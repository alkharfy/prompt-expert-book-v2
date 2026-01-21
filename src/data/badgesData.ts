// =====================================================
// بيانات الشارات - Badges Data (Client-side reference)
// =====================================================

export interface Badge {
    id: string
    name: string
    description: string
    icon: string
    category: 'reading' | 'exercises' | 'streak' | 'special'
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
    requirementType: string
    requirementValue: number
    pointsReward: number
}

// الشارات المتاحة (نسخة للعرض في الواجهة)
export const allBadges: Badge[] = [
    // شارات القراءة
    {
        id: 'first_page',
        name: 'القارئ المبتدئ',
        description: 'قرأت أول صفحة في الكتاب',
        icon: '📖',
        category: 'reading',
        rarity: 'common',
        requirementType: 'pages_read',
        requirementValue: 1,
        pointsReward: 10
    },
    {
        id: 'reader_10',
        name: 'قارئ نشط',
        description: 'قرأت 10 صفحات',
        icon: '📚',
        category: 'reading',
        rarity: 'common',
        requirementType: 'pages_read',
        requirementValue: 10,
        pointsReward: 25
    },
    {
        id: 'reader_25',
        name: 'محب القراءة',
        description: 'قرأت 25 صفحة',
        icon: '📕',
        category: 'reading',
        rarity: 'uncommon',
        requirementType: 'pages_read',
        requirementValue: 25,
        pointsReward: 50
    },
    {
        id: 'reader_50',
        name: 'قارئ متمرس',
        description: 'قرأت 50 صفحة',
        icon: '📗',
        category: 'reading',
        rarity: 'rare',
        requirementType: 'pages_read',
        requirementValue: 50,
        pointsReward: 100
    },
    {
        id: 'book_complete',
        name: 'أنهيت الكتاب',
        description: 'أكملت قراءة الكتاب كاملاً',
        icon: '🏆',
        category: 'reading',
        rarity: 'legendary',
        requirementType: 'pages_read',
        requirementValue: 100,
        pointsReward: 500
    },

    // شارات الفصول
    {
        id: 'chapter_1',
        name: 'الخطوة الأولى',
        description: 'أكملت الفصل الأول',
        icon: '1️⃣',
        category: 'reading',
        rarity: 'common',
        requirementType: 'chapters_completed',
        requirementValue: 1,
        pointsReward: 30
    },
    {
        id: 'chapter_3',
        name: 'في الطريق',
        description: 'أكملت 3 فصول',
        icon: '3️⃣',
        category: 'reading',
        rarity: 'uncommon',
        requirementType: 'chapters_completed',
        requirementValue: 3,
        pointsReward: 75
    },
    {
        id: 'chapter_6',
        name: 'نصف الطريق',
        description: 'أكملت 6 فصول',
        icon: '🌗',
        category: 'reading',
        rarity: 'rare',
        requirementType: 'chapters_completed',
        requirementValue: 6,
        pointsReward: 150
    },
    {
        id: 'all_chapters',
        name: 'خبير البرومبتات',
        description: 'أكملت جميع الفصول',
        icon: '🎓',
        category: 'reading',
        rarity: 'epic',
        requirementType: 'chapters_completed',
        requirementValue: 9,
        pointsReward: 300
    },

    // شارات التمارين
    {
        id: 'first_exercise',
        name: 'المتدرب',
        description: 'أكملت أول تمرين',
        icon: '✏️',
        category: 'exercises',
        rarity: 'common',
        requirementType: 'exercises_completed',
        requirementValue: 1,
        pointsReward: 15
    },
    {
        id: 'exercises_5',
        name: 'مجتهد',
        description: 'أكملت 5 تمارين',
        icon: '💪',
        category: 'exercises',
        rarity: 'common',
        requirementType: 'exercises_completed',
        requirementValue: 5,
        pointsReward: 40
    },
    {
        id: 'exercises_10',
        name: 'متفوق',
        description: 'أكملت 10 تمارين',
        icon: '⭐',
        category: 'exercises',
        rarity: 'uncommon',
        requirementType: 'exercises_completed',
        requirementValue: 10,
        pointsReward: 80
    },
    {
        id: 'exercises_20',
        name: 'محترف',
        description: 'أكملت 20 تمرين',
        icon: '🌟',
        category: 'exercises',
        rarity: 'rare',
        requirementType: 'exercises_completed',
        requirementValue: 20,
        pointsReward: 150
    },
    {
        id: 'all_exercises',
        name: 'أسطورة التمارين',
        description: 'أكملت جميع التمارين',
        icon: '👑',
        category: 'exercises',
        rarity: 'legendary',
        requirementType: 'exercises_completed',
        requirementValue: 30,
        pointsReward: 400
    },
    {
        id: 'quiz_ace',
        name: 'عبقري',
        description: 'حصلت على 100% في اختبار',
        icon: '🧠',
        category: 'exercises',
        rarity: 'uncommon',
        requirementType: 'perfect_quizzes',
        requirementValue: 1,
        pointsReward: 50
    },
    {
        id: 'quiz_master',
        name: 'سيد الاختبارات',
        description: 'نجحت في 10 اختبارات',
        icon: '🎯',
        category: 'exercises',
        rarity: 'rare',
        requirementType: 'quizzes_passed',
        requirementValue: 10,
        pointsReward: 100
    },

    // شارات Streak
    {
        id: 'streak_3',
        name: 'ثابت',
        description: '3 أيام متتالية من التعلم',
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        requirementType: 'streak_days',
        requirementValue: 3,
        pointsReward: 30
    },
    {
        id: 'streak_7',
        name: 'أسبوع كامل',
        description: '7 أيام متتالية',
        icon: '🔥',
        category: 'streak',
        rarity: 'uncommon',
        requirementType: 'streak_days',
        requirementValue: 7,
        pointsReward: 70
    },
    {
        id: 'streak_14',
        name: 'أسبوعان',
        description: '14 يوم متتالي',
        icon: '🔥',
        category: 'streak',
        rarity: 'rare',
        requirementType: 'streak_days',
        requirementValue: 14,
        pointsReward: 140
    },
    {
        id: 'streak_30',
        name: 'شهر كامل',
        description: '30 يوم متتالي',
        icon: '🔥',
        category: 'streak',
        rarity: 'epic',
        requirementType: 'streak_days',
        requirementValue: 30,
        pointsReward: 300
    },
    {
        id: 'streak_100',
        name: 'أسطوري',
        description: '100 يوم متتالي',
        icon: '💎',
        category: 'streak',
        rarity: 'legendary',
        requirementType: 'streak_days',
        requirementValue: 100,
        pointsReward: 1000
    },

    // شارات النقاط
    {
        id: 'points_100',
        name: 'جامع النقاط',
        description: 'جمعت 100 نقطة',
        icon: '💰',
        category: 'special',
        rarity: 'common',
        requirementType: 'total_points',
        requirementValue: 100,
        pointsReward: 0
    },
    {
        id: 'points_500',
        name: 'ثري',
        description: 'جمعت 500 نقطة',
        icon: '💎',
        category: 'special',
        rarity: 'uncommon',
        requirementType: 'total_points',
        requirementValue: 500,
        pointsReward: 0
    },
    {
        id: 'points_1000',
        name: 'ملياردير',
        description: 'جمعت 1000 نقطة',
        icon: '🏦',
        category: 'special',
        rarity: 'rare',
        requirementType: 'total_points',
        requirementValue: 1000,
        pointsReward: 0
    },
    {
        id: 'points_5000',
        name: 'إمبراطور النقاط',
        description: 'جمعت 5000 نقطة',
        icon: '👸',
        category: 'special',
        rarity: 'legendary',
        requirementType: 'total_points',
        requirementValue: 5000,
        pointsReward: 0
    },

    // شارات خاصة
    {
        id: 'early_bird',
        name: 'الطائر المبكر',
        description: 'تعلمت قبل الساعة 7 صباحاً',
        icon: '🌅',
        category: 'special',
        rarity: 'uncommon',
        requirementType: 'early_login',
        requirementValue: 1,
        pointsReward: 25
    },
    {
        id: 'night_owl',
        name: 'بومة الليل',
        description: 'تعلمت بعد منتصف الليل',
        icon: '🦉',
        category: 'special',
        rarity: 'uncommon',
        requirementType: 'late_login',
        requirementValue: 1,
        pointsReward: 25
    },
    {
        id: 'weekend_warrior',
        name: 'محارب الإجازة',
        description: 'تعلمت في نهاية الأسبوع',
        icon: '🎉',
        category: 'special',
        rarity: 'common',
        requirementType: 'weekend_login',
        requirementValue: 1,
        pointsReward: 20
    }
]

// تصنيف الشارات حسب الفئة
export const badgesByCategory = {
    reading: allBadges.filter(b => b.category === 'reading'),
    exercises: allBadges.filter(b => b.category === 'exercises'),
    streak: allBadges.filter(b => b.category === 'streak'),
    special: allBadges.filter(b => b.category === 'special')
}

// ألقاب المستويات
export const levelTitles: Record<number, { title: string; icon: string }> = {
    1: { title: 'مبتدئ', icon: '🌱' },
    2: { title: 'متعلم', icon: '📖' },
    3: { title: 'ناشط', icon: '⚡' },
    4: { title: 'متقدم', icon: '🔥' },
    5: { title: 'خبير', icon: '💪' },
    6: { title: 'محترف', icon: '🌟' },
    7: { title: 'متميز', icon: '💎' },
    8: { title: 'أسطوري', icon: '👑' },
    9: { title: 'إمبراطور', icon: '🏆' },
    10: { title: 'أسطورة', icon: '🌌' }
}
