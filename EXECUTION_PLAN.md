# 🗺️ خطة التنفيذ المرحلية — خبير البرومبتات

> **آخر تحديث:** 23 مارس 2026
> **إجمالي المراحل:** 7 مراحل + مهام مستمرة
> **المدة الإجمالية:** ~10 أسابيع
> **إجمالي عناصر العمل:** 35+ عنصر

---

## 📌 ملخص تنفيذي

هذه الخطة تحوّل الكتاب من منتج رقمي ثابت إلى **منصة تعليمية تفاعلية** مع:
- مسارات تعليمية (سريع / متوسط / شامل)
- تخصصات (برمجة / تجارة إلكترونية / تصميم / تسويق / عام)
- خطة تعلم زمنية شخصية
- مكتبة مصادر محدّثة
- **بنية تحتية للبيع والتحويل** (analytics, email drip, cart recovery, blog)

### حالة المشروع الحالية

| ✅ موجود | ❌ ناقص |
|----------|---------|
| Onboarding بسيط (1 خطوة، localStorage فقط) | مسارات تعليمية |
| 10 فصول + 89 صفحة | تخصصات مخصصة |
| 40+ تمرين تفاعلي | خطة زمنية شخصية |
| Daily Missions + Streaks | مكتبة مصادر |
| Email system (Resend) | Upgrade drip emails |
| Gamification (نقاط، إنجازات، leaderboard) | Analytics/Tracking |
| 3 اشتراكات (Basic/Pro/VIP) | Guest Reading Mode |
| Kashier payments | Subscription page في Profile |
| Admin dashboard (billing/) | Lead Magnet + Blog/SEO |

### الجمهور المستهدف

| الشريحة | النسبة | الوصف |
|---------|--------|-------|
| 🎓 طلاب وشباب (18-25) | ~40% | أكبر شريحة — موبايل أولاً، ميزانية محدودة |
| 💼 موظفين (25-35) | ~30% | يطورون مهاراتهم، وقت محدود |
| 🚀 رواد أعمال | ~15% | يستخدمون AI لتوفير تكاليف |
| 💡 فضوليين | ~15% | يفهمون AI بشكل عام |

**حقائق مهمة:** 42% تحت 25 سنة | أغلبهم موبايل | متوسط جلسة الموبايل 72 ثانية | يريدون نتائج فورية

---

## 🔴 المرحلة 0: الأساسيات الفورية

> **المدة:** الأسبوع الأول (4-5 أيام)
> **الأولوية:** حرجة — بدون هذه المرحلة أنت تخسر فلوس كل يوم
> **المتطلبات السابقة:** لا شيء

### 0.1 — Google Analytics 4 + Conversion Tracking

**لماذا أولاً؟** بدون analytics أنت أعمى — لا تعرف أين يخرج الزائر ولا أي خطة تُباع أكثر. كل قرار = تخمين.

**المطلوب:**

```typescript
// src/lib/analytics.ts — ملف جديد

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// الأحداث الحرجة:
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

| الملف | النوع | الوصف |
|-------|-------|-------|
| `src/lib/analytics.ts` | جديد | مركز التتبع — GA4 |
| `src/app/layout.tsx` | تعديل | إضافة GA4 script tag |
| `src/app/payment/page.tsx` | تعديل | إضافة conversion events |
| `src/components/PaywallGate.tsx` | تعديل | إضافة paywall_hit event |

**تكلفة التنفيذ:** 2-3 ساعات

---

### 0.2 — Guest Reading Mode (السماح بالقراءة بدون حساب)

**لماذا؟** حالياً المستخدم لازم يسجّل حساب (إيميل + باسورد + تأكيد + onboarding) **قبل** ما يقرأ المحتوى المجاني. هذا يخسّرك 30-40% من الزوار المهتمين.

**الحالي:**
```
زائر → Landing → "ابدأ القراءة" → Login/Register ← ❌ حاجز → حساب → Onboarding → يقرأ
```

**المطلوب:**
```
زائر → Landing → "اقرأ مجاناً" → يدخل المقدمة مباشرة ← ✅
→ يقرأ + يستمتع
→ لما يحب يحفظ تقدمه → "سجل لحفظ تقدمك" ← فيه دافع الآن
```

**التطبيق:**
```typescript
// middleware.ts — تعديل
// السماح بالوصول المباشر للمحتوى المجاني بدون auth
const publicReadingPaths = [
  '/read/intro/',           // كل المقدمة (6 صفحات)
  '/read/section-1/',       // كل فصل 1 (17 صفحة)
  '/read/section-2/page/1', // أول 4 صفحات من فصل 2
  '/read/section-2/page/2',
  '/read/section-2/page/3',
  '/read/section-2/page/4',
];

// Guest user: يقرأ بدون حساب لكن:
// ❌ لا يحفظ تقدم
// ❌ لا يحل تمارين
// ❌ لا يستخدم gamification
// ✅ يشوف banner أسفل الصفحة: "سجل لحفظ تقدمك"
```

| الملف | النوع | الوصف |
|-------|-------|-------|
| `middleware.ts` | تعديل | السماح بقراءة guest للمحتوى المجاني |
| `src/components/GuestBanner.tsx` | جديد | "سجل لحفظ تقدمك" — ثابت أسفل الشاشة |
| `src/app/read/[section]/[page]/page.tsx` | تعديل | دعم القراءة بدون auth |

**تكلفة التنفيذ:** 4-6 ساعات

---

### 0.3 — إصلاح الموبايل الحالي (تقييم حالي: 2/5)

**لماذا؟** أغلب الجمهور على الموبايل (خصوصاً في مصر) والموقع حالياً desktop-first.

**الإصلاحات الفورية:**

| المشكلة | الملف | الإصلاح |
|---------|-------|---------|
| PricingSection: `repeat(3, 1fr)` بدون responsive | `PricingSection.tsx` | `grid-template-columns: 1fr` على الموبايل |
| TargetAudience: نفس المشكلة | `TargetAudience.tsx` | `grid-template-columns: 1fr` على الموبايل |
| Hero title: `clamp(32px, 5vw, 88px)` كبير جداً | Landing CSS | تضييق: `clamp(28px, 5vw, 56px)` |
| Padding كبير (40-60px) | عدة ملفات | `padding: 16px` على الموبايل |
| عناصر تفاعلية صغيرة | عدة ملفات | minimum `44px × 44px` (Apple HIG) |

**قاعدة CSS الجديدة:**
```css
/* الأساس = موبايل (min-width بدل max-width) */
.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

**تكلفة التنفيذ:** يومين
**اختبار على:** iPhone SE, Samsung A-series

---

### ✅ Definition of Done — المرحلة 0

- [ ] GA4 مفعّل + يرسل page_view events
- [ ] أحداث التحويل (paywall_hit, payment_started, payment_completed) متتبعة
- [ ] الزائر يقدر يقرأ المحتوى المجاني بدون حساب
- [ ] GuestBanner يظهر للزوار الغير مسجلين
- [ ] Landing Page تعرض بشكل سليم على شاشات 375px+
- [ ] كل العناصر التفاعلية 44px minimum

---

## 🟠 المرحلة 1: أسس البيع

> **المدة:** الأسبوع الثاني (5-6 أيام)
> **الأولوية:** حرجة — هذه المرحلة هي الفرق بين "منتج جميل" و"منتج يبيع"
> **المتطلبات السابقة:** المرحلة 0 (analytics مطلوب لقياس أثر التغييرات)

### لماذا مرحلة منفصلة للبيع؟

الخطة الأصلية كلها تركز على **ماذا يرى المستخدم بعد ما يدفع**. لكنها لا تجاوب على:

> **لماذا يدفع شخص 299-999 جنيه لهذا الكتاب بينما يقدر يتعلم مجاناً من LearnPrompting.org و PromptingGuide.ai؟**

#### الميزة التنافسية الحقيقية (يجب أن تكون واضحة في كل مكان):

| الميزة | كتابنا | Udemy | LearnPrompting |
|--------|--------|------|---------------|
| عربي 100% بأسلوب مصري | ✅ | ✅ (بعضها) | ❌ |
| تفاعلي (تمارين + gamification) | ✅ 40+ تمرين | ❌ فيديو فقط | ❌ نص فقط |
| تتبع تقدم + streaks | ✅ | ❌ | ❌ |
| سعر أقل (299 vs 349-2199 ج.م) | ✅ | ❌ | مجاني |
| شهادة قابلة للمشاركة | ✅ | ✅ | ❌ |
| مجتمع + leaderboard | ✅ | ❌ | Discord فقط |
| أسلوب قصصي (أحمد وسارة) | ✅ | ❌ | ❌ |

**← هذا الجدول يجب أن يظهر في Landing Page!**

---

### 1.1 — قسم "المشكلة والحل" في Landing Page

حالياً الـ Hero يقول "احترف البرومبت" — لكن الزائر يسأل: **"ليه أحترفه؟"**

**المطلوب — إضافة أعلى الـ Landing:**
```
❌ المشكلة:
"بتقعد 20 دقيقة بتكتب prompt وبيطلعلك نتيجة محبطة؟"
"بتحس إن ChatGPT مش بيفهمك؟"
"زملاؤك بيستخدموا AI وبيخلصوا شغلهم في نص الوقت وانت لسه؟"

✅ الحل:
"في 4 ساعات بس هتتعلم تكتب prompts زي المحترفين"
"500+ متعلم قبلك حققوا نتائج من أول أسبوع"
"مش فيديوهات مملة — ده كتاب تفاعلي بتطبق فيه وانت بتتعلم"
```

| الملف | النوع |
|-------|-------|
| `src/components/landing/PainPointsSection.tsx` | جديد |
| `src/components/landing/CompetitorComparison.tsx` | جديد |
| `src/app/page.tsx` | تعديل — إضافة الأقسام الجديدة |

---

### 1.2 — Lead Magnet (PDF مجاني + email capture)

الزائر اللي مش مستعد يسجل — بيخرج ومش بيرجع. لازم ناخد إيميله على الأقل.

**الحل:**
- **"دليل GOLDS المصغّر — 5 تقنيات Prompt أساسية في 10 دقائق"** (PDF)
- Modal يظهر بعد 30 ثانية على Landing أو عند scroll 50%
- أو popup عند محاولة الخروج (exit intent)
- الزائر يكتب إيميله → يحصل على PDF → يدخل في drip campaign

| الملف | النوع |
|-------|-------|
| `src/components/landing/LeadMagnetModal.tsx` | جديد |
| `src/app/api/lead-magnet/route.ts` | جديد — يرسل PDF + يخزن الإيميل |
| `public/assets/content/golds-mini-guide.pdf` | جديد — الـ PDF نفسه |

---

### 1.3 — Upgrade Email Drip (6 إيميلات)

المستخدم المجاني يقرأ فصل 1 كامل → يصطدم بـ paywall → **صمت تام!**

**السلسلة المطلوبة:**
```
يوم 1 بعد التسجيل: "أهلاً! جهزنالك فصل 1 كامل مجاناً 🎁"
يوم 3: "خلصت فصل 1؟ هنا ملخص أهم 3 حاجات اتعلمتها"
يوم 5: "55+ قالب prompt جاهز بيستناك في خطة Pro 🔥"  ← أول mention للترقية
يوم 7: "أحمد (بطل الكتاب) في فصل 3 بيبني أول AI Agent... عايز تكمل معاه؟"
يوم 10: "عرض خاص: 20% خصم لأول 48 ساعة ⏰"  ← urgency
يوم 14: "آخر فرصة — العرض بينتهي بكرة"
```

| الملف | النوع |
|-------|-------|
| `src/lib/upgrade-emails.ts` | جديد — قوالب الإيميلات الست |
| `src/app/api/cron/upgrade-drip/route.ts` | جديد — Cron job يومي |
| `src/lib/email.ts` | تعديل — إضافة أنواع إيميلات جديدة |

إضافة لجدول `email_preferences`: `upgrade_emails: boolean`

---

### 1.4 — Abandoned Cart Recovery (3 إيميلات)

المستخدم يفتح صفحة الدفع → يتردد → يخرج → **ما حد بيتواصل معاه!**

**السلسلة:**
```
بعد 1 ساعة: إيميل "نسيت حاجة؟ خطة {plan} بتستناك"
بعد 24 ساعة: "لسه مهتم؟ هنا 3 أسباب ليه {plan} هتغير شغلك"
بعد 72 ساعة: "عرض خاص ليك: كود خصم {COMEBACK10} صالح 48 ساعة"
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

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own intents" ON payment_intents FOR ALL
  USING (auth.uid()::text = user_id::text);
```

| الملف | النوع |
|-------|-------|
| `src/lib/cart-recovery.ts` | جديد — قوالب إيميلات الـ cart |
| `src/app/api/cron/cart-recovery/route.ts` | جديد — Cron job |
| `src/app/payment/page.tsx` | تعديل — تسجيل payment_intent عند الزيارة |
| `supabase_payment_intents.sql` | جديد — Migration |

---

### 1.5 — تقديم Referral Widget

**الحالي:** يظهر فقط بعد إنجاز achievement أو إكمال فصل (80% من المستخدمين لا يوصلوا).

**المطلوب — متى يظهر:**
- بعد أول تسجيل دخول مباشرة: "ادعي صاحبك واكسب 50 جنيه"
- في header/navigation دائماً (أيقونة صغيرة)
- بعد أول paywall: "ادعي 3 أصحاب واحصل على خصم 30%"
- في صفحة الدفع: "عندك كود إحالة؟"

| الملف | النوع |
|-------|-------|
| `src/components/ReferralWidget.tsx` | تعديل — توقيت ظهور جديد |
| `src/components/Navigation.tsx` | تعديل — إضافة أيقونة referral |
| `src/app/payment/page.tsx` | تعديل — حقل كود إحالة |

---

### 1.6 — صفحة اشتراك + إيصالات في Profile

المستخدم اللي دافع 999 جنيه لخطة VIP يريد **يحس إنه VIP**.

```
┌────────────────────────────────┐
│  الاشتراك والدفع               │
│                                │
│  📦 الخطة: Pro                 │
│  📅 التجديد: 15 أبريل 2026     │
│  💳 آخر دفع: 499 ج.م           │
│  🔄 الحالة: نشط ✅             │
│                                │
│  [تغيير الخطة] [تحميل فاتورة] │
│                                │
│  ── سجل المدفوعات ──           │
│  15/3/2026  Pro  499ج  [تحميل] │
│  15/2/2026  Pro  499ج  [تحميل] │
└────────────────────────────────┘
```

| الملف | النوع |
|-------|-------|
| `src/app/profile/subscription/page.tsx` | جديد |
| `src/app/api/payments/history/route.ts` | جديد |

---

### ✅ Definition of Done — المرحلة 1

- [ ] قسم Pain Points ظاهر في Landing قبل الـ Hero أو بجانبه
- [ ] جدول مقارنة المنافسين ظاهر في Landing
- [ ] Lead Magnet modal يعمل + يرسل PDF
- [ ] 6 إيميلات upgrade drip مجدولة وتعمل
- [ ] 3 إيميلات abandoned cart مجدولة وتعمل
- [ ] Referral Widget يظهر بعد التسجيل مباشرة
- [ ] صفحة اشتراك في Profile تعرض الخطة الحالية + سجل الدفع
- [ ] كل الأحداث الجديدة متتبعة في GA4

---

## 🟡 المرحلة 2: الـ Onboarding الجديد + Quick Win

> **المدة:** الأسبوع 3-4 (~8-10 أيام)
> **الأولوية:** عالية — تخصيص تجربة المستخدم من أول لحظة
> **المتطلبات السابقة:** المرحلة 0 (Guest Mode يحدد متى يظهر الـ Onboarding)

### 2.1 — إعادة بناء Onboarding (2-3 خطوات بدل 4)

**لماذا 2-3 بدل 4؟** متوسط جلسة الموبايل 72 ثانية. 4 خطوات كثيرة.

#### الخطوة 1: الهدف + التخصص (شاشة واحدة)
```
┌──────────────────────────┐
│    ما هدفك من التعلم؟     │
│                           │
│  [تطوير مهني] [مشروع]    │  ← chips أفقية
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

#### الخطوة 2: المسار + المدة (شاشة واحدة)
```
┌──────────────────────────────────────┐
│         اختر مسارك التعليمي          │
│                                      │
│  ⚡ السريع (29 صفحة | ~4 ساعات)     │
│     المقدمة + فصل 1 + فصل 2         │
│                                      │
│  📚 المتوسط (77 صفحة | ~12 ساعة)    │
│     فصول 1-6 + 20 تمرين             │
│                                      │
│  🏆 الشامل (89 صفحة | ~20 ساعة)     │
│     كل المحتوى + شهادة              │
│                                      │
│  ── في كام وقت؟ ──                   │
│  [🏃أسبوع] [🚶أسبوعين] [🎯شهر]      │
│  [🌿شهرين] [✨بدون جدول]             │
│                                      │
│        [ابدأ رحلتك! 🚀]             │
└──────────────────────────────────────┘
```

**ملاحظة:** خيار "✨ بدون جدول" مضاف — المستخدم يتعلم بطريقته بدون ضغط.

---

### 2.2 — قاعدة بيانات تفضيلات التعلم

**الحالي:** Onboarding يحفظ في localStorage فقط → يضيع عند تغيير الجهاز.
**المطلوب:** حفظ في Supabase.

```sql
-- supabase_learning_preferences.sql
CREATE TABLE user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  learning_goal TEXT NOT NULL 
    CHECK (learning_goal IN ('professional','entrepreneurship','career-change','curiosity')),
  specialization TEXT NOT NULL 
    CHECK (specialization IN ('programming','ecommerce','design','marketing','general')),
  learning_path TEXT NOT NULL 
    CHECK (learning_path IN ('quick','intermediate','comprehensive')),
  learning_duration TEXT NOT NULL 
    CHECK (learning_duration IN ('1week','2weeks','1month','2months','flexible')),
  
  plan_start_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_learning_preferences FOR ALL
  USING (auth.uid()::text = user_id::text);

CREATE INDEX idx_prefs_user ON user_learning_preferences(user_id);
```

---

### 2.3 — أنواع TypeScript

```typescript
// src/types/learning.ts

// المسارات التعليمية
export type LearningPathId = 'quick' | 'intermediate' | 'comprehensive';

export interface LearningPath {
  id: LearningPathId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  sections: string[];
  totalPages: number;
  estimatedHours: number;
  exerciseCount: number;
  features: string[];
}

// التخصصات
export type SpecializationId = 'programming' | 'ecommerce' | 'design' | 'marketing' | 'general';

export interface Specialization {
  id: SpecializationId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  examplePrompts: string[];
  useCases: string[];
  relatedTools: string[];
}

// أهداف التعلم
export type LearningGoalId = 'professional' | 'entrepreneurship' | 'career-change' | 'curiosity';

// مدة التعلم
export type LearningDurationId = '1week' | '2weeks' | '1month' | '2months' | 'flexible';

export interface LearningDuration {
  id: LearningDurationId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  dailyPages: number;
  dailyExercises: number;
  dailyMinutes: number;
}

// تفضيلات المستخدم الكاملة
export interface UserLearningPreferences {
  userId: string;
  learningPath: LearningPathId;
  specialization: SpecializationId;
  learningGoal: LearningGoalId;
  learningDuration: LearningDurationId;
  planStartDate: string;
  isActive: boolean;
}
```

---

### 2.4 — Quick Win: أول Prompt ناجح في 60 ثانية

بعد الـ Onboarding مباشرة — قبل القراءة. يعطي المستخدم نتيجة فورية تحفزه.

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

**ملاحظة:** الـ Prompt يتغير بناءً على التخصص المختار:
- برمجة: "اكتبلي function بـ Python لقراءة ملف CSV..."
- تجارة: "اكتبلي وصف منتج جذاب لـ..."
- تسويق: "اكتبلي 5 أفكار posts لـ Instagram عن..."
- تصميم: "اقترحلي color palette لبراند..."
- عام: "اكتبلي إيميل اعتذار..."

---

### 2.5 — ملفات المرحلة 2

| # | الملف | النوع | الوصف |
|---|-------|-------|-------|
| 1 | `src/types/learning.ts` | جديد | أنواع TypeScript |
| 2 | `src/lib/learning-preferences.ts` | جديد | CRUD للتفضيلات |
| 3 | `src/app/api/learning-preferences/route.ts` | جديد | GET/POST API |
| 4 | `src/components/onboarding/StepGoalAndSpec.tsx` | جديد | خطوة 1: الهدف + التخصص |
| 5 | `src/components/onboarding/StepPathAndDuration.tsx` | جديد | خطوة 2: المسار + المدة |
| 6 | `src/components/onboarding/ProgressIndicator.tsx` | جديد | مؤشر التقدم |
| 7 | `src/components/onboarding/QuickWin.tsx` | جديد | أول Prompt ناجح |
| 8 | `src/context/LearningContext.tsx` | جديد | Context provider |
| 9 | `supabase_learning_preferences.sql` | جديد | Migration |
| 10 | `src/app/onboarding/page.tsx` | تعديل | إعادة بناء كامل |
| 11 | `src/app/layout.tsx` | تعديل | إضافة LearningContext |

---

### ✅ Definition of Done — المرحلة 2

- [ ] Onboarding يعمل بـ 2-3 خطوات (mobile-first)
- [ ] التفضيلات تُحفظ في Supabase (ليس localStorage)
- [ ] LearningContext يوفر التفضيلات لكل الصفحات
- [ ] Quick Win يظهر بعد الـ Onboarding بناءً على التخصص
- [ ] المستخدمين الحاليين يحصلون على المسار الشامل + تخصص عام تلقائياً

---

## 🟢 المرحلة 3: المسارات التعليمية (Learning Paths)

> **المدة:** الأسبوع 5-6 (~7-8 أيام)
> **الأولوية:** عالية — تحويل الكتاب من "89 صفحة مخيفة" إلى "مسار واضح"
> **المتطلبات السابقة:** المرحلة 2 (التفضيلات + Context)

### 3.1 — تعريف المسارات الثلاثة

**الملف:** `src/data/learningPaths.ts`

#### المسار السريع (Quick Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | intro, section-1, section-2 |
| **الصفحات** | 29 صفحة |
| **التمارين** | 5 تمارين أساسية |
| **المدة** | ~4 ساعات |
| **الخطة المطلوبة** | Basic أو أعلى |

**ما يتعلمه:** ما هو AI التوليدي، أساسيات الـ Prompts، أول تقنيات التواصل

#### المسار المتوسط (Intermediate Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | intro → section-6 |
| **الصفحات** | 77 صفحة |
| **التمارين** | 20 تمرين |
| **المدة** | ~12 ساعة |
| **الخطة المطلوبة** | Pro أو أعلى |

**ما يتعلمه:** + تصميم تجربة المستخدم + كتابة محتوى + تحسين الجودة + أدوات AI

#### المسار الشامل (Comprehensive Path)
| البند | القيمة |
|-------|--------|
| **الأقسام** | كل الأقسام (intro → section-10 + appendix + glossary) |
| **الصفحات** | 89 صفحة |
| **التمارين** | 40+ تمرين |
| **المدة** | ~20 ساعة |
| **الخطة المطلوبة** | VIP |

**ما يتعلمه:** كل المحتوى + المشروع الممتد + أدوات AI + Chat + شهادة

---

### 3.2 — Knowledge Cards (Micro-Learning للموبايل)

29 صفحة = ليس "سريع" لجلسة موبايل 72 ثانية. الحل: تقسيم كل صفحة إلى **بطاقات معرفة**.

**كيف يعمل:**
- كل بطاقة = 2-3 دقائق قراءة
- عرض **بطاقة واحدة** في كل مرة على الموبايل (swipeable)
- كل بطاقة تنتهي بـ **Takeaway** واحد واضح
- المستخدم يكمل بطاقتين في جلسة واحدة

**مثال:**
```
صفحة "كيف يفكر الذكاء الاصطناعي" → 3 بطاقات:
├── بطاقة 1: ما هو AI التوليدي؟ (2 دقائق)
├── بطاقة 2: كيف يفهم AI كلامك؟ (2 دقائق)
└── بطاقة 3: الفرق بين Prompt ضعيف وقوي (3 دقائق)
```

> **لا يتطلب إعادة كتابة المحتوى** — فقط إضافة metadata لتقسيم الصفحات + عرض مختلف على الموبايل.

---

### 3.3 — تعديل صفحة TOC

إضافة **شريط المسار** + **تظليل** الفصول الغير مشمولة + زر **"ترقية المسار"**

```
┌────────────────────────────────────┐
│ 📚 مسارك: المتوسط  [تغيير المسار] │
│ ████████████░░░░░░  45% مكتمل     │
├────────────────────────────────────┤
│  ✅ المقدمة (مكتمل)                │
│  ✅ الفصل 1 (مكتمل)                │
│  🔵 الفصل 2 (جاري)                 │
│  ○ الفصل 3                         │
│  ○ الفصل 4                         │
│  ○ الفصل 5                         │
│  ○ الفصل 6                         │
│  🔒 الفصل 7-10 (خارج مسارك)       │
│     [ترقية للوصول →]               │
└────────────────────────────────────┘
```

---

### 3.4 — ملفات المرحلة 3

| # | الملف | النوع | الوصف |
|---|-------|-------|-------|
| 1 | `src/data/learningPaths.ts` | جديد | تعريف المسارات الثلاثة |
| 2 | `src/components/plan/PathProgressBar.tsx` | جديد | شريط تقدم المسار |
| 3 | `src/app/toc/page.tsx` | تعديل | فلترة حسب المسار + شريط تقدم |
| 4 | `src/app/read/[section]/[page]/page.tsx` | تعديل | عرض Knowledge Cards على الموبايل |

---

### ✅ Definition of Done — المرحلة 3

- [ ] المسارات الثلاثة معرفة ومعروضة في TOC
- [ ] شريط تقدم المسار يعكس الإكمال الحقيقي
- [ ] الفصول خارج المسار مميزة ومقفلة مع زر ترقية
- [ ] Knowledge Cards تعمل على الموبايل (swipeable)
- [ ] زر "تغيير المسار" يعمل من TOC

---

## 🔵 المرحلة 4: التخصصات (Specializations)

> **المدة:** الأسبوع 7-8 (~8-10 أيام)
> **الأولوية:** متوسطة-عالية — تحويل الكتاب من "محتوى عام" إلى "محتوى مخصص ليك"
> **المتطلبات السابقة:** المرحلة 2 (التخصص محفوظ) + المرحلة 3 (المسارات)

### 4.1 — هيكل المحتوى المخصص

لكل فصل من الفصول الأساسية، أمثلة مخصصة بناءً على التخصص:

#### مثال: فصل 2 (من الفكرة للمواصفات)

| التخصص | أمثلة الـ Prompt |
|--------|-----------------|
| **البرمجة** | "اكتبلي مواصفات API لتطبيق إدارة مهام..."، "صمملي database schema لـ..." |
| **التجارة** | "اكتبلي خطة إطلاق متجر إلكتروني..."، "حللي السوق المصري لمنتج..." |
| **التصميم** | "صمملي wireframe لتطبيق..."، "اقترحلي color palette لبراند..." |
| **التسويق** | "اكتبلي خطة تسويقية لمنتج..."، "صمملي حملة سوشيال ميديا..." |
| **عام** | "اكتبلي إيميل رسمي..."، "لخصلي التقرير ده..." |

### 4.2 — هيكل البيانات

```typescript
// src/data/specializationContent.ts

interface SpecializationContent {
  specializationId: SpecializationId;
  sectionId: string;
  
  examplePrompts: {
    title: string;
    prompt: string;
    expectedOutput: string;
    tips: string[];
  }[];
  
  bonusExercises: ExerciseData[];
  
  scenarios: {
    title: string;
    description: string;
    steps: string[];
  }[];
  
  recommendedTools: {
    name: string;
    url: string;
    description: string;
  }[];
}
```

### 4.3 — حجم المحتوى (الإصدار الأول — مصغّر)

الخطة الأصلية كانت 140 مثال + 50 تمرين — كثير جداً. McKinsey يقول المشكلة ليست نقص المحتوى بل صعوبة البدء.

**الإصدار 1:**
- 3 أمثلة لكل تخصص × 4 فصول أساسية = **60 مثال**
- 1 تمرين لكل تخصص × 4 فصول = **20 تمرين**
- **الإصدار 2:** التوسع بناءً على بيانات الاستخدام

### 4.4 — كيفية العرض

- **في صفحة القراءة** (`/read/[section]/[page]`): قسم "أمثلة من تخصصك" أسفل المحتوى
- **في التمارين** (`/exercises`): تمارين التخصص أولاً ثم العامة
- **في الأدوات** (`/tools`): الـ Prompt Generator يبدأ بقوالب التخصص

### 4.5 — استراتيجية Model-Agnostic

كل مثال يركز على **المبدأ** (التقنية) مش الأداة:
- ذكر الأداة كـ "مثال تطبيقي" قابل للتحديث — ليس جزء أساسي
- إضافة metadata: `{ modelSpecific: true, lastVerified: "2026-03" }`
- **مراجعة ربع سنوية** لتحديث الأمثلة المرتبطة بأدوات محددة

### 4.6 — ملفات المرحلة 4

| # | الملف | النوع | الوصف |
|---|-------|-------|-------|
| 1 | `src/data/specializations.ts` | جديد | بيانات التخصصات الخمسة |
| 2 | `src/data/specializationContent.ts` | جديد | 60 مثال + 20 تمرين |
| 3 | `src/components/reading/SpecializationExamples.tsx` | جديد | عرض أمثلة التخصص |
| 4 | `src/app/read/[section]/[page]/page.tsx` | تعديل | إضافة أمثلة التخصص |
| 5 | `src/app/exercises/page.tsx` | تعديل | ترتيب حسب التخصص |
| 6 | `src/components/tools/PromptGenerator.tsx` | تعديل | قوالب حسب التخصص |

---

### ✅ Definition of Done — المرحلة 4

- [ ] 60 مثال مخصص مكتوب ومضاف (5 تخصصات × 4 فصول × 3 أمثلة)
- [ ] 20 تمرين إضافي مكتوب ومضاف
- [ ] أمثلة التخصص تظهر في صفحات القراءة
- [ ] التمارين مرتبة حسب التخصص في /exercises
- [ ] PromptGenerator يبدأ بقوالب التخصص
- [ ] كل مثال مرتبط بأداة فيه metadata: modelSpecific + lastVerified

---

## 🟣 المرحلة 5: خطة التعلم الزمنية (Learning Plan)

> **المدة:** الأسبوع 9 (~5-6 أيام)
> **الأولوية:** متوسطة — يعطي المستخدم إحساس بالتقدم اليومي
> **المتطلبات السابقة:** المرحلة 2 (مدة التعلم) + المرحلة 3 (المسارات)

### 5.1 — محرك توليد الخطة

```
المسار المختار → عدد الصفحات + التمارين
مدة التعلم → عدد الأيام
                ↓
    جدول يومي = (صفحات ÷ أيام) + (تمارين ÷ أيام)
```

**مثال: المسار المتوسط + شهر واحد:**
```
77 صفحة ÷ 30 يوم = ~2.6 صفحات/يوم
20 تمرين ÷ 30 يوم = تمرين كل يوم ونصف

يوم 1: قراءة المقدمة (ص 1-3)
يوم 2: قراءة المقدمة (ص 4-6)
يوم 3: فصل 1 (ص 1-3)
يوم 4: فصل 1 (ص 4-6) + تمرين 1
...
يوم 30: 🎉 احتفال بالإنجاز!
```

### 5.2 — بطاقة يومية بسيطة (بدل تقويم أسبوعي)

التقويم الأسبوعي الكامل معقد جداً على الموبايل. الأفضل: **بطاقة واحدة "مهمتك اليوم"**.

```
┌────────────────────────────────────┐
│  📅 يوم 14 من 30                   │
│  ████████████░░░░░░  45% مكتمل    │
│                                    │
│  📖 اقرأ: فصل 3 — صفحة 5-7        │
│  ✏️ حل: تمرين Prompt Builder #8    │
│  ⏰ ~30 دقيقة                      │
│                                    │
│  [ابدأ القراءة] [حل التمرين]      │
│                                    │
│  ⓘ الخطة مرنة — تقدر تعدلها      │
└────────────────────────────────────┘
```

### 5.3 — خيار "بدون جدول" (Flexible)

بعض المستخدمين لا يريدون الالتزام بجدول. عند اختيار "بدون جدول":
- المهمات اليومية تبقى **عشوائية** (كالنظام الحالي)
- مع **اقتراحات ذكية** بناءً على آخر نقطة وصلها

### 5.4 — ربط مع Daily Missions

بدلاً من المهمات العشوائية فقط:

| المهمة | المصدر |
|--------|--------|
| المهمة 1 | **من الخطة**: اقرأ الصفحات المحددة لليوم |
| المهمة 2 | **من الخطة**: حل التمرين المحدد (إن وجد) |
| المهمة 3 | **عشوائية**: مهمة إضافية (note, bookmark, streak) |

```typescript
// src/lib/missions.ts — تعديل
// قبل
generateDailyMissions(userId, userLevel, userPlan)
// بعد
generateDailyMissions(userId, userLevel, userPlan, learningPath?)
```

### 5.5 — إيميلات الخطة الزمنية

إضافة لنظام الإيميل:
- **تذكير يومي**: "مهمتك اليوم: اقرأ فصل 3 ص 5-7"
- **تقرير أسبوعي**: "أنجزت 5/7 أيام هذا الأسبوع — ممتاز!"
- **لما يتأخر** (نبرة إيجابية): "اشتقنالك! جهزنالك ملخص اللي فاتك"
- **عند الإنجاز**: "🎉 أنهيت المسار! خد شهادتك"

> **ملاحظة:** لا نستخدم guilt-driven notifications (NNGroup يحذر من ده) — نبرة إيجابية فقط.

### 5.6 — جدول DB

```sql
-- supabase_learning_plan.sql
CREATE TABLE learning_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
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

### 5.7 — ملفات المرحلة 5

| # | الملف | النوع | الوصف |
|---|-------|-------|-------|
| 1 | `src/lib/learning-plan.ts` | جديد | محرك توليد الخطة |
| 2 | `src/app/api/learning-plan/route.ts` | جديد | GET/POST/PATCH |
| 3 | `src/app/my-plan/page.tsx` | جديد | صفحة خطة التعلم |
| 4 | `src/components/plan/DailyTaskCard.tsx` | جديد | بطاقة المهمة اليومية |
| 5 | `supabase_learning_plan.sql` | جديد | Migration |
| 6 | `src/lib/missions.ts` | تعديل | ربط المهمات بالخطة |
| 7 | `src/lib/email.ts` | تعديل | إيميلات الخطة الزمنية |
| 8 | `src/components/Navigation.tsx` | تعديل | إضافة رابط "خطتي" |

---

### ✅ Definition of Done — المرحلة 5

- [ ] محرك الخطة يولّد جدول يومي بناءً على المسار + المدة
- [ ] بطاقة يومية تعرض المطلوب اليوم
- [ ] خيار "بدون جدول" يعمل
- [ ] Daily Missions مرتبطة بالخطة (المهمة 1 و 2 من الخطة)
- [ ] إيميل تذكير يومي + تقرير أسبوعي يعملوا
- [ ] رابط "خطتي" في Navigation

---

## ⚪ المرحلة 6: مكتبة المصادر + AI Changelog

> **المدة:** الأسبوع 10 (~5-6 أيام)
> **الأولوية:** متوسطة — تعطي قيمة مستمرة للمشتركين
> **المتطلبات السابقة:** المرحلة 2 (التخصص لفلترة المصادر)

### 6.1 — مكتبة المصادر

```
┌────────────────────────────────────┐
│  📚 مكتبة المصادر                  │
│                                    │
│  [الكل] [تخصصي] [الأحدث]          │
│  🔍 بحث...                         │
│                                    │
│  [أدوات AI] [دورات] [مقالات]      │
│  [فيديوهات] [قوالب]               │
│                                    │
│  ┌──────────────────────────┐      │
│  │ 🔧 ChatGPT — OpenAI      │      │
│  │ أداة محادثة ذكية          │      │
│  │ مبتدئ | الكل              │      │
│  │ [زيارة] [حفظ]            │      │
│  └──────────────────────────┘      │
│                                    │
│  [تحميل المزيد...]                │
└────────────────────────────────────┘
```

### 6.2 — قاعدة بيانات المصادر

```sql
-- supabase_learning_resources.sql
CREATE TABLE learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- التصنيف
  category TEXT NOT NULL 
    CHECK (category IN ('tool','course','article','video','template','book','community')),
  specialization TEXT[] DEFAULT '{"general"}',
  level TEXT DEFAULT 'beginner' 
    CHECK (level IN ('beginner','intermediate','advanced')),
  related_sections TEXT[],
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'ar' CHECK (language IN ('ar','en','both')),
  
  -- نظام Freshness (حماية من تقادم المحتوى)
  content_date DATE,                              -- تاريخ إنشاء المحتوى
  ai_model_version TEXT,                          -- الموديل المذكور
  is_model_specific BOOLEAN DEFAULT false,        -- مرتبط بموديل محدد؟
  freshness_status TEXT DEFAULT 'fresh'
    CHECK (freshness_status IN ('fresh','aging','outdated','evergreen')),
  
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT DEFAULT 'admin',
  
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

-- RLS
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read resources" 
  ON learning_resources FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own saved" 
  ON user_saved_resources FOR ALL USING (auth.uid()::text = user_id::text);

-- Indexes
CREATE INDEX idx_resources_category ON learning_resources(category);
CREATE INDEX idx_resources_specialization ON learning_resources USING GIN(specialization);
CREATE INDEX idx_saved_resources_user ON user_saved_resources(user_id);
```

> **ملاحظة:** نظام تقييم النجوم (resource_ratings) مؤجل للإصدار 2. الاكتفاء بزر "مفيد/غير مفيد" في الإصدار 1.

### 6.3 — نظام التحديث شبه التلقائي

1. **الأدمن** يضيف مصادر يدوياً من لوحة التحكم
2. **Cron Job أسبوعي** يتحقق من صلاحية الروابط (HTTP HEAD)
3. المصادر **بدون تحقق 30 يوم** → حالة "يحتاج مراجعة"
4. المصادر `is_model_specific = true` → **تحذير بعد 6 شهور**
5. إيميل أسبوعي للأدمن بالمصادر التي تحتاج مراجعة

### 6.4 — عدد المصادر الأولية: 25-30 مصدر مختار بعناية

| التصنيف | العدد |
|---------|-------|
| أدوات AI | 8 |
| دورات | 5 |
| مقالات | 5 |
| فيديوهات | 5 |
| قوالب | 4 |
| كتب + مجتمعات | 3 |
| **المجموع** | **~30** |

---

### 6.5 — AI Changelog (تحديثات أسبوعية — ميزة VIP)

صفحة جديدة: `/ai-updates` — "ما الجديد في عالم AI هذا الأسبوع"

- تحديثات قصيرة: 3-5 نقاط أسبوعياً
- الأدمن يكتبها يدوياً (5-10 دقائق)
- تتكامل مع الإشعارات والإيميلات
- **ميزة VIP حصرية** — سبب إضافي للترقية

---

### 6.6 — ملفات المرحلة 6

| # | الملف | النوع | الوصف |
|---|-------|-------|-------|
| 1 | `src/data/learningResources.ts` | جديد | المصادر الأولية (seed) |
| 2 | `src/app/api/resources/route.ts` | جديد | GET مع فلترة |
| 3 | `src/app/api/resources/[id]/save/route.ts` | جديد | POST/DELETE حفظ |
| 4 | `src/app/resources/page.tsx` | جديد | صفحة المكتبة |
| 5 | `src/components/resources/ResourceCard.tsx` | جديد | بطاقة مصدر |
| 6 | `src/components/resources/ResourceFilters.tsx` | جديد | فلاتر |
| 7 | `src/app/ai-updates/page.tsx` | جديد | صفحة التحديثات |
| 8 | `supabase_learning_resources.sql` | جديد | Migration |
| 9 | `src/lib/features.ts` | تعديل | إضافة features جديدة |
| 10 | `src/types/subscription.ts` | تعديل | إضافة FeatureKey جديدة |
| 11 | `src/components/Navigation.tsx` | تعديل | إضافة رابط "المصادر" |

---

### ✅ Definition of Done — المرحلة 6

- [ ] 25-30 مصدر أولي مضاف في DB
- [ ] صفحة المصادر تعمل مع فلترة (تصنيف + تخصص + مستوى)
- [ ] حفظ المصادر في المفضلة يعمل
- [ ] نظام freshness يحذر من المصادر القديمة
- [ ] صفحة AI Updates تعمل (VIP فقط)
- [ ] رابط "المصادر" في Navigation

---

## 📝 المرحلة 7: Content Marketing + Blog

> **المدة:** بداية من الأسبوع 10 + مستمر
> **الأولوية:** متوسطة — يجلب زوار مجانيين (organic traffic) على المدى الطويل
> **المتطلبات السابقة:** المرحلة 0 (analytics لقياس traffic)

### 7.1 — لماذا Blog؟

حالياً SEO يعتمد على كلمة "خبير البرومبتات" — لكن الناس تبحث عن:
- "إزاي أستخدم ChatGPT"
- "أفضل prompt للتسويق"
- "prompt engineering بالعربي"

### 7.2 — التطبيق

مسار جديد: `/blog/[slug]`

كل مقال ينتهي بـ CTA: **"عايز تتعلم أكتر؟ جرب الفصل الأول مجاناً"**

### 7.3 — أول 5 مقالات

1. **"5 أخطاء بيعملها كل اللي بيستخدم ChatGPT"** — clickbait عملي
2. **"إزاي تكتب إيميل احترافي في 30 ثانية بالـ AI"** — عملي فوراً
3. **"الفرق بين Prompt ضعيف وقوي (بالأمثلة)"** — مأخوذ من فصل 1
4. **"أفضل 10 Prompts للتسويق الرقمي"** — يستهدف شريحة التسويق
5. **"ChatGPT vs Claude vs Gemini — أيهم أحسن للعربي؟"** — مقارنة مطلوبة

### 7.4 — ملفات المرحلة 7

| # | الملف | النوع |
|---|-------|-------|
| 1 | `src/app/blog/page.tsx` | جديد — قائمة المقالات |
| 2 | `src/app/blog/[slug]/page.tsx` | جديد — صفحة مقال |
| 3 | `src/components/blog/BlogCard.tsx` | جديد |
| 4 | `src/components/blog/BlogCTA.tsx` | جديد — CTA في نهاية كل مقال |

---

### ✅ Definition of Done — المرحلة 7

- [ ] Blog route يعمل مع SSG
- [ ] 5 مقالات أولية منشورة
- [ ] كل مقال فيه CTA للكتاب
- [ ] SEO metadata لكل مقال

---

## 🔄 مهام مستمرة (بعد الإطلاق)

| المهمة | التكرار | المسؤول |
|--------|---------|---------|
| مراجعة KPIs | أسبوعياً | الأدمن |
| كتابة مقال blog | أسبوعياً | الأدمن (بمساعدة AI) |
| تحديث المصادر + التحقق من الروابط | شهرياً | Cron + الأدمن |
| مراجعة Model-Agnostic (تحديث أمثلة الأدوات) | ربع سنوياً | الأدمن |
| A/B testing للأسعار والـ CTAs | حسب الحاجة | الأدمن |
| تحديث AI Changelog | أسبوعياً | الأدمن (5-10 دقائق) |

---

## 📊 KPIs — مؤشرات النجاح

| المؤشر (KPI) | الهدف | كيف تقيسه |
|--------------|-------|-----------|
| **Visitor → Signup Rate** | 15-25% | GA4: Landing visits ÷ sign_up events |
| **Signup → Free Reader Rate** | 70%+ | Users who read ≥1 page in 24h |
| **Free → Paid Conversion** | 8-15% | Paying users ÷ total free users |
| **Paywall → Payment Rate** | 20-30% | paywall_hit → payment_completed |
| **Abandoned Cart Recovery** | 10-15% | Cart email opens → completions |
| **MRR (Monthly Recurring Revenue)** | نمو 10%/شهر | Admin dashboard |
| **Churn Rate** | <5%/شهر | Expired ÷ total active |
| **ARPU** | 400+ ج.م | Total revenue ÷ paying users |
| **Referral Rate** | 15%+ | Sharers ÷ total users |
| **DAU/MAU** | 25%+ | Daily active ÷ Monthly active |
| **Content Completion** | 40%+ | Users who finish their path |
| **NPS** | 50+ | استبيان بعد إكمال المسار |

---

## 📁 ملخص شامل لكل الملفات

### ملفات جديدة

| # | الملف | المرحلة |
|---|-------|---------|
| 1 | `src/lib/analytics.ts` | 0 |
| 2 | `src/components/GuestBanner.tsx` | 0 |
| 3 | `src/components/landing/PainPointsSection.tsx` | 1 |
| 4 | `src/components/landing/CompetitorComparison.tsx` | 1 |
| 5 | `src/components/landing/LeadMagnetModal.tsx` | 1 |
| 6 | `src/app/api/lead-magnet/route.ts` | 1 |
| 7 | `src/lib/upgrade-emails.ts` | 1 |
| 8 | `src/app/api/cron/upgrade-drip/route.ts` | 1 |
| 9 | `src/lib/cart-recovery.ts` | 1 |
| 10 | `src/app/api/cron/cart-recovery/route.ts` | 1 |
| 11 | `supabase_payment_intents.sql` | 1 |
| 12 | `src/app/profile/subscription/page.tsx` | 1 |
| 13 | `src/app/api/payments/history/route.ts` | 1 |
| 14 | `src/types/learning.ts` | 2 |
| 15 | `src/lib/learning-preferences.ts` | 2 |
| 16 | `src/app/api/learning-preferences/route.ts` | 2 |
| 17 | `src/components/onboarding/StepGoalAndSpec.tsx` | 2 |
| 18 | `src/components/onboarding/StepPathAndDuration.tsx` | 2 |
| 19 | `src/components/onboarding/ProgressIndicator.tsx` | 2 |
| 20 | `src/components/onboarding/QuickWin.tsx` | 2 |
| 21 | `src/context/LearningContext.tsx` | 2 |
| 22 | `supabase_learning_preferences.sql` | 2 |
| 23 | `src/data/learningPaths.ts` | 3 |
| 24 | `src/components/plan/PathProgressBar.tsx` | 3 |
| 25 | `src/data/specializations.ts` | 4 |
| 26 | `src/data/specializationContent.ts` | 4 |
| 27 | `src/components/reading/SpecializationExamples.tsx` | 4 |
| 28 | `src/lib/learning-plan.ts` | 5 |
| 29 | `src/app/api/learning-plan/route.ts` | 5 |
| 30 | `src/app/my-plan/page.tsx` | 5 |
| 31 | `src/components/plan/DailyTaskCard.tsx` | 5 |
| 32 | `supabase_learning_plan.sql` | 5 |
| 33 | `src/data/learningResources.ts` | 6 |
| 34 | `src/app/api/resources/route.ts` | 6 |
| 35 | `src/app/api/resources/[id]/save/route.ts` | 6 |
| 36 | `src/app/resources/page.tsx` | 6 |
| 37 | `src/components/resources/ResourceCard.tsx` | 6 |
| 38 | `src/components/resources/ResourceFilters.tsx` | 6 |
| 39 | `src/app/ai-updates/page.tsx` | 6 |
| 40 | `supabase_learning_resources.sql` | 6 |
| 41 | `src/app/blog/page.tsx` | 7 |
| 42 | `src/app/blog/[slug]/page.tsx` | 7 |
| 43 | `src/components/blog/BlogCard.tsx` | 7 |
| 44 | `src/components/blog/BlogCTA.tsx` | 7 |
| 45 | `public/assets/content/golds-mini-guide.pdf` | 1 |

### ملفات موجودة (تعديل)

| # | الملف | المرحلة | التعديل |
|---|-------|---------|---------|
| 1 | `src/app/layout.tsx` | 0+2 | GA4 script + LearningContext |
| 2 | `src/app/payment/page.tsx` | 0+1 | Conversion events + payment_intent + referral |
| 3 | `src/components/PaywallGate.tsx` | 0 | paywall_hit event |
| 4 | `middleware.ts` | 0 | Guest Reading paths |
| 5 | `src/components/landing/PricingSection.tsx` | 0 | Mobile responsive |
| 6 | `src/components/landing/TargetAudience.tsx` | 0 | Mobile responsive |
| 7 | `src/app/page.tsx` | 1 | Pain Points + Comparison sections |
| 8 | `src/lib/email.ts` | 1+5 | Upgrade drip + plan emails |
| 9 | `src/components/ReferralWidget.tsx` | 1 | توقيت مبكر |
| 10 | `src/components/Navigation.tsx` | 1+5+6 | Referral + خطتي + المصادر |
| 11 | `src/app/onboarding/page.tsx` | 2 | إعادة بناء كامل |
| 12 | `src/app/toc/page.tsx` | 3 | فلترة مسار + تقدم |
| 13 | `src/app/read/[section]/[page]/page.tsx` | 0+3+4 | Guest mode + Knowledge Cards + أمثلة تخصص |
| 14 | `src/app/exercises/page.tsx` | 4 | ترتيب حسب التخصص |
| 15 | `src/components/tools/PromptGenerator.tsx` | 4 | قوالب تخصص |
| 16 | `src/lib/missions.ts` | 5 | ربط بالخطة الزمنية |
| 17 | `src/lib/features.ts` | 6 | Features جديدة |
| 18 | `src/types/subscription.ts` | 6 | FeatureKey جديدة |

---

## 📈 ملخص الأرقام النهائي

| البند | القيمة |
|-------|--------|
| مراحل التنفيذ | 7 + مستمر |
| المدة الإجمالية | ~10 أسابيع |
| ملفات جديدة | ~45 |
| ملفات تعديل | ~18 |
| جداول DB جديدة | 4 (preferences, plan_tasks, resources, saved_resources) + 1 (payment_intents) |
| أمثلة تخصص (إصدار 1) | 60 |
| تمارين إضافية (إصدار 1) | 20 |
| مصادر أولية | 25-30 |
| مقالات blog أولية | 5 |
| إيميلات جديدة | 6 upgrade + 3 cart + 4 plan = 13 |

---

## ⚠️ ملاحظات عامة

### التوافق مع النظام الحالي
- **لا يوجد breaking changes** — كل الإضافات اختيارية
- المستخدمين الحاليين → المسار الشامل + تخصص عام تلقائياً
- الـ Onboarding الجديد → للمستخدمين الجدد فقط (أو عند طلب التعديل)
- Daily Missions تبقى كما هي إذا لم يختر خطة

### الأداء
- بيانات المسارات والتخصصات = **static data** (لا API calls)
- تفضيلات المستخدم = **cached في Context**
- المصادر = **paginated** (20/صفحة)
- الخطة = **حساب client-side**

### الأمان
- كل الجداول الجديدة = **RLS مفعل**
- المصادر الخارجية = **validated URLs**
- Admin فقط يضيف/يعدل مصادر
- Rate limiting على API endpoints الحساسة

### قابلية التوسع
- إضافة تخصصات = إضافة بيانات في `specializations.ts` فقط
- إضافة مسار = إضافة في `learningPaths.ts`
- المصادر قابلة للتوسيع بلا حدود من Admin panel
- يمكن إضافة **AI-powered recommendations** لاحقاً

---

> **الملف المرجعي الأصلي:** `LEARNING_PATHS_PLAN.md` — يحتوي على كل التفاصيل والأبحاث الأصلية
> **هذا الملف:** خطة التنفيذ المرحلية المنظمة — جاهزة للتطبيق مرحلة بمرحلة
