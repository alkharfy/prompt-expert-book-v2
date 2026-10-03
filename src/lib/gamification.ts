// Gamification System - نظام النقاط والإحصائيات
// يتم استخدامه لتحديث إحصائيات المستخدم عند إكمال التمارين والقراءة
//
// This module contains no service-role key. Server award handlers pass their
// admin client explicitly; raw point/stat writes are blocked by the browser proxy.

import { supabaseProxy as supabase } from './supabase_proxy'
import { dbLogger } from './logger'

// Browser callers use the proxy (default). Server callers — API routes and the
// missions engine — must pass their service-role client: the proxy fetches a
// relative /api URL, which only resolves in the browser.
type GamificationDb = { rpc: (...args: any[]) => any; from: (table: string) => any }

// Helper type for upsert operations
type UpsertTable = {
    upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
}

/**
 * تسجيل إكمال التمرين بشكل ذري (atomic) لمنع race condition
 * يستخدم INSERT مع ON CONFLICT DO NOTHING ثم يتحقق من عدد الصفوف المتأثرة
 * إذا لم يتم إدراج صف جديد، فالتمرين مُسجل مسبقاً
 * 
 * @returns true إذا تم تسجيل التمرين بنجاح (أي أنه جديد)
 * @returns false إذا كان التمرين مُسجلاً مسبقاً
 */
async function tryRecordExerciseCompletion(
    userId: string,
    exerciseId: string,
    exerciseType: string,
    pointsEarned: number
): Promise<boolean> {
    try {
        // محاولة إدراج سجل جديد - إذا كان موجوداً مسبقاً سيفشل بسبب unique constraint
        // ونستخدم returning لمعرفة إذا تم الإدراج فعلاً
        const { data, error } = await (supabase
            .from('exercise_progress') as unknown as {
                insert: (data: unknown) => {
                    select: (columns: string) => Promise<{
                        data: { id: string }[] | null;
                        error: { code?: string; message?: string } | null
                    }>
                }
            })
            .insert({
                user_id: userId,
                exercise_id: exerciseId,
                exercise_type: exerciseType,
                is_completed: true,
                points_earned: pointsEarned,
                completed_at: new Date().toISOString()
            })
            .select('id')

        // إذا كان هناك خطأ بسبب unique constraint (كود 23505)
        // فهذا يعني أن التمرين مُسجل مسبقاً
        if (error) {
            if (error.code === '23505') {
                dbLogger.debug(`Exercise ${exerciseId} already recorded (conflict)`)
                return false
            }
            dbLogger.error('Error recording exercise completion', error)
            return false
        }

        // تم الإدراج بنجاح - التمرين جديد
        return data !== null && data.length > 0
    } catch (err) {
        dbLogger.error('Exception in tryRecordExerciseCompletion', err)
        return false
    }
}

/**
 * التحقق من أن التمرين لم يُسجل نقاطه مسبقاً (للاستخدام في حالات خاصة فقط)
 * @deprecated استخدم tryRecordExerciseCompletion للعمليات الذرية
 */
async function isExerciseAlreadyRecorded(userId: string, exerciseId: string): Promise<boolean> {
    const { data } = await supabase
        .from('exercise_progress')
        .select('is_completed, points_earned')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .maybeSingle() as { data: { is_completed: boolean; points_earned: number } | null; error: unknown }

    return data?.is_completed === true && (data?.points_earned || 0) > 0
}

/**
 * تحديث إحصائيات التمارين للمستخدم
 */
export async function updateExerciseStats(
    userId: string,
    exerciseType: 'quiz' | 'fill_blank' | 'prompt_builder',
    isCorrect: boolean | null,
    pointsEarned: number,
    db: GamificationDb = supabase
): Promise<void> {
    try {
        // Atomic upsert via RPC to prevent race conditions
        const { error: rpcError } = await db.rpc('update_exercise_stats_atomic', {
            p_user_id: userId,
            p_exercise_type: exerciseType,
            p_is_correct: isCorrect,
            p_points_earned: pointsEarned,
        })

        if (rpcError) {
            dbLogger.error('RPC update_exercise_stats_atomic failed, using fallback', rpcError)
            // Fallback: original read-then-write (acceptable for low-traffic scenarios)
            await updateExerciseStatsFallback(userId, exerciseType, isCorrect, pointsEarned, db)
        } else {
            dbLogger.debug('Exercise stats updated (atomic)')
        }
    } catch (error) {
        dbLogger.error('Error in updateExerciseStats', error)
    }
}

/** Fallback for when RPC is not yet deployed */
async function updateExerciseStatsFallback(
    userId: string,
    exerciseType: 'quiz' | 'fill_blank' | 'prompt_builder',
    isCorrect: boolean | null,
    pointsEarned: number,
    db: GamificationDb = supabase
): Promise<void> {
    const { data: currentStats, error: fetchError } = await db
        .from('user_exercise_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

    if (fetchError) {
        dbLogger.error('Error fetching exercise stats', fetchError)
        return
    }

    const stats = currentStats as {
        total_completed?: number;
        total_correct?: number;
        total_points?: number;
        quizzes_completed?: number;
        fill_blanks_completed?: number;
        prompt_builders_completed?: number;
    } | null
    const newStats = {
        user_id: userId,
        total_completed: (stats?.total_completed || 0) + 1,
        total_correct: (stats?.total_correct || 0) + (isCorrect ? 1 : 0),
        total_points: (stats?.total_points || 0) + pointsEarned,
        quizzes_completed: (stats?.quizzes_completed || 0) + (exerciseType === 'quiz' ? 1 : 0),
        fill_blanks_completed: (stats?.fill_blanks_completed || 0) + (exerciseType === 'fill_blank' ? 1 : 0),
        prompt_builders_completed: (stats?.prompt_builders_completed || 0) + (exerciseType === 'prompt_builder' ? 1 : 0),
        last_exercise_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await (db
        .from('user_exercise_stats') as unknown as UpsertTable)
        .upsert(newStats, { onConflict: 'user_id' })

    if (upsertError) {
        dbLogger.error('Error updating exercise stats (fallback)', upsertError)
    }
}

/**
 * تحديث نظام الـ Gamification (النقاط، المستوى، التمارين المكتملة)
 * يستخدم RPC للعمليات الذرية لمنع race conditions
 */
export async function updateGamification(
    userId: string,
    pointsEarned: number,
    actionType: string = 'exercise_complete',
    db: GamificationDb = supabase
): Promise<void> {
    try {
        // Try atomic RPC first
        const { data: rpcResult, error: rpcError } = await db.rpc('update_gamification_atomic', {
            p_user_id: userId,
            p_points_earned: pointsEarned,
            p_action_type: actionType,
        })

        if (rpcError) {
            dbLogger.error('RPC update_gamification_atomic failed, using fallback', rpcError)
            await updateGamificationFallback(userId, pointsEarned, actionType, db)
        } else {
            dbLogger.debug('Gamification updated (atomic)', rpcResult)
        }

        // حفظ في سجل النقاط
        await (db
            .from('points_history') as unknown as { insert: (data: unknown) => Promise<{ error: unknown }> })
            .insert({
                user_id: userId,
                points: pointsEarned,
                action_type: actionType,
                action_details: { timestamp: new Date().toISOString() }
            })

    } catch (error) {
        dbLogger.error('Error in updateGamification', error)
    }
}

/** Fallback for when RPC is not yet deployed */
async function updateGamificationFallback(
    userId: string,
    pointsEarned: number,
    actionType: string = 'exercise_complete',
    db: GamificationDb = supabase
): Promise<void> {
    const { data: currentData, error: fetchError } = await db
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

    if (fetchError) {
        dbLogger.error('Error fetching gamification data (fallback)', fetchError)
    }

    const gamData = currentData as {
        total_points?: number;
        exercises_completed?: number;
        last_activity_date?: string;
        current_streak?: number;
        longest_streak?: number;
    } | null

    const newTotalPoints = (gamData?.total_points || 0) + pointsEarned
    const newExercisesCompleted = (gamData?.exercises_completed || 0) + (actionType === 'exercise_complete' ? 1 : 0)
    const newLevel = Math.floor(newTotalPoints / 100) + 1
    const pointsToNextLevel = 100 - (newTotalPoints % 100)

    const today = new Date().toISOString().split('T')[0]
    const lastActivityDate = gamData?.last_activity_date
    let currentStreak = gamData?.current_streak || 0
    let longestStreak = gamData?.longest_streak || 0

    if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
            currentStreak += 1
        } else if (diffDays > 1) {
            currentStreak = 1
        }
    } else {
        currentStreak = 1
    }

    longestStreak = Math.max(longestStreak, currentStreak)

    const gamificationData = {
        user_id: userId,
        total_points: newTotalPoints,
        current_level: Math.min(newLevel, 10),
        points_to_next_level: pointsToNextLevel,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        exercises_completed: newExercisesCompleted,
        chapters_completed: (gamData as any)?.chapters_completed || 0,
        total_reading_time_minutes: (gamData as any)?.total_reading_time_minutes || 0,
        updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await (db
        .from('user_gamification') as unknown as UpsertTable)
        .upsert(gamificationData, { onConflict: 'user_id' })

    if (upsertError) {
        dbLogger.error('Error updating gamification (fallback)', upsertError)
    }
}

/**
 * Compatibility hook for client exercises. The validated server save handles
 * points, correctness and mission updates; browser-provided scores are ignored.
 */
export async function onExerciseComplete(
    userId: string,
    exerciseType: 'quiz' | 'fill_blank' | 'prompt_builder',
    isCorrect: boolean | null,
    pointsEarned: number,
    exerciseId?: string
): Promise<void> {
    // The validated server-side exercise save now awards points and updates
    // missions once. Retain this client hook for existing callers without
    // accepting correctness or point values from the browser.
    return
}

/**
 * تسجيل إنشاء ملاحظة/تظليل جديد ومنح النقاط
 * 5 نقاط لكل ملاحظة، حد أقصى 10 ملاحظات يومياً (50 نقطة)
 */
export async function recordNoteCreation(
    userId: string,
    db: GamificationDb = supabase
): Promise<{ pointsAwarded: number; dailyLimitReached: boolean }> {
    try {
        // 1. حساب عدد الملاحظات المُنشأة اليوم
        const today = new Date().toISOString().split('T')[0]
        const todayStart = `${today}T00:00:00.000Z`
        const todayEnd = `${today}T23:59:59.999Z`

        const { data: todayNotes, error: countError } = await db
            .from('user_notes')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd) as { data: { id: string }[] | null; error: { message: string } | null }

        if (countError) {
            dbLogger.error('Error counting today notes for gamification', countError)
            return { pointsAwarded: 0, dailyLimitReached: false }
        }

        const todayCount = todayNotes?.length || 0

        // حد أقصى 10 ملاحظات يومياً للنقاط
        if (todayCount > 10) {
            dbLogger.debug(`User ${userId} reached daily note limit (${todayCount} today)`)
            return { pointsAwarded: 0, dailyLimitReached: true }
        }

        // 2. منح 5 نقاط
        const pointsEarned = 5
        await updateGamification(userId, pointsEarned, 'note_created', db)

        // 3. التحقق من إجمالي الملاحظات للإنجازات
        const { data: totalNotes, error: totalError } = await db
            .from('user_notes')
            .select('id, section_id')
            .eq('user_id', userId) as { data: { id: string; section_id: string }[] | null; error: { message: string } | null }

        if (totalError) {
            dbLogger.error('Error counting total notes for achievements', totalError)
            return { pointsAwarded: pointsEarned, dailyLimitReached: false }
        }

        const totalCount = totalNotes?.length || 0
        const uniqueSections = new Set(totalNotes?.map(n => n.section_id) || []).size

        // 4. التحقق من الإنجازات
        // أول ملاحظة (first_note)
        if (totalCount === 1) {
            await updateGamification(userId, 20, 'achievement_first_note', db)
            dbLogger.info(`User ${userId} earned achievement: first_note (20 pts)`)
        }

        // 10 ملاحظات (note_taker)
        if (totalCount === 10) {
            await updateGamification(userId, 50, 'achievement_note_taker', db)
            dbLogger.info(`User ${userId} earned achievement: note_taker (50 pts)`)
        }

        // 50 ملاحظة (scholar)
        if (totalCount === 50) {
            await updateGamification(userId, 150, 'achievement_scholar', db)
            dbLogger.info(`User ${userId} earned achievement: scholar (150 pts)`)
        }

        // ملاحظات في 5 فصول مختلفة (notes_5_sections)
        if (uniqueSections === 5) {
            // نتحقق أنه لم يحصل على هذا الإنجاز من قبل
            const { data: existingAchievement } = await db
                .from('points_history')
                .select('id')
                .eq('user_id', userId)
                .eq('action_type', 'achievement_notes_5_sections')
                .maybeSingle() as { data: { id: string } | null }

            if (!existingAchievement) {
                await updateGamification(userId, 100, 'achievement_notes_5_sections', db)
                dbLogger.info(`User ${userId} earned achievement: notes_5_sections (100 pts)`)
            }
        }

        return { pointsAwarded: pointsEarned, dailyLimitReached: false }
    } catch (error) {
        dbLogger.error('Error in recordNoteCreation', error)
        return { pointsAwarded: 0, dailyLimitReached: false }
    }
}

/**
 * تسجيل إكمال فصل ومشاهدة الملخص — 15 نقطة لكل ملخص (مرة واحدة لكل فصل)
 */
export async function recordChapterCompletion(
    userId: string,
    sectionId: string,
    db: GamificationDb = supabase
): Promise<{ pointsAwarded: number; alreadyViewed: boolean }> {
    try {
        // التحقق إن المستخدم ما شاف الملخص قبل كده
        const actionType = `recap_viewed_${sectionId}`
        const { data: existing } = await db
            .from('points_history')
            .select('id')
            .eq('user_id', userId)
            .eq('action_type', actionType)
            .maybeSingle() as { data: { id: string } | null }

        if (existing) {
            return { pointsAwarded: 0, alreadyViewed: true }
        }

        // منح 15 نقطة
        await updateGamification(userId, 15, actionType, db)
        dbLogger.info(`User ${userId} viewed recap for ${sectionId} (+15 pts)`)

        // التحقق من مشاهدة كل الملخصات (إنجاز "الملخّص")
        const { data: allRecaps } = await db
            .from('points_history')
            .select('action_type')
            .eq('user_id', userId)
            .like('action_type', 'recap_viewed_%') as { data: { action_type: string }[] | null }

        const viewedCount = allRecaps?.length || 0
        if (viewedCount >= 10) {
            // تحقق إنه لم يحصل على الإنجاز من قبل
            const { data: existingAch } = await db
                .from('points_history')
                .select('id')
                .eq('user_id', userId)
                .eq('action_type', 'achievement_all_recaps')
                .maybeSingle() as { data: { id: string } | null }

            if (!existingAch) {
                await updateGamification(userId, 100, 'achievement_all_recaps', db)
                dbLogger.info(`User ${userId} earned achievement: all_recaps (100 pts)`)
            }
        }

        return { pointsAwarded: 15, alreadyViewed: false }
    } catch (error) {
        dbLogger.error('Error in recordChapterCompletion', error)
        return { pointsAwarded: 0, alreadyViewed: false }
    }
}

/**
 * مزامنة تقدم القراءة مع نظام الـ Gamification
 */
export async function syncReadingToGamification(
    userId: string,
    completedChaptersCount: number,
    db: GamificationDb = supabase
): Promise<void> {
    try {
        const { data: currentData } = await db
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle() as { data: Record<string, unknown> | null }

        const gamData = currentData as {
            total_points?: number;
            chapters_completed?: number;
        } | null

        const currentChapters = gamData?.chapters_completed || 0

        // إذا كان هناك فصول جديدة مكتملة
        if (completedChaptersCount > currentChapters) {
            const newChapters = completedChaptersCount - currentChapters
            const pointsEarned = newChapters * 50 // 50 نقطة لكل فصل

            await updateGamification(userId, pointsEarned, 'chapter_complete', db)

            // تحديث عدد الفصول بشكل صريح
            await (db
                .from('user_gamification') as unknown as UpsertTable)
                .upsert({
                    user_id: userId,
                    chapters_completed: completedChaptersCount,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
        }
    } catch (error) {
        dbLogger.error('Error in syncReadingToGamification', error)
    }
}
