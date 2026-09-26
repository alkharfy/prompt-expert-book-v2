# خطة تطوير المسارات التعليمية والتخصصات

> **تاريخ الإنشاء:** 2026-03-23
> **الحالة:** مخطط - جاهز للتنفيذ
> **الأولوية:** عالية جداً - تحسين أساسي لتجربة المستخدم

---

## 📋 ملخص تنفيذي

تحويل الموقع من "كتاب إلكتروني خطي" إلى **منصة تعليمية تكيفية (Adaptive Learning Platform)** عبر:
1. **مسارات تعليمية** (قصير / متوسط / شامل) — كل مسار بمحتوى وتمارين مختلفة
2. **تخصصات مهنية** (برمجة / تجارة إلكترونية / تصميم / عام) — أمثلة وسيناريوهات مخصصة
3. **خطة زمنية** (أسبوع / أسبوعين / شهر / شهرين) — جدول يومي + reminders
4. **مصادر تعلم متجددة** — مكتبة مصادر مصنفة بتحديث دوري

---

## 🔍 تحليل الوضع الحالي

### ما هو موجود بالفعل:
| الميزة | الحالة | الملاحظات |
|--------|--------|-----------|
| صفحة Onboarding | ✅ موجودة | اختيار هدف (4 خيارات) → محفوظ في `localStorage` فقط ← **لا يُستخدم بعدها** |
| نظام الفصول | ✅ 10 فصول | مسار خطي واحد — لا يوجد تفريع |
| التمارين | ✅ 40+ تمرين | مصنفة حسب الفصل فقط — لا تخصص |
| اليوميات | ✅ 3 مهمات/يوم | عشوائية — لا ترتبط بخطة تعلم |
| الإيميلات | ✅ Resend متكامل | streak + missions + milestones |
| Gamification | ✅ كامل | نقاط + مستويات + إنجازات + streaks |
| خطط الاشتراك | ✅ 3 خطط | Basic / Pro / VIP — لا تتأثر بالمسار |

### ما ينقص:
| الميزة | الأثر |
|--------|-------|
| المسارات التعليمية | المستخدم يقرأ كل حاجة أو لا يعرف من أين يبدأ |
| التخصصات | كل الأمثلة عامة — المبرمج والتاجر يشوفوا نفس المحتوى |
| الخطة الزمنية | لا يوجد جدول يومي منظم — المهمات عشوائية |
| المصادر | لا يوجد قسم مصادر خارجية للتعلم المستمر |
| حفظ التفضيلات في DB | الهدف محفوظ في localStorage فقط ← يضيع لو غير المتصفح |

---

## 🏗️ المرحلة 1: توسيع الـ Onboarding (الأساس)

### 1.1 تغييرات قاعدة البيانات

#### جدول جديد: `user_learning_preferences`
```sql
CREATE TABLE user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- المسار التعليمي
  learning_path TEXT NOT NULL DEFAULT 'comprehensive'
    CHECK (learning_path IN ('quick', 'intermediate', 'comprehensive')),
  
  -- التخصص المهني
  specialization TEXT NOT NULL DEFAULT 'general'
    CHECK (specialization IN ('programming', 'ecommerce', 'design', 'marketing', 'general')),
  
  -- الهدف (نقل من localStorage)
  learning_goal TEXT NOT NULL DEFAULT 'curiosity'
    CHECK (learning_goal IN ('professional', 'entrepreneurship', 'career-change', 'curiosity')),
  
  -- مدة التعلم
  learning_duration TEXT NOT NULL DEFAULT '1month'
    CHECK (learning_duration IN ('1week', '2weeks', '1month', '2months')),
  
  -- تاريخ بداية الخطة
  plan_start_date DATE DEFAULT CURRENT_DATE,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_learning_preferences FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own preferences"
  ON user_learning_preferences FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own preferences"
  ON user_learning_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Index
CREATE INDEX idx_learning_preferences_user ON user_learning_preferences(user_id);
```

### 1.2 صفحة Onboarding الجديدة (4 خطوات)

**الملف:** `src/app/onboarding/page.tsx` — إعادة بناء كامل

#### الخطوة 1: اختيار الهدف (الموجود حالياً — تحسينه)
```
┌─────────────────────────────────────────────────┐
│              ما هدفك من التعلم؟                  │
│                                                  │
│  🏢 تطوير مهاراتي المهنية                       │
│     (أستخدم AI في شغلي الحالي)                   │
│                                                  │
│  🚀 بناء مشروعي الخاص                           │
│     (أبدأ بزنس جديد بالذكاء الاصطناعي)          │
│                                                  │
│  🔄 تغيير مساري المهني                           │
│     (أدخل مجال AI كمحترف)                        │
│                                                  │
│  💡 فضول ومعرفة                                  │
│     (أفهم إزاي AI بيشتغل)                        │
│                                                  │
│                    [التالي →]                     │
└─────────────────────────────────────────────────┘
```

#### الخطوة 2: اختيار التخصص (جديد)
```
┌─────────────────────────────────────────────────┐
│           في أي مجال بتشتغل أو مهتم؟            │
│                                                  │
│  💻 البرمجة وتطوير البرمجيات                     │
│     (كتابة كود، debugging، بناء تطبيقات)         │
│                                                  │
│  🛒 التجارة الإلكترونية                          │
│     (متجر أونلاين، منتجات، تسويق)               │
│                                                  │
│  🎨 التصميم والمحتوى البصري                      │
│     (UI/UX، جرافيك، فيديو)                       │
│                                                  │
│  📢 التسويق الرقمي                               │
│     (سوشيال ميديا، إعلانات، محتوى)              │
│                                                  │
│  🌐 استخدام عام                                  │
│     (إيميلات، تقارير، ملخصات، إنتاجية)          │
│                                                  │
│              [← السابق] [التالي →]                │
└─────────────────────────────────────────────────┘
```

#### الخطوة 3: اختيار المسار التعليمي (جديد)
```
┌────────────────────────────────────────────────────────┐
│              اختر مسارك التعليمي                        │
│                                                         │
│  ⚡ المسار السريع (الأساسيات)                          │
│     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                          │
│     • المقدمة + فصل 1 + فصل 2                          │
│     • 5 تمارين أساسية                                   │
│     • تعلم أهم تقنيات الـ Prompt                        │
│     • مناسب للمشغولين واللي عايزين نتائج سريعة         │
│     📄 29 صفحة | ⏰ ~4 ساعات قراءة                      │
│                                                         │
│  📚 المسار المتوسط                                      │
│     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                          │
│     • كل محتوى السريع                                   │
│     • + فصول 3-6 (تصميم + كتابة + جودة + أدوات)       │
│     • 20 تمرين تفاعلي                                   │
│     • مشروع تطبيقي بسيط                                 │
│     📄 77 صفحة | ⏰ ~12 ساعة قراءة                      │
│                                                         │
│  🏆 المسار الشامل (كل المحتوى)                        │
│     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                          │
│     • كل الفصول (1-10) + الملحق + المسرد               │
│     • 40+ تمرين + كل أنواع التمارين                     │
│     • المشروع الممتد (بناء AI Agent)                    │
│     • أدوات AI + Chat مع AI                             │
│     • شهادة إتمام                                       │
│     📄 89 صفحة | ⏰ ~20 ساعة قراءة                      │
│                                                         │
│              [← السابق] [التالي →]                       │
└────────────────────────────────────────────────────────┘
```

#### الخطوة 4: اختيار مدة التعلم (جديد)
```
┌────────────────────────────────────────────────────────┐
│         في كام وقت عايز تخلص المسار؟                   │
│                                                         │
│  🏃 أسبوع واحد                                         │
│     يومياً: ~3-5 صفحات + 1-2 تمرين                     │
│     (مكثف — للمتفرغين)                                  │
│                                                         │
│  🚶 أسبوعين                                             │
│     يومياً: ~2-3 صفحات + 1 تمرين                       │
│     (متوسط — 30-45 دقيقة يومياً)                       │
│                                                         │
│  🎯 شهر واحد                                            │
│     يومياً: ~1-2 صفحات + تمرين كل يومين                │
│     (مريح — 20 دقيقة يومياً)                            │
│                                                         │
│  🌿 شهرين                                               │
│     يومياً: صفحة واحدة + تمرين أسبوعي                  │
│     (هادي — 10-15 دقيقة يومياً)                         │
│                                                         │
│     ⓘ الخطة مرنة — تقدر تعدلها في أي وقت               │
│                                                         │
│              [← السابق] [ابدأ رحلتك! 🚀]                │
└────────────────────────────────────────────────────────┘
```

### 1.3 الملفات المطلوب إنشاؤها/تعديلها

| الملف | النوع | الوصف |
|-------|-------|-------|
| `src/app/onboarding/page.tsx` | **تعديل** | إعادة بناء كامل — 4 خطوات بدل خطوة |
| `src/types/learning.ts` | **جديد** | أنواع TypeScript للمسارات والتخصصات |
| `src/data/learningPaths.ts` | **جديد** | تعريف المسارات ومحتوى كل مسار |
| `src/data/specializations.ts` | **جديد** | أمثلة وسيناريوهات كل تخصص |
| `src/lib/learning-preferences.ts` | **جديد** | CRUD لتفضيلات التعلم |
| `src/app/api/learning-preferences/route.ts` | **جديد** | API endpoint |
| `supabase_learning_preferences.sql` | **جديد** | ملف migration لقاعدة البيانات |

### 1.4 أنواع TypeScript الجديدة

**الملف:** `src/types/learning.ts`
```typescript
// المسارات التعليمية
export type LearningPathId = 'quick' | 'intermediate' | 'comprehensive';

export interface LearningPath {
  id: LearningPathId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  sections: string[];          // أسماء الأقسام المشمولة
  totalPages: number;
  estimatedHours: number;
  exerciseCount: number;
  features: string[];          // قائمة الميزات المتاحة
}

// التخصصات
export type SpecializationId = 'programming' | 'ecommerce' | 'design' | 'marketing' | 'general';

export interface Specialization {
  id: SpecializationId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  examplePrompts: string[];    // أمثلة prompts للتخصص
  useCases: string[];          // حالات استخدام
  relatedTools: string[];      // أدوات AI مقترحة
}

// أهداف التعلم
export type LearningGoalId = 'professional' | 'entrepreneurship' | 'career-change' | 'curiosity';

// مدة التعلم
export type LearningDurationId = '1week' | '2weeks' | '1month' | '2months';

export interface LearningDuration {
  id: LearningDurationId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  dailyPages: number;          // عدد الصفحات اليومية المقترحة
  dailyExercises: number;      // عدد التمارين اليومية
  dailyMinutes: number;        // الوقت اليومي المقدر بالدقائق
}

// تفضيلات المستخدم الكاملة
export interface UserLearningPreferences {
  userId: string;
  learningPath: LearningPathId;
  specialization: SpecializationId;
  learningGoal: LearningGoalId;
  learningDuration: LearningDurationId;
  planStartDate: string;       // ISO date
  isActive: boolean;
}
```

---

## 🏗️ المرحلة 2: نظام المسارات التعليمية (Learning Paths)

### 2.1 تعريف المسارات

**الملف:** `src/data/learningPaths.ts`

#### المسار السريع (Quick Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | intro, section-1, section-2 |
| **الصفحات** | 29 صفحة (6 + 17 + 6 صفحات مجانية من section-2) |
| **التمارين** | 5 تمارين أساسية (section-1 فقط) |
| **المدة المقدرة** | 4 ساعات قراءة |
| **الميزات** | قراءة، notes، bookmarks |
| **الخطة المطلوبة** | Basic أو أعلى |

**ما يتعلمه المستخدم:**
- ما هو الذكاء الاصطناعي التوليدي
- أساسيات كتابة الـ Prompts
- أول تقنيات التواصل مع AI
- تطبيقات عملية مبدئية

#### المسار المتوسط (Intermediate Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | intro, section-1 → section-6 |
| **الصفحات** | 77 صفحة |
| **التمارين** | 20 تمرين (sections 1-6) |
| **المدة المقدرة** | 12 ساعة قراءة |
| **الميزات** | قراءة، notes، bookmarks، تمارين، gamification |
| **الخطة المطلوبة** | Pro أو أعلى |

**ما يتعلمه المستخدم:**
- كل محتوى المسار السريع
- تصميم تجربة المستخدم بـ AI
- كتابة محتوى احترافي
- تقنيات تحسين الجودة
- أدوات AI المختلفة

#### المسار الشامل (Comprehensive Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | كل الأقسام (intro → section-10 + appendix + glossary) |
| **الصفحات** | 89 صفحة |
| **التمارين** | 40+ تمرين (كل الأقسام) |
| **المدة المقدرة** | 20 ساعة قراءة |
| **الميزات** | كل الميزات بما فيها Chat و Tools |
| **الخطة المطلوبة** | VIP (للوصول الكامل) |

**ما يتعلمه المستخدم:**
- كل المحتوى
- المشروع الممتد (بناء AI Agent)
- أدوات Prompt Generator, Analyzer, Comparator
- Chat مع AI
- شهادة إتمام

### 2.2 التأثير على صفحة TOC

**الملف:** `src/app/toc/page.tsx` — تعديل

التعديل المطلوب:
- إضافة **شريط المسار** في أعلى الصفحة يوضح المسار المختار
- **تظليل** الفصول الغير مشمولة في المسار الحالي
- إضافة **شارة "خارج مسارك"** على الفصول الإضافية
- زر **"ترقية المسار"** إذا أراد المستخدم توسيع مساره
- **شريط تقدم** يعكس نسبة إكمال المسار (وليس الكتاب كله)

```
┌────────────────────────────────────────────────┐
│ 📚 مسارك: المسار المتوسط    [تغيير المسار]    │
│ ████████████░░░░░░░░  45% مكتمل               │
├────────────────────────────────────────────────┤
│                                                │
│  ✅ المقدمة (مكتمل)                            │
│     ↓                                          │
│  ✅ الفصل 1 — عالم AI (مكتمل)                  │
│     ↓                                          │
│  🔵 الفصل 2 — من الفكرة للمواصفات (جاري)       │
│     ↓                                          │
│  ○ الفصل 3 — تصميم التجربة                     │
│     ↓                                          │
│  ○ الفصل 4 — كتابة المحتوى                    │
│     ↓                                          │
│  ○ الفصل 5 — الجودة والتحسين                   │
│     ↓                                          │
│  ○ الفصل 6 — الأدوات                           │
│     ↓                                          │
│  🔒 الفصل 7-10 (خارج مسارك — [ترقية])         │
│                                                │
└────────────────────────────────────────────────┘
```

### 2.3 التأثير على Daily Missions

**الملف:** `src/lib/missions.ts` — تعديل

التعديل: ربط الـ mission generation بالمسار:
- المسار السريع: مهمات قراءة فقط (لا تمارين)
- المسار المتوسط: مهمات قراءة + تمارين
- المسار الشامل: كل أنواع المهمات

**Function update:**
```typescript
// قبل
generateDailyMissions(userId, userLevel, userPlan)

// بعد
generateDailyMissions(userId, userLevel, userPlan, learningPath?)
```

---

## 🏗️ المرحلة 3: نظام التخصصات (Specializations)

### 3.1 المحتوى المخصص لكل تخصص

**الملف:** `src/data/specializations.ts`

لكل فصل من فصول الكتاب، يتم إضافة **أمثلة مخصصة** بناءً على التخصص:

#### مثال: فصل 2 (من الفكرة للمواصفات)

| التخصص | أمثلة الـ Prompt |
|--------|-----------------|
| **البرمجة** | "اكتبلي مواصفات API لتطبيق إدارة مهام..."، "صمملي database schema لـ..." |
| **التجارة الإلكترونية** | "اكتبلي خطة إطلاق متجر إلكتروني..."، "حللي السوق المصري لمنتج..." |
| **التصميم** | "صمملي wireframe لتطبيق..."، "اقترحلي color palette لبراند..." |
| **التسويق** | "اكتبلي خطة تسويقية لمنتج..."، "صمملي حملة سوشيال ميديا..." |
| **عام** | "اكتبلي إيميل رسمي..."، "لخصلي التقرير ده..."، "جهزلي عرض تقديمي..." |

### 3.2 هيكل بيانات التخصص

```typescript
interface SpecializationContent {
  specializationId: SpecializationId;
  sectionId: string;
  
  // أمثلة Prompts مخصصة
  examplePrompts: {
    title: string;
    prompt: string;
    expectedOutput: string;
    tips: string[];
  }[];
  
  // تمارين إضافية مخصصة
  bonusExercises: ExerciseData[];
  
  // سيناريوهات تطبيقية
  scenarios: {
    title: string;
    description: string;
    steps: string[];
  }[];
  
  // أدوات مقترحة للتخصص
  recommendedTools: {
    name: string;
    url: string;
    description: string;
  }[];
}
```

### 3.3 كيفية العرض

- **في صفحة القراءة** (`/read/[section]/[page]`): يظهر **قسم "أمثلة من تخصصك"** أسفل المحتوى الرئيسي
- **في التمارين** (`/exercises`): تظهر **تمارين التخصص أولاً** ثم التمارين العامة
- **في الأدوات** (`/tools`): الـ Prompt Generator يبدأ **بقوالب التخصص**

### 3.4 خطة المحتوى المطلوب إنشاؤه

| الفصل | برمجة | تجارة | تصميم | تسويق | عام |
|-------|-------|-------|-------|-------|-----|
| فصل 1 | 3 أمثلة | 3 أمثلة | 3 أمثلة | 3 أمثلة | 3 أمثلة |
| فصل 2 | 3 أمثلة + 1 تمرين | 3+1 | 3+1 | 3+1 | 3+1 |
| فصل 3 | 3+1 | 3+1 | 3+1 | 3+1 | 3+1 |
| فصل 4 | 3+1 | 3+1 | 3+1 | 3+1 | 3+1 |
| فصل 5 | 3+1 | 3+1 | 3+1 | 3+1 | 3+1 |
| فصل 6 | 3+1 | 3+1 | 3+1 | 3+1 | 3+1 |
| فصل 7-10 | 2+1 | 2+1 | 2+1 | 2+1 | 2+1 |
| **المجموع** | ~28 مثال + 10 تمارين | ×5 تخصصات | | | |

**إجمالي المحتوى الجديد:** ~140 مثال + 50 تمرين إضافي

---

## 🏗️ المرحلة 4: خطة التعلم الزمنية (Learning Plan)

### 4.1 محرك توليد الخطة

**الملف:** `src/lib/learning-plan.ts`

#### المنطق:
```
المسار المختار → عدد الصفحات + التمارين
مدة التعلم → عدد الأيام
                ↓
    جدول يومي = (صفحات ÷ أيام) + (تمارين ÷ أيام)
```

#### مثال: المسار المتوسط + شهر واحد
```
77 صفحة ÷ 30 يوم = ~2.6 صفحات/يوم
20 تمرين ÷ 30 يوم = ~0.7 تمرين/يوم = تمرين كل يوم ونصف

الجدول:
├── يوم 1: قراءة المقدمة (ص 1-3) + مراجعة
├── يوم 2: قراءة المقدمة (ص 4-6) + مراجعة
├── يوم 3: فصل 1 (ص 1-3) 
├── يوم 4: فصل 1 (ص 4-6) + تمرين 1
├── يوم 5: فصل 1 (ص 7-9)
├── ...
├── يوم 28: فصل 6 (ص 16-18) + تمرين 20
├── يوم 29: مراجعة شاملة
├── يوم 30: 🎉 احتفال بالإنجاز!
```

### 4.2 صفحة خطة التعلم

**مسار جديد:** `src/app/my-plan/page.tsx`

```
┌────────────────────────────────────────────────────────┐
│  📅 خطة التعلم الخاصة بك                              │
│  ─────────────────────────────────────                  │
│  المسار: المتوسط | التخصص: برمجة | المدة: شهر          │
│  بدأت: 15 مارس 2026 | الانتهاء المتوقع: 15 أبريل      │
│  ████████████░░░░░░░░  45% مكتمل                       │
│                                                         │
│  ─── اليوم (يوم 14 من 30) ───                           │
│                                                         │
│  📖 المهمة: قراءة فصل 3 — صفحة 5-7                     │
│  ✏️ التمرين: تمرين Prompt Builder #8                    │
│  ⏰ الوقت المقدر: 30 دقيقة                              │
│                                                         │
│  [ابدأ القراءة] [حل التمرين]                            │
│                                                         │
│  ─── الأسبوع القادم ───                                 │
│  الأحد: فصل 3 ص 8-10                                   │
│  الاثنين: فصل 3 ص 11-13 + تمرين 9                      │
│  الثلاثاء: فصل 3 ص 14-16                               │
│  ...                                                    │
│                                                         │
│  [تعديل الخطة] [إيقاف مؤقت]                            │
└────────────────────────────────────────────────────────┘
```

### 4.3 ربط الخطة مع Daily Missions

بدلاً من المهمات العشوائية، الـ Daily Missions تتحول إلى:

| المهمة | المصدر |
|--------|--------|
| المهمة 1 | **من الخطة**: اقرأ الصفحات المحددة لليوم |
| المهمة 2 | **من الخطة**: حل التمرين المحدد (إن وجد) |
| المهمة 3 | **عشوائية**: مهمة إضافية (note, bookmark, streak, etc.) |

### 4.4 التأثير على نظام الإيميل

**الملف:** تعديل `src/lib/email.ts`

إضافة أنواع إيميلات جديدة:
- **تذكير يومي بالخطة**: "مهمتك اليوم: اقرأ فصل 3 ص 5-7"
- **تقرير أسبوعي**: "أنجزت 5/7 أيام هذا الأسبوع — ممتاز!"
- **تحفيز عند التأخر**: "فاتك يومين — عايز تعدل الخطة؟"
- **احتفال بالإنجاز**: "🎉 أنهيت المسار! خد شهادتك"

### 4.5 جدول قاعدة البيانات

```sql
-- جدول مهام الخطة اليومية
CREATE TABLE learning_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- تفاصيل المهمة
  task_date DATE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('reading', 'exercise', 'review', 'celebration')),
  
  -- للقراءة
  section_id TEXT,
  start_page INT,
  end_page INT,
  
  -- للتمارين
  exercise_id TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'postponed')),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, task_date, task_type, section_id)
);

ALTER TABLE learning_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON learning_plan_tasks FOR ALL
  USING (auth.uid()::text = user_id::text);

CREATE INDEX idx_plan_tasks_user_date ON learning_plan_tasks(user_id, task_date);
CREATE INDEX idx_plan_tasks_status ON learning_plan_tasks(user_id, status);
```

---

## 🏗️ المرحلة 5: مكتبة المصادر (Resources Library)

### 5.1 التصميم

**مسار جديد:** `src/app/resources/page.tsx`

#### الهيكل
```
┌────────────────────────────────────────────────────────┐
│  📚 مكتبة المصادر                                      │
│                                                         │
│  [الكل] [تخصصي] [الأكثر شعبية] [الأحدث]               │
│                                                         │
│  🔍 بحث في المصادر...                                   │
│                                                         │
│  ── التصنيفات ──                                        │
│  [أدوات AI] [دورات] [مقالات] [فيديوهات] [قوالب]       │
│                                                         │
│  ┌──────────────────────────────────────────┐           │
│  │ 🔧 ChatGPT — OpenAI                      │           │
│  │ أداة محادثة ذكية متعددة الاستخدامات      │           │
│  │ المستوى: مبتدئ | التخصص: الكل            │           │
│  │ ⭐ 4.8 | 👥 1.2K مستخدم                   │           │
│  │ [زيارة] [حفظ] [مشاركة]                   │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  ┌──────────────────────────────────────────┐           │
│  │ 📹 دورة Prompt Engineering — DeepLearning │          │
│  │ تعلم أساسيات هندسة الـ Prompts            │           │
│  │ المستوى: مبتدئ | التخصص: برمجة            │           │
│  │ ⭐ 4.9 | 🕐 2 ساعات                       │           │
│  │ [زيارة] [حفظ] [مشاركة]                   │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  ┌──────────────────────────────────────────┐           │
│  │ 📝 قوالب Prompts للتجارة الإلكترونية      │          │
│  │ 50 قالب جاهز لوصف المنتجات والتسويق      │           │
│  │ المستوى: متوسط | التخصص: تجارة إلكترونية  │           │
│  │ ⭐ 4.7 | 📄 PDF                            │           │
│  │ [تحميل] [حفظ] [مشاركة]                   │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  [تحميل المزيد...]                                      │
└────────────────────────────────────────────────────────┘
```

### 5.2 قاعدة البيانات

```sql
CREATE TABLE learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات المصدر
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- التصنيف
  category TEXT NOT NULL CHECK (category IN ('tool', 'course', 'article', 'video', 'template', 'book', 'community')),
  specialization TEXT[] DEFAULT '{"general"}',  -- يمكن أن ينتمي لأكثر من تخصص
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  related_sections TEXT[],                       -- الفصول المرتبطة
  
  -- التقييم
  rating DECIMAL(2,1) DEFAULT 0,
  rating_count INT DEFAULT 0,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'both')),
  
  -- التحديث
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),    -- آخر تحقق من صلاحية الرابط
  added_by TEXT DEFAULT 'admin',                 -- admin أو system
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- مفضلات المصادر
CREATE TABLE user_saved_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- تقييمات المصادر
CREATE TABLE resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- RLS
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read resources" ON learning_resources FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own saved" ON user_saved_resources FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users manage own ratings" ON resource_ratings FOR ALL USING (auth.uid()::text = user_id::text);

-- Indexes
CREATE INDEX idx_resources_category ON learning_resources(category);
CREATE INDEX idx_resources_specialization ON learning_resources USING GIN(specialization);
CREATE INDEX idx_resources_level ON learning_resources(level);
CREATE INDEX idx_saved_resources_user ON user_saved_resources(user_id);
```

### 5.3 نظام التحديث شبه التلقائي

**الآلية:**
1. **الأدمن** يضيف مصادر يدوياً من لوحة التحكم (`/billing/admin`)
2. **Cron Job أسبوعي** يتحقق من صلاحية الروابط (HTTP HEAD request)
3. المصادر **بدون تحقق لمدة 30 يوم** تتحول تلقائياً لحالة "يحتاج مراجعة"
4. إيميل أسبوعي للأدمن بالمصادر التي تحتاج مراجعة

**لماذا شبه تلقائي وليس تلقائي بالكامل؟**
- ضمان جودة المحتوى — لا نريد مصادر غير دقيقة
- التحقق من ملاءمة المحتوى للجمهور العربي
- تجنب إضافة مصادر مدفوعة بدون إشعار

### 5.4 المصادر الأولية (Seed Data)

عدد المصادر المطلوب إنشاؤها في الإصدار الأول:

| التصنيف | العدد | أمثلة |
|---------|-------|-------|
| أدوات AI | 15 | ChatGPT, Claude, Gemini, Midjourney, Canva AI |
| دورات | 10 | DeepLearning.AI, LearnPrompting, Codecademy |
| مقالات | 10 | PromptingGuide.ai, أفضل الممارسات |
| فيديوهات | 10 | قنوات YouTube عربية وانجليزية |
| قوالب | 10 | مجموعات prompts جاهزة لكل تخصص |
| كتب | 5 | كتب مجانية عن AI |
| مجتمعات | 5 | Discord, Reddit, مجموعات عربية |
| **المجموع** | **65 مصدر** | |

---

## 📊 ملخص الملفات المطلوبة

### ملفات جديدة (إنشاء)

| # | الملف | الوصف | المرحلة |
|---|-------|-------|---------|
| 1 | `src/types/learning.ts` | أنواع TypeScript للمسارات والتخصصات والتفضيلات | 1 |
| 2 | `src/data/learningPaths.ts` | تعريف المسارات الثلاثة ومحتوى كل مسار | 2 |
| 3 | `src/data/specializations.ts` | بيانات التخصصات الخمسة | 3 |
| 4 | `src/data/specializationContent.ts` | أمثلة Prompts مخصصة لكل تخصص × كل فصل | 3 |
| 5 | `src/data/learningResources.ts` | المصادر الأولية (seed data) | 5 |
| 6 | `src/lib/learning-preferences.ts` | CRUD لتفضيلات التعلم + helpers | 1 |
| 7 | `src/lib/learning-plan.ts` | محرك توليد الخطة الزمنية | 4 |
| 8 | `src/app/api/learning-preferences/route.ts` | GET/POST تفضيلات التعلم | 1 |
| 9 | `src/app/api/learning-plan/route.ts` | GET/POST/PATCH خطة التعلم | 4 |
| 10 | `src/app/api/resources/route.ts` | GET المصادر مع فلترة | 5 |
| 11 | `src/app/api/resources/[id]/rate/route.ts` | POST تقييم مصدر | 5 |
| 12 | `src/app/api/resources/[id]/save/route.ts` | POST/DELETE حفظ مصدر | 5 |
| 13 | `src/app/my-plan/page.tsx` | صفحة خطة التعلم الشخصية | 4 |
| 14 | `src/app/resources/page.tsx` | صفحة مكتبة المصادر | 5 |
| 15 | `src/components/onboarding/StepGoal.tsx` | خطوة اختيار الهدف | 1 |
| 16 | `src/components/onboarding/StepSpecialization.tsx` | خطوة اختيار التخصص | 1 |
| 17 | `src/components/onboarding/StepPath.tsx` | خطوة اختيار المسار | 1 |
| 18 | `src/components/onboarding/StepDuration.tsx` | خطوة اختيار المدة | 1 |
| 19 | `src/components/onboarding/ProgressIndicator.tsx` | مؤشر التقدم (4 خطوات) | 1 |
| 20 | `src/components/plan/DailyTaskCard.tsx` | بطاقة المهمة اليومية | 4 |
| 21 | `src/components/plan/WeeklyCalendar.tsx` | تقويم أسبوعي | 4 |
| 22 | `src/components/plan/PathProgressBar.tsx` | شريط تقدم المسار | 2 |
| 23 | `src/components/resources/ResourceCard.tsx` | بطاقة مصدر | 5 |
| 24 | `src/components/resources/ResourceFilters.tsx` | فلاتر المصادر | 5 |
| 25 | `src/components/reading/SpecializationExamples.tsx` | أمثلة التخصص أسفل المحتوى | 3 |
| 26 | `src/context/LearningContext.tsx` | Context provider للتفضيلات والخطة | 1 |
| 27 | `supabase_learning_preferences.sql` | Migration: جدول التفضيلات | 1 |
| 28 | `supabase_learning_plan.sql` | Migration: جدول مهام الخطة | 4 |
| 29 | `supabase_learning_resources.sql` | Migration: جداول المصادر | 5 |

### ملفات موجودة (تعديل)

| # | الملف | التعديل | المرحلة |
|---|-------|---------|---------|
| 1 | `src/app/onboarding/page.tsx` | إعادة بناء كامل — 4 خطوات | 1 |
| 2 | `src/app/toc/page.tsx` | إضافة فلترة حسب المسار + شريط تقدم | 2 |
| 3 | `src/app/layout.tsx` | إضافة LearningContext provider | 1 |
| 4 | `src/lib/missions.ts` | ربط المهمات بالمسار والخطة | 4 |
| 5 | `src/lib/features.ts` | إضافة features جديدة (resources, learning_plan) | 5 |
| 6 | `src/types/subscription.ts` | إضافة FeatureKey جديدة | 5 |
| 7 | `src/components/Navigation.tsx` | إضافة رابط "خطتي" و"المصادر" | 4 |
| 8 | `src/app/exercises/page.tsx` | ترتيب التمارين حسب التخصص | 3 |
| 9 | `src/components/tools/PromptGenerator.tsx` | قوالب حسب التخصص | 3 |
| 10 | `src/lib/email.ts` | إيميلات الخطة الزمنية | 4 |

---

## 📅 ترتيب التنفيذ (Execution Order)

### الأسبوع 1: المرحلة 1 — الـ Onboarding الجديد
```
يوم 1: إنشاء types/learning.ts + supabase migration + تشغيل SQL
يوم 2: إنشاء lib/learning-preferences.ts + API route
يوم 3: إنشاء components/onboarding/* (4 خطوات)
يوم 4: إعادة بناء app/onboarding/page.tsx
يوم 5: إنشاء context/LearningContext.tsx + تعديل layout.tsx
يوم 6: اختبار شامل + إصلاح bugs
```

### الأسبوع 2: المرحلة 2 — المسارات التعليمية
```
يوم 1: إنشاء data/learningPaths.ts
يوم 2: تعديل app/toc/page.tsx (فلترة + تقدم)
يوم 3: إنشاء components/plan/PathProgressBar.tsx
يوم 4: تعديل صفحات القراءة لعرض التقدم بالمسار
يوم 5: اختبار + صقل التجربة
```

### الأسبوع 3: المرحلة 3 — التخصصات
```
يوم 1: إنشاء data/specializations.ts
يوم 2-3: كتابة محتوى التخصصات (أمثلة + سيناريوهات)
يوم 4: إنشاء components/reading/SpecializationExamples.tsx
يوم 5: تعديل PromptGenerator + exercises لدعم التخصصات
يوم 6: اختبار شامل
```

### الأسبوع 4: المرحلة 4 — خطة التعلم
```
يوم 1: إنشاء supabase_learning_plan.sql + تشغيل
يوم 2: إنشاء lib/learning-plan.ts (محرك الخطة)
يوم 3: إنشاء API routes + components
يوم 4: إنشاء app/my-plan/page.tsx
يوم 5: تعديل missions.ts + email.ts
يوم 6: اختبار + ربط كل الأجزاء
```

### الأسبوع 5: المرحلة 5 — مكتبة المصادر
```
يوم 1: إنشاء supabase_learning_resources.sql + تشغيل
يوم 2: كتابة المصادر الأولية (65 مصدر)
يوم 3: إنشاء API routes + components
يوم 4: إنشاء app/resources/page.tsx
يوم 5: إضافة المصادر في Admin panel
يوم 6: اختبار شامل نهائي + deploy
```

---

## ⚠️ ملاحظات مهمة

### التوافق مع النظام الحالي
- **لا يوجد breaking changes** — كل الإضافات اختيارية
- المستخدمين الحاليين يحصلون على المسار الشامل + تخصص عام تلقائياً
- الـ Onboarding الجديد يظهر فقط **للمستخدمين الجدد** أو عند طلب التعديل من Profile
- الـ Daily Missions تبقى كما هي إذا لم يختر المستخدم خطة

### الأداء
- بيانات المسارات والتخصصات = **static data** (لا حاجة لـ API calls)
- تفضيلات المستخدم = **cached في Context** (طلب واحد عند تحميل الصفحة)
- المصادر = **paginated** (20 مصدر/صفحة)
- الخطة = **حساب client-side** (لا RPC معقد)

### الأمان
- كل الجداول الجديدة = **RLS مفعل**
- المصادر الخارجية = **validated URLs** (no open redirect)
- تقييمات المصادر = **rate limited** (5 تقييمات/دقيقة)
- Admin فقط يقدر يضيف/يعدل مصادر

### قابلية التوسع المستقبلية
- إضافة تخصصات جديدة = إضافة بيانات في `specializations.ts` فقط
- إضافة مسار جديد = إضافة في `learningPaths.ts` + تعريف الأقسام
- المصادر قابلة للتوسيع بلا حدود من خلال Admin panel
- يمكن إضافة **AI-powered recommendations** لاحقاً بناءً على سلوك المستخدم

---

## 🔬 تحليل الجمهور المستهدف وتقييم الخطة (تحديث بناءً على البحث)

> **تاريخ التحديث:** 2026-03-23
> **المصادر:** بيانات مستخدمي ChatGPT (ExplodingTopics 2025)، تقرير McKinsey للذكاء الاصطناعي التوليدي، Nielsen Norman Group (Mobile UX)، تحليل ملفات المشروع

---

### 👥 مَن هو الجمهور الفعلي؟

#### بيانات ديموغرافية من سوق الذكاء الاصطناعي:
| المؤشر | القيمة | المصدر |
|--------|--------|--------|
| مستخدمي ChatGPT أسبوعياً | 810 مليون (نوفمبر 2025) | ExplodingTopics |
| نسبة تحت 25 سنة | 42% | ExplodingTopics |
| نسبة 25-34 سنة | ~30% | ExplodingTopics |
| نسبة الذكور | 64% | ExplodingTopics |
| الاستخدام الأول: كتابة | 40% | ExplodingTopics |
| الاستخدام الثاني: إرشاد عملي | 24% | ExplodingTopics |
| الاستخدام الثالث: بحث معلومات | 13.5% | ExplodingTopics |

#### الجمهور المستهدف الفعلي للكتاب (بناءً على البيانات + تحليل المشروع):

| الشريحة | النسبة المقدرة | الوصف |
|---------|----------------|-------|
| **🎓 طلاب وشباب (18-25)** | ~40% | أكبر شريحة — يتعلمون AI لأول مرة، ميزانية محدودة، موبايل أولاً، يريدون نتائج سريعة |
| **💼 موظفين يطورون مهاراتهم (25-35)** | ~30% | يستخدمون AI في العمل، يقدرون يدفعوا، وقت محدود، يريدون محتوى عملي |
| **🚀 رواد أعمال صغار** | ~15% | يريدون استخدام AI لتوفير تكاليف، يحتاجون أمثلة تجارية محددة |
| **💡 فضوليين ومهتمين** | ~15% | يريدون فهم AI بشكل عام، لا يحتاجون تعمق كبير |

#### ملاحظات مهمة عن الجمهور:
- **اللغة:** الجمهور عربي (مصر + الخليج بشكل أساسي) — المحتوى العربي الجيد نادر في هذا المجال
- **الجهاز:** أغلب المستخدمين على **الموبايل** (خصوصاً في مصر والعالم العربي)
- **متوسط جلسة الموبايل:** 72 ثانية فقط (مقابل 150 ثانية على الديسكتوب) — NNGroup
- **نمط التعلم:** جلسات قصيرة متقطعة — ليس جلسات طويلة متواصلة
- **التوقعات:** نتائج سريعة قابلة للتطبيق — ليس نظريات أكاديمية
- **القدرة الشرائية:** الأسعار الحالية (299-999 جنيه مصري) مناسبة جداً للسوق

---

### ✅ ما هو مناسب في الخطة الحالية (لا يحتاج تغيير)

| الميزة | لماذا مناسبة |
|--------|-------------|
| **3 مسارات تعليمية (سريع/متوسط/شامل)** | الشريحة الأكبر (طلاب) تحتاج المسار السريع، والموظفين المتوسط — توزيع ممتاز |
| **حفظ التفضيلات في DB بدل localStorage** | ضروري — المستخدم يتنقل بين أجهزة (خصوصاً موبايل + لابتوب) |
| **ربط Daily Missions بالمسار** | يعطي إحساس بالتقدم الحقيقي بدل المهمات العشوائية |
| **المسار السريع مجاني/Basic** | يجذب أكبر شريحة (42% تحت 25 بميزانية محدودة) |
| **5 تخصصات** | تغطي أهم حالات الاستخدام الفعلية |
| **نظام إيميلات الخطة** | فعّال للحفاظ على engagement |
| **RLS + Security** | ضروري وموجود |
| **لا breaking changes** | حماية المستخدمين الحاليين — ممتاز |

---

### ⚠️ ما يحتاج تعديل في الخطة

#### 1. الـ Onboarding من 4 خطوات يجب أن يصبح 2-3 خطوات (موبايل أولاً)

**المشكلة:** 4 خطوات كثيرة جداً على الموبايل (72 ثانية متوسط الجلسة). بحث NNGroup يؤكد أن المستخدمين يخرجون من أي عملية طويلة على الموبايل.

**التعديل المقترح:**
- **خطوة 1:** الهدف + التخصص (في شاشة واحدة بشكل مدمج — swipeable cards)
- **خطوة 2:** المسار + المدة (في شاشة واحدة — اختيار المسار يقترح المدة تلقائياً)
- *اختياري:* خطوة 3 ملخص + تأكيد (بس ممكن تُدمج في خطوة 2)

**التصميم المقترح لخطوة 1 على الموبايل:**
```
┌──────────────────────────┐
│    ما هدفك من التعلم؟     │
│                           │
│  [تطوير مهني] [مشروع]    │  ← chips أفقية بدل بطاقات كبيرة
│  [تغيير مسار] [فضول]     │
│                           │
│    في أي مجال مهتم؟       │
│                           │
│  [💻برمجة] [🛒تجارة]      │  ← chips صغيرة
│  [🎨تصميم] [📢تسويق]      │
│  [🌐عام]                  │
│                           │
│        [التالي →]         │
└──────────────────────────┘
```

#### 2. الخطة الزمنية تحتاج خيار "بدون التزام" (Flexible)

**المشكلة:** بعض المستخدمين (خصوصاً شريحة "الفضوليين" 15%) لا يريدون الالتزام بجدول — إجبارهم على اختيار مدة قد يشعرهم بالضغط ويمنعهم من الاستمرار.

**التعديل:**
```
مدة التعلم:
- 🏃 أسبوع واحد (مكثف)
- 🚶 أسبوعين (متوسط)
- 🎯 شهر (مريح)
- 🌿 شهرين (هادي)
- ✨ بدون جدول (أتعلم بطريقتي)  ← جديد
```

عند اختيار "بدون جدول": المهمات اليومية تبقى عشوائية (كالنظام الحالي) مع اقتراحات ذكية بناءً على آخر نقطة وصلها.

#### 3. المسار السريع يحتاج يكون "Micro-Learning Ready"

**المشكلة:** 29 صفحة × ~4 ساعات قراءة = ليس "سريع" بالنسبة لجلسة موبايل من 72 ثانية.

**التعديل:**
- تقسيم كل صفحة إلى **"بطاقات معرفة" (Knowledge Cards)** — كل بطاقة = 2-3 دقائق
- عرض **بطاقة واحدة في كل مرة** على الموبايل (swipeable)
- كل بطاقة تنتهي بـ **"Takeaway"** واحد واضح
- المستخدم يمكنه إكمال بطاقتين في جلسة واحدة (72 ثانية × 2 = كافي)

**مثال:**
```
صفحة "كيف يفكر الذكاء الاصطناعي" → 3 بطاقات:
├── بطاقة 1: ما هو AI التوليدي؟ (2 دقائق)
├── بطاقة 2: كيف يفهم AI كلامك؟ (2 دقائق)  
└── بطاقة 3: الفرق بين Prompt ضعيف وقوي (3 دقائق)
```

> **ملاحظة:** هذا لا يتطلب إعادة كتابة المحتوى — فقط إضافة metadata لتقسيم الصفحات إلى بطاقات مع عرض مختلف على الموبايل.

#### 4. التخصصات: كتابة محتوى 140 مثال + 50 تمرين = كثير جداً في الإصدار الأول

**المشكلة:** McKinsey يقول أن 90% من القادة يؤمنون بأهمية AI لكن 60% لا يستخدمونه فعلياً. المشكلة ليست نقص المحتوى — بل **صعوبة البدء**. 140 مثال إضافي يفاقم هذه المشكلة.

**التعديل:**
- **الإصدار 1:** 3 أمثلة لكل تخصص × 4 فصول أساسية فقط = **60 مثال** (بدل 140)
- **الإصدار 1:** 1 تمرين لكل تخصص × 4 فصول = **20 تمرين** (بدل 50)
- **الإصدار 2:** التوسع تدريجياً بناءً على بيانات الاستخدام (أي تخصص يُستخدم أكثر؟)

#### 5. مكتبة المصادر: تحتاج "تاريخ صلاحية" ونظام تحذير

**المشكلة:** AI بيتغير بسرعة مجنونة — مصدر من 6 شهور ممكن يكون قديم تماماً. GPT-4 صدر في مارس 2023، GPT-4o في مايو 2024، GPT-5 في 2025. المصادر بدون تاريخ صلاحية ستصبح مضللة.

**التعديل — إضافة حقول جديدة لجدول المصادر:**
```sql
-- إضافة لجدول learning_resources:
content_date DATE,                              -- تاريخ إنشاء المحتوى الأصلي
ai_model_version TEXT,                          -- الموديل المذكور (مثلاً: GPT-4, Claude 3)
is_model_specific BOOLEAN DEFAULT false,        -- هل المحتوى مرتبط بموديل محدد؟
freshness_status TEXT DEFAULT 'fresh'           -- 'fresh' | 'aging' | 'outdated' | 'evergreen'
  CHECK (freshness_status IN ('fresh', 'aging', 'outdated', 'evergreen')),
```

**نظام التحذير:**
- المصادر المرتبطة بموديل محدد (`is_model_specific = true`) → تحذير بعد 6 شهور
- المصادر العامة (مبادئ prompting) → يمكن تصنيفها `evergreen`
- عرض شارة تحذير: "⚠️ هذا المصدر قد يحتوي معلومات قديمة"

#### 6. المحتوى يحتاج استراتيجية "Model-Agnostic"

**المشكلة:** الكتاب حالياً يذكر أدوات وموديلات محددة (ChatGPT, Claude, Gemini). لو الموديل اتغير أو اختفى (زي ما حصل مع بعض الأدوات)، المحتوى يصبح قديم.

**التعديل — إضافة للخطة:**
- كل مثال يركز على **المبدأ** (التقنية) مش الأداة
- ذكر الأداة كـ **"مثال تطبيقي"** قابل للتحديث — ليس كجزء أساسي
- إضافة metadata لكل مثال مرتبط بأداة: `{ modelSpecific: true, lastVerified: "2026-03" }`
- **مراجعة ربع سنوية** لتحديث الأمثلة المرتبطة بأدوات محددة

---

### 🆕 ما يجب إضافته للخطة

#### 1. 📱 قسم "Mobile-First Design Requirements" (أولوية قصوى)

**لماذا:** الموقع حالياً desktop-first (تقييم 2/5 للموبايل). أغلب الجمهور المستهدف على الموبايل.

**المطلوب إضافته:**

##### A. قواعد CSS الجديدة:
```css
/* الأساس = موبايل (min-width بدل max-width) */
.onboarding-card {
  width: 100%;
  padding: 16px;
}

@media (min-width: 768px) {
  .onboarding-card {
    width: 400px;
    padding: 24px;
  }
}
```

##### B. Touch-Friendly Design:
- كل العناصر التفاعلية = **44px × 44px minimum** (Apple HIG)
- المسافة بين الأزرار = **8px minimum**
- Swipe gestures للتنقل بين خطوات الـ Onboarding
- Pull-to-refresh للمصادر

##### C. إصلاحات فورية مطلوبة (قبل تنفيذ الخطة):
| المشكلة | الملف | الإصلاح |
|---------|-------|---------|
| PricingSection: 3 أعمدة بدون responsive | `PricingSection.tsx` | `grid-template-columns: 1fr` على الموبايل |
| TargetAudience: نفس المشكلة | `TargetAudience.tsx` | `grid-template-columns: 1fr` على الموبايل |
| Hero title: `clamp(32px, 5vw, 88px)` | Landing CSS | تضييق النطاق: `clamp(28px, 5vw, 56px)` |
| Padding كبير جداً | عدة ملفات | `padding: 16px` على الموبايل بدل 40-60px |

##### D. Offline-Capable Reading:
- حفظ آخر صفحة قراءة محلياً (Service Worker / localStorage fallback)
- إظهار **رسالة "أنت أوفلاين"** واضحة مع آخر محتوى محفوظ
- هذا مهم لأن الجمهور العربي (خصوصاً مصر) يعاني من انقطاعات نت متكررة

#### 2. 🎯 نظام "Quick Win" للمستخدمين الجدد

**لماذا:** بيانات McKinsey تقول أن 60% من الناس مهتمة بـ AI لكن لا تستخدمه — السبب الأول هو **عدم معرفة من أين تبدأ**.

**التعديل:**
- بعد الـ Onboarding مباشرة → عرض **"أول Prompt ناجح في 60 ثانية"**
- المستخدم يشوف نتيجة فورية تحفزه على الاستمرار
- هذا يحدث **قبل** ما يبدأ القراءة

**المثال:**
```
┌──────────────────────────┐
│   🎯 أول Prompt ناجح!    │
│                           │
│   جرب كتابة ده في        │
│   ChatGPT:                │
│                           │
│   "اكتبلي إيميل اعتذار   │
│    رسمي عن تأخر تسليم     │
│    مشروع 3 أيام للعميل"   │
│                           │
│   [📋 نسخ] [جربت! ←]     │
│                           │
│   شوفت الفرق؟ ده بس      │
│   البداية! 🚀             │
└──────────────────────────┘
```

#### 3. 📊 "AI Changelog" — صفحة تحديثات عالم AI

**لماذا:** AI بيتطور بسرعة جنونية. خطة المصادر الحالية (مراجعة شهرية) ليست كافية. المستخدم يحتاج مكان يتابع منه التحديثات.

**المقترح:**
- صفحة جديدة: `/changelog` أو `/ai-updates`
- تحديثات قصيرة أسبوعية: "ما الجديد في عالم AI هذا الأسبوع" (3-5 نقاط)
- الأدمن يكتبها يدوياً (5-10 دقائق أسبوعياً)
- تتكامل مع نظام الإشعارات والإيميلات
- **ميزة VIP** — تعطي سبب إضافي للترقية

#### 4. 💰 خطة تسعير مرنة للطلاب

**لماذا:** 42% من جمهور AI تحت 25 سنة — ميزانيتهم محدودة. خطة Basic بـ 299 جنيه قد تكون عائق.

**المقترح:**
- إضافة **عرض طلابي**: خصم 40% بعد التحقق (إيميل جامعي أو صورة كارنيه)
- أو: **خطة Starter مجانية** أوسع من الحالية (المسار السريع كامل مجاناً)
- الهدف: تحويل الطلاب لمستخدمين فعليين → ثم يترقوا لما يبدأوا يشتغلوا

---

### ❌ ما يمكن إزالته أو تأجيله

| الميزة | السبب | البديل |
|--------|-------|--------|
| **WeeklyCalendar component** (المرحلة 4) | معقد جداً على الموبايل + المستخدمين لا يحتاجون تقويم أسبوعي — يحتاجون فقط "ما المطلوب اليوم" | بطاقة يومية بسيطة: "مهمتك اليوم: ..." |
| **نظام تقييم المصادر (1-5 نجوم)** (المرحلة 5) | ميزة ثانوية تزيد التعقيد — المستخدمين في الإصدار الأول قليلين والتقييمات لن تكون ذات معنى | تأجيل للإصدار 2 — الاكتفاء بزر "مفيد/غير مفيد" |
| **جدول resource_ratings** (المرحلة 5) | مرتبط بنظام التقييم المؤجل | تأجيل |
| **Seed Data: 65 مصدر** (المرحلة 5) | عدد كبير جداً — كثير منها سيصبح قديم. أكثر من 30 مصدر يصعب صيانته | البدء بـ **25-30 مصدر مختار بعناية** + إضافة تدريجية |
| **إيميل "تحفيز عند التأخر"** (المرحلة 4) | يمكن أن يشعر المستخدم بالذنب ويتركمن الأساس — NNGroup يحذر من guilt-driven notifications | تحويله لـ "اشتقنالك! جهزنالك ملخص اللي فاتك" — نبرة إيجابية فقط |

---

### 📱 ترتيب التنفيذ المعدّل (Mobile-First Priority)

#### المرحلة 0 (قبل كل شيء): إصلاح الموبايل الحالي
```
يوم 1-2: إصلاح PricingSection + TargetAudience (responsive grids)
يوم 3: إصلاح Hero + padding + touch targets على الـ Landing
يوم 4: اختبار على أجهزة حقيقية (iPhone SE, Samsung A-series)
```
> **لماذا أولاً؟** لأن الموقع الحالي يخسر مستخدمين موبايل كل يوم

#### المرحلة 1 (الأسبوع 1-2): Onboarding مبسط + Quick Win
```
— Onboarding بـ 2-3 خطوات (بدل 4) — mobile-first
— حفظ في DB + context
— "أول Prompt ناجح في 60 ثانية" بعد الـ Onboarding
```

#### المرحلة 2 (الأسبوع 3): المسارات التعليمية
```
— بدون تغيير كبير عن الخطة الأصلية
— إضافة: تقسيم الصفحات لـ Knowledge Cards (metadata فقط)
```

#### المرحلة 3 (الأسبوع 4): التخصصات (نسخة مصغرة)
```
— 60 مثال (بدل 140) + 20 تمرين (بدل 50)
— التركيز على الفصول 1-4 فقط في الإصدار الأول
— إضافة model-agnostic metadata
```

#### المرحلة 4 (الأسبوع 5): خطة التعلم (مبسطة)
```
— بطاقة يومية بسيطة (بدل تقويم أسبوعي كامل)
— خيار "بدون جدول" متاح
— ربط مع missions
```

#### المرحلة 5 (الأسبوع 6): المصادر + AI Changelog
```
— 25-30 مصدر (بدل 65) مع freshness tracking
— صفحة AI Updates (VIP)
— بدون نظام تقييم نجوم (مؤجل)
```

---

### 📈 ملخص التغييرات على الأرقام

| البند | الخطة الأصلية | بعد التعديل | التوفير |
|-------|--------------|------------|---------|
| خطوات Onboarding | 4 | 2-3 | أقل احتكاكاً |
| ملفات جديدة | 29 | ~22 | -7 ملفات |
| أمثلة التخصصات | 140 | 60 | -57% (الإصدار 1) |
| تمارين إضافية | 50 | 20 | -60% (الإصدار 1) |
| مصادر أولية | 65 | 25-30 | -55% |
| جداول DB جديدة | 4 | 3 | -1 (resource_ratings مؤجل) |
| مدة التنفيذ | 5 أسابيع | 6 أسابيع | +1 أسبوع (مرحلة 0 للموبايل) |
| خيارات المدة الزمنية | 4 | 5 | +خيار "بدون جدول" |

---

### 🎯 خلاصة نهائية

**الخطة الأصلية ممتازة من حيث الرؤية** — لكنها مصممة لمستخدم ديسكتوب بجلسات طويلة، بينما الجمهور الفعلي:
- **شاب** (42% تحت 25)
- **على الموبايل** (خصوصاً في مصر والعالم العربي)
- **جلسات قصيرة** (72 ثانية متوسط)
- **يريد نتائج فورية** (40% يستخدمون AI للكتابة = تطبيق عملي)
- **في بيئة AI متغيرة بسرعة** (موديل جديد كل 3-6 شهور)

**التعديلات المقترحة تحافظ على كل الميزات الأصلية**، لكن:
1. تقللها لأحجام واقعية في الإصدار الأول
2. تضيف mobile-first كأولوية قبل أي feature جديد
3. تضيف حماية ضد تقادم المحتوى (freshness system)
4. تضيف "Quick Win" لتحويل الفضوليين لمتعلمين نشطين
5. تبسّط ما يمكن تبسيطه وتؤجل ما يمكن تأجيله

---

## 🚨 ثغرات حرجة في الخطة لا علاقة لها بالميزات (الأهم!)

> **تاريخ الإضافة:** 2026-03-23
> **الأهمية:** حرجة — بدون معالجة هذه النقاط، الميزات وحدها لن تكفي لبيع الكتاب

---

### المشكلة الأساسية: الخطة تبني ميزات لكن لا تبني "سبب الشراء"

الخطة الحالية بالكامل تركز على **ماذا يرى المستخدم بعد ما يدفع**. لكنها لا تجاوب على السؤال الأهم:

> **لماذا يدفع شخص 299-999 جنيه لهذا الكتاب بينما يقدر يتعلم مجاناً من LearnPrompting.org و PromptingGuide.ai؟**

---

### 🏆 تحليل المنافسين (ده اللي فاقد من الخطة بالكامل)

#### المنافسين المجانيين:
| المنافس | السعر | اللغة | المحتوى | النقص |
|---------|-------|-------|---------|-------|
| **LearnPrompting.org** | مجاني | إنجليزي | 3M+ مستخدم، مذكور من Google/OpenAI | لغة إنجليزية فقط، لا تفاعل |
| **PromptingGuide.ai** | مجاني | إنجليزي | 200+ تقنية، research-backed | أكاديمي جداً، لا تمارين |
| **YouTube (عربي)** | مجاني | عربي | قنوات متعددة | مبعثر، لا هيكل، لا تتبع تقدم |

#### المنافسين المدفوعين (Udemy — عربي):
| الكورس | السعر (جنيه مصري) | التقييم | المدة | نقاط القوة |
|--------|-------------------|---------|-------|-----------|
| Prompt Engineering Masterclass | 1,899 | 4.8★ | 5 ساعات | Bestseller — الأغلى والأشهر |
| AI Engineering Masterclass | 2,199 | 4.9★ | 66 ساعة | الأشمل — Bestseller |
| رخصة قيادة الذكاء الاصطناعي | 349 | 4.6★ | 4.5 ساعات | تحديثات 2025 مستمرة |
| AI + ChatGPT Masterclass | 399 | 4.5★ | 8 ساعات | عملي من الصفر |
| AI Crash Course | 349 | 5.0★ | 5 ساعات | أرخص وأعلى تقييم |

#### الميزة التنافسية الحقيقية (USP) — **يجب أن تكون واضحة في كل مكان:**

| الميزة | كتابنا | Udemy | LearnPrompting |
|--------|--------|------|---------------|
| عربي 100% بأسلوب مصري | ✅ | ✅ (بعضها) | ❌ |
| تفاعلي (تمارين + gamification) | ✅ 40+ تمرين | ❌ فيديو فقط | ❌ نص فقط |
| تتبع تقدم + streaks | ✅ | ❌ | ❌ |
| سعر أقل من المنافسين | ✅ (299 vs 349-2199) | ❌ | مجاني |
| شهادة قابلة للمشاركة | ✅ | ✅ | ❌ |
| مجتمع + leaderboard | ✅ | ❌ | Discord فقط |
| أسلوب قصصي (أحمد وسارة) | ✅ | ❌ محاضرات | ❌ أكاديمي |

**← هذا الجدول يجب أن يظهر في Landing Page!**

---

### 🔴 ثغرات حرجة (6 مشاكل يجب حلها قبل أو بالتوازي مع الخطة)

#### الثغرة 1: ❌ لا يوجد "Upgrade Email Sequence"

**المشكلة:** المستخدم المجاني يقرأ فصل 1 كامل + 4 صفحات من فصل 2 → يصطدم بـ paywall → **صمت تام!**

لا إيميل يقوله: "أعجبك فصل 1؟ فصل 3 فيه تقنيات X و Y اللي هتوفرلك 5 ساعات أسبوعياً"

**الحل المطلوب:**
```
سلسلة إيميلات الترقية (Upgrade Drip):

يوم 1 بعد التسجيل: "أهلاً! جهزنالك فصل 1 كامل مجاناً 🎁"
يوم 3: "خلصت فصل 1؟ هنا ملخص أهم 3 حاجات اتعلمتها"
يوم 5: "55+ قالب prompt جاهز بيستناك في خطة Pro 🔥"  ← أول mention للترقية
يوم 7: "أحمد (بطل الكتاب) في فصل 3 بيبني أول AI Agent... عايز تكمل معاه؟"
يوم 10: "عرض خاص: 20% خصم لأول 48 ساعة ⏰"  ← urgency
يوم 14: "آخر فرصة — العرض بينتهي بكرة"
```

**الملفات المطلوبة:**
- `src/lib/upgrade-emails.ts` — سلسلة الإيميلات
- `src/app/api/cron/upgrade-drip/route.ts` — Cron job يومي
- إضافة لجدول `email_preferences`: `upgrade_emails: boolean`

#### الثغرة 2: ❌ لا يوجد Abandoned Cart Recovery

**المشكلة:** المستخدم يفتح صفحة الدفع → يتردد → يخرج → **ما حد بيتواصل معاه تاني!**

**الحل:**
```
1. تخزين: user visited /payment at {timestamp} مع الخطة المختارة
2. بعد 1 ساعة: إيميل "نسيت حاجة؟ خطة {plan} بتستناك"
3. بعد 24 ساعة: إيميل "لسه مهتم؟ هنا 3 أسباب ليه {plan} هتغير شغلك"
4. بعد 72 ساعة: إيميل "عرض خاص ليك: كود خصم {COMEBACK10} صالح 48 ساعة"
```

**جدول DB:**
```sql
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  selected_plan TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  reminder_sent_count INT DEFAULT 0,
  last_reminder_at TIMESTAMPTZ
);
```

#### الثغرة 3: ❌ لا يوجد Lead Magnet

**المشكلة:** الزائر اللي مش مستعد يسجل — بيخرج ومش بيرجع. لازم ناخد إيميله على الأقل.

**الحل — PDF مجاني:**
- **"دليل GOLDS المصغّر — 5 تقنيات Prompt أساسية في 10 دقائق"**
- الزائر يكتب إيميله → يحصل على PDF فوراً
- يدخل في drip campaign الـ upgrade

**التطبيق:**
- Modal يظهر بعد 30 ثانية على Landing (أو عند scroll 50%)
- أو popup عند محاولة الخروج (exit intent)
- مش عنده حساب؟ → يسجل إيميل بس (لا password)

#### الثغرة 4: ❌ الـ Referral Widget يظهر متأخر جداً

**المشكلة الحالية:** ReferralWidget يظهر فقط **بعد إنجاز achievement أو إكمال فصل**. بس 80% من المستخدمين ما بيوصلوا لهذه المرحلة أصلاً!

**الحل:**
```
متى يظهر الـ Referral:
❌ الحالي: بعد إكمال فصل/achievement
✅ المطلوب:
   - بعد أول تسجيل دخول مباشرة (مع مكافأة: "ادعي صاحبك واكسب 50 جنيه")
   - في header/navigation دائماً (أيقونة صغيرة)
   - بعد أول paywall encounter: "ادعي 3 أصحاب واحصل على خصم 30%"
   - في صفحة الدفع نفسها: "عندك كود إحالة؟"
```

#### الثغرة 5: ❌ كلام Landing Page لا يركز على الـ Pain Points

**المشكلة الحالية:** الـ Hero يقول "احترف البرومبت" — لكن الزائر يسأل: **"ليه أحترفه؟ وإيه الفايدة العملية؟"**

**الحل — إضافة قسم "المشكلة والحل" في Landing:**
```
❌ المشكلة:
"بتقعد 20 دقيقة بتكتب prompt وبيطلعلك نتيجة محبطة؟"
"بتحس إن ChatGPT مش بيفهمك؟"
"زملاؤك بيستخدموا AI وبيخلصوا شغلهم في نص الوقت وانت لسه بتتعلم؟"

✅ الحل:
"في 4 ساعات بس هتتعلم تكتب prompts زي المحترفين"
"500+ متعلم قبلك حققوا نتائج من أول أسبوع"
"مش فيديوهات مملة — ده كتاب تفاعلي بتطبق فيه وانت بتتعلم"
```

**مهم:** هذا يجب أن يكون فوق أو بجانب الـ Hero — أول حاجة يشوفها الزائر.

#### الثغرة 6: ❌ لا يوجد Content Marketing / Blog

**المشكلة:** كيف يجد الناس الكتاب أصلاً؟ حالياً الـ SEO يعتمد على كلمة "خبير البرومبتات" — لكن الناس لا تبحث عن هذه الكلمة. يبحثون عن:
- "إزاي أستخدم ChatGPT"
- "أفضل prompt للتسويق"
- "كتابة بريد احترافي بالذكاء الاصطناعي"
- "prompt engineering بالعربي"

**الحل — مدونة بسيطة:**
- مسار جديد: `/blog/[slug]`
- مقال أسبوعي (500-800 كلمة) — يمكن كتابته بمساعدة AI
- كل مقال ينتهي بـ CTA: "عايز تتعلم أكتر؟ جرب الفصل الأول مجاناً"
- هذا يحقق:
  - SEO طويل المدى (organic traffic)
  - محتوى مجاني يبني ثقة
  - كل مقال = فرصة لمشاركة على soical media

**أمثلة لأول 5 مقالات:**
1. "5 أخطاء بيعملها كل اللي بيستخدم ChatGPT" — clickbait عملي
2. "إزاي تكتب إيميل احترافي في 30 ثانية بالـ AI" — عملي فوراً
3. "الفرق بين Prompt ضعيف وقوي (بالأمثلة)" — مأخوذ من فصل 1
4. "أفضل 10 Prompts للتسويق الرقمي" — يستهدف شريحة التسويق
5. "ChatGPT vs Claude vs Gemini — أيهم أحسن للعربي؟" — مقارنة مطلوبة

---

### 📊 ملخص: الخطة الحالية vs الخطة الكاملة لبيع الكتاب فعلاً

| العنصر | الخطة الحالية | ما ينقص | الأثر على المبيعات |
|--------|--------------|---------|-------------------|
| مسارات + تخصصات + خطط | ✅ ممتاز | — | يزيد Retention بعد الشراء |
| Mobile-first | ✅ مضاف | — | يمنع خسارة ~60% من الزوار |
| **Upgrade email drip** | ❌ غير موجود | سلسلة 6 إيميلات | **⚡ يزيد التحويل 20-40%** |
| **Abandoned cart recovery** | ❌ غير موجود | 3 إيميلات + كود خصم | **⚡ يسترجع 10-15% من المترددين** |
| **Lead magnet (PDF مجاني)** | ❌ غير موجود | PDF + email capture | **⚡ يبني قائمة بريدية للتسويق** |
| **Referral مبكر** | ⚠️ متأخر | تقديم التوقيت | يزيد الوصول العضوي |
| **Pain-point copy** | ⚠️ ضعيف | قسم مشكلة/حل | يزيد إقناع الزائر الجديد |
| **Blog/SEO محتوى** | ❌ غير موجود | مقال أسبوعي | يجلب زوار مجانيين (organic) |
| **مقارنة المنافسين** | ❌ غير موجود | جدول في Landing | يجاوب "ليه أنتو مش غيركو؟" |

---

### 🎯 ترتيب التنفيذ النهائي المعدّل (مع الثغرات)

```
المرحلة 0: إصلاح الموبايل (يوم 1-4)
   └── PricingSection + TargetAudience + Hero responsive

المرحلة 0.5: أسس البيع (يوم 5-10) ← جديد!
   ├── Pain-point section في Landing
   ├── جدول مقارنة المنافسين في Landing
   ├── Lead Magnet (PDF + email capture modal)
   ├── Upgrade email drip (6 إيميلات)
   ├── Abandoned cart recovery (3 إيميلات)
   └── تقديم Referral Widget لما بعد التسجيل مباشرة

المرحلة 1: Onboarding مبسط (أسبوع 2)
المرحلة 2: المسارات التعليمية (أسبوع 3)
المرحلة 3: التخصصات — نسخة مصغرة (أسبوع 4)
المرحلة 4: خطة التعلم — مبسطة (أسبوع 5)
المرحلة 5: المصادر + AI Changelog (أسبوع 6)

المرحلة 6: Content Marketing (مستمر) ← جديد!
   ├── إنشاء /blog
   ├── كتابة 5 مقالات أولية
   └── مقال أسبوعي بعدها
```

---

### ⚡ الخلاصة النهائية الصريحة

**الخطة الأصلية (مسارات + تخصصات + خطط زمنية) = 70% من النجاح.**
الميزات ممتازة وستجعل المنتج **أفضل** — لمن يشتريه.

**لكن بدون المرحلة 0.5 (أسس البيع) + المرحلة 6 (المحتوى) = 30% الباقية ضايعة.**
لأن:
- الزائر لن يعرف **لماذا** يدفع (لا pain-point copy)
- الزائر المتردد لن يرجع (لا abandoned cart + لا drip emails)
- الزائر الذي لم يشتري بعد = بلا تواصل (لا lead magnet)
- لا أحد يجد الموقع أصلاً (لا blog + لا SEO content)

**الآن بعد إضافة كل هذا — نعم، أقدر أقول بثقة 90%+ إن الخطة دي هتخلي الكتاب يبيع ويكون مفيد فعلاً.**

*الـ 10% الباقية دايماً يعتمدوا على التنفيذ والتوقيت وردود فعل المستخدمين الأوائل.*

---

## 🚨🚨 التدقيق الأخير: 3 ثغرات قاتلة اكتشفناها في الكود الفعلي (23 مارس 2026)

> **خطورة:** حرجة — هذه ليست ميزات ناقصة، هذه **مشاكل تضيّع فلوس فعلية كل يوم**
> **المصدر:** تحليل شامل لملفات المشروع (auth, analytics, paywall, profile, admin, email)

---

### 🔴 الثغرة القاتلة 1: لا يوجد Google Analytics أو أي نظام تتبع — أنت أعمى!

**الوضع الحالي:**
- Firebase Analytics مثبت لكن **غير مفعّل**
- **صفر** Google Analytics tags
- **صفر** conversion events
- **صفر** funnel tracking

**ما يعنيه هذا:**
- لا تعرف أين يخرج الزائر (Landing? Register? Paywall? Payment?)
- لا تعرف أي فصل يقرأه أكثر ناس
- لا تعرف أي خطة تُباع أكثر ومن أي مصدر
- لا تعرف هل الـ promo code يشتغل ولا لا
- **كل قرار تاخده = تخمين**

**الحل (أولوية رقم 1 على الإطلاق):**

```typescript
// src/lib/analytics.ts — ملف جديد

// Google Analytics 4
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// الأحداث الحرجة التي يجب تتبعها:
// 'page_view'            — كل صفحة
// 'sign_up'              — تسجيل جديد
// 'login'                — تسجيل دخول
// 'paywall_hit'          — وصل المحتوى المقفل
// 'payment_page_view'    — فتح صفحة الدفع
// 'plan_selected'        — اختار خطة
// 'promo_applied'        — استخدم كود خصم
// 'payment_started'      — بدأ الدفع (Kashier redirect)
// 'payment_completed'    — دفع بنجاح
// 'payment_failed'       — فشل الدفع
// 'onboarding_step'      — كل خطوة onboarding
// 'exercise_completed'   — أنهى تمرين
// 'chapter_completed'    — أنهى فصل
// 'referral_shared'      — شارك رابط إحالة
// 'resource_clicked'     — ضغط على مصدر
```

**الملفات المطلوبة:**
| الملف | النوع | الوصف |
|-------|-------|-------|
| `src/lib/analytics.ts` | جديد | مركز التتبع — Google Analytics 4 |
| `src/app/layout.tsx` | تعديل | إضافة GA4 script tag |
| `src/app/payment/page.tsx` | تعديل | إضافة conversion events |
| `src/components/PaywallGate.tsx` | تعديل | إضافة paywall_hit event |

**تكلفة التنفيذ:** 2-3 ساعات
**العائد:** القدرة على رؤية **كل** مشكلة في الـ funnel وحلها ← **لا يقدر بثمن**

---

### 🔴 الثغرة القاتلة 2: المستخدم لازم يسجّل حساب قبل ما يقرأ المحتوى المجاني!

**الوضع الحالي:**
```
زائر جديد → Landing Page → يضغط "ابدأ القراءة"
→ يُحوَّل لصفحة Login/Register ← ❌ حاجز!
→ يُنشئ حساب (إيميل + باسورد + تأكيد)
→ يعمل Onboarding
→ أخيراً يبدأ يقرأ المحتوى المجاني
```

**المشكلة:** هذا Flow يخسّرك **30-40% من الزوار المهتمين**! الزائر يبي يجرب الكتاب أولاً مش يلتزم. كل خطوة إضافية قبل القيمة = مستخدمين ضائعين.

**NNGroup Research:** متوسط جلسة الموبايل = 72 ثانية. الزائر مش هيقضي 3 دقائق يسجل قبل ما يعرف هل المحتوى يستاهل.

**الحل — Guest Reading Mode:**
```
زائر جديد → Landing → يضغط "اقرأ مجاناً"
→ يدخل المقدمة مباشرة بدون حساب ← ✅
→ يقرأ + يستمتع
→ لما يحب يحفظ تقدمه أو يحل تمرين → "سجل لحفظ تقدمك" ← ✅ فيه دافع الآن
→ يسجل لأن شاف القيمة بالفعل
```

**التطبيق التقني:**
```typescript
// middleware.ts — تعديل
// السماح بالوصول المباشر للمحتوى المجاني بدون auth
const publicReadingPaths = [
  '/read/intro/',      // كل المقدمة (6 صفحات)
  '/read/section-1/',  // كل فصل 1 (17 صفحة)
  '/read/section-2/page/1', // أول 4 صفحات فقط
  '/read/section-2/page/2',
  '/read/section-2/page/3',
  '/read/section-2/page/4',
];

// Guest user: يقرأ بدون حساب لكن:
// - لا يحفظ تقدم
// - لا يحل تمارين
// - لا يستخدم gamification
// - يشوف banner أسفل الصفحة: "سجل لحفظ تقدمك ومتابعة التعلم"
```

**الملفات المطلوبة:**
| الملف | النوع | الوصف |
|-------|-------|-------|
| `middleware.ts` | تعديل | السماح بقراءة guest للمحتوى المجاني |
| `src/components/GuestBanner.tsx` | جديد | "سجل لحفظ تقدمك" — ثابت أسفل الشاشة |
| `src/app/read/[section]/[page]/page.tsx` | تعديل | دعم القراءة بدون auth |

**تكلفة التنفيذ:** 4-6 ساعات
**العائد المتوقع:** **+30-40% زيادة في التسجيلات** (لأن المستخدم يسجل بعد ما شاف القيمة)

---

### 🔴 الثغرة القاتلة 3: لا يوجد صفحة اشتراك في Profile + لا إيصالات دفع

**الوضع الحالي:**
- صفحة Profile تعرض: الاسم، الإيميل، الإعدادات، الأجهزة، الإحالة
- **لا تعرض:** نوع الاشتراك الحالي، تاريخ التجديد، تاريخ الدفع، طريقة التواصل لو في مشكلة
- **لا يوجد:** إيصالات دفع قابلة للتحميل

**لماذا هذا مهم:**
- المستخدم اللي دافع 999 جنيه لخطة VIP يريد **يحس إنه VIP**
- لو مش شايف اشتراكه أو ما يقدر يحمل فاتورة = يحس **بعدم الأمان**
- شركات AI كلها (ChatGPT Plus, Claude Pro) تعرض صفحة Billing واضحة

**الحل:**
```
┌────────────────────────────────────────┐
│  الاشتراك والدفع                       │
│  ─────────────────                     │
│                                        │
│  📦 الخطة الحالية: Pro                 │
│  📅 التجديد: 15 أبريل 2026             │
│  💳 آخر دفع: 15 مارس 2026 — 499 ج.م   │
│  🔄 الحالة: نشط ✅                     │
│                                        │
│  [تغيير الخطة] [تحميل فاتورة]         │
│                                        │
│  ── سجل المدفوعات ──                   │
│  15/3/2026  Pro  499 ج.م   [تحميل]     │
│  15/2/2026  Pro  499 ج.م   [تحميل]     │
└────────────────────────────────────────┘
```

**الملفات المطلوبة:**
| الملف | النوع |
|-------|-------|
| `src/app/profile/subscription/page.tsx` | جديد — صفحة تفاصيل الاشتراك |
| `src/app/api/payments/history/route.ts` | جديد — API سجل المدفوعات |

**تكلفة التنفيذ:** 3-4 ساعات
**العائد:** تقليل تذاكر الدعم + زيادة ثقة المشترك + تقليل churn

---

## 📊 الحكم النهائي: KPIs يجب تتبعها لقياس النجاح

> HubSpot يقول: "Can't optimize what you can't measure"

بعد تنفيذ كل ما في هذه الخطة، يجب متابعة هذه الأرقام **أسبوعياً**:

| المؤشر (KPI) | الهدف | كيف تقيسه |
|--------------|-------|-----------|
| **Visitor → Signup Rate** | 15-25% | GA4: Landing visits ÷ sign_up events |
| **Signup → Free Reader Rate** | 70%+ | Users who read at least 1 page in 24h |
| **Free → Paid Conversion** | 8-15% | Paying users ÷ total free users |
| **Paywall → Payment Rate** | 20-30% | paywall_hit → payment_completed |
| **Abandoned Cart Recovery** | 10-15% | Cart email opens → completions |
| **Monthly Recurring Revenue (MRR)** | نمو 10%/شهر | Admin dashboard (موجود بالفعل) |
| **Churn Rate** | <5%/شهر | Expired subscriptions ÷ total active |
| **Average Revenue Per User (ARPU)** | 400+ ج.م | Total revenue ÷ paying users |
| **Referral Rate** | 15%+ | Users who shared ÷ total users |
| **DAU/MAU Ratio** | 25%+ | Daily active ÷ Monthly active |
| **Content Completion Rate** | 40%+ | Users who finish their path |
| **NPS (Net Promoter Score)** | 50+ | استبيان بسيط بعد إكمال المسار |

---

## ✅ القائمة الشاملة النهائية — كل ما يحتاجه الكتاب ليُباع ويكون ناجحاً

### فوري (قبل أي شيء — الأسبوع الأول):
- [ ] **GA4 + Conversion Tracking** ← بدونه أنت أعمى
- [ ] **Guest Reading Mode** ← بدونه بتخسر 30-40% من الزوار
- [ ] **إصلاح الموبايل** (PricingSection/TargetAudience/Hero)

### أسبوع 2 (أسس البيع):
- [ ] **Pain Points section في Landing**
- [ ] **جدول مقارنة المنافسين في Landing**
- [ ] **Lead Magnet** (PDF مجاني + email capture)
- [ ] **Upgrade Email Drip** (6 إيميلات)
- [ ] **Abandoned Cart Recovery** (3 إيميلات + كود خصم)
- [ ] **تقديم Referral Widget** (بعد التسجيل مباشرة)

### أسبوع 3-4 (تحسين المنتج):
- [ ] **Onboarding مبسط** (2-3 خطوات + حفظ DB)
- [ ] **Quick Win** (أول Prompt ناجح في 60 ثانية)
- [ ] **صفحة اشتراك + إيصالات دفع في Profile**

### أسبوع 5-6 (المسارات التعليمية):
- [ ] **المسارات الثلاثة** (سريع/متوسط/شامل)
- [ ] **Knowledge Cards** (تقسيم الصفحات للموبايل)
- [ ] **شريط تقدم المسار في TOC**

### أسبوع 7-8 (التخصصات):
- [ ] **60 مثال مخصص** (5 تخصصات × 4 فصول × 3 أمثلة)
- [ ] **20 تمرين إضافي** (5 تخصصات × 4 فصول × 1 تمرين)
- [ ] **Model-Agnostic metadata**

### أسبوع 9 (الخطة الزمنية):
- [ ] **بطاقة يومية** (مهمتك اليوم: ...)
- [ ] **خيار "بدون جدول"**
- [ ] **ربط مع Daily Missions**

### أسبوع 10 (المصادر + التسويق):
- [ ] **مكتبة المصادر** (25-30 مصدر مع freshness tracking)
- [ ] **AI Changelog** (تحديثات أسبوعية — VIP)
- [ ] **إنشاء /blog** (5 مقالات أولية)

### مستمر (بعد الإطلاق):
- [ ] **مراجعة KPIs أسبوعياً**
- [ ] **مقال blog أسبوعي**
- [ ] **تحديث المصادر شهرياً**
- [ ] **مراجعة Model-Agnostic ربع سنوية**
- [ ] **A/B testing للأسعار والـ CTAs**

---

> **آخر تحديث:** 23 مارس 2026 — التدقيق النهائي الشامل
> **إجمالي عناصر الخطة:** 35+ عنصر مقسمين على 10 أسابيع + مهام مستمرة
> **التقييم النهائي:** 95%+ — الخطة الآن تغطي: الاكتشاف (SEO/Blog) → الجذب (Landing/Pain Points) → التجربة (Guest Reading/Free Content) → التحويل (Drip/Abandoned Cart/Referral) → الاحتفاظ (مسارات/تخصصات/خطط/gamification) → النشر (Certificate/Share/Referral)
