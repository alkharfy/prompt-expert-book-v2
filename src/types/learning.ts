// src/types/learning.ts — أنواع TypeScript للمسارات التعليمية

// المسارات التعليمية
export type LearningPathId = 'quick' | 'intermediate' | 'comprehensive'

export interface LearningPath {
  id: LearningPathId
  nameAr: string
  descriptionAr: string
  icon: string
  sections: string[]
  totalPages: number
  estimatedHours: number
  exerciseCount: number
  features: string[]
}

// التخصصات
export type SpecializationId = 'programming' | 'ecommerce' | 'design' | 'marketing' | 'general'

export interface Specialization {
  id: SpecializationId
  nameAr: string
  icon: string
  quickWinPrompt: string
}

// أهداف التعلم
export type LearningGoalId = 'professional' | 'entrepreneurship' | 'career-change' | 'curiosity'

export interface LearningGoal {
  id: LearningGoalId
  nameAr: string
  descriptionAr: string
  icon: string
}

// مدة التعلم
export type LearningDurationId = '1week' | '2weeks' | '1month' | '2months' | 'flexible'

export interface LearningDuration {
  id: LearningDurationId
  nameAr: string
  icon: string
  dailyMinutes: number
}

// إجابات شاشات البداية (onboarding v2)
export type ProfessionId =
  | 'accounting'
  | 'hr_admin'
  | 'teacher'
  | 'marketing_business'
  | 'sales_service'
  | 'student_jobseeker'
  | 'programmer'
  | 'other'

export type AiLevelId = 'new' | 'some' | 'daily'

export type DailyMinutes = 10 | 20 | 30

export type OnboardingStatus = 'completed' | 'skipped'

// تفضيلات المستخدم الكاملة
export interface UserLearningPreferences {
  userId: string
  /** No longer asked since onboarding v2 — null for new rows. */
  learningGoal: LearningGoalId | null
  specialization: SpecializationId
  learningPath: LearningPathId
  learningDuration: LearningDurationId
  planStartDate: string
  isActive: boolean
  profession: ProfessionId | null
  aiLevel: AiLevelId | null
  dailyMinutes: DailyMinutes | null
  onboardingStatus: OnboardingStatus | null
}
