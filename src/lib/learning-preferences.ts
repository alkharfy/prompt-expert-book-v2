import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  UserLearningPreferences,
  LearningGoalId,
  SpecializationId,
  LearningPathId,
  LearningDurationId,
  AiLevelId,
  DailyMinutes,
  OnboardingStatus,
  ProfessionId,
} from '@/types/learning'
import {
  ONBOARDING_VERSION,
  PROFESSION_SPECIALIZATION,
  durationBucketForMinutes,
  isAiLevelId,
  isDailyMinutes,
  isProfessionId,
} from '@/lib/onboarding'

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
    learningGoal: data.learning_goal ?? null,
    specialization: data.specialization,
    learningPath: data.learning_path,
    learningDuration: data.learning_duration,
    planStartDate: data.plan_start_date,
    isActive: data.is_active,
    // v2 columns: unknown/legacy values read as "not answered", never guessed.
    profession: isProfessionId(data.profession) ? data.profession : null,
    aiLevel: isAiLevelId(data.ai_level) ? data.ai_level : null,
    dailyMinutes: isDailyMinutes(data.daily_minutes) ? data.daily_minutes : null,
    onboardingStatus: data.onboarding_status === 'completed' || data.onboarding_status === 'skipped'
      ? data.onboarding_status
      : null,
  }
}

export interface OnboardingAnswers {
  profession?: ProfessionId
  aiLevel?: AiLevelId
  dailyMinutes?: DailyMinutes
}

/**
 * Onboarding v2 write. Only the answers given are written, so skipping mid-way
 * keeps earlier answers and never invents the rest. Legacy NOT NULL columns get
 * values old readers understand: the mapped track, `comprehensive` (a narrower
 * path would show «خارج مسارك» locks on /toc) and a duration bucket.
 * Requires migration 20261016_onboarding_v2 (nullable learning_goal + v2 columns).
 */
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers,
  status?: OnboardingStatus,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()
  const { data: existing, error: readError } = await supabase
    .from('user_learning_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (readError) return { ok: false, error: readError.message }

  const row: Record<string, unknown> = { learning_path: 'comprehensive', is_active: true }
  if (answers.profession) {
    row.profession = answers.profession
    row.specialization = PROFESSION_SPECIALIZATION[answers.profession]
  }
  if (answers.aiLevel) row.ai_level = answers.aiLevel
  if (answers.dailyMinutes) {
    row.daily_minutes = answers.dailyMinutes
    row.learning_duration = durationBucketForMinutes(answers.dailyMinutes)
    row.plan_start_date = new Date().toISOString().split('T')[0]
  }
  if (status) {
    row.onboarding_status = status
    row.onboarding_version = ONBOARDING_VERSION
    row.onboarded_at = new Date().toISOString()
  }

  const { error } = existing
    ? await supabase.from('user_learning_preferences').update(row).eq('user_id', userId)
    : await supabase.from('user_learning_preferences').insert({
        user_id: userId,
        learning_goal: null,
        specialization: 'general',
        learning_duration: 'flexible',
        ...row,
      })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
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
