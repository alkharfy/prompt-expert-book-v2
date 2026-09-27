// =====================================================
// Daily Missions Engine — المحرك الأساسي للمهام اليومية
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from './logger'

// ===== Types =====

export interface MissionTemplate {
    id: string
    title_ar: string
    description_ar: string
    icon: string
    category: string
    min_target: number
    max_target: number
    base_points: number
    bonus_multiplier: number
    requires_plan: string | null
    min_level: number
    is_active: boolean
}

export interface UserDailyMission {
    id: string
    user_id: string
    mission_template_id: string
    mission_date: string
    target_value: number
    current_value: number
    status: 'active' | 'completed' | 'expired' | 'skipped'
    points_earned: number
    completed_at: string | null
    slot_number: number
    created_at: string
    // Joined template data
    template?: MissionTemplate
}

// Action types that map to mission template IDs
const ACTION_TO_TEMPLATE_MAP: Record<string, string[]> = {
    'read_page': ['read_pages', 'reread_page', 'read_section'],
    'complete_exercise': ['complete_exercise', 'complete_quiz'],
    'perfect_score': ['perfect_score'],
    'add_note': ['add_notes'],
    'highlight_text': ['highlight_text'],
    'add_bookmark': ['bookmark_page'],
    'use_tool': ['use_tool'],
    'chat_message': ['try_chat'],
    'maintain_streak': ['maintain_streak'],
}

// All-clear bonus points
const ALL_CLEAR_BONUS = 50

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables')
    }
    return createClient(url, serviceKey)
}

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// ===== Core Functions =====

/**
 * توليد 3 مهام يومية للمستخدم
 * القواعد:
 * - مهمة واحدة على الأقل من فئة 'reading'
 * - لا يتكرر نفس الـ template في نفس اليوم
 * - الـ target عشوائي بين min_target و max_target
 * - تُراعى باقة المستخدم ومستواه
 */
export async function generateDailyMissions(
    userId: string,
    userLevel: number = 1,
    userPlan: string | null = null
): Promise<UserDailyMission[]> {
    const supabase = getServiceClient()
    const today = getTodayDate()

    try {
        // 1. تحقق: هل المستخدم عنده مهام لليوم؟
        const { data: existingMissions, error: checkError } = await supabase
            .from('user_daily_missions')
            .select('*, mission_templates(*)')
            .eq('user_id', userId)
            .eq('mission_date', today)
            .order('slot_number', { ascending: true })

        if (checkError) {
            dbLogger.error('Error checking existing missions', checkError)
            return []
        }

        const existing = existingMissions as unknown as (UserDailyMission & { mission_templates: MissionTemplate })[] | null

        if (existing && existing.length >= 3) {
            // إعادة تشكيل البيانات مع القالب
            return existing.map(m => ({
                ...m,
                template: m.mission_templates || undefined,
                mission_templates: undefined,
            })) as unknown as UserDailyMission[]
        }

        // 2. انتهاء مهام الأمس (إذا كانت موجودة)
        await checkAndExpireMissions(userId)

        // 3. جلب القوالب المتاحة
        const { data: templates, error: templatesError } = await supabase
            .from('mission_templates')
            .select('*')
            .eq('is_active', true)
            .lte('min_level', userLevel)

        if (templatesError || !templates) {
            dbLogger.error('Error fetching mission templates', templatesError)
            return []
        }

        const allTemplates = templates as unknown as MissionTemplate[]

        // فلترة حسب الباقة
        const filteredTemplates = allTemplates.filter(t => {
            if (!t.requires_plan) return true // مجاني
            if (!userPlan) return false // المستخدم بلا باقة
            const planOrder = ['basic', 'pro', 'vip']
            return planOrder.indexOf(userPlan) >= planOrder.indexOf(t.requires_plan)
        })

        if (filteredTemplates.length < 3) {
            dbLogger.warn(`Not enough templates for user ${userId} (found ${filteredTemplates.length})`)
            return []
        }

        // 4. اختيار 3 مهام عشوائية
        const readingTemplates = filteredTemplates.filter(t => t.category === 'reading')
        const otherTemplates = filteredTemplates.filter(t => t.category !== 'reading')

        const selected: MissionTemplate[] = []

        // مهمة قراءة واحدة على الأقل
        if (readingTemplates.length > 0) {
            const readingPick = readingTemplates[Math.floor(Math.random() * readingTemplates.length)]
            selected.push(readingPick)
        }

        // باقي المهام من كل الأنواع (ما عدا المختارة)
        const remaining = [...readingTemplates, ...otherTemplates].filter(
            t => !selected.find(s => s.id === t.id)
        )

        // عشوائية Fisher-Yates
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]]
        }

        while (selected.length < 3 && remaining.length > 0) {
            selected.push(remaining.pop()!)
        }

        if (selected.length < 3) {
            dbLogger.warn(`Could only select ${selected.length} missions for user ${userId}`)
            return []
        }

        // 5. إنشاء المهام
        const missionsToInsert = selected.map((template, index) => ({
            user_id: userId,
            mission_template_id: template.id,
            mission_date: today,
            target_value: randomBetween(template.min_target, template.max_target),
            current_value: 0,
            status: 'active',
            points_earned: 0,
            slot_number: index + 1,
        }))

        const { data: inserted, error: insertError } = await supabase
            .from('user_daily_missions')
            .insert(missionsToInsert)
            .select('*, mission_templates(*)')

        if (insertError) {
            dbLogger.error('Error inserting daily missions', insertError)
            return []
        }

        const insertedMissions = inserted as unknown as (UserDailyMission & { mission_templates: MissionTemplate })[] | null

        dbLogger.info(`Generated 3 daily missions for user ${userId}`)

        return (insertedMissions || []).map(m => ({
            ...m,
            template: m.mission_templates || undefined,
            mission_templates: undefined,
        })) as unknown as UserDailyMission[]

    } catch (error) {
        dbLogger.error('Error in generateDailyMissions', error)
        return []
    }
}

/**
 * تحديث تقدم مهمة بناءً على نوع الإجراء
 * يرجع معلومات عن المهام المكتملة والـ All Clear إذا حدثت
 */
export async function updateMissionProgress(
    userId: string,
    actionType: string,
    value: number = 1
): Promise<{
    updatedMissions: UserDailyMission[]
    completedMissions: UserDailyMission[]
    allClear: boolean
    totalPointsEarned: number
}> {
    const supabase = getServiceClient()
    const today = getTodayDate()
    const result = {
        updatedMissions: [] as UserDailyMission[],
        completedMissions: [] as UserDailyMission[],
        allClear: false,
        totalPointsEarned: 0,
    }

    try {
        // 1. جلب المهام النشطة لليوم
        const { data: todayMissions, error: fetchError } = await supabase
            .from('user_daily_missions')
            .select('*, mission_templates(*)')
            .eq('user_id', userId)
            .eq('mission_date', today)
            .eq('status', 'active')

        if (fetchError || !todayMissions) {
            dbLogger.error('Error fetching today missions for progress', fetchError)
            return result
        }

        const missions = todayMissions as unknown as (UserDailyMission & { mission_templates: MissionTemplate })[]

        // 2. البحث عن المهام المطابقة للإجراء
        const matchingTemplateIds = ACTION_TO_TEMPLATE_MAP[actionType] || []

        for (const mission of missions) {
            if (!matchingTemplateIds.includes(mission.mission_template_id)) continue

            const newValue = Math.min(mission.current_value + value, mission.target_value)
            const isCompleted = newValue >= mission.target_value

            const updateData: Record<string, unknown> = {
                current_value: newValue,
            }

            let pointsEarned = 0

            if (isCompleted) {
                const template = mission.mission_templates
                pointsEarned = Math.round(
                    (template?.base_points || 20) * (template?.bonus_multiplier || 1)
                )

                updateData.status = 'completed'
                updateData.completed_at = new Date().toISOString()
                updateData.points_earned = pointsEarned
            }

            // تحديث المهمة
            const { error: updateError } = await supabase
                .from('user_daily_missions')
                .update(updateData)
                .eq('id', mission.id)

            if (updateError) {
                dbLogger.error(`Error updating mission ${mission.id}`, updateError)
                continue
            }

            const updatedMission: UserDailyMission = {
                ...mission,
                current_value: newValue,
                status: isCompleted ? 'completed' : 'active',
                completed_at: isCompleted ? new Date().toISOString() : null,
                points_earned: pointsEarned,
                template: mission.mission_templates || undefined,
            }

            result.updatedMissions.push(updatedMission)

            if (isCompleted) {
                result.completedMissions.push(updatedMission)
                result.totalPointsEarned += pointsEarned

                // منح النقاط عبر gamification
                const { updateGamification } = await import('./gamification')
                await updateGamification(userId, pointsEarned, 'mission_complete', supabase)

                dbLogger.info(`Mission ${mission.id} completed! +${pointsEarned} pts`)
            }
        }

        // 3. فحص All Clear (هل كل مهام اليوم اكتملت؟)
        if (result.completedMissions.length > 0) {
            const { data: allMissions, error: allError } = await supabase
                .from('user_daily_missions')
                .select('status')
                .eq('user_id', userId)
                .eq('mission_date', today)

            if (!allError && allMissions) {
                const allStatuses = (allMissions as unknown as { status: string }[]).map(m => m.status)
                const allCompleted = allStatuses.length === 3 && allStatuses.every(s => s === 'completed')

                if (allCompleted) {
                    result.allClear = true

                    // مكافأة All Clear
                    const { updateGamification } = await import('./gamification')
                    await updateGamification(userId, ALL_CLEAR_BONUS, 'all_clear_bonus', supabase)
                    result.totalPointsEarned += ALL_CLEAR_BONUS

                    dbLogger.info(`User ${userId} achieved All Clear! +${ALL_CLEAR_BONUS} bonus pts`)

                    // فحص سلسلة All Clear (3 أيام، 7 أيام، 30 يوم)
                    await checkAllClearStreak(userId)
                }
            }
        }

        return result
    } catch (error) {
        dbLogger.error('Error in updateMissionProgress', error)
        return result
    }
}

/**
 * انتهاء صلاحية مهام اليوم السابق غير المكتملة
 */
export async function checkAndExpireMissions(userId?: string): Promise<void> {
    const supabase = getServiceClient()
    const today = getTodayDate()

    try {
        let query = supabase
            .from('user_daily_missions')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('mission_date', today)

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { error } = await query

        if (error) {
            dbLogger.error('Error expiring old missions', error)
        }
    } catch (error) {
        dbLogger.error('Error in checkAndExpireMissions', error)
    }
}

/**
 * فحص سلسلة الـ All Clear ومنح شارات/نقاط
 */
async function checkAllClearStreak(userId: string): Promise<void> {
    const supabase = getServiceClient()

    try {
        // جلب آخر 30 يوم من المهام
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: recentMissions, error } = await supabase
            .from('user_daily_missions')
            .select('mission_date, status')
            .eq('user_id', userId)
            .gte('mission_date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('mission_date', { ascending: false })

        if (error || !recentMissions) return

        const missions = recentMissions as unknown as { mission_date: string; status: string }[]

        // تجميع حسب اليوم
        const dayMap = new Map<string, string[]>()
        for (const m of missions) {
            const date = m.mission_date
            if (!dayMap.has(date)) dayMap.set(date, [])
            dayMap.get(date)!.push(m.status)
        }

        // حساب أيام All Clear المتتالية (من اليوم للخلف)
        let consecutiveDays = 0
        const today = new Date()

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today)
            checkDate.setDate(checkDate.getDate() - i)
            const dateStr = checkDate.toISOString().split('T')[0]

            const statuses = dayMap.get(dateStr)
            if (statuses && statuses.length === 3 && statuses.every(s => s === 'completed')) {
                consecutiveDays++
            } else {
                break
            }
        }

        // منح الشارات حسب السلسلة
        const { updateGamification } = await import('./gamification')

        // فحص أول مهمة يومية مكتملة
        const { data: firstMissionCheck } = await supabase
            .from('points_history')
            .select('id')
            .eq('user_id', userId)
            .eq('action_type', 'achievement_first_mission')
            .maybeSingle()

        if (!firstMissionCheck) {
            await updateGamification(userId, 20, 'achievement_first_mission', supabase)
            dbLogger.info(`User ${userId} earned achievement: first_mission`)
        }

        // 3 أيام متتالية
        if (consecutiveDays >= 3) {
            const { data: existing3 } = await supabase
                .from('points_history')
                .select('id')
                .eq('user_id', userId)
                .eq('action_type', 'achievement_all_clear_3')
                .maybeSingle()

            if (!existing3) {
                await updateGamification(userId, 100, 'achievement_all_clear_3', supabase)
                dbLogger.info(`User ${userId} earned achievement: all_clear_3 (3 days)`)
            }
        }

        // 7 أيام متتالية
        if (consecutiveDays >= 7) {
            const { data: existing7 } = await supabase
                .from('points_history')
                .select('id')
                .eq('user_id', userId)
                .eq('action_type', 'achievement_all_clear_7')
                .maybeSingle()

            if (!existing7) {
                await updateGamification(userId, 200, 'achievement_all_clear_7', supabase)
                dbLogger.info(`User ${userId} earned achievement: all_clear_7 (7 days)`)
            }
        }

        // 30 يوم
        if (consecutiveDays >= 30) {
            const { data: existing30 } = await supabase
                .from('points_history')
                .select('id')
                .eq('user_id', userId)
                .eq('action_type', 'achievement_all_clear_30')
                .maybeSingle()

            if (!existing30) {
                await updateGamification(userId, 500, 'achievement_all_clear_30', supabase)
                dbLogger.info(`User ${userId} earned achievement: all_clear_30 (30 days!)`)
            }
        }
    } catch (error) {
        dbLogger.error('Error in checkAllClearStreak', error)
    }
}

/**
 * جلب مهام اليوم مع بيانات القوالب
 */
export async function getTodayMissions(userId: string): Promise<UserDailyMission[]> {
    const supabase = getServiceClient()
    const today = getTodayDate()

    try {
        const { data, error } = await supabase
            .from('user_daily_missions')
            .select('*, mission_templates(*)')
            .eq('user_id', userId)
            .eq('mission_date', today)
            .order('slot_number', { ascending: true })

        if (error) {
            dbLogger.error('Error fetching today missions', error)
            return []
        }

        const missions = data as unknown as (UserDailyMission & { mission_templates: MissionTemplate })[] | null

        return (missions || []).map(m => ({
            ...m,
            template: m.mission_templates || undefined,
            mission_templates: undefined,
        })) as unknown as UserDailyMission[]
    } catch (error) {
        dbLogger.error('Error in getTodayMissions', error)
        return []
    }
}

// ===== Learning Plan Integration =====

/**
 * جلب ملخص خطة اليوم من learning_plan_tasks — لعرضه في MissionsWidget
 * هذا لا يؤثر على المهام اليومية نفسها، بل يعرض اقتراحات من الخطة بجانبها
 */
export async function getTodayPlanSuggestions(userId: string): Promise<{
    hasPlan: boolean
    readingTask: string | null
    exerciseTask: string | null
}> {
    const supabase = getServiceClient()
    const today = getTodayDate()

    try {
        const { data } = await supabase
            .from('learning_plan_tasks')
            .select('task_type, title_ar, status')
            .eq('user_id', userId)
            .eq('task_date', today)
            .eq('status', 'pending')
            .in('task_type', ['reading', 'exercise'])

        if (!data || data.length === 0) return { hasPlan: false, readingTask: null, exerciseTask: null }

        const tasks = data as { task_type: string; title_ar: string; status: string }[]
        const readingTask = tasks.find(t => t.task_type === 'reading')?.title_ar || null
        const exerciseTask = tasks.find(t => t.task_type === 'exercise')?.title_ar || null

        return { hasPlan: true, readingTask, exerciseTask }
    } catch (error) {
        dbLogger.error('Error in getTodayPlanSuggestions', error)
        return { hasPlan: false, readingTask: null, exerciseTask: null }
    }
}
