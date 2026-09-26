# تقرير فحص شامل — PromptMaster
# Comprehensive Site Audit Report

**الموقع:** https://www.prompt-mr.com  
**التاريخ:** مارس 2026  
**الغرض:** مرجع كامل لكل صفحات وميزات ومحتوى الموقع لتسهيل التطوير المستقبلي

---

## 1. نظرة عامة على المشروع (Project Overview)

**PromptMaster** هو منصة تعليمية تفاعلية باللغة العربية لتعلم هندسة البرمجيات اللغوية (Prompt Engineering) والذكاء الاصطناعي التوليدي. المنصة عبارة عن كتاب إلكتروني تفاعلي مع نظام اشتراكات، gamification، تمارين تفاعلية، ومساعد ذكاء اصطناعي.

### Tech Stack
| التقنية | التفاصيل |
|---------|----------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **UI** | React 19.2.4, TypeScript 5 |
| **الاستضافة** | Vercel (project: prompt-expert-book) |
| **قاعدة البيانات** | Supabase (PostgreSQL + RLS) |
| **المصادقة** | Firebase Auth (email/password + Google OAuth) |
| **الدفع** | Kashier Payment Gateway (HMAC webhook verification) |
| **البريد الإلكتروني** | Resend |
| **AI APIs** | OpenAI (GPT-4o Mini), Google Gemini 2.0 Flash, Groq |
| **Rate Limiting** | Upstash Redis + in-memory fallback |
| **الأنيميشن** | Framer Motion + GSAP |
| **البحث** | Fuse.js (fuzzy search) |
| **الاختبارات** | Vitest + Testing Library |
| **Analytics** | Google Analytics 4 (G-9CT7KVS3J0) |
| **الخطوط** | Cairo + Tajawal (Arabic-first) |
| **الاتجاه** | RTL (Right-to-Left) |

### خطط الاشتراك
| الخطة | السعر | الميزات |
|-------|-------|---------|
| **Basic** (أساسي) | 299 ج.م | قراءة الكتاب، إشارات مرجعية، تمارين |
| **Pro** (احترافي) | 499 ج.م | + gamification، أدوات، شهادة |
| **VIP** (مميز) | 999 ج.م | + مساعد AI، كل الميزات |

---

## 2. كل صفحات الموقع (All Pages — 52+ routes)

### 2.1 الصفحات العامة (Public Pages)

| المسار | الوصف | المكونات الرئيسية |
|--------|-------|-------------------|
| `/` | الصفحة الرئيسية (Landing Page) | HeroSection, PainPointsSection, WhatYouLearn, BookContentsSection, TargetAudience, CaseStudies, GamificationSection, CertificatePreview, CompetitorComparison, Testimonials, PricingSection, FAQSection, FinalCTA, LeadMagnetModal, PromoBanner |
| `/blog` | المدونة — 3+ مقالات SEO | BlogCard components |
| `/blog/[slug]` | صفحة مقال فردي | BlogCTA |
| `/community` | صفحة المجتمع | - |
| `/certificate/[id]` | عرض شهادة عامة | Certificate component |
| `/share/[type]/[id]` | صفحة مشاركة اجتماعية | ShareCardRenderer |
| `/unsubscribe` | إلغاء الاشتراك من البريد | - |

### 2.2 صفحات المصادقة (Auth Pages)

| المسار | الوصف |
|--------|-------|
| `/login` | تسجيل الدخول (email/password + Google) |
| `/register` | إنشاء حساب جديد |
| `/verify-code` | التحقق من رمز التفعيل |
| `/forgot-password` | استعادة كلمة المرور |
| `/reset-password` | إعادة تعيين كلمة المرور |

### 2.3 صفحات القراءة (Reading Pages)

| المسار | الوصف |
|--------|-------|
| `/read/[section]/[page]` | قارئ الكتاب الرئيسي |

**الأقسام المتاحة:**
- `intro` — المقدمة (6 صفحات)
- `section-1` إلى `section-10` — الوحدات 1-10
- `glossary` — المسرد
- `appendix` — الملاحق

**مكونات القارئ:** SectionPage, ReadingPagination, ScrollProgress, FontSizeControl, BookmarkButton, BackToTop, CopyButton, TextHighlighter, HighlightRenderer, NotesSidebar, GlossaryModal, GlossaryTerm, LockedOverlay, ChapterRecap, RecapCard, KnowledgeCardView, SpecializationExamples

### 2.4 صفحات الميزات (Feature Pages)

| المسار | الوصف | الخطة المطلوبة |
|--------|-------|----------------|
| `/toc` | جدول المحتويات | مجاني |
| `/notes` | ملاحظات المستخدم | تسجيل دخول |
| `/bookmarks` | الإشارات المرجعية | تسجيل دخول |
| `/exercises` | التمارين التفاعلية | Basic+ |
| `/achievements` | الإنجازات والشارات | Pro+ |
| `/leaderboard` | قائمة المتصدرين | Pro+ |
| `/resources` | مصادر التعلم | تسجيل دخول |
| `/profile` | الملف الشخصي | تسجيل دخول |
| `/profile/subscription` | إدارة الاشتراك | تسجيل دخول |
| `/my-plan` | خطة التعلم الشخصية | تسجيل دخول |
| `/challenge` | تحدي 7 أيام | مجاني |
| `/onboarding` | إعداد أولي (هدف، تخصص، مسار) | تسجيل دخول |
| `/tools` | أدوات الـ Prompt | Pro+ |
| `/running-project` | مشروع تطبيقي مستمر | Pro+ |
| `/prompt-hospital` | مستشفى البرومبت (تشخيص وإصلاح) | Pro+ |
| `/ai-updates` | آخر تحديثات AI | تسجيل دخول |
| `/library` | مكتبة القوالب | مجاني |
| `/certificate` | شهادة الإتمام | Pro+ |

### 2.5 صفحات الدفع (Payment Pages)

| المسار | الوصف |
|--------|-------|
| `/payment` | صفحة اختيار الخطة والدفع (Kashier) + زر واتساب |
| `/payment/callback` | صفحة استقبال نتيجة الدفع من Kashier |

### 2.6 صفحات الإدارة (Admin Pages)

| المسار | الوصف |
|--------|-------|
| `/billing/admin/dashboard` | لوحة تحكم الإدارة — إحصائيات شاملة |
| `/billing/admin/subscriptions` | إدارة الاشتراكات |
| `/billing/admin/plans` | إدارة الخطط |
| `/billing/admin/promos` | إدارة أكواد الخصم |
| `/billing/admin/site-stats` | إحصائيات الموقع |
| `/billing/admin/testimonials` | إدارة التقييمات |
| `/billing/admin/chat` | إدارة المحادثات |

---

## 3. كل مسارات API (All API Routes — 59+)

### 3.1 المصادقة (Auth)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/auth/register` | POST | تسجيل حساب جديد (email, password, name) + device fingerprint |
| `/api/auth/login` | POST | تسجيل الدخول + إنشاء جلسة |
| `/api/auth/logout` | POST | تسجيل الخروج + مسح الجلسة |
| `/api/auth/google` | POST | مصادقة Google OAuth |
| `/api/auth/status` | GET | التحقق من حالة المصادقة |
| `/api/auth/session` | GET | بيانات الجلسة الحالية |
| `/api/auth/verify-code` | POST | التحقق من رمز التفعيل |
| `/api/auth/resend-code` | POST | إعادة إرسال رمز التفعيل |
| `/api/auth/forgot-password` | POST | إرسال رابط استعادة كلمة المرور |
| `/api/auth/reset-password` | POST | إعادة تعيين كلمة المرور |
| `/api/auth/db-operation` | POST | وكيل عمليات قاعدة البيانات (client→API→Supabase) |
| `/api/auth/device-check` | POST | التحقق من الجهاز/البصمة الرقمية |

### 3.2 الدفع (Payment)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/payment/create-session` | POST | إنشاء جلسة دفع Kashier |
| `/api/payment/verify` | POST | التحقق من عملية الدفع |
| `/api/payment/status` | GET | حالة الدفع |
| `/api/webhooks/kashier` | POST | Webhook من Kashier (HMAC verified) |

### 3.3 القراءة والتقدم (Reading & Progress)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/reading-progress` | GET/POST | قراءة/تحديث تقدم القراءة |
| `/api/reading-progress/chapter-complete` | POST | تسجيل إكمال فصل |
| `/api/reading-progress/claim-reward` | POST | المطالبة بمكافأة |

### 3.4 الملاحظات (Notes)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/notes` | GET/POST/DELETE | CRUD للملاحظات |

### 3.5 Gamification
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/achievements` | GET | قائمة الإنجازات |
| `/api/achievements/check` | POST | التحقق من إنجازات جديدة |
| `/api/achievements/unlock` | POST | فتح إنجاز |
| `/api/streak` | GET/POST | بيانات/تحديث الـ streak |

### 3.6 المهام اليومية (Daily Missions)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/missions` | GET | مهام اليوم |
| `/api/missions/generate` | POST | توليد مهام يومية جديدة |
| `/api/missions/progress` | POST | تحديث تقدم مهمة |

### 3.7 المحادثة الذكية (AI Chat)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/chat` | POST | إرسال رسالة (RAG + multi-model) |
| `/api/chat/rate` | POST | تقييم رد المساعد |
| `/api/chat/history` | GET | سجل المحادثات |

### 3.8 الأكواد الترويجية (Promo)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/promo/validate` | POST | التحقق من صلاحية كود |
| `/api/promo/apply` | POST | تطبيق كود خصم |
| `/api/promo/settings` | GET | إعدادات العروض |

### 3.9 خطة التعلم (Learning Plan)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/learning-plan` | GET | الخطة الحالية |
| `/api/learning-plan/generate` | POST | توليد خطة جديدة |
| `/api/learning-plan/complete-task` | POST | إتمام مهمة |
| `/api/learning-preferences` | GET/POST | تفضيلات التعلم |

### 3.10 الاشتراكات (Subscription)
| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/subscription/status` | GET | حالة الاشتراك الحالي |

### 3.11 أخرى
| المسار | الوظيفة |
|--------|---------|
| `/api/resources` | مصادر التعلم |
| `/api/ai-updates` | تحديثات AI |
| `/api/lead-magnet` | التقاط بريد الـ lead magnet |
| `/api/share/[type]` | مشاركة اجتماعية |
| `/api/prompt-hospital` | تشخيص البرومبت |
| `/api/testimonials` | التقييمات |
| `/api/referral` | نظام الإحالة |
| `/api/user/[id]` | بيانات المستخدم |
| `/api/payments/[id]` | بيانات الدفعة |

### 3.12 Cron Jobs
| المسار | الوظيفة |
|--------|---------|
| `/api/cron/send-reminders` | إرسال تذكيرات البريد |
| `/api/cron/upgrade-drip` | حملة بريدية للترقية (6 مراحل) |
| `/api/cron/cart-recovery` | استرداد سلة المشتريات (3 مراحل) |
| `/api/cron/check-expired` | التحقق من الاشتراكات المنتهية |

### 3.13 الإدارة (Admin APIs)
| المسار | الوظيفة |
|--------|---------|
| `/api/admin/login` | دخول لوحة الإدارة |
| `/api/admin/stats` | إحصائيات شاملة |
| `/api/admin/subscriptions` | إدارة الاشتراكات |
| `/api/admin/plans` | إدارة الخطط |
| `/api/admin/promos` | إدارة الأكواد |
| `/api/admin/chat-stats` | إحصائيات المحادثات |
| `/api/admin/testimonials` | إدارة التقييمات |

---

## 4. محتوى الكتاب (Book Content)

### 4.1 هيكل المحتوى
الكتاب مبني على قصة تفاعلية يمر بها شخصيات: **أحمد** (المتعلم) و**سارة** (المعلمة) و**خالد** و**نورة**.

### 4.2 الوحدات بالتفصيل

#### المقدمة (Intro) — 6 صفحات
| الصفحة | العنوان | المحتوى |
|--------|---------|---------|
| 1 | هل الذكاء الاصطناعي يفهمك؟ | إحصائيات عن تبني AI |
| 2 | القصة والشخصيات | تعريف بأحمد وسارة وخالد ونورة |
| 3 | ماذا ستحصل عليه | 55+ قالب، GOLDS، RAG، System Prompts |
| 4 | لمن هذا الكتاب؟ | رواد الأعمال، المسوقين، المطورين |
| 5 | كيف تستخدم هذا الكتاب | 3 مسارات قراءة |
| 6 | مثال سريع | مقارنة ChatGPT vs Claude |

#### الوحدة 1: عالم الذكاء الاصطناعي التوليدي — 13 صفحة
| الفصل | الصفحات | المحتوى |
|--------|---------|---------|
| 1.1 اليوم الأول في AI | 1-4 | التنبؤ بالتوكن، Transformers، Attention، أهمية صياغة الأوامر |
| 1.2 خريطة النماذج 2026 | 5-8 | GPT-5, Claude 4, Gemini 2.5, DeepSeek R1 — مقارنات |
| 1.3 نافذة السياق والحدود | 9-10 | الذاكرة العاملة، حساب التوكن، الـ Hallucinations |
| 1.4 ما لا يستطيع AI فعله | 11-13 | القيود، تحديات اللغة العربية |

#### الوحدة 2: تجربتك الأولى مع AI — 4+ صفحات
| الصفحة | المحتوى |
|--------|---------|
| 1 | أهلاً بك في ChatGPT! — أول محادثة لأحمد |
| 2 | 5 أوامر أولى — تمارين عملية |
| 3 | لماذا بعض الردود أفضل — مقارنة: غامض vs واضح |
| 4 | جرب Claude و Gemini أيضاً — مقارنة منصات |

#### الوحدة 3: إطار GOLDS — 4 صفحات
| الصفحة | المحتوى |
|--------|---------|
| 1 | سر المحترفين: GOLDS — تقديم الإطار |
| 2 | G - Goal — تحديد الهدف بوضوح |
| 3 | O - Output — اختيار تنسيق المخرجات |
| 4 | L - Length — التحكم في حجم الرد |
| + | D - Details + S - Style |

#### الوحدة 4: تسلسل الأوامر (Prompt Chaining) — 6 صفحات
- تعريف وأهمية تسلسل الأوامر
- تقسيم المهام الكبيرة (3 طرق)
- بناء سلسلة أوامر مترابطة
- أنماط: متتالي، متوازي، منسق

#### الوحدة 5: الجودة وتصحيح الأخطاء — 4 صفحات
- 5 فئات فشل: الغموض، السياق، التنسيق، الهلوسة، الحدود
- تقنية Self-Consistency (Wang et al. 2022)
- منهج علمي لتحسين الأوامر

#### الوحدة 6: AI متعدد الوسائط — 20 صفحة (بعد الإضافات)
- ما بعد النص: ما هو AI متعدد الوسائط
- مصفوفة التحويل (صورة→نص، نص→صورة، صوت→نص)
- نماذج: GPT-4V, Claude Vision, Gemini, DALL-E, Midjourney
- أمثلة عربية عملية (تحليل فواتير، وصف عقارات، OCR)
- **صفحة 17-18 (جديدة):** محتوى AI للفيديو

#### الوحدة 7: وكلاء AI (AI Agents) — 4+ صفحات
- ما وراء الأمر: ما هم الوكلاء؟
- تشريح الوكيل: حلقة ReAct، إطار ATLAS
- Agent, Tools, Logic, Actions, Safety

#### الوحدة 8: (مكتبة القوالب/Library)
- قوالب جاهزة للاستخدام (20+ قالب)
- مجموعة A: قوالب أساسية (سؤال 7 أسئلة، تحديد الهدف، PRD)
- مجموعة B: قوالب البنية (خريطة الموقع، تدفقات المستخدم)
- مجموعة C: قوالب المحتوى (دليل اللهجة، CTAs، رسائل الخطأ)

#### الوحدة 9: (محتوى متقدم)

#### الوحدة 10: مستقبل AI — 17 صفحة (بعد الإضافات)
| الصفحات | المحتوى |
|---------|---------|
| 1-3 | المشهد يتغير بسرعة + نماذج التفكير (o3, o4-mini) + AGI |
| 4-10 | محتوى أصلي |
| **11-15 (جديدة)** | **اربح فلوس بالذكاء الاصطناعي** — 5 صفحات كاملة |
| 16-17 | الخاتمة (تم إزاحتها) |

**محتوى "اربح فلوس بالذكاء الاصطناعي" (صفحات 11-15):**
- فرص العمل الحر في مجال AI
- منصات العمل (Upwork, Fiverr, Mostaql, Khamsat)
- أسعار وتسعير الخدمات
- بناء Portfolio احترافي
- استراتيجيات النمو

### 4.3 المسرد (Glossary)
20+ مصطلح تقني مفهرس بالفئات:
- **أساسيات AI:** توكن، برومبت، Completion، نافذة السياق، Temperature، Top-P
- **تقنيات الأوامر:** Few-shot Learning، Chain of Thought، Prompt Injection
- **تقني:** API، Prompt Caching
- **منصات:** ChatGPT، Claude، Gemini

### 4.4 أنواع كتل المحتوى (Content Block Types)
- `image` — رسوم توضيحية ولقطات شاشة
- `text` — نص سردي وشروحات
- `card` — مفاهيم أساسية في بطاقات
- `code` — أمثلة أوامر ونصوص برمجية
- `carousel` — محتوى دوار
- `exercise` — تحديات تفاعلية
- `quiz` — أسئلة اختيار من متعدد
- `fill_blank` — ملء الفراغات
- `prompt_builder` — بناء أوامر تفاعلي

---

## 5. نظام Gamification الكامل

### 5.1 النقاط والمستويات
- نظام XP تراكمي (5 إلى 1000 نقطة لكل مهمة)
- المستويات تتطلب 100 نقطة إضافية لكل مستوى
- RPC دالة `add_points()` و`update_gamification_atomic()`

### 5.2 الشارات (50+ Badge)
| الفئة | العدد | أمثلة |
|-------|-------|-------|
| **reading** | 5 | أول فصل (50 XP)، نصف الكتاب (200 XP)، التخرج (500 XP) |
| **exercises** | 6 | أول تمرين → سيد التمارين |
| **streak** | 5 | 3 أيام → 100 يوم (1000 XP) |
| **special** | 8 | Early bird، Night owl، نقاط |
| **missions** | 7 | مشاريع + تحديات المستشفى |
| **notes** | 4 | تقدم في تدوين الملاحظات |
| **social** | 3 | مشاركة الإنجازات |

### 5.3 الـ Streak (سلسلة القراءة)
- تتبع يومي للقراءة
- تذكيرات بريدية عند الانقطاع
- شارات عند 3, 7, 14, 30, 100 يوم

### 5.4 المهام اليومية (Daily Missions)
- 3 مهام يومية لكل مستخدم (قراءة + تمرين + تفاعل)
- نقاط إضافية عند إتمام الثلاثة
- مكونات: DailyMissionsWidget, MissionCompleteToast, AllClearCelebration

### 5.5 تحدي 7 أيام (7-Day Challenge)
| اليوم | العنوان | النقاط | الشارة |
|-------|---------|--------|--------|
| 1 | أول برومبت احترافي (GOLDS) | 50 | 🌱 |
| 2 | خلي AI يكتب (3 منشورات) | 75 | ✍️ |
| 3 | صمم بدون مصمم (3 صور AI) | 75 | 🎨 |
| 4 | حلل بيانات في دقائق | 100 | 📊 |
| 5 | اتكلم زي المحترفين (3 سلاسل) | 100 | ⛓️ |
| 6 | بحث بالوكيل الذكي | 100 | 🔍 |
| 7 | أول دخل (عرض freelance) | 200 | 🏆 |
| **المجموع** | | **700 XP** | **7 شارات** |

### 5.6 قائمة المتصدرين (Leaderboard)
- VIEW في قاعدة البيانات يجمع total_points, level, streak, badges
- ترتيب حسب النقاط
- صفحة `/leaderboard` (تتطلب Pro+)

### 5.7 الشهادة (Certificate)
- تُصدر عند إكمال 9 فصول + الاسم الكامل (3 أجزاء)
- معرف فريد (certificate_id)
- قابلة للمشاركة عبر `/certificate/[id]`
- تُنشأ كصورة عبر html2canvas

---

## 6. التمارين التفاعلية (Interactive Exercises)

### أنواع التمارين
| النوع | النقاط | الوصف |
|-------|--------|-------|
| **Quiz** (اختيار من متعدد) | 10 | أسئلة مع خيارات متعددة |
| **Fill-in-blank** (ملء الفراغات) | 15 | مفاهيم ومصطلحات |
| **Prompt Builder** (بناء أوامر) | 20-25 | بناء أمر كامل من أجزاء |

### توزيع التمارين
- **الوحدة 1:** 5 أسئلة quiz عن أساسيات AI
- **الوحدة 2:** 3 quiz + 1 fill-blank + 1 prompt_builder
- **الوحدة 3:** تمارين إطار GOLDS
- **الوحدة 4:** تمارين تسلسل الأوامر
- **الوحدة 5:** تمارين ضمان الجودة
- **الوحدة 6:** تمارين متعددة الوسائط

### مكونات التمارين
- QuizQuestion.tsx — أسئلة الاختيار
- FillInBlank.tsx — ملء الفراغات
- PromptBuilder.tsx — بناء الأوامر
- ProgressDashboard.tsx — لوحة التقدم

---

## 7. أدوات الـ Prompt (Tools)

| الأداة | الوصف |
|--------|-------|
| **PromptAnalyzer** | تحليل جودة الأمر مع تقييم رقمي |
| **PromptGenerator** | مولد أوامر بالذكاء الاصطناعي |
| **PromptDiagnoser** | تشخيص وإصلاح الأوامر الضعيفة |
| **PromptChallenges** | تحديات كتابة الأوامر |
| **ResponseComparator** | مقارنة ردود النماذج المختلفة |
| **RunningProjectHub** | مساحة عمل لمشروع تطبيقي حقيقي |

---

## 8. المساعد الذكي (AI Chat)

### الميزات
- متعدد النماذج: GPT-4o Mini, Gemini 2.0 Flash, Groq
- نظام RAG: يبحث في محتوى الكتاب لتقديم إجابات سياقية
- Fuse.js مع تطبيع عربي (حمزة، تاء مربوطة، تشكيل)
- سجل محادثات محفوظ في Supabase
- نظام تقييم الردود (👍/👎)
- متاح فقط لخطة VIP

### المكونات
- ChatButton.tsx — زر عائم لفتح المحادثة
- ChatWindow.tsx — نافذة المحادثة الكاملة
- ChatMessage.tsx — فقاعة رسالة فردية

---

## 9. نظام البريد الإلكتروني (Email System)

### أنواع الرسائل
| النوع | الوصف |
|-------|-------|
| **تذكير Streak** | تذكير عند انقطاع سلسلة القراءة |
| **إنجاز (Milestone)** | إشعار عند تحقيق إنجاز |
| **حملة الترقية (Upgrade Drip)** | 6 مراحل: يوم 1, 3, 5, 7, 10, 14 بعد التسجيل |
| **استرداد السلة (Cart Recovery)** | 3 مراحل: 1 ساعة, 24 ساعة, 72 ساعة بعد زيارة صفحة الدفع |
| **ملخص أسبوعي** | | 

### Cron Jobs
- `/api/cron/send-reminders` — تذكيرات يومية
- `/api/cron/upgrade-drip` — حملة الترقية
- `/api/cron/cart-recovery` — استرداد السلة
- `/api/cron/check-expired` — فحص الاشتراكات المنتهية

### تفضيلات البريد
- المستخدم يتحكم في: التذكيرات، المهام، الإنجازات، الملخص الأسبوعي، رسائل الترقية، استرداد السلة
- رابط إلغاء الاشتراك في كل رسالة
- صفحة `/unsubscribe` مخصصة

---

## 10. نظام المصادقة والأمان (Auth & Security)

### تدفق المصادقة
1. المستخدم يسجل عبر email/password أو Google OAuth
2. يتم إنشاء حساب في Firebase + Supabase
3. رمز تحقق يُرسل بالبريد (6 أرقام)
4. بعد التحقق يُنشأ session token
5. الجلسة تُخزن كـ cookie (`ebook_session_token`, `ebook_user_id`)
6. بصمة الجهاز تُسجل (حد أقصى 3 أجهزة)

### حماية المسارات (Middleware)
- **Edge Runtime** — يعمل على الحافة (edge)
- **Fail-closed** — يرفض الوصول عند الخطأ
- يتحقق من: cookie → subscription → features
- تحقق من مسارات إعادة التوجيه ضد قائمة مسموحة (anti-open-redirect)
- يمنع `//`, أحرف مشفرة، مسارات غير مسموحة

### أمان API
- Rate limiting لكل endpoint (Upstash Redis + in-memory fallback)
- Input sanitization (email, phone, name, password)
- Zod validation
- HMAC verification لـ Kashier webhooks
- Password hashing بـ bcrypt (12 rounds) مع ترحيل SHA-256 القديم
- حد أقصى 128 حرف لكلمة المرور

### أمان قاعدة البيانات
- RLS مُفعل على كل الجداول
- RLS معطل للجداول المستخدمة عبر API (الوصول فقط عبر service_role)
- `is_admin()` function تعود دائماً بـ false (الإدارة عبر API فقط)
- audit log لعمليات الإدارة

### Security Headers (next.config.js)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- HSTS (سنة واحدة)
- Permissions-Policy (كاميرا/مايك/GPS معطلة)
- CSP مقيد

---

## 11. مسارات التعلم (Learning Paths)

### 3 مسارات
| المسار | الأقسام | الصفحات | الساعات | التمارين |
|--------|---------|---------|---------|----------|
| **سريع** ⚡ | intro + 1-2 | ~30 | 4 | 5 |
| **متوسط** 📘 | intro + 1-6 | ~80 | 12 | 20 |
| **شامل** 🏆 | intro + 1-10 | ~175 | 20 | 40 |

### 5 تخصصات
| التخصص | المثال السريع |
|--------|--------------|
| 💻 **برمجة** | كتابة دالة JavaScript مع تعليقات |
| 🛒 **تجارة إلكترونية** | وصف منتج ساعات ذكية |
| 🎨 **تصميم** | لوحة ألوان لماركة قهوة مصرية |
| 📣 **تسويق** | خطة محتوى Instagram لمطعم |
| 🌐 **عام** | تلخيص تقرير في 5 نقاط |

### 4 أهداف تعلم
- تطوير مهني
- ريادة أعمال
- تغيير مسار مهني
- فضول ومعرفة

### 5 مدد زمنية
- أسبوع واحد
- أسبوعين
- شهر واحد
- شهرين
- مرن

### نظام Onboarding
صفحة `/onboarding` تجمع:
1. الهدف + التخصص (StepGoalAndSpec)
2. المسار + المدة (StepPathAndDuration)
3. تجربة سريعة (QuickWin)

ثم يولد خطة تعلم شخصية في `/my-plan`

---

## 12. المدونة (Blog)

### 3+ مقالات SEO
| المقال | الفئة | زمن القراءة |
|--------|-------|-------------|
| "5 أخطاء يقع فيها الجميع مع ChatGPT" | ⚠️ أخطاء | 6 دقائق |
| "اكتب إيميل احترافي في 30 ثانية" | 📖 شرح | - |
| "أوامر ضعيفة vs قوية (مع أمثلة)" | 💡 نصائح | - |

### SEO
- Static generation (SSG) لكل المقالات
- Open Graph + structured data
- صفحة `/blog` مع BlogCard components
- CTA داخل كل مقال

---

## 13. صفحات الهبوط والتسويق (Landing & Marketing)

### مكونات الصفحة الرئيسية (بالترتيب)
1. **PromoBanner** — بانر عرض مع عداد تنازلي
2. **HeroSection** — عنوان رئيسي + CTA + إثبات اجتماعي
3. **PainPointsSection** — نقاط الألم (لماذا تحتاج مهارات AI)
4. **WhatYouLearn** — ماذا ستتعلم
5. **BookContentsSection** — معاينة جدول المحتويات
6. **TargetAudience** — الجمهور المستهدف
7. **CaseStudies** — 4 قصص نجاح حقيقية
8. **GamificationSection** — عرض ميزات الـ gamification
9. **CertificatePreview** — معاينة الشهادة
10. **CompetitorComparison** — جدول مقارنة مع المنافسين
11. **Testimonials** — تقييمات المستخدمين
12. **PricingSection** — عرض الخطط الثلاثة
13. **FAQSection** — الأسئلة الشائعة
14. **FinalCTA** — دعوة أخيرة للعمل
15. **LeadMagnetModal** — نافذة التقاط البريد

### نظام العروض (Promo)
- أكواد خصم (نسبة مئوية أو مبلغ ثابت)
- حد أقصى للاستخدام
- تاريخ انتهاء
- تقييد حسب الخطة
- إدارة كاملة من لوحة الإدارة

---

## 14. لوحة الإدارة (Admin Dashboard)

### صفحات الإدارة
| المسار | الوظيفة |
|--------|---------|
| `/billing/admin/dashboard` | إحصائيات شاملة (مستخدمين، إيرادات، اشتراكات) |
| `/billing/admin/subscriptions` | عرض/تعديل/إلغاء/تمديد الاشتراكات |
| `/billing/admin/plans` | إدارة الخطط والأسعار |
| `/billing/admin/promos` | إنشاء وإدارة أكواد الخصم |
| `/billing/admin/site-stats` | إحصائيات مفصلة |
| `/billing/admin/testimonials` | إضافة/تعديل/حذف التقييمات |
| `/billing/admin/chat` | مراقبة المحادثات |

### Admin Audit Log
- كل عملية إدارية تُسجل في `admin_audit_log`
- الأنشطة: extend, cancel, create, refund, update
- يُسجل: admin_user_id, target_user_id, IP, details

---

## 15. قاعدة البيانات (Database Schema)

### جميع الجداول (37+ جدول)

#### جداول المستخدمين
| الجدول | الوصف |
|--------|-------|
| `users` | بيانات المستخدمين الأساسية |
| `devices` | أجهزة المستخدمين المسجلة |
| `sessions` | جلسات المستخدمين |
| `verification_codes` | رموز التحقق |
| `admin_sessions` | جلسات الإدارة |

#### جداول القراءة والمحتوى
| الجدول | الوصف |
|--------|-------|
| `reading_progress` | تقدم القراءة (current_page, completed_chapters, completion_percentage) |
| `bookmarks` | الإشارات المرجعية |
| `user_notes` | ملاحظات المستخدم (مع highlight_color: orange/yellow/green/blue/purple) |

#### جداول التمارين
| الجدول | الوصف |
|--------|-------|
| `exercise_progress` | تقدم التمارين (quiz/fill_blank/prompt_builder) |
| `user_exercise_stats` | إحصائيات تمارين تراكمية |

#### جداول Gamification
| الجدول | الوصف |
|--------|-------|
| `user_gamification` | نقاط، مستوى، streak، إحصائيات |
| `badges` | تعريف الشارات (50+) |
| `user_badges` | شارات المستخدم |
| `points_history` | سجل النقاط |
| `user_achievements` | إنجازات المستخدم |
| `user_certificates` | شهادات الإتمام |
| `user_claimed_rewards` | المكافآت المطالب بها |
| `mission_templates` | قوالب المهام اليومية |
| `user_daily_missions` | مهام المستخدم اليومية |

#### جداول الدفع والاشتراك
| الجدول | الوصف |
|--------|-------|
| `payments` | عمليات الدفع (Kashier) |
| `payment_intents` | نوايا الدفع (لاسترداد السلة) |
| `subscriptions` | الاشتراكات (basic/pro/vip, active/expired/cancelled/upgraded) |
| `plans` | تعريف الخطط |
| `plan_features` | ميزات كل خطة |
| `promo_codes` | أكواد الخصم |
| `promo_code_uses` | استخدامات الأكواد |

#### جداول التعلم
| الجدول | الوصف |
|--------|-------|
| `user_learning_preferences` | تفضيلات التعلم (هدف، تخصص، مسار، مدة) |
| `learning_plan_tasks` | مهام خطة التعلم اليومية |
| `learning_plan_summary` | ملخص خطة التعلم |
| `learning_resources` | مصادر التعلم |
| `user_saved_resources` | المصادر المحفوظة |

#### جداول المحادثة
| الجدول | الوصف |
|--------|-------|
| `chat_messages` | رسائل المحادثة |
| `chat_ratings` | تقييمات الردود |

#### جداول التسويق
| الجدول | الوصف |
|--------|-------|
| `testimonials` | التقييمات |
| `site_settings` | إعدادات الموقع |
| `certificates` | شهادات عامة |
| `lead_magnet_subscribers` | مشتركين الـ lead magnet |
| `email_preferences` | تفضيلات البريد |
| `email_log` | سجل الرسائل المرسلة |
| `ai_changelog` | تحديثات AI |

#### جداول الإدارة
| الجدول | الوصف |
|--------|-------|
| `admin_audit_log` | سجل عمليات الإدارة |

### RPC Functions المهمة (27 دالة)
- `get_user_plan(user_id)` — جلب خطة المستخدم
- `user_has_feature(user_id, feature)` — التحقق من ميزة
- `add_points(user_id, points, action_type, details)` — إضافة نقاط
- `update_user_streak(user_id)` — تحديث الـ streak
- `check_and_award_badges(user_id)` — فحص ومنح شارات
- `check_and_unlock_achievements(user_id)` — فتح إنجازات
- `generate_certificate(user_id)` — إنشاء شهادة
- `update_gamification_atomic(user_id, points, action)` — تحديث gamification ذري
- `update_exercise_stats_atomic(user_id, type, correct, points)` — تحديث إحصائيات ذري
- `try_use_promo_code(...)` — استخدام كود خصم ذري
- `has_successful_payment(user_id)` — التحقق من دفع ناجح

---

## 16. كل المكونات (All Components — 66 file)

### Landing (17 مكون)
HeroSection, PainPointsSection, WhatYouLearn, BookContentsSection, TargetAudience, CaseStudies, GamificationSection, CertificatePreview, CompetitorComparison, Testimonials, PricingSection, FAQSection, FinalCTA, LeadMagnetModal, PromoBanner, UnifiedBackground, index.ts

### Reading (18 مكون)
SectionPage, ReadingPagination, ScrollProgress, FontSizeControl, BookmarkButton, BackToTop, CopyButton, ChapterRecap, QuickRecapButton, RecapCard, LockedOverlay, GlossaryModal, GlossaryTerm, HighlightRenderer, TextHighlighter, NotesSidebar, KnowledgeCardView, SpecializationExamples

### Exercises (4 مكون)
FillInBlank, ProgressDashboard, PromptBuilder, QuizQuestion

### Gamification (2 مكون)
StreakBanner, StreakNotification

### Missions (3 مكون)
DailyMissionsWidget, MissionCompleteToast, AllClearCelebration

### Tools (6 مكون)
PromptAnalyzer, PromptGenerator, PromptDiagnoser, PromptChallenges, ResponseComparator, RunningProjectHub

### Chat (3 مكون)
ChatButton, ChatWindow, ChatMessage

### Auth (2 مكون)
AuthCard, AuthInput

### Blog (2 مكون)
BlogCard, BlogCTA

### Onboarding (4 مكون)
ProgressIndicator, QuickWin, StepGoalAndSpec, StepPathAndDuration

### Plan (2 مكون)
DailyTaskCard, PathProgressBar

### Sharing (3 مكون)
ShareButton, ShareCardPreview, ShareCardRenderer

### Resources (2 مكون)
ResourceCard, ResourceFilters

### Achievements (1 مكون)
Certificate

### Root (14 مكون)
Navigation, BackgroundParticles, ClientErrorBoundary, ErrorBoundary, FeatureGate, FloatingAssets, GuestBanner, ProgressCircle, ReferralWidget, RoadmapPath, Robot, SearchDialog, SubscriptionGateModal

---

## 17. المكتبات والخدمات (Libraries — 36 file in src/lib/)

### Database
- `supabase.ts` — Client-side Supabase client
- `supabase-admin.ts` — Server-side admin client (service_role)
- `supabase_proxy.ts` — Client→API→Supabase proxy
- `database.types.ts` — Auto-generated TypeScript types

### Auth
- `firebase_client.ts` — Firebase client SDK
- `firebase_admin.ts` — Firebase Admin SDK (token verification)
- `firebase_auth_middleware.ts` — Server-side auth middleware
- `google_auth.ts` — Google OAuth flow
- `auth.ts` — Client-side session check
- `auth-middleware.ts` — Server-side auth + subscription check
- `auth_system.ts` — Full auth: register, login, logout, session, device limit, bcrypt

### Payment
- `kashier.ts` — Kashier gateway integration

### Features
- `subscription.ts` — Multi-strategy subscription lookup
- `features.ts` — Plan-to-feature mapping (single source of truth)
- `promo.ts` — Promotional system with Zod validation

### Gamification
- `gamification.ts` — XP + level update
- `missions.ts` — Daily mission generation + tracking

### Email
- `email.ts` — Resend email service (Arabic HTML templates)
- `upgrade-emails.ts` — 6-stage upgrade drip campaign
- `cart-recovery.ts` — 3-stage cart abandonment recovery

### Learning
- `learning-plan.ts` — Personalized daily plan generation
- `learning-preferences.ts` — Preferences CRUD

### Content
- `chat-context.ts` — RAG context retrieval
- `certificates.ts` — Certificate lookup
- `testimonials.ts` — CRUD for testimonials

### Security
- `password.ts` — bcrypt hashing + SHA-256 legacy migration
- `rate-limit.ts` — Dual rate limiting (Redis + in-memory)
- `sanitize.ts` — Input sanitization
- `validation.ts` — Zod validation

### Utility
- `fingerprint.ts` — Device fingerprinting (SHA-256)
- `cookie_utils.ts` — Cookie management
- `analytics.ts` — GA4 event tracking
- `arabic-normalize.ts` — Arabic text normalization
- `logger.ts` — Prefixed logger instances
- `config.ts` — Central configuration
- `exerciseScoring.ts` — Prompt scoring system

---

## 18. Hooks و Utils و Types

### Custom Hooks (1)
- `useReducedMotion.ts` — كشف `prefers-reduced-motion`

### Utils (3)
- `readingTime.ts` — حساب وقت القراءة (180 كلمة/دقيقة عربي)
- `searchIndex.ts` — بناء فهرس بحث Fuse.js
- `textFormatting.ts` — تنسيق نص غني (روابط تلقائية، تمييز أسماء شخصيات، bold, مسرد)

### Context Providers (2)
- `SubscriptionContext.tsx` — حالة الاشتراك على مستوى التطبيق
- `LearningContext.tsx` — تفضيلات التعلم على مستوى التطبيق

### Type Definitions (3)
- `book.ts` — `PageContent`, `ContentBlock` types
- `learning.ts` — Learning paths, specializations, goals, durations
- `subscription.ts` — Plans (basic/pro/vip), features (12 key), statuses

---

## 19. البنية التحتية (Infrastructure)

### Environment Variables المطلوبة
| المتغير | الاستخدام |
|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config (6 vars) |
| `FIREBASE_ADMIN_*` | Firebase Admin SDK (3 vars) |
| `KASHIER_API_KEY` | Kashier payment |
| `KASHIER_MERCHANT_ID` | Kashier merchant |
| `KASHIER_WEBHOOK_SECRET` | Webhook HMAC |
| `OPENAI_API_KEY` | GPT-4o Mini |
| `GEMINI_API_KEY` | Google Gemini |
| `GROQ_API_KEY` | Groq |
| `RESEND_API_KEY` | Email service |
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `ADMIN_PASSWORD` | Admin dashboard |
| `GA_MEASUREMENT_ID` | Google Analytics |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp support |
| `CRON_SECRET` | Cron job authentication |

### Vercel Configuration (vercel.json)
- Cron jobs مجدولة
- Region configuration
- Build settings

### Scripts
| الملف | الوظيفة |
|--------|---------|
| `scripts/generate-pdf.cjs` | إنشاء PDF من الكتاب (Puppeteer) |
| `scripts/migrate_plan.cjs` | ترحيل خطط الاشتراك |
| `scripts/run_phase1_migrations.mjs` | تشغيل ترحيلات المرحلة 1 |
| `scripts/debug-env.js` | فحص متغيرات البيئة |

---

## 20. ملخص الأرقام (Summary Stats)

| الفئة | العدد |
|-------|-------|
| **صفحات الموقع** | 52+ route |
| **مسارات API** | 59+ endpoint |
| **مكونات React** | 66 component |
| **مكتبات/خدمات** | 36 file |
| **جداول قاعدة البيانات** | 37+ table |
| **RPC Functions** | 27 function |
| **RLS Policies** | 50+ policy |
| **Triggers** | 10 trigger |
| **ملفات بيانات** | 24 data file |
| **وحدات الكتاب** | 10 units + intro + glossary + appendix + library |
| **صفحات الكتاب** | ~175 page |
| **شارات** | 50+ badge |
| **تمارين** | 40+ exercise |
| **مقالات مدونة** | 3+ post |
| **Dependencies (prod)** | 17 |
| **Dependencies (dev)** | 12 |

---

## 21. الميزات المضافة حديثاً (Recent Features)

### 1. زر واتساب في صفحة الدفع
- رقم: 201029010778
- رابط: `wa.me/201029010778`
- ملف: `src/app/payment/page.tsx`

### 2. تحديث Bio/Positioning
- عنوان Hero محدث
- وصف محدث في `layout.tsx` و `HeroSection.tsx`

### 3. محتوى "اربح فلوس بالذكاء الاصطناعي" (5 صفحات)
- ملف: `src/data/unit10Data.ts` (صفحات 11-15)

### 4. محتوى فيديو AI (صفحتان)
- ملف: `src/data/unit6Data.ts` (صفحات 17-18)

### 5. نظام تحدي 7 أيام
- ملفات: `src/data/challengeData.ts`, `src/app/challenge/page.tsx`

### 6. قصص نجاح (Case Studies)
- ملف: `src/components/landing/CaseStudies.tsx`
- 4 قصص نجاح حقيقية

---

*نهاية التقرير — تم إنشاؤه تلقائياً من فحص شامل للكود المصدري*
