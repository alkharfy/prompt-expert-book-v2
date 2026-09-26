# 🚀 خطة تطوير ميزات التفاعل والتحفيز — الأولوية القصوى

> **تاريخ الإنشاء:** 17 فبراير 2026  
> **المشروع:** خبير البرومبتات — كتاب تعليمي تفاعلي  
> **الهدف:** تحويل الكتاب من تجربة قراءة سلبية إلى تجربة إدمانية تخلي القارئ يرجع كل يوم ويكمل  
> **عدد المراحل:** 5 مراحل — كل مرحلة تنتهي باختبار قبول (Acceptance Test)

---

## 📑 فهرس الخطة

| المرحلة | الميزة | الأولوية | الجهد المتوقع | التأثير |
|---------|--------|----------|--------------|---------|
| [المرحلة 1](#-المرحلة-1-نظام-الملاحظات-والتظليل-notes--highlights) | نظام الملاحظات والتظليل | 🔴 قصوى | 3-4 أيام | ⭐⭐⭐⭐⭐ |
| [المرحلة 2](#-المرحلة-2-المهام-اليومية-daily-missions) | المهام اليومية | 🔴 قصوى | 3-4 أيام | ⭐⭐⭐⭐⭐ |
| [المرحلة 3](#-المرحلة-3-نظام-التذكيرات-بالإيميل-email-reminders) | تذكيرات الإيميل (Resend) | 🔴 قصوى | 2-3 أيام | ⭐⭐⭐⭐ |
| [المرحلة 4](#-المرحلة-4-ملخصات-الفصول-chapter-recaps) | ملخصات الفصول | 🔴 قصوى | 2-3 أيام | ⭐⭐⭐⭐ |
| [المرحلة 5](#-المرحلة-5-مشاركة-التقدم-والإنجازات-social-sharing) | مشاركة التقدم والإنجازات | 🔴 قصوى | 2-3 أيام | ⭐⭐⭐⭐ |

**الإجمالي المتوقع:** 12-17 يوم عمل

---

## 🔒 قواعد عامة للتنفيذ

1. **لا ننتقل لمرحلة جديدة إلا بعد اجتياز اختبار القبول للمرحلة الحالية**
2. كل مرحلة تبدأ بـ SQL (قاعدة البيانات) → ثم Backend API → ثم Frontend Components → ثم الاختبار
3. كل ملف جديد لازم يتبع نفس patterns المشروع الحالي (TypeScript, RTL, Dark Theme, Framer Motion)
4. كل جدول جديد لازم يكون عليه RLS (Row Level Security)
5. كل API جديد لازم يكون عليه Rate Limiting + Auth Check
6. كل component لازم يدعم الموبايل (Responsive) + `prefers-reduced-motion`

---

## 📦 البنية التحتية المشتركة (قبل أي مرحلة)

### الملفات اللي هتتعدل في أكتر من مرحلة:
```
src/lib/database.types.ts     ← إضافة أنواع الجداول الجديدة
src/lib/gamification.ts       ← ربط المهام والملاحظات بنظام النقاط
src/data/achievementsData.ts  ← إنجازات جديدة مرتبطة بكل ميزة
src/app/layout.tsx            ← تسجيل Providers جديدة
src/styles/gamification.css   ← أنماط جديدة للمهام والاحتفالات
```

---

# 📝 المرحلة 1: نظام الملاحظات والتظليل (Notes & Highlights)

> **الهدف:** القارئ يقدر يظلل أي نص في الكتاب ويضيف ملاحظاته الخاصة، ويرجعلها في أي وقت  
> **ليه مهم؟** بيحوّل الكتاب من "بتاع الكل" لـ"كتابي أنا" — يزود التفاعل بنسبة 40%+  
> **المرجع:** نفس نمط Kindle Highlights + Notion Comments

---

## 1.1 قاعدة البيانات

### جدول `user_notes`
```sql
-- =====================================================
-- المرحلة 1: جدول ملاحظات وتظليل المستخدم
-- =====================================================

CREATE TABLE IF NOT EXISTS user_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- ربط بالمستخدم
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- موقع الملاحظة في الكتاب
    section_id TEXT NOT NULL,          -- مثال: 'section-1', 'intro', 'appendix'
    page_number INTEGER NOT NULL,       -- رقم الصفحة داخل القسم
    
    -- بيانات التظليل
    highlighted_text TEXT,              -- النص المظلل (null لو ملاحظة بدون تظليل)
    
    -- بيانات موقع التظليل في الصفحة (لإعادة رسمه)
    text_start_offset INTEGER,          -- بداية التظليل في النص
    text_end_offset INTEGER,            -- نهاية التظليل في النص
    content_block_index INTEGER,        -- رقم الـ contentBlock اللي فيه التظليل
    
    -- الملاحظة
    note_text TEXT,                     -- نص الملاحظة (null لو تظليل بدون ملاحظة)
    
    -- تنسيق
    highlight_color TEXT DEFAULT 'orange'  
        CHECK (highlight_color IN ('orange', 'yellow', 'green', 'blue', 'purple')),
    
    -- تتبع
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX idx_user_notes_user ON user_notes(user_id);
CREATE INDEX idx_user_notes_section ON user_notes(user_id, section_id, page_number);
CREATE INDEX idx_user_notes_created ON user_notes(created_at DESC);

-- RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notes_select" ON user_notes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_insert" ON user_notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_update" ON user_notes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_delete" ON user_notes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_user_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_notes_updated
    BEFORE UPDATE ON user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_notes_timestamp();
```

### تحديث `database.types.ts`
```typescript
// إضافة في Database.public.Tables:
user_notes: {
    Row: {
        id: string
        user_id: string
        section_id: string
        page_number: number
        highlighted_text: string | null
        text_start_offset: number | null
        text_end_offset: number | null
        content_block_index: number | null
        note_text: string | null
        highlight_color: 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
        created_at: string
        updated_at: string
    }
    Insert: Omit<...Row, 'id' | 'created_at' | 'updated_at'>
    Update: Partial<...Row>
}
```

---

## 1.2 Backend — API Endpoints

### ملف: `src/app/api/notes/route.ts`
| Method | الوصف | Parameters |
|--------|-------|-----------|
| `GET` | جلب ملاحظات المستخدم | `?section_id=X&page_number=Y` (اختياري) — بدون params يجلب الكل |
| `POST` | إنشاء ملاحظة/تظليل جديد | Body: `{ section_id, page_number, highlighted_text?, text_start_offset?, text_end_offset?, content_block_index?, note_text?, highlight_color? }` |

### ملف: `src/app/api/notes/[id]/route.ts`
| Method | الوصف | Parameters |
|--------|-------|-----------|
| `PUT` | تعديل ملاحظة | Body: `{ note_text?, highlight_color? }` |
| `DELETE` | حذف ملاحظة | - |

### المتطلبات:
- ✅ Auth check عبر cookies (`ebook_user_id`)
- ✅ Rate Limiting: 30 طلب/دقيقة باستخدام `src/lib/rate-limit.ts`
- ✅ Input sanitization عبر `src/lib/sanitize.ts`
- ✅ Validation: `note_text` max 2000 حرف، `highlighted_text` max 1000 حرف
- ✅ حد أقصى 500 ملاحظة لكل مستخدم (لمنع الإساءة)

---

## 1.3 Frontend — المكونات

### 1.3.1 `src/components/reading/TextHighlighter.tsx`
**الوظيفة:** يلتقط تظليل النص (text selection) ويعرض قائمة منبثقة

```
المستخدم يظلل نص → تظهر فقاعة (Popover) فوق النص:
  ┌──────────────────────────────────┐
  │ 🟠 🟡 🟢 🔵 🟣  │  📝 ملاحظة  │
  └──────────────────────────────────┘
  
اختيار لون = حفظ التظليل فوراً
ضغط "ملاحظة" = فتح textarea لكتابة ملاحظة
```

**التفاصيل التقنية:**
- يستخدم `window.getSelection()` API لالتقاط التظليل
- يحسب `text_start_offset` و `text_end_offset` نسبةً لـ `content_block_index`
- يستخدم `position: absolute` للـ Popover فوق النص المظلل
- يدعم Touch selection على الموبايل (`selectionchange` event)
- Animation بـ Framer Motion (fade in/out)

### 1.3.2 `src/components/reading/HighlightRenderer.tsx`
**الوظيفة:** يعيد رسم التظليلات المحفوظة على النص عند تحميل الصفحة

**التفاصيل:**
- يستقبل `notes[]` من API عند تحميل الصفحة
- يطبق `<mark>` tags على النص بناءً على `start_offset` و `end_offset`
- لون الـ `mark` يطابق `highlight_color`
- ضغط على التظليل = عرض الملاحظة المرتبطة + خيار تعديل/حذف

### 1.3.3 `src/components/reading/NotesSidebar.tsx`
**الوظيفة:** شريط جانبي (أو Modal على الموبايل) يعرض كل ملاحظات الصفحة الحالية

```
┌─────────────────────────┐
│  📝 ملاحظاتي (3)        │
│─────────────────────────│
│  🟠 "البرومبت المثالي"  │
│  ملاحظتي: مهم جداً...   │
│  الفصل 2 — صفحة 3       │
│  ────────────────        │
│  🟢 "Context Window"     │
│  بدون ملاحظة             │
│  ────────────────        │
│  🔵 "أفضل الممارسات"    │
│  ملاحظتي: أطبق ده...    │
└─────────────────────────┘
```

### 1.3.4 `src/app/notes/page.tsx`
**الوظيفة:** صفحة مستقلة لعرض **كل** ملاحظات المستخدم من الكتاب كله

**المميزات:**
- فلترة حسب القسم / اللون / وجود ملاحظة
- ترتيب حسب التاريخ أو الموقع في الكتاب
- بحث في الملاحظات
- رابط مباشر لكل ملاحظة يوديك للصفحة بالظبط
- تصدير الملاحظات كملف نصي (Export)
- عدّاد: "عندك 23 ملاحظة في 8 فصول"

---

## 1.4 التعديلات على الملفات الموجودة

| الملف | التعديل |
|-------|---------|
| `src/components/reading/SectionPage.tsx` | إضافة `<TextHighlighter>` و `<HighlightRenderer>` حول محتوى الصفحة + زر sidebar |
| `src/components/Navigation.tsx` | إضافة رابط "📝 ملاحظاتي" في قائمة "الأدوات والتعلم" |
| `src/data/achievementsData.ts` | إضافة إنجازات: `first_note` (أول ملاحظة - 20 نقطة)، `note_taker` (10 ملاحظات - 50 نقطة)، `scholar` (50 ملاحظة - 150 نقطة) |
| `src/lib/gamification.ts` | إضافة `recordNoteCreation()` لمنح نقاط عند إنشاء ملاحظة (5 نقاط لكل ملاحظة، حد أقصى 10 يومياً) |
| `src/styles/` | ملف جديد `notes.css` لأنماط التظليل والملاحظات |

---

## 1.5 ربط بنظام الـ Gamification

| الإجراء | النقاط | الشرط |
|---------|--------|-------|
| إنشاء أول ملاحظة | 20 نقطة + شارة "📝 المدوّن" | مرة واحدة |
| كل ملاحظة جديدة | 5 نقاط | حد أقصى 10 ملاحظات/يوم = 50 نقطة |
| 10 ملاحظات إجمالي | 50 نقطة + شارة "✍️ دارس" | مرة واحدة |
| 50 ملاحظة إجمالي | 150 نقطة + شارة "🎯 باحث" | مرة واحدة |
| ملاحظات في 5 فصول مختلفة | 100 نقطة + شارة "📚 شامل" | مرة واحدة |

---

## ✅ 1.6 اختبار القبول — المرحلة 1

> **لا ننتقل للمرحلة 2 إلا بعد نجاح كل اختبارات القبول دي:**

### اختبارات وظيفية (Functional Tests)
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| F1.1 | المستخدم يظلل نص في صفحة قراءة | تظهر فقاعة اختيار اللون | ⬜ |
| F1.2 | المستخدم يختار لون تظليل | التظليل يتحفظ ويظهر حتى بعد تحديث الصفحة | ⬜ |
| F1.3 | المستخدم يضغط "ملاحظة" | يظهر textarea ويقدر يكتب ويحفظ | ⬜ |
| F1.4 | المستخدم يضغط على تظليل محفوظ | تظهر الملاحظة المرتبطة مع خيارات تعديل/حذف | ⬜ |
| F1.5 | المستخدم يحذف ملاحظة | التظليل يختفي والملاحظة تُحذف من DB | ⬜ |
| F1.6 | المستخدم يفتح صفحة `/notes` | كل الملاحظات تظهر مرتبة + قابلة للفلترة | ⬜ |
| F1.7 | المستخدم يضغط ملاحظة في `/notes` | يتوجه لصفحة القراءة الصحيحة | ⬜ |
| F1.8 | المستخدم ينشئ أول ملاحظة | يحصل على شارة "المدوّن" + 20 نقطة | ⬜ |

### اختبارات أمنية (Security Tests)
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| S1.1 | طلب API بدون auth | رد 401 Unauthorized | ⬜ |
| S1.2 | محاولة قراءة ملاحظات مستخدم آخر | رد 403 أو نتائج فارغة (RLS) | ⬜ |
| S1.3 | إرسال `note_text` بأكتر من 2000 حرف | رد 400 Validation Error | ⬜ |
| S1.4 | إرسال أكتر من 30 طلب في دقيقة | رد 429 Rate Limited | ⬜ |
| S1.5 | إرسال HTML/XSS في `note_text` | النص يتعقّم (sanitized) | ⬜ |

### اختبارات تجربة المستخدم (UX Tests)
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| U1.1 | تظليل على الموبايل (touch) | يعمل بسلاسة مع contextmenu | ⬜ |
| U1.2 | RTL support | كل العناصر متجهة صح | ⬜ |
| U1.3 | Animation | حركات سلسة بدون lag | ⬜ |
| U1.4 | Dark theme | الألوان متوافقة مع الثيم الداكن | ⬜ |
| U1.5 | `prefers-reduced-motion` | الحركات تتعطل للمستخدمين اللي طالبين كده | ⬜ |

---

# 🎯 المرحلة 2: المهام اليومية (Daily Missions)

> **الهدف:** كل يوم القارئ يلاقي 3 مهام جديدة تشجعه يفتح الكتاب — زي Duolingo بالظبط  
> **ليه مهم؟** الـ Streak موجود بس مفيش محتوى يومي يسحب القارئ. المهام اليومية بتحوّل "هفتح الكتاب" من "لازم" لـ"عايز"  
> **المرجع:** Duolingo Daily Quests + Habitica Daily Tasks

---

## 2.1 قاعدة البيانات

### جدول `daily_missions`
```sql
-- =====================================================
-- المرحلة 2: جدول المهام اليومية
-- =====================================================

-- تعريف أنواع المهام المتاحة (Template)
CREATE TABLE IF NOT EXISTS mission_templates (
    id TEXT PRIMARY KEY,                -- مثال: 'read_pages', 'complete_exercise', 'add_note'
    title_ar TEXT NOT NULL,             -- مثال: 'اقرأ {target} صفحات'
    description_ar TEXT NOT NULL,
    icon TEXT NOT NULL,                 -- مثال: '📖', '✏️', '📝'
    category TEXT NOT NULL              -- 'reading', 'exercises', 'notes', 'tools', 'streak'
        CHECK (category IN ('reading', 'exercises', 'notes', 'tools', 'streak', 'social')),
    
    -- نطاق الهدف العشوائي
    min_target INTEGER NOT NULL,        -- أقل هدف (مثل: 2 صفحات)
    max_target INTEGER NOT NULL,        -- أقصى هدف (مثل: 5 صفحات)
    
    -- المكافأة
    base_points INTEGER NOT NULL,       -- النقاط الأساسية
    bonus_multiplier DECIMAL DEFAULT 1.0, -- مضاعف المكافأة (للمهام الصعبة)
    
    -- شروط التفعيل
    requires_plan TEXT DEFAULT NULL,     -- null = مجاني, 'basic'/'pro'/'vip'
    min_level INTEGER DEFAULT 1,         -- الحد الأدنى لمستوى المستخدم
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المهام اليومية المعيّنة لكل مستخدم
CREATE TABLE IF NOT EXISTS user_daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_template_id TEXT NOT NULL REFERENCES mission_templates(id),
    
    -- تاريخ المهمة (يتغير يومياً)
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- الهدف والتقدم
    target_value INTEGER NOT NULL,      -- الهدف العشوائي المُولَّد (مثل: 3 صفحات)
    current_value INTEGER DEFAULT 0,    -- التقدم الحالي
    
    -- الحالة
    status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'expired', 'skipped')),
    
    -- مكافأة
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    
    -- ترتيب المهمة (1, 2, 3 — ثلاث مهام في اليوم)
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 3),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- كل مستخدم عنده 3 مهام في اليوم بالضبط
    UNIQUE(user_id, mission_date, slot_number)
);

-- فهارس
CREATE INDEX idx_user_daily_missions_user_date ON user_daily_missions(user_id, mission_date);
CREATE INDEX idx_user_daily_missions_status ON user_daily_missions(status);

-- RLS
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_templates_read" ON mission_templates
    FOR SELECT USING (TRUE);  -- الكل يقدر يقرا القوالب

CREATE POLICY "user_missions_select" ON user_daily_missions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_missions_update" ON user_daily_missions
    FOR UPDATE USING (auth.uid()::text = user_id::text);
```

### بيانات المهام الأولية (Seed Data)
```sql
INSERT INTO mission_templates (id, title_ar, description_ar, icon, category, min_target, max_target, base_points) VALUES
-- مهام القراءة
('read_pages',      'اقرأ {target} صفحات',           'أكمل قراءة عدد من الصفحات اليوم',         '📖', 'reading',   2, 5,  20),
('read_section',    'ابدأ فصل جديد',                  'افتح واقرأ أول صفحة من فصل لسه ما بدأته',  '📚', 'reading',   1, 1,  30),
('reread_page',     'راجع صفحة قرأتها قبل كده',       'ارجع لصفحة سبق قراءتها وراجعها',          '🔄', 'reading',   1, 1,  15),

-- مهام التمارين
('complete_quiz',     'أجب على {target} سؤال',        'أكمل أسئلة اختيار من متعدد',               '✏️', 'exercises', 1, 3,  25),
('complete_exercise', 'أنهِ {target} تمرين',           'أكمل أي نوع من التمارين',                  '🎯', 'exercises', 1, 2,  25),
('perfect_score',     'احصل على إجابة صحيحة من أول مرة', 'أجب صح على سؤال من أول محاولة',         '⭐', 'exercises', 1, 1,  35),

-- مهام الملاحظات (بعد المرحلة 1)
('add_notes',       'أضف {target} ملاحظات',           'ظلل نص أو اكتب ملاحظة جديدة',             '📝', 'notes',     1, 3,  20),
('highlight_text',  'ظلل {target} نصوص مفيدة',        'ظلل أجزاء مهمة من المحتوى',                '🖍️', 'notes',     2, 4,  15),

-- مهام الأدوات
('use_tool',        'استخدم أداة من صندوق الأدوات',   'جرب المولد أو المحلل أو المقارن',           '🛠️', 'tools',     1, 1,  25),
('try_chat',        'اسأل المساعد الذكي سؤال',       'استخدم الشات الذكي واسأل سؤال عن المحتوى',  '💬', 'tools',     1, 1,  20),

-- مهام الـ Streak
('maintain_streak', 'حافظ على سلسلتك 🔥',            'سجل نشاط اليوم للحفاظ على streak',          '🔥', 'streak',    1, 1,  15),
('bookmark_page',   'احفظ {target} إشارات مرجعية',    'احفظ صفحات مهمة للرجوع إليها لاحقاً',       '🔖', 'reading',   1, 2,  15);
```

---

## 2.2 Backend — API & Logic

### ملف: `src/app/api/missions/route.ts`
| Method | الوصف | التفاصيل |
|--------|-------|---------|
| `GET` | جلب مهام اليوم | إذا مفيش مهام لليوم → يولّد 3 مهام عشوائية → يرجعهم |

### ملف: `src/app/api/missions/progress/route.ts`
| Method | الوصف | التفاصيل |
|--------|-------|---------|
| `POST` | تحديث تقدم مهمة | Body: `{ mission_id, increment }` — يزود `current_value` ويتحقق لو اكتملت |

### ملف: `src/lib/missions.ts` — المحرك الأساسي
```typescript
// الوظائف الرئيسية:

generateDailyMissions(userId: string): Promise<Mission[]>
// 1. يتحقق: هل عند المستخدم مهام لليوم؟
// 2. لو لا → يختار 3 مهام عشوائية تناسب مستوى المستخدم وباقته
// 3. القواعد:
//    - مهمة واحدة على الأقل من فئة 'reading' (لأنه كتاب)
//    - لا يتكرر نفس الـ template في نفس اليوم
//    - الـ target عشوائي بين min_target و max_target
//    - مهام 'notes' تظهر فقط بعد تفعيل المرحلة 1
// 4. يحفظ الثلاث مهام في user_daily_missions
// 5. يرجّع المهام

updateMissionProgress(userId: string, actionType: string, value?: number): Promise<void>
// يتم استدعاؤه تلقائياً عند:
//   - قراءة صفحة → actionType: 'read_page'
//   - إكمال تمرين → actionType: 'complete_exercise' + نوع التمرين
//   - إضافة ملاحظة → actionType: 'add_note'
//   - استخدام أداة → actionType: 'use_tool'
//   - استخدام الشات → actionType: 'chat_message'
//   - إضافة bookmark → actionType: 'add_bookmark'
// يقارن مع مهام اليوم النشطة ويحدّث current_value
// لو current_value >= target_value:
//   → يحدّث status = 'completed'
//   → يمنح النقاط
//   → يتحقق: لو الثلاث مهام اكتملت = مكافأة إضافية (All Clear Bonus)

checkAndExpireMissions(): Promise<void>
// يتم استدعاؤه عبر cron أو عند أول طلب في يوم جديد
// يحوّل مهام أمس الغير مكتملة إلى 'expired'
```

### نقاط الربط مع الكود الموجود (Integration Points):
| مكان الربط | الملف | التعديل |
|-----------|-------|---------|
| عند تحميل صفحة قراءة | `src/components/reading/SectionPage.tsx` | في `useEffect` عند `updateReadingProgress` — يستدعي `updateMissionProgress('read_page')` |
| عند إكمال تمرين | `src/lib/gamification.ts` → `onExerciseComplete()` | يستدعي `updateMissionProgress('complete_exercise')` |
| عند إنشاء ملاحظة (المرحلة 1) | `src/app/api/notes/route.ts` → `POST` | يستدعي `updateMissionProgress('add_note')` |
| عند إرسال رسالة شات | `src/app/api/chat/route.ts` | يستدعي `updateMissionProgress('chat_message')` |
| عند إضافة bookmark | API أو action الحالي | يستدعي `updateMissionProgress('add_bookmark')` |

---

## 2.3 Frontend — المكونات

### 2.3.1 `src/components/missions/DailyMissionsWidget.tsx`
**الوظيفة:** ويدجت عائم يظهر في كل صفحات الكتاب (أسفل يمين)

```
 ┌────────────────────────────────┐
 │  🎯 مهام اليوم    2/3 ✅      │
 │────────────────────────────────│
 │  📖 اقرأ 3 صفحات   [██░░] 2/3│
 │  ✏️ أكمل تمرين     [████] ✅  │
 │  📝 أضف ملاحظة     [░░░░] 0/1│
 │────────────────────────────────│
 │  🔥 سلسلة: 5 أيام             │
 │  ⏰ باقي 6 ساعات               │
 └────────────────────────────────┘
```

**التفاصيل:**
- يجلب المهام عبر `useSWR` أو `useState` + `fetch` من `/api/missions`
- Progress bar لكل مهمة
- Countdown timer لنهاية اليوم
- يمكن طيه (minimize) لأيقونة صغيرة
- Animation عند إكمال مهمة (green checkmark + confetti pulse)
- على الموبايل: يظهر كـ floating button → ينفتح كـ bottom sheet

### 2.3.2 `src/components/missions/MissionCompleteToast.tsx`
**الوظيفة:** إشعار يظهر لما مهمة تتكمل

```
 ┌─────────────────────────────────┐
 │  ✅ مهمة مكتملة! +25 نقطة      │
 │  "اقرأ 3 صفحات"                │
 │  ────────                       │
 │  🏆 أكمل كل المهام للمكافأة!   │
 └─────────────────────────────────┘
```

### 2.3.3 `src/components/missions/AllClearCelebration.tsx`
**الوظيفة:** احتفال كبير لما القارئ يكمل الـ 3 مهام

```
 ┌───────────────────────────────────────┐
 │         🎉🎊 ممتاز! 🎊🎉              │
 │                                       │
 │     أكملت كل مهام اليوم!             │
 │     🏆 مكافأة إضافية: +50 نقطة       │
 │                                       │
 │     🔥 سلسلتك: 6 أيام                │
 │     ⭐ مجموع نقاط اليوم: 120         │
 │                                       │
 │         [رجع للقراءة]                 │
 └───────────────────────────────────────┘
```
- Full-screen overlay مع confetti animation (باستخدام CSS أو `canvas-confetti` library)
- يظهر مرة واحدة في اليوم

---

## 2.4 ربط بنظام الـ Gamification

| الإجراء | النقاط | الملاحظات |
|---------|--------|----------|
| إكمال مهمة | حسب `base_points` × `bonus_multiplier` | تتراوح 15-35 نقطة |
| إكمال كل مهام اليوم (All Clear) | +50 نقطة bonus | مرة واحدة في اليوم |
| 3 أيام All Clear متتالية | شارة "🎯 ملتزم" + 100 نقطة | مرة واحدة |
| 7 أيام All Clear متتالية | شارة "💪 محارب" + 200 نقطة | مرة واحدة |
| 30 يوم All Clear | شارة "👑 أسطوري" + 500 نقطة | مرة واحدة |
| أول مهمة يومية مكتملة | شارة "🌅 البداية" + 20 نقطة | مرة واحدة |

### إضافات لـ `achievementsData.ts`:
```typescript
// ============ إنجازات المهام اليومية ============
{ id: 'first_mission', icon: '🌅', title: 'البداية', 
  description: 'أكمل أول مهمة يومية', category: 'missions', points: 20, requirement: 1, requirementType: 'mission_complete' },
{ id: 'all_clear_3', icon: '🎯', title: 'ملتزم',
  description: 'أكمل كل المهام اليومية 3 أيام متتالية', category: 'missions', points: 100, requirement: 3, requirementType: 'mission_complete' },
{ id: 'all_clear_7', icon: '💪', title: 'محارب',
  description: 'أكمل كل المهام اليومية 7 أيام متتالية', category: 'missions', points: 200, requirement: 7, requirementType: 'mission_complete' },
{ id: 'all_clear_30', icon: '👑', title: 'أسطوري',
  description: 'أكمل كل المهام اليومية 30 يوم', category: 'missions', points: 500, requirement: 30, requirementType: 'mission_complete' },
```

---

## ✅ 2.6 اختبار القبول — المرحلة 2

### اختبارات وظيفية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| F2.1 | أول دخول في اليوم | يتم توليد 3 مهام عشوائية | ⬜ |
| F2.2 | الويدجت يظهر في صفحة القراءة | يعرض المهام بالتقدم الحالي | ⬜ |
| F2.3 | القارئ يقرأ 3 صفحات ومهمته "اقرأ 3 صفحات" | الـ progress bar يتقدم تلقائياً ويتكمل | ⬜ |
| F2.4 | القارئ يكمل تمرين ومهمته "أكمل تمرين" | المهمة تتكمل + toast notification | ⬜ |
| F2.5 | القارئ يكمل الـ 3 مهام | يظهر احتفال All Clear + 50 نقطة bonus | ⬜ |
| F2.6 | القارئ يفتح الكتاب في اليوم التالي | مهام جديدة مختلفة + المهام القديمة expired | ⬜ |
| F2.7 | القارئ مستواه 1 | لا تظهر مهام متقدمة (تحتاج مستوى أعلى) | ⬜ |
| F2.8 | القارئ بباقة basic | لا تظهر مهام أدوات VIP | ⬜ |

### اختبارات أداء
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| P2.1 | تحميل الويدجت | أقل من 200ms | ⬜ |
| P2.2 | تحديث التقدم | أقل من 300ms | ⬜ |
| P2.3 | توليد المهام | أقل من 500ms | ⬜ |

### اختبارات UX
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| U2.1 | الويدجت على الموبايل | يظهر كـ FAB → bottom sheet | ⬜ |
| U2.2 | الويدجت لا يغطي المحتوى | يمكن طيه + لا يعيق القراءة | ⬜ |
| U2.3 | Countdown timer | يعدّ تنازلياً بشكل صحيح | ⬜ |
| U2.4 | الاحتفال | animation سلسة بدون lag | ⬜ |

---

# 📧 المرحلة 3: نظام التذكيرات بالإيميل (Email Reminders)

> **الهدف:** إرسال إيميلات تلقائية ذكية تسحب القارئ يرجع للكتاب  
> **ليه مهم؟** القارئ اللي مش بيفتح الكتاب لأيام — لو مفيش حاجة تفكّره، نسي خالص. Resend مثبت في package.json بس مش مستخدم!  
> **المرجع:** Duolingo Passive Aggressive Owl + Headspace Mindful Reminders

---

## 3.1 قاعدة البيانات

### جدول `email_preferences`
```sql
-- =====================================================
-- المرحلة 3: تفضيلات وسجل الإيميلات
-- =====================================================

CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- تفضيلات الإرسال
    reminders_enabled BOOLEAN DEFAULT TRUE,           -- القارئ يقدر يوقفها
    reminder_frequency TEXT DEFAULT 'smart'            -- 'daily', 'every_3_days', 'weekly', 'smart'
        CHECK (reminder_frequency IN ('daily', 'every_3_days', 'weekly', 'smart')),
    preferred_time TEXT DEFAULT '18:00',               -- الوقت المفضل (24h format)
    timezone TEXT DEFAULT 'Africa/Cairo',              -- المنطقة الزمنية
    
    -- إيميلات محددة
    streak_reminders BOOLEAN DEFAULT TRUE,             -- تذكير بالـ Streak
    mission_reminders BOOLEAN DEFAULT TRUE,            -- تذكير بالمهام اليومية
    milestone_notifications BOOLEAN DEFAULT TRUE,      -- تهنئة بالإنجازات
    weekly_recap BOOLEAN DEFAULT TRUE,                 -- ملخص أسبوعي
    
    -- تتبع
    last_email_sent_at TIMESTAMPTZ,
    total_emails_sent INTEGER DEFAULT 0,
    unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- سجل الإيميلات المرسلة
CREATE TABLE IF NOT EXISTS email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,           -- 'streak_reminder', 'mission_reminder', 'weekly_recap', 'milestone', 'welcome'
    subject TEXT NOT NULL,
    template_id TEXT,
    status TEXT DEFAULT 'sent'          -- 'sent', 'failed', 'bounced'
        CHECK (status IN ('sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX idx_email_prefs_user ON email_preferences(user_id);
CREATE INDEX idx_email_log_user ON email_log(user_id, sent_at DESC);

-- RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_prefs_select" ON email_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "email_prefs_update" ON email_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);
```

---

## 3.2 Backend — Email Service

### ملف: `src/lib/email.ts` — محرك الإيميلات
```typescript
// التهيئة:
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// الوظائف الأساسية:

sendStreakReminder(user: UserInfo): Promise<void>
// يُرسَل عند:
//   - streak >= 3 أيام + مفيش نشاط اليوم (بعد الساعة 6 مساءً)
// الموضوع: "🔥 سلسلتك {streak} أيام — لا تخليها تنكسر!"
// المحتوى: الروبوت زعلان + اقتباس من آخر صفحة قرأها + زر "ارجع أكمل"

sendMissionReminder(user: UserInfo): Promise<void>
// يُرسَل عند:
//   - مهام اليوم 0/3 + الساعة > 4 مساءً
// الموضوع: "🎯 عندك 3 مهام مستنياك — {minutesEstimate} دقايق بس!"
// المحتوى: قائمة المهام + تقدير وقت الإنجاز + زر "ابدأ دلوقتي"

sendWeeklyRecap(user: UserInfo): Promise<void>
// يُرسَل: كل جمعة
// الموضوع: "📊 ملخصك الأسبوعي — قرأت {pages} صفحة وكسبت {points} نقطة!"
// المحتوى:
//   - صفحات مقروءة هذا الأسبوع
//   - تمارين مكتملة
//   - نقاط مكتسبة
//   - أطول streak
//   - الترتيب في المتصدرين
//   - "الأسبوع الجاي، حاول تخلص فصل {next_chapter}!"

sendMilestoneEmail(user: UserInfo, milestone: MilestoneInfo): Promise<void>
// يُرسَل عند:
//   - إكمال فصل / إنجاز / مستوى جديد / شهادة
// الموضوع: "🏆 مبروك! {milestone_title}"
// المحتوى: تفاصيل الإنجاز + صورة الشارة + زر "شارك إنجازك"

sendWelcomeEmail(user: UserInfo): Promise<void>
// يُرسَل: بعد التسجيل وتفعيل الحساب
// الموضوع: "🚀 أهلاً بيك في خبير البرومبتات!"
// المحتوى: خطوات البداية + نصائح + تشجيع
```

### قوالب الإيميل — `src/lib/email-templates/`
| الملف | الوصف |
|-------|-------|
| `streak-reminder.tsx` | قالب React Email لتذكير الـ Streak |
| `mission-reminder.tsx` | قالب تذكير المهام اليومية |
| `weekly-recap.tsx` | قالب الملخص الأسبوعي |
| `milestone.tsx` | قالب التهنئة بالإنجاز |
| `welcome.tsx` | قالب الترحيب |
| `base-layout.tsx` | Layout مشترك (RTL, Dark theme, Logo, Unsubscribe link) |

### API Endpoints

#### `src/app/api/cron/send-reminders/route.ts`
```
GET /api/cron/send-reminders?secret=CRON_SECRET
```
- يُستدعى كل ساعة عبر Vercel Cron أو external cron
- يجلب المستخدمين اللي محتاجين تذكير حسب:
  - `email_preferences.reminders_enabled = true`
  - `email_preferences.reminder_frequency` + `last_email_sent_at`
  - الوقت الحالي ≈ `preferred_time` (± ساعة)
- ما يبعتش أكتر من إيميل واحد في اليوم لنفس المستخدم
- ما يبعتش أكتر من 3 إيميلات في الأسبوع (حتى في وضع daily)

#### `src/app/api/email/unsubscribe/route.ts`
```
GET /api/email/unsubscribe?token=XXX&type=all|streak|missions|recap
```
- رابط في كل إيميل — بدون تسجيل دخول
- يعتمد على `unsubscribe_token` (UUID)
- صفحة تأكيد بسيطة

#### `src/app/api/email/preferences/route.ts`
```
GET  — جلب تفضيلات المستخدم
PUT  — تحديث التفضيلات
```

---

## 3.3 Frontend

### 3.3.1 إضافة في صفحة `/profile`
**قسم جديد: "تفضيلات الإيميل"**

```
┌───────────────────────────────────┐
│  📧 تفضيلات الإيميل               │
│───────────────────────────────────│
│  ☑️ تذكيرات الـ Streak            │
│  ☑️ تذكيرات المهام اليومية        │
│  ☑️ تهنئة بالإنجازات              │
│  ☑️ الملخص الأسبوعي              │
│                                   │
│  التكرار: [ذكي 🔽]               │
│  الوقت المفضل: [18:00 🔽]        │
│                                   │
│  [حفظ التفضيلات]                  │
└───────────────────────────────────┘
```

### 3.3.2 صفحة إلغاء الاشتراك
**`src/app/unsubscribe/page.tsx`**
- تصميم بسيط (الروبوت زعلان 😢)
- "هل أنت متأكد؟"
- خيار: إلغاء كل شيء أو إلغاء نوع معين فقط
- خيار: تقليل التكرار بدل الإلغاء الكامل

---

## 3.4 جدول الإرسال الذكي (Smart Frequency)

```
الخوارزمية:
┌──────────────────────────────────────────────────────────────────┐
│  لو القارئ نشط اليوم → لا ترسل حاجة                            │
│  لو القارئ عنده streak > 3 + مفيش نشاط → streak reminder        │
│  لو القارئ عنده مهام 0/3 بعد الساعة 4 → mission reminder        │
│  لو يوم الجمعة → weekly recap                                   │
│  لو القارئ حقق إنجاز → milestone email (فوراً)                  │
│                                                                  │
│  الحدود:                                                         │
│  - حد أقصى 1 إيميل/يوم (ماعدا milestone)                       │
│  - حد أقصى 3 إيميلات/أسبوع                                     │
│  - لو القارئ ما فتحش آخر 3 إيميلات → توقف التذكيرات تلقائياً  │
│  - بعد 30 يوم بدون نشاط → إيميل أخير "وحشتنا" ثم توقف         │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ 3.5 اختبار القبول — المرحلة 3

### اختبارات وظيفية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| F3.1 | مستخدم جديد يفعّل حسابه | يتلقى إيميل ترحيب | ⬜ |
| F3.2 | مستخدم عنده streak 5 + مفيش نشاط اليوم | يتلقى تذكير streak بعد الساعة 6 | ⬜ |
| F3.3 | مستخدم عنده مهام 0/3 | يتلقى تذكير مهام بعد الساعة 4 | ⬜ |
| F3.4 | يوم الجمعة | يتلقى ملخص أسبوعي بالأرقام الصحيحة | ⬜ |
| F3.5 | مستخدم يكمل فصل | يتلقى إيميل تهنئة | ⬜ |
| F3.6 | مستخدم يلغي اشتراك streak | لا يتلقى تذكيرات streak لكن يتلقى الباقي | ⬜ |
| F3.7 | مستخدم يلغي كل شيء | لا يتلقى أي إيميل | ⬜ |
| F3.8 | مستخدم نشط اليوم | لا يتلقى أي تذكير اليوم | ⬜ |

### اختبارات تقنية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| T3.1 | الإيميل يظهر صح في Gmail | RTL + Dark responsive design | ⬜ |
| T3.2 | الإيميل يظهر صح في Outlook | RTL + layout سليم | ⬜ |
| T3.3 | رابط Unsubscribe يعمل | يوقف الإيميلات بدون login | ⬜ |
| T3.4 | Cron endpoint محمي | يرفض بدون `CRON_SECRET` | ⬜ |
| T3.5 | حد 1 إيميل/يوم | لو الـ cron اتشغل مرتين، ما يبعتش مرتين | ⬜ |

### اختبارات UX
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| U3.1 | تفضيلات الإيميل في `/profile` | تظهر وتشتغل | ⬜ |
| U3.2 | صفحة إلغاء الاشتراك | واضحة ومبسطة | ⬜ |
| U3.3 | CTA buttons في الإيميل | تودي لصفحة الكتاب الصحيحة | ⬜ |

---

# 📋 المرحلة 4: ملخصات الفصول (Chapter Recaps)

> **الهدف:** في نهاية كل فصل، القارئ يشوف ملخص مرئي جذاب بأهم النقاط + إحساس إنجاز  
> **ليه مهم؟** بيثبت المعلومة + بيدي إحساس "أنا فعلاً اتعلمت حاجة" — وده بيشجع يكمل الفصل اللي بعده  
> **المرجع:** Headway App Chapter Summaries + Blinkist Key Insights

---

## 4.1 بيانات الملخصات

### ملف: `src/data/recapsData.ts`

```typescript
export interface ChapterRecap {
    sectionId: string                    // 'section-1', 'section-2', ...
    chapterLabel: string                 // 'الفصل 01'
    chapterTitle: string                 // 'أساسيات البرومبت'
    
    // أهم النقاط (3-5 نقاط لكل فصل)
    keyTakeaways: {
        icon: string                     // emoji
        title: string                    // عنوان قصير
        description: string              // شرح 1-2 سطر
    }[]
    
    // نصيحة عملية
    proTip: {
        text: string                     // "جرب ده: ..."
        icon: string                     // 💡
    }
    
    // ربط بالفصل التالي
    nextChapterTeaser: {
        title: string                    // "في الفصل القادم..."
        description: string              // جملة تشويقية
        icon: string
    }
    
    // إحصائيات الفصل
    stats: {
        pages: number                    // عدد الصفحات
        estimatedMinutes: number         // وقت القراءة التقديري
        exercises: number                // عدد التمارين المرتبطة
    }
    
    // اقتباس مميز من الفصل
    keyQuote?: {
        text: string
        pageNumber: number
    }
}
```

### محتوى الملخصات — يُكتب يدوياً لكل فصل:

| القسم | عدد الـ Key Takeaways | ملخص الفصل |
|-------|----------------------|-----------|
| `section-1` | 4 نقاط | أساسيات البرومبت — ما هو البرومبت، لماذا مهم، المكونات الأساسية |
| `section-2` | 4 نقاط | من الفكرة للمواصفات — PRD، تحليل المتطلبات |
| `section-3` | 4 نقاط | تصميم التجربة — UX، الهيكل، wireframes |
| `section-4` | 4 نقاط | كتابة المحتوى — النصوص، النبرة، SEO |
| `section-5` | 4 نقاط | الجودة والتحسين — Testing، Debugging |
| `section-6` | 4 نقاط | الأدوات — أدوات AI المختلفة واستخداماتها |
| `section-7` | 4 نقاط | (حسب محتوى الفصل) |
| `section-8` | 4 نقاط | (حسب محتوى الفصل) |
| `section-9` | 4 نقاط | (حسب محتوى الفصل) |
| `section-10` | 4 نقاط | (حسب محتوى الفصل) |

---

## 4.2 Frontend — المكونات

### 4.2.1 `src/components/reading/ChapterRecap.tsx`
**الوظيفة:** يظهر تلقائياً عند إكمال آخر صفحة في أي فصل

```
 ┌──────────────────────────────────────────────────────┐
 │                                                      │
 │         🎉 أكملت الفصل 03: تصميم التجربة!           │
 │                                                      │
 │  ── أهم ما تعلمته ──                                 │
 │                                                      │
 │  🎯  تصميم UX يبدأ بفهم المستخدم                    │
 │      فهم احتياجات المستخدم هو أساس...                │
 │                                                      │
 │  🏗️  Wireframe قبل الكود                             │
 │      دائماً ارسم الهيكل قبل ما تبدأ...               │
 │                                                      │
 │  📐  Responsive من اليوم الأول                        │
 │      صمم للموبايل الأول ثم وسّع...                   │
 │                                                      │
 │  🧪  اختبر مع مستخدمين حقيقيين                      │
 │      لا تفترض — اسأل واختبر...                       │
 │                                                      │
 │  ── 💡 نصيحة عملية ──                                │
 │  "جرب تعمل wireframe لمشروعك الحالي                 │
 │   باستخدام البرومبت اللي اتعلمته"                   │
 │                                                      │
 │  ── 📊 إحصائياتك ──                                  │
 │  📖 18 صفحة  ⏱ ~25 دقيقة  ✏️ 3 تمارين              │
 │                                                      │
 │  ── 🔮 في الفصل القادم... ──                         │
 │  "هتتعلم إزاي تكتب محتوى الواجهة                    │
 │   بطريقة تخلي المستخدم يفهم ويتفاعل"               │
 │                                                      │
 │  ┌──────────┐  ┌──────────────────┐                  │
 │  │ 📤 شارك  │  │ ▶️ ابدأ الفصل 04 │                  │
 │  └──────────┘  └──────────────────┘                  │
 │                                                      │
 └──────────────────────────────────────────────────────┘
```

**التفاصيل:**
- يظهر كـ full-page section تحت آخر صفحة أو كـ modal/overlay
- Animation: Framer Motion staggered reveal (كل نقطة تظهر بعد الثانية)
- Confetti عند الظهور
- زر "شارك" (يربط بالمرحلة 5)
- زر "ابدأ الفصل التالي" (CTA رئيسي)
- يتم حفظ إن القارئ شاف الملخص (لمنع إعادة العرض)

### 4.2.2 `src/components/reading/RecapCard.tsx`
**الوظيفة:** بطاقة نقطة واحدة (reusable)

### 4.2.3 `src/components/reading/QuickRecapButton.tsx`
**الوظيفة:** زر صغير في صفحة القراءة — "📋 ملخص الفصل السابق"
- يظهر في أول صفحة من كل فصل (ماعدا الأول)
- يفتح modal مع ملخص الفصل السابق
- بيساعد القارئ يفتكر لو ساب الكتاب فترة

---

## 4.3 التعديلات على الملفات الموجودة

| الملف | التعديل |
|-------|---------|
| `src/components/reading/SectionPage.tsx` | عند الوصول لآخر صفحة في القسم → عرض `<ChapterRecap>` بدل/بعد المحتوى |
| `src/components/reading/ReadingPagination.tsx` | في آخر صفحة: زر "التالي" → "📋 شوف الملخص" بدل الانتقال المباشر |
| `src/lib/gamification.ts` | إضافة `recordChapterCompletion()` — يمنح نقاط إضافية عند مشاهدة الملخص |

---

## 4.4 ربط بنظام الـ Gamification

| الإجراء | النقاط |
|---------|--------|
| مشاهدة ملخص فصل (أول مرة) | +15 نقطة |
| مشاهدة كل الملخصات | شارة "📋 الملخِّص" + 100 نقطة |
| مشاركة ملخص (المرحلة 5) | +10 نقاط |

---

## ✅ 4.5 اختبار القبول — المرحلة 4

### اختبارات وظيفية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| F4.1 | القارئ يوصل لآخر صفحة في فصل 1 | يظهر ملخص بـ 4 نقاط + إحصائيات | ⬜ |
| F4.2 | القارئ يضغط "ابدأ الفصل التالي" | ينتقل لأول صفحة من الفصل التالي | ⬜ |
| F4.3 | القارئ يفتح أول صفحة فصل 3 | يظهر زر "ملخص الفصل السابق" | ⬜ |
| F4.4 | القارئ يضغط زر الملخص السابق | يفتح modal بملخص الفصل 2 | ⬜ |
| F4.5 | كل الـ 10 فصول عندهم ملخصات | محتوى صحيح ومتوافق مع الفصل | ⬜ |
| F4.6 | القارئ يشوف الملخص أول مرة | يحصل على 15 نقطة | ⬜ |
| F4.7 | Animation والـ stagger reveal | كل نقطة تظهر بترتيب سلس | ⬜ |

### اختبارات محتوى
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| C4.1 | كل ملخص فيه 3-5 key takeaways | ✓ | ⬜ |
| C4.2 | كل ملخص فيه pro tip عملي | ✓ | ⬜ |
| C4.3 | كل ملخص فيه teaser للفصل التالي | ✓ (ماعدا الأخير) | ⬜ |
| C4.4 | الإحصائيات صحيحة (صفحات/وقت/تمارين) | ✓ | ⬜ |
| C4.5 | المحتوى عربي سليم بدون أخطاء إملائية | ✓ | ⬜ |

---

# 📤 المرحلة 5: مشاركة التقدم والإنجازات (Social Sharing)

> **الهدف:** القارئ يقدر يشارك إنجازاته وتقدمه على السوشيال ميديا  
> **ليه مهم؟** بيعمل Social Proof + تسويق مجاني + بيخلي القارئ فخور ويكمل عشان يشارك أكتر  
> **المرجع:** GitHub Contribution Graph + Duolingo Share Cards + Spotify Wrapped

---

## 5.1 أنواع المحتوى القابل للمشاركة

### 5.1.1 بطاقة إكمال فصل (Chapter Completion Card)
```
 ┌──────────────────────────────────────┐
 │  خبير البرومبتات 🤖                  │
 │                                      │
 │  🏆 أكملت الفصل 03                  │
 │  "تصميم تجربة المستخدم"             │
 │                                      │
 │  📖 18 صفحة  ⏱ 25 دقيقة            │
 │  ⭐ 350 نقطة  🔥 streak: 7 أيام     │
 │                                      │
 │  [خبير البرومبتات — promptexpert.com]│
 └──────────────────────────────────────┘
```

### 5.1.2 بطاقة التقدم الأسبوعي (Weekly Progress Card)
```
 ┌──────────────────────────────────────┐
 │  ملخص أسبوعي 📊                     │
 │                                      │
 │  📖 12 صفحة    ✏️ 5 تمارين          │
 │  ⭐ 280 نقطة   🔥 7 أيام streak     │
 │  📝 8 ملاحظات  🎯 18/21 مهمة        │
 │                                      │
 │  [████████░░] 65% من الكتاب         │
 │                                      │
 │  [خبير البرومبتات — promptexpert.com]│
 └──────────────────────────────────────┘
```

### 5.1.3 بطاقة الإنجاز (Achievement Card)
```
 ┌──────────────────────────────────────┐
 │  🏅 إنجاز جديد!                     │
 │                                      │
 │  💪 "محارب"                          │
 │  أكملت كل المهام اليومية            │
 │  7 أيام متتالية!                     │
 │                                      │
 │  [خبير البرومبتات — promptexpert.com]│  
 └──────────────────────────────────────┘
```

### 5.1.4 بطاقة الـ Streak (Streak Card)
```
 ┌──────────────────────────────────────┐
 │  🔥🔥🔥 سلسلة 30 يوم! 🔥🔥🔥       │
 │                                      │
 │  30 يوم متواصل من التعلم!           │
 │  المستوى: 💎 متميز                   │
 │                                      │
 │  [خبير البرومبتات — promptexpert.com]│
 └──────────────────────────────────────┘
```

---

## 5.2 Backend

### ملف: `src/app/api/share/generate-card/route.ts`
**الوظيفة:** يولّد صورة PNG للبطاقة server-side

```
POST /api/share/generate-card
Body: { type: 'chapter' | 'weekly' | 'achievement' | 'streak', data: {...} }
Response: { imageUrl: string } — رابط مؤقت للصورة (أو Base64)
```

**الطريقة التقنية:**
- Option A: استخدام `html2canvas` (موجود بالفعل في package.json) لتحويل React component لصورة
- Option B: استخدام `@vercel/og` (Satori) لتوليد صور OG من JSX on the server
- **التوصية:** Option B أفضل — أسرع و server-side و لا يحتاج browser

### ملف: `src/app/api/share/og/[type]/route.tsx`
**الوظيفة:** Open Graph dynamic image endpoint

```
GET /api/share/og/chapter?section=3&user=Ahmed
GET /api/share/og/achievement?id=all_clear_7&user=Ahmed
GET /api/share/og/streak?days=30&user=Ahmed
```
- يُستخدم في `<meta og:image>` لصفحات المشاركة
- لما حد يشارك الرابط على فيسبوك/تويتر، الصورة تظهر تلقائياً

### ملف: `src/app/share/[type]/[id]/page.tsx`
**الوظيفة:** صفحة مشاركة عامة (بدون auth) — لما حد يضغط على رابط المشاركة

```
مثال: /share/chapter/section-3?user=ahmed-123
مثال: /share/achievement/all_clear_7?user=ahmed-123
مثال: /share/streak/30?user=ahmed-123
```
- تعرض البطاقة + CTA "ابدأ رحلتك أنت كمان!"
- OG meta tags لعرض الصورة في السوشيال

---

## 5.3 Frontend — المكونات

### 5.3.1 `src/components/sharing/ShareButton.tsx`
**الوظيفة:** زر مشاركة موحد يُستخدم في كل الأماكن

```typescript
<ShareButton 
    type="chapter"           // نوع المحتوى
    data={{ sectionId: 'section-3', ... }}
    variant="icon" | "full"  // أيقونة فقط أو زر كامل
/>
```

**عند الضغط:**
1. يظهر Bottom Sheet / Modal:
```
 ┌───────────────────────────────────┐
 │  📤 شارك إنجازك                   │
 │─────────────────────────────────  │
 │  [Preview of the card]            │
 │─────────────────────────────────  │
 │  🐦 X (Twitter)                   │
 │  📘 Facebook                      │
 │  💬 WhatsApp                      │
 │  💼 LinkedIn                      │
 │  📋 نسخ الرابط                    │
 │  📥 تحميل كصورة                   │
 └───────────────────────────────────┘
```

2. كل خيار يفتح share URL مع نص مُعد مسبقاً:
   - Twitter: `https://twitter.com/intent/tweet?text=...&url=...`
   - Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`
   - WhatsApp: `https://wa.me/?text=...`
   - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`

3. Web Share API كـ fallback على الموبايل (أفضل تجربة)

### 5.3.2 `src/components/sharing/ShareCardPreview.tsx`
**الوظيفة:** يعرض preview للبطاقة قبل المشاركة

### 5.3.3 `src/components/sharing/ShareCardRenderer.tsx`
**الوظيفة:** يبني البطاقة كـ React component (يُستخدم في التصدير + OG)

---

## 5.4 أماكن ظهور زر المشاركة

| المكان | الملف المتأثر | نوع المشاركة |
|--------|-------------|-------------|
| ملخص الفصل (المرحلة 4) | `ChapterRecap.tsx` | `chapter` |
| صفحة الإنجازات | `src/app/achievements/page.tsx` | `achievement` |
| الشهادة (موجود بالفعل — تحسينه) | `src/app/certificate/[id]/page.tsx` | `certificate` |
| لوحة المتصدرين | `src/app/leaderboard/page.tsx` | `streak` أو `weekly` |
| احتفال All Clear (المرحلة 2) | `AllClearCelebration.tsx` | `achievement` |
| Streak milestone (7, 14, 30 يوم) | `StreakNotification.tsx` | `streak` |
| الملف الشخصي | `src/app/profile/page.tsx` | `weekly` |

---

## 5.5 ربط بنظام الـ Gamification

| الإجراء | النقاط |
|---------|--------|
| أول مشاركة | شارة "📢 مؤثر" + 30 نقطة |
| 5 مشاركات | شارة "🌟 سفير" + 75 نقطة |
| 10 مشاركات | شارة "📣 ناشر" + 150 نقطة |
| مشاركة الشهادة | +50 نقطة (مرة واحدة) |

### إضافات لـ `achievementsData.ts`:
```typescript
{ id: 'first_share', icon: '📢', title: 'مؤثر',
  description: 'شارك إنجازك لأول مرة', category: 'social', points: 30, ... },
{ id: 'share_5', icon: '🌟', title: 'سفير',
  description: 'شارك 5 مرات', category: 'social', points: 75, ... },
{ id: 'share_certificate', icon: '🎓', title: 'خريج فخور',
  description: 'شارك شهادتك على السوشيال', category: 'social', points: 50, ... },
```

---

## ✅ 5.6 اختبار القبول — المرحلة 5

### اختبارات وظيفية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| F5.1 | القارئ يكمل فصل ويضغط "شارك" | تظهر قائمة المشاركة مع preview | ⬜ |
| F5.2 | القارئ يختار Twitter | يفتح Twitter مع نص + رابط | ⬜ |
| F5.3 | القارئ يختار WhatsApp | يفتح WhatsApp مع نص + رابط | ⬜ |
| F5.4 | القارئ يختار "تحميل كصورة" | يتحمل PNG بجودة عالية | ⬜ |
| F5.5 | القارئ يختار "نسخ الرابط" | الرابط ينسخ + toast confirmation | ⬜ |
| F5.6 | حد يفتح رابط المشاركة | يشوف الريكاب العام + CTA "ابدأ رحلتك" | ⬜ |
| F5.7 | حد يشارك الرابط على فيسبوك | OG image تظهر صح | ⬜ |
| F5.8 | أول مشاركة | القارئ يحصل على شارة "مؤثر" + 30 نقطة | ⬜ |

### اختبارات تقنية
| # | الاختبار | الحالة المتوقعة | ✅/❌ |
|---|---------|---------------|------|
| T5.1 | OG image endpoint | يرجع صورة صحيحة < 500ms | ⬜ |
| T5.2 | Web Share API على الموبايل | يعرض native share sheet | ⬜ |
| T5.3 | صفحة المشاركة العامة بدون auth | تعمل بدون تسجيل دخول | ⬜ |
| T5.4 | صور المشاركة RTL | النص العربي يظهر صح في الصورة | ⬜ |

---

# 📐 الملخص النهائي

## ترتيب التنفيذ والاعتماديات

```
المرحلة 1: الملاحظات والتظليل ─────────────────────┐
    ↓ (المرحلة 2 تعتمد على وجود الملاحظات كمهمة)    │
المرحلة 2: المهام اليومية ──────────────────────────┤
    ↓ (المرحلة 3 تعتمد على وجود المهام في الإيميلات) │
المرحلة 3: تذكيرات الإيميل ─────────────────────────┤
    ↓ (المرحلة 4 مستقلة لكن تستفيد من الـ Sharing)   │ كل المراحل
المرحلة 4: ملخصات الفصول ──────────────────────────┤ تُحسّن بعضها
    ↓ (المرحلة 5 تضيف مشاركة لكل اللي فات)           │
المرحلة 5: مشاركة التقدم ──────────────────────────┘
```

## قائمة الملفات الجديدة (Summary)

```
الجداول الجديدة (SQL):
├── supabase_user_notes.sql                    (المرحلة 1)
├── supabase_daily_missions.sql                (المرحلة 2)
└── supabase_email_preferences.sql             (المرحلة 3)

API Endpoints:
├── src/app/api/notes/route.ts                 (المرحلة 1)
├── src/app/api/notes/[id]/route.ts            (المرحلة 1)
├── src/app/api/missions/route.ts              (المرحلة 2)
├── src/app/api/missions/progress/route.ts     (المرحلة 2)
├── src/app/api/email/preferences/route.ts     (المرحلة 3)
├── src/app/api/email/unsubscribe/route.ts     (المرحلة 3)
├── src/app/api/cron/send-reminders/route.ts   (المرحلة 3)
├── src/app/api/share/generate-card/route.ts   (المرحلة 5)
└── src/app/api/share/og/[type]/route.tsx       (المرحلة 5)

Libraries:
├── src/lib/missions.ts                        (المرحلة 2)
├── src/lib/email.ts                           (المرحلة 3)
└── src/lib/email-templates/*.tsx              (المرحلة 3)

Components:
├── src/components/reading/TextHighlighter.tsx  (المرحلة 1)
├── src/components/reading/HighlightRenderer.tsx (المرحلة 1)
├── src/components/reading/NotesSidebar.tsx     (المرحلة 1)
├── src/components/reading/ChapterRecap.tsx     (المرحلة 4)
├── src/components/reading/RecapCard.tsx        (المرحلة 4)
├── src/components/reading/QuickRecapButton.tsx (المرحلة 4)
├── src/components/missions/DailyMissionsWidget.tsx    (المرحلة 2)
├── src/components/missions/MissionCompleteToast.tsx    (المرحلة 2)
├── src/components/missions/AllClearCelebration.tsx     (المرحلة 2)
├── src/components/sharing/ShareButton.tsx      (المرحلة 5)
├── src/components/sharing/ShareCardPreview.tsx (المرحلة 5)
└── src/components/sharing/ShareCardRenderer.tsx (المرحلة 5)

Pages:
├── src/app/notes/page.tsx                     (المرحلة 1)
├── src/app/unsubscribe/page.tsx               (المرحلة 3)
└── src/app/share/[type]/[id]/page.tsx         (المرحلة 5)

Styles:
├── src/styles/notes.css                       (المرحلة 1)
├── src/styles/missions.css                    (المرحلة 2)
└── src/styles/sharing.css                     (المرحلة 5)

Data:
└── src/data/recapsData.ts                     (المرحلة 4)
```

## الملفات الموجودة اللي هتتعدل

```
src/lib/database.types.ts          (كل المراحل — إضافة أنواع جديدة)
src/lib/gamification.ts            (المراحل 1, 2, 4, 5 — ربط بالنقاط)
src/data/achievementsData.ts       (كل المراحل — إنجازات جديدة)
src/components/reading/SectionPage.tsx  (المراحل 1, 4 — تظليل + ملخصات)
src/components/Navigation.tsx      (المرحلة 1 — رابط الملاحظات)
src/app/profile/page.tsx           (المراحل 3, 5 — تفضيلات إيميل + مشاركة)
src/app/achievements/page.tsx      (المرحلة 5 — زر مشاركة)
src/app/layout.tsx                 (المرحلة 2 — DailyMissionsWidget)
src/styles/gamification.css        (المرحلة 2 — أنماط المهام)
```

---

> **ملاحظة أخيرة:** هذا الملف مرجع حي — يتم تحديثه بعد كل مرحلة بنتائج الاختبارات والتعديلات اللي حصلت أثناء التنفيذ.
