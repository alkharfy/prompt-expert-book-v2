import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  UserLearningPreferences,
  LearningGoalId,
  SpecializationId,
  LearningPathId,
  LearningDurationId,
} from '@/types/learning'

const VALID_GOALS: LearningGoalId[] = ['professional', 'entrepreneurship', 'career-change', 'curiosity']
const VALID_SPECS: SpecializationId[] = ['programming', 'ecommerce', 'design', 'marketing', 'general']
const VALID_PATHS: LearningPathId[] = ['quick', 'intermediate', 'comprehensive']
const VALID_DURATIONS: LearningDurationId[] = ['1week', '2weeks', '1month', '2months', 'flexible']

export function validatePreferences(data: Record<string, unknown>): string | null {
  if (!data.learningGoal || !VALID_GOALS.includes(data.learningGoal as LearningGoalId))
    return 'learningGoal غير صالح'
  if (!data.specialization || !VALID_SPECS.includes(data.specialization as SpecializationId))
    return 'specialization غير صالح'
  if (!data.learningPath || !VALID_PATHS.includes(data.learningPath as LearningPathId))
    return 'learningPath غير صالح'
  if (!data.learningDuration || !VALID_DURATIONS.includes(data.learningDuration as LearningDurationId))
    return 'learningDuration غير صالح'
  return null
}

export async function getLearningPreferences(userId: string): Promise<UserLearningPreferences | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_learning_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    userId: data.user_id,
    learningGoal: data.learning_goal,
    specialization: data.specialization,
    learningPath: data.learning_path,
    learningDuration: data.learning_duration,
    planStartDate: data.plan_start_date,
    isActive: data.is_active,
  }
}

export async function saveLearningPreferences(
  userId: string,
  prefs: {
    learningGoal: LearningGoalId
    specialization: SpecializationId
    learningPath: LearningPathId
    learningDuration: LearningDurationId
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('user_learning_preferences')
    .upsert(
      {
        user_id: userId,
        learning_goal: prefs.learningGoal,
        specialization: prefs.specialization,
        learning_path: prefs.learningPath,
        learning_duration: prefs.learningDuration,
        plan_start_date: new Date().toISOString().split('T')[0],
        is_active: true,
      },
      { onConflict: 'user_id' }
    )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
