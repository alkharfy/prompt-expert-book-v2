// بيانات الإنجازات - Achievements Data
// تعريف جميع الإنجازات المتاحة في النظام

export interface AchievementDefinition {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'reading' | 'exercises' | 'streak' | 'special' | 'missions';
  points: number;
  requirement: number;
  requirementType: 'chapters' | 'exercises' | 'streak' | 'points' | 'time' | 'custom' | 'mission_complete';
  secret?: boolean; // إنجازات سرية لا تظهر حتى تفتح
}

export const achievementsData: AchievementDefinition[] = [
  // ============ إنجازات القراءة ============
  {
    id: 'first_chapter',
    icon: '📖',
    title: 'البداية',
    description: 'أكمل قراءة أول فصل',
    category: 'reading',
    points: 50,
    requirement: 1,
    requirementType: 'chapters',
  },
  {
    id: 'three_chapters',
    icon: '📚',
    title: 'قارئ نشط',
    description: 'أكمل قراءة 3 فصول',
    category: 'reading',
    points: 100,
    requirement: 3,
    requirementType: 'chapters',
  },
  {
    id: 'half_book',
    icon: '📕',
    title: 'نصف الطريق',
    description: 'أكمل قراءة نصف الكتاب',
    category: 'reading',
    points: 200,
    requirement: 5,
    requirementType: 'chapters',
  },
  {
    id: 'full_book',
    icon: '🎓',
    title: 'خريج',
    description: 'أكمل قراءة الكتاب كاملاً',
    category: 'reading',
    points: 500,
    requirement: 9,
    requirementType: 'chapters',
  },
  {
    id: 'speed_reader',
    icon: '⚡',
    title: 'قارئ سريع',
    description: 'أكمل الكتاب في أقل من أسبوع',
    category: 'reading',
    points: 300,
    requirement: 7,
    requirementType: 'custom',
    secret: true,
  },

  // ============ إنجازات التمارين ============
  {
    id: 'first_exercise',
    icon: '✏️',
    title: 'أول خطوة',
    description: 'أكمل أول تمرين',
    category: 'exercises',
    points: 30,
    requirement: 1,
    requirementType: 'exercises',
  },
  {
    id: 'five_exercises',
    icon: '🎯',
    title: 'متمرن',
    description: 'أكمل 5 تمارين',
    category: 'exercises',
    points: 100,
    requirement: 5,
    requirementType: 'exercises',
  },
  {
    id: 'ten_exercises',
    icon: '💪',
    title: 'مجتهد',
    description: 'أكمل 10 تمارين',
    category: 'exercises',
    points: 200,
    requirement: 10,
    requirementType: 'exercises',
  },
  {
    id: 'twenty_exercises',
    icon: '🏋️',
    title: 'محترف',
    description: 'أكمل 20 تمرين',
    category: 'exercises',
    points: 400,
    requirement: 20,
    requirementType: 'exercises',
  },
  {
    id: 'all_exercises',
    icon: '🏆',
    title: 'سيد التمارين',
    description: 'أكمل جميع التمارين',
    category: 'exercises',
    points: 600,
    requirement: 30,
    requirementType: 'exercises',
  },
  {
    id: 'perfect_score',
    icon: '💯',
    title: 'درجة كاملة',
    description: 'احصل على درجة كاملة في 5 تمارين متتالية',
    category: 'exercises',
    points: 250,
    requirement: 5,
    requirementType: 'custom',
    secret: true,
  },

  // ============ إنجازات الاستمرارية ============
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'بداية الاشتعال',
    description: 'حافظ على streak لمدة 3 أيام',
    category: 'streak',
    points: 50,
    requirement: 3,
    requirementType: 'streak',
  },
  {
    id: 'streak_7',
    icon: '🔥',
    title: 'أسبوع مشتعل',
    description: 'حافظ على streak لمدة أسبوع',
    category: 'streak',
    points: 150,
    requirement: 7,
    requirementType: 'streak',
  },
  {
    id: 'streak_14',
    icon: '🔥',
    title: 'نار متقدة',
    description: 'حافظ على streak لمدة أسبوعين',
    category: 'streak',
    points: 300,
    requirement: 14,
    requirementType: 'streak',
  },
  {
    id: 'streak_30',
    icon: '🌟',
    title: 'شهر من الالتزام',
    description: 'حافظ على streak لمدة شهر',
    category: 'streak',
    points: 500,
    requirement: 30,
    requirementType: 'streak',
  },
  {
    id: 'streak_100',
    icon: '💎',
    title: 'أسطورة',
    description: 'حافظ على streak لمدة 100 يوم',
    category: 'streak',
    points: 1000,
    requirement: 100,
    requirementType: 'streak',
    secret: true,
  },

  // ============ إنجازات خاصة ============
  {
    id: 'points_500',
    icon: '⭐',
    title: 'نجم صاعد',
    description: 'اجمع 500 نقطة',
    category: 'special',
    points: 50,
    requirement: 500,
    requirementType: 'points',
  },
  {
    id: 'points_1000',
    icon: '🌟',
    title: 'نجم لامع',
    description: 'اجمع 1000 نقطة',
    category: 'special',
    points: 100,
    requirement: 1000,
    requirementType: 'points',
  },
  {
    id: 'points_5000',
    icon: '✨',
    title: 'نجم متألق',
    description: 'اجمع 5000 نقطة',
    category: 'special',
    points: 250,
    requirement: 5000,
    requirementType: 'points',
  },
  {
    id: 'early_bird',
    icon: '🌅',
    title: 'الطائر المبكر',
    description: 'ادرس في الصباح الباكر (قبل 7 صباحاً)',
    category: 'special',
    points: 100,
    requirement: 1,
    requirementType: 'custom',
    secret: true,
  },
  {
    id: 'night_owl',
    icon: '🦉',
    title: 'بومة الليل',
    description: 'ادرس بعد منتصف الليل',
    category: 'special',
    points: 100,
    requirement: 1,
    requirementType: 'custom',
    secret: true,
  },
  {
    id: 'bookmarks_10',
    icon: '📑',
    title: 'جامع الإشارات',
    description: 'أضف 10 إشارات مرجعية',
    category: 'special',
    points: 75,
    requirement: 10,
    requirementType: 'custom',
  },
  {
    id: 'first_certificate',
    icon: '🎖️',
    title: 'أول شهادة',
    description: 'احصل على شهادة إتمام الكتاب',
    category: 'special',
    points: 500,
    requirement: 1,
    requirementType: 'custom',
  },
  {
    id: 'share_certificate',
    icon: '📤',
    title: 'فخور بإنجازي',
    description: 'شارك شهادتك مع الآخرين',
    category: 'special',
    points: 50,
    requirement: 1,
    requirementType: 'custom',
  },
  {
    id: 'use_all_tools',
    icon: '🧰',
    title: 'صانع محترف',
    description: 'استخدم جميع الأدوات المتقدمة',
    category: 'special',
    points: 150,
    requirement: 3,
    requirementType: 'custom',
  },
  {
    id: 'top_10',
    icon: '🏅',
    title: 'من العشرة الأوائل',
    description: 'كن ضمن أفضل 10 في لوحة المتصدرين',
    category: 'special',
    points: 300,
    requirement: 1,
    requirementType: 'custom',
    secret: true,
  },

  // ============ إنجازات المهمات ============
  {
    id: 'chap1_mission1',
    icon: '🧭',
    title: 'بوصلة المشروع',
    description: 'قم بملء بطاقة المشروع (ورقة التعريف)',
    category: 'missions',
    points: 10,
    requirement: 1,
    requirementType: 'mission_complete',
  },
  {
    id: 'chap1_game1',
    icon: '🔍',
    title: 'المحقق الذكي',
    description: 'اكتشف العناصر الـ 5 الناقصة في برومبت علي',
    category: 'missions',
    points: 5,
    requirement: 1,
    requirementType: 'mission_complete',
  },
  {
    id: 'chap1_mission2',
    icon: '🚀',
    title: 'قاذف البداية',
    description: 'جرب برومبت الـ Kickoff مع مشروعك',
    category: 'missions',
    points: 10,
    requirement: 1,
    requirementType: 'mission_complete',
  },
  {
    id: 'chap1_boss',
    icon: '⚔️',
    title: 'قاهر الوحوش',
    description: 'حول البرومبت الضعيف إلى برومبت احترافي',
    category: 'missions',
    points: 20,
    requirement: 1,
    requirementType: 'mission_complete',
  },
];

// تجميع الإنجازات حسب الفئة
export const achievementsByCategory = achievementsData.reduce((acc, achievement) => {
  if (!acc[achievement.category]) {
    acc[achievement.category] = [];
  }
  acc[achievement.category].push(achievement);
  return acc;
}, {} as Record<string, AchievementDefinition[]>);

// الحصول على إنجاز بالـ ID
export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return achievementsData.find(a => a.id === id);
};

// حساب إجمالي النقاط المتاحة من الإنجازات
export const totalAchievementPoints = achievementsData.reduce((sum, a) => sum + a.points, 0);

// عدد الإنجازات
export const totalAchievements = achievementsData.length;

// الإنجازات غير السرية
export const visibleAchievements = achievementsData.filter(a => !a.secret);
export const secretAchievements = achievementsData.filter(a => a.secret);
