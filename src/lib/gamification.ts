// Gamification System - نظام النقاط والإحصائيات
// يتم استخدامه لتحديث إحصائيات المستخدم عند إكمال التمارين والقراءة

import { supabase } from './supabase'
import { dbLogger } from './logger'

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
                insert: (data: unknown) => { select: (columns: string) => Promise<{ 
                    data: { id: string }[] | null; 
                    error: { code?: string; message?: string } | null 
                }> } 
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
    isCorrect: boolean,
    pointsEarned: number
): Promise<void> {
    try {
        // 1. جلب الإحصائيات الحالية
        const { data: currentStats, error: fetchError } = await supabase
            .from('user_exercise_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

        if (fetchError) {
            dbLogger.error('Error fetching exercise stats', fetchError)
            return // توقف إذا فشل الجلب
        }

        // 2. حساب الإحصائيات الجديدة
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

        // 3. حفظ الإحصائيات
        const { error: upsertError } = await (supabase
            .from('user_exercise_stats') as unknown as UpsertTable)
            .upsert(newStats, {
                onConflict: 'user_id'
            })

        if (upsertError) {
            dbLogger.error('Error updating exercise stats', upsertError)
        } else {
            dbLogger.debug('Exercise stats updated')
        }
    } catch (error) {
        dbLogger.error('Error in updateExerciseStats', error)
    }
}

/**
 * تحديث نظام الـ Gamification (النقاط، المستوى، التمارين المكتملة)
 */
export async function updateGamification(
    userId: string,
    pointsEarned: number,
    actionType: string = 'exercise_complete'
): Promise<void> {
    try {
        // 1. جلب بيانات الـ Gamification الحالية
        const { data: currentData, error: fetchError } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

        if (fetchError) {
            dbLogger.error('Error fetching gamification data', fetchError)
        }

        // Cast to proper type for use
        const gamData = currentData as {
            total_points?: number;
            exercises_completed?: number;
            last_activity_date?: string;
            current_streak?: number;
            longest_streak?: number;
        } | null

        // 2. حساب النقاط والمستوى الجديد
        const newTotalPoints = (gamData?.total_points || 0) + pointsEarned
        const newExercisesCompleted = (gamData?.exercises_completed || 0) + 1
        
        // حساب المستوى (كل 100 نقطة = مستوى جديد)
        const newLevel = Math.floor(newTotalPoints / 100) + 1
        const pointsToNextLevel = 100 - (newTotalPoints % 100)

        // 3. حساب الـ Streak
        const today = new Date().toISOString().split('T')[0]
        const lastActivityDate = gamData?.last_activity_date
        let currentStreak = gamData?.current_streak || 0
        let longestStreak = gamData?.longest_streak || 0

        if (lastActivityDate) {
            const lastDate = new Date(lastActivityDate)
            const todayDate = new Date(today)
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays === 1) {
                // تتابع يومي
                currentStreak += 1
            } else if (diffDays > 1) {
                // انقطاع - إعادة العداد
                currentStreak = 1
            }
            // إذا diffDays === 0، نفس اليوم، لا تغيير
        } else {
            currentStreak = 1
        }

        longestStreak = Math.max(longestStreak, currentStreak)

        // 4. تحديث البيانات
        const gamificationData = {
            user_id: userId,
            total_points: newTotalPoints,
            current_level: Math.min(newLevel, 10), // الحد الأقصى 10 مستويات
            points_to_next_level: pointsToNextLevel,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
            exercises_completed: newExercisesCompleted,
            updated_at: new Date().toISOString()
        }

        const { error: upsertError } = await (supabase
            .from('user_gamification') as unknown as UpsertTable)
            .upsert(gamificationData, {
                onConflict: 'user_id'
            })

        if (upsertError) {
            dbLogger.error('Error updating gamification', upsertError)
        } else {
            dbLogger.debug('Gamification updated')
        }

        // 5. حفظ في سجل النقاط
        await (supabase
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

/**
 * دالة شاملة لتحديث كل الإحصائيات عند إكمال تمرين
 * تستخدم عملية ذرية (atomic) لمنع تكرار النقاط في حالة race condition
 * @param exerciseId - معرف التمرين (مطلوب لمنع تكرار النقاط)
 */
export async function onExerciseComplete(
    userId: string,
    exerciseType: 'quiz' | 'fill_blank' | 'prompt_builder',
    isCorrect: boolean,
    pointsEarned: number,
    exerciseId?: string
): Promise<void> {
    // إذا لم يتم تمرير exerciseId، نستخدم الطريقة القديمة (غير آمنة)
    // هذا للتوافق مع الكود القديم - يجب تحديث جميع الاستدعاءات لتمرير exerciseId
    if (!exerciseId) {
        dbLogger.warn('onExerciseComplete called without exerciseId - race condition possible')
        await updateExerciseStats(userId, exerciseType, isCorrect, pointsEarned)
        await updateGamification(userId, pointsEarned, 'exercise_complete')
        return
    }
    
    // استخدام العملية الذرية: محاولة تسجيل التمرين أولاً
    // إذا نجحت العملية، فالتمرين جديد ويمكن إضافة النقاط
    // إذا فشلت (التمرين موجود مسبقاً)، لا نضيف نقاط
    const wasNewlyRecorded = await tryRecordExerciseCompletion(
        userId, 
        exerciseId, 
        exerciseType, 
        pointsEarned
    )
    
    if (!wasNewlyRecorded) {
        dbLogger.debug(`Exercise ${exerciseId} was already recorded, skipping gamification update`)
        return
    }

    // تحديث الإحصائيات فقط إذا كان التمرين جديداً
    await updateExerciseStats(userId, exerciseType, isCorrect, pointsEarned)
    await updateGamification(userId, pointsEarned, 'exercise_complete')
}
