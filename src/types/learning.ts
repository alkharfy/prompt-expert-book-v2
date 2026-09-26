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

// تفضيلات المستخدم الكاملة
export interface UserLearningPreferences {
  userId: string
  learningGoal: LearningGoalId
  specialization: SpecializationId
  learningPath: LearningPathId
  learningDuration: LearningDurationId
  planStartDate: string
  isActive: boolean
}
