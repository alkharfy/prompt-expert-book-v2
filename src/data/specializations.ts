import type { Specialization, SpecializationId } from '@/types/learning'

export const SPECIALIZATIONS: Record<SpecializationId, Specialization> = {
  programming: {
    id: 'programming',
    nameAr: 'البرمجة والتطوير',
    icon: '💻',
    quickWinPrompt: 'اكتبلي دالة JavaScript تعمل validation لـ email address مع شرح كل سطر',
  },
  ecommerce: {
    id: 'ecommerce',
    nameAr: 'التجارة الإلكترونية',
    icon: '🛒',
    quickWinPrompt: 'اكتبلي وصف منتج احترافي لمتجر إلكتروني يبيع ساعات ذكية',
  },
  design: {
    id: 'design',
    nameAr: 'التصميم والإبداع',
    icon: '🎨',
    quickWinPrompt: 'اقترحلي color palette مع typography لبراند قهوة مصري عصري',
  },
  marketing: {
    id: 'marketing',
    nameAr: 'التسويق الرقمي',
    icon: '📣',
    quickWinPrompt: 'اكتبلي خطة محتوى لصفحة إنستغرام لمطعم جديد — أسبوع كامل',
  },
  general: {
    id: 'general',
    nameAr: 'استخدام عام',
    icon: '🌐',
    quickWinPrompt: 'لخصلي هذا التقرير في 5 نقاط رئيسية مع توصيات عملية',
  },
}

export function getSpecialization(id: SpecializationId): Specialization {
  return SPECIALIZATIONS[id] ?? SPECIALIZATIONS.general
}
