# خطة الإصلاح الكاملة لـ PromptMaster — مع تحقق عدائي لكل إصلاح

> ملاحظة للمنفّذ: جذر المستودع هو `e:/prompt-mr/new-book/book2`. كل المسارات أدناه نسبية لهذا الجذر (مثلاً `src/...`)، ما عدا `middleware.ts` و`next.config.js` و`vercel.json` و`.env.local` فهي في الجذر مباشرةً. الأرقام في `ملف:سطر` تم التحقق منها على الكود الحيّ.

---

## ملخص تنفيذي

**السبب الجذري لصفر المبيعات:** الكتاب المدفوع يُشحَن كاملاً إلى متصفّح كل زائر ويُخفى بـ CSS فقط (لا سبب للدفع)، وكل زر دعوة-للفعل رئيسي يدفع نحو القراءة المجانية ولا يصل التسجيل أبداً إلى صفحة الدفع — فالقمع لا يطلب المال إطلاقاً؛ يُضاف لذلك تضارب الأسعار (المعروض ≠ المخصوم) وانعدام أي مصداقية وتتبّع تحويل معطوب.

**تأكيد أن الدفع نفسه يعمل:** المسار السعيد للدفع يعمل end-to-end — Kashier يخصم المال فعلاً و`users.is_active` تصبح `true` على الأقل في مسار سطح المكتب السعيد (مؤكَّد من المالك). لذلك **المشكلة ليست في الدفع**؛ كل ما يخص "صلابة مسار المال" هنا هو تحصين للحالات الحدّية (إغلاق تبويب الجوال، عدم وصول webhook، مسارات تفعيل بديلة) كي لا نخسر عميلاً دافعاً عند التوسّع — مهم، لكنه ليس سبب صفر المبيعات.

**ترتيب التنفيذ الموصى به (حسب أثر الإيراد):**
- **P0 (هذا الأسبوع):** WS1 الـ paywall على الخادم · WS2 توحيد السعر · WS3 قمع يطلب البيع · WS7 إصلاح أعطال إرسال البريد (السلّة/الترقية لا تُرسَل لأحد).
- **P1 (أسبوعان):** WS4 المصداقية والصفحات القانونية · WS5 توحيد الدومين · WS6 تتبّع التحويل قبل صرف أي إعلان · WS8 تحصين مسار المال.
- **P2 (شهر):** WS9 سرعة الجوال و SSR والاكتشاف العضوي.

> تبعية إطلاق الإعلانات: **لا يُصرَف أول جنيه على الإعلانات قبل اكتمال WS1 + WS2 + WS3 + WS6** (لأن الإعلان بلا paywall وبلا سعر موحّد وبلا تتبّع تحويل سليم = حرق ميزانية بلا تعلّم خوارزمي).

---

## القرارات المعتمدة (مُقفلة — 2026-06-16)

| القرار | المعتمد | الانعكاس على التنفيذ |
|--------|---------|----------------------|
| **الدومين الكنسي** | `https://www.prompt-mr.com` | WS5 يبني كل URL منه. مهامك على اللوحات: ربط الدومين في Vercel (301 من apex+vercel)، تحديث Kashier redirect/webhook، توثيق Resend (SPF/DKIM/DMARC)، إضافته لـ Firebase Authorized Domains. |
| **التحكم بالسعر** | **لوحة الأدمن (DB-controlled)** | **يغيّر WS2:** مصدر الحقيقة الوحيد = جدول `plans`. `create-session/route.ts` يقرأ السعر من `plans` بدل التثبيت (فيتطابق المخصوم مع المعروض ومع تعديل الأدمن). كل الواجهات تقرأ من نفس الجدول. أعِد بذر `plans` + `site_settings` إلى 99/199/399. لا "طغيان كود". الحارس يصبح **اختبار تكامل** (المعروض == ما يخصمه create-session) + grep يمنع أي سعر مثبّت. |
| **المحتوى المجاني** | مقدمة + **فصل 1 كامل فقط** (~23 صفحة) | في `src/config/sections.ts`: أبقِ intro=0(حر) و section-1=17؛ **اضبط section-2..section-10 freePageLimit=0**. الفصول المتقدمة (GOLDS/الوكلاء/RAG/الربح) كلها خلف الجدار. |
| **الضمان** | يُبقى + سياسة حقيقية | WS4 ينشئ `/refund-policy` بمدة 30 يوم + مسار طلب استرجاع، وكل ذكر للضمان يُربط بها. |
| **الأرقام القانونية** | **95 قالب · 48 تمرين · ~23 صفحة مجانية** | تُعتمد في كل سطح (حُسمت نقطة التضارب في WS2). إجمالي صفحات القراءة يُثبَّت رقماً واحداً وقت التنفيذ. |

> **AI56 مع التسعير من اللوحة:** بما أن الأدمن قد يغيّر سعر basic، فالخصم الثابت 94 هشّ. القرار التنفيذي: اجعل AI56 يهبط بالسعر النهائي إلى **5 ج.م ديناميكياً** (الخصم = سعر basic الحالي − 5)، فيبقى العرض "5 ج.م" صحيحاً مهما عدّل الأدمن السعر.

> **عنصر مُعتمد:** كود `COMEBACK10` في بريد السلة → **يُحذف** ويُربط `/payment` مباشرة (ما لم تطلب خصم "عودة" لاحقاً). شهادات/هوية المؤسّس تُجمَع لـ WS4 (الأسبوع الثاني) ولا تحبس بدء P0.

---

# الورش

---

## WS1 — Paywall حقيقي على الخادم (إعطاء الناس سبباً للدفع) — **P0**

- **الهدف (متى نقول "تم الإصلاح بالكامل"):** المحتوى المدفوع لا يصل أبداً إلى متصفّح غير مصرّح له. كل صفحة مقفولة تُجلَب من مسار خادم يتحقق من الجلسة + الدفع server-side، يعيد الصفحات المجانية فقط للضيوف، ويعيد **402 بلا جسم النص** للصفحات المقفولة — فيكون المحتوى المدفوع غائباً فيزيائياً عن الاستجابة الشبكية وعن حزمة JS. **هذا يشمل كل الأسطح المدفوعة:** الفصول، التخصص (`SpecializationExamples`)، المسرد (glossary)، الملحق (appendix)، المكتبة (library)، والبحث.

- **الوضع الحالي (الكود الآن):**
  - الكتاب الكامل يُشحَن للمتصفّح: كل مسار قسم `'use client'` يستورد بيانات وحدته كاملة، مثل `src/app/read/section-2/[page]/page.tsx:4` ثم يمرّرها كـ `data`.
  - القفل CSS فقط: `src/components/reading/SectionPage.tsx:889-891` يطبّق `blur(8px)/pointerEvents:none/opacity:0.3` بينما `contentBlocks` لا تزال مرسومة في DOM عند `:926-1255`.
  - فشل-مفتوح: `SectionPage.tsx:75` `useState(true)` (تفاؤلي) و`.catch` عند `:187-189` يُبقي `hasPaid=true` عند أي خطأ شبكة/تحقق.
  - `middleware.ts:137` يعتبر `/read/*` و`/api/*` عامّاً؛ لا يحمي القراءة.
  - **تسريبات إضافية وجدها الفريق العدائي:** `src/components/reading/SpecializationExamples.tsx:6` يستورد 60 مثالاً + 20 تمريناً مدفوعاً وتُرسَم في آخر صفحة من كل قسم بشرط `isLastPage && !isCurrentPageLocked` فقط (لا على `hasPaid`)؛ `src/app/read/glossary/[page]/page.tsx:7` و`src/app/read/appendix/[page]/page.tsx:8` يستوردان البيانات كاملة مع قفل-بـ-blur على أساس `!isAuthed` فقط؛ `src/app/library/[page]/page.tsx:7` بوّابة دخول لا paywall؛ `src/utils/searchIndex.ts:50-66` يجلب كل الوحدات client-side؛ `src/data/recapsData.ts` يسرّب `keyQuote`/`keyTakeaways`.
  - بدائيات الخادم الصحيحة الموجودة للبناء عليها: `src/lib/supabase-admin.ts` `getSupabaseAdmin()`، و`src/app/api/auth/verify-session/route.ts` يقرأ كوكيز `ebook_session_token`/`ebook_user_id` ويحسب `hasPaid`.

- **خطوات الإصلاح (محصّنة — تدمج ما طلبه الفريق العدائي):**
  1. **`NEW src/lib/server/access.ts`** — `getServerAccess(): Promise<{userId, sessionValid, hasPaid}>`. ينسخ منطق `verify-session/route.ts:27-60` للتحقق من صف الجلسة، و`:76-113` لحساب `hasPaid` من ثلاثة مصادر. **تحصين عدائي إلزامي:** أضِف `users.is_active=true` (مع `plan_expires_at` إن وُجد) كمصدر رابع لـ `hasPaid`؛ هذا يمنع قفل عميل دافع فعلاً في حالة فشل كتابة `current_plan` أو تأخّر webhook (الحقل الذي يؤكّد المالك أن التفعيل يقلبه). اجعل `verify-session` نفسه يستدعي `getServerAccess` لمنع الانحراف (مع الحفاظ على سلوك تجديد كوكي الجلسة في `route.ts:62-145`).
  2. **`NEW src/data/server/sectionContent.ts`** — يبدأ بـ `import 'server-only'`. يصدّر `SECTION_DATA: Record<string, PageContent[]>` يربط `intro/section-1..10/library/**glossary/**appendix`. **تحصين:** أضِف `glossary` و`appendix` صراحةً (الفريق العدائي أثبت إغفالهما) — كل منهما إمّا مدفوع (يُضاف للسجل) أو مجاني صراحةً موثّق؛ في الحالتين يُحذف الاستيراد الساكن من ملف المسار. اشتقّ `freePageLimit` من `SECTION_REGISTRY` (مصدر واحد).
  3. **`NEW src/app/api/content/[sectionId]/[page]/route.ts`** — GET. يحسب `isFreePage` (`intro` دائماً مجاني؛ غيره `page <= freePageLimit`). مجاني → 200+جسم بغضّ النظر عن المصادقة. غير مجاني → `getServerAccess()`: `!sessionValid` → 401؛ `sessionValid && !hasPaid` → **402 بلا جسم**؛ `hasPaid` → 200+جسم. `library/glossary/appendix` المدفوعة تُعامَل بـ `freePageLimit=0`. رؤوس `Cache-Control: private, no-store`. حارس معدّل بسيط من `src/lib/rate-limit`. هذا هو **المسار الوحيد** الذي يصل به جسم صفحة مدفوعة للمتصفّح.
  4. **تحويل `SectionPage.tsx`** ليجلب الصفحة من الـ API بدل استلام الوحدة كاملة: احذف الـ prop `data` (`:64-67`)، أضِف حالة `page/locked/lockReason/loading/totalPages`. في `useEffect` على `[pageNum]`: `fetch('/api/content/${config.id}/${pageNum}', {credentials:'include'})`. عند القفل ارسم `LockedOverlay` فقط و**لا ترسم `contentBlocks` إطلاقاً** (استبدل كتلة blur في `:889-892`). احذف `hasPaid=true` التفاؤلي (`:75`) و`catch` الفاشل-مفتوح (`:187-189`) — الافتراض **فشل-مغلق**. حدّث كل ملفات `src/app/read/section-*/[page]/page.tsx` لتمرّر `config` فقط دون استيراد `unitNData`.
  5. **التخصص (سدّ التسريب الذي أغفله التصميم):** انقل أمثلة التخصص خلف الخادم — `src/components/reading/SpecializationExamples.tsx:6` يُزال استيراده الساكن، ويُجلَب عبر مسار خادم (نفس `/api/content` أو `/api/spec`) يستدعي `getServerAccess` ويعيد الأمثلة فقط لصفحات مجانية أو مستخدمين دافعين. غيّر شرط الرسم في `SectionPage.tsx:1261-1263` ليعتمد على `hasPaid` لا على `!isCurrentPageLocked` فقط.
  6. **المكتبة:** `src/app/library/[page]/page.tsx` — احذف `import { libraryData }` (`:7`)، اجلب `/api/content/library/${pageNum}`، استبدل `isCurrentPageLocked = !isAuthed` (`:33`) بعلم `locked` من الخادم. المكتبة تتطلب `hasPaid` لا مجرّد `isAuthed`.
  7. **المسرد والملحق:** حوّل `read/glossary/[page]/page.tsx` و`read/appendix/[page]/page.tsx` لنمط جلب `/api/content/glossary|appendix/[page]` (أو علّمهما مجانيين صراحةً)؛ في الحالتين احذف الاستيراد الساكن وكتلة الـ blur.
  8. **البحث:** `src/utils/searchIndex.ts:50-91` — أزِل `await import('@/data/bookData')`؛ أنشئ `NEW src/app/api/search/route.ts` يبني الفهرس من `sectionContent.ts` ويعيد للزائر غير الدافع **عناوين/أوصاف الصفحات المقفولة فقط (بلا جسم)**. **تحصين:** يُمنَع شحن أي فهرس كامل-الجسم مبني مسبقاً إلى `public/` أو أي chunk؛ الفهرس per-request عبر `getServerAccess`.
  9. **`middleware.ts` كدفاع-بالعمق فقط:** أبقِ `/read/` و`/library` قابلين للوصول (الصفحات المجانية تحتاجها)؛ الحماية الحقيقية هي 402 من الـ API. اختيارياً اجعل `/library` `PROTECTED_ROUTE` يحوّل غير الدافع لـ `/payment`. **لا** تحجب `/read/*` كلياً (يكسر القمع المجاني).
  10. **حجم المعاينة المجانية (خطوة إلزامية لا توصية):** قلّل `section-1` من `freePageLimit:17` (الفصل كامل) إلى تشويق (مثلاً 5)، أو أبقِه واضبط النصوص. اجعل `LockedOverlay` يحسب العدد المجاني من `SECTION_REGISTRY` بدل التثبيت (`27` في `:175`، `188` في `:253`). **المجموع المجاني الحقيقي حالياً ≈ 51 صفحة** (intro 6 + s1 17 + s2 4 + s3-10 = 3×8=24) — مؤكَّد من `src/config/sections.ts`؛ أيّ رقم يُعرَض يجب أن يساوي هذا الحساب.

- **🔴 التحقق العدائي (إثبات اكتمال الإصلاح):**

  **محاولات التفاف يجب أن تفشل بعد الإصلاح:**
  - حساب مجاني يختار تخصصاً ثم يفتح آخر صفحة قسم → **يجب ألّا** تظهر أمثلة/مخرجات التخصص (اليوم تظهر).
  - فتح `/read/glossary/3` أو `/read/appendix/5` كزائر وحذف الـ blur من DevTools → **يجب ألّا** يظهر أي نص (اليوم يظهر).
  - حظر `/api/auth/verify-session` (offline/DevTools) على صفحة مقفولة → **يجب** أن تبقى مقفولة (لا فشل-مفتوح).
  - مستخدم `is_active=true` لكن بلا صف subscription/`current_plan` (محاكاة تأخّر webhook) → **يجب** أن يحصل على 200+جسم (لا قفل عميل دافع).

  **اختبارات عدائية محدّدة (خطوة بخطوة):**
  1. بلا كوكيز: `GET /api/content/section-3/4` → 402 وجسم JSON **خالٍ** من `contentBlocks`؛ `GET /api/content/section-3/1` → 200+جسم.
  2. بعد `npm run build`: `rg -F '<جملة مميّزة من unit3 صفحة مقفولة>' .next/static` = صفر؛ كرّر لـ **عبارة من `expectedOutput` في `specializationContent.ts`، ومن `glossaryData`، ومن `appendixData`، ومن `keyQuote` في `recapsData.ts`** + امسح `public/**` أيضاً. (شغّل نفس الـ grep على البناء الحالي أولاً لإثبات التسريب الحالي.)
  3. حساب جديد مجاني، تخصص مختار، `/read/section-4/<آخر صفحة>` → DOM لا يحوي أي `prompt/expectedOutput`.
  4. حساب مسجّل غير دافع: `/api/content/library/1` و`/api/content/glossary/1` و`/api/content/appendix/1` → 402 بلا جسم (أو 200 موثّق مجانياً بلا استيراد ساكن).
  5. `curl /api/content/section-1/17` بلا كوكيز → قرّر صراحةً إن كان مقبولاً (إذا أُبقي الفصل 1 مجانياً، أدرِجه في allowlist الـ grep بدقة).
  6. بحث بعبارة من صفحة مقفولة كغير دافع → بلا أي مقتطف جسم؛ ولا ملف فهرس في `public/` أو أي chunk.

  **معايير القبول المحصّنة:**
  - إثبات الحزمة يغطّي **كل** الأسطح المدفوعة (الوحدات + التخصص + المسرد + الملحق + recap)، صفر تطابق لكل عبارة مدفوعة، مع allowlist صريحة للمجاني (intro، والفصل 1 إن أُبقي مجانياً).
  - المسار السعيد للدافع غير متأثّر: `is_active=true`/دفع ناجح → 200+جسم.
  - فشل-مغلق: عند خطأ/مهلة في التحقق تظهر صفحة القفل.
  - **حارس CI** يُفشل البناء إذا ظهر كمستورِد client أيّ من: `from '@/data/bookData'`, `unit\dData`, `@/data/specializationContent`, `@/data/recapsData` (value import), `@/data/glossaryData` (value import) داخل ملف `'use client'` أو قابل للوصول من graph العميل (وحدات `server-only` مستثناة).
  - اختبارات مسار: 200+جسم للصفحة المجانية في كل حالات الوصول الثلاث؛ 402/401 للمقفولة بلا `page`؛ 404 لقسم/صفحة غير موجودة؛ واختبار صريح: `is_active=true` بلا subscription → 200.

- **مخاطر/انحدارات يجب مراقبتها:** جولة شبكة قبل ظهور المحتوى (خفّفها بـ skeleton + prefetch للصفحة التالية للدافعين؛ المجاني cacheable والمدفوع `no-store`)؛ `middleware` لا يستورد كود Node خادمي؛ الصفحات المجانية تبقى تعيد 200+جسم للزائر (SEO/قمع)؛ احذر مسارات بيانات ثانية مخفية (grep قبل الشحن)؛ refactor `verify-session` يحافظ على تجديد الكوكي؛ القصّ يجب أن يكون دفعة واحدة لكل المسارات الـ 11 + المكتبة + البحث + المسرد + الملحق وإلّا يبقى التسريب.

- **الجهد:** كبير.

---

## WS2 — مصدر واحد للحقيقة للسعر وإحصاءات المنتج (المعروض == المخصوم) — **P0**

- **الهدف:** كل سعر وكل إحصاء منتج معروض في أيّ مكان (الهبوط، paywall، صفحة الدفع، مودال البوابة، الملف الشخصي، الأدمن، الإيميلات، نسخ الإعلان، الميتاداتا) مشتقّ من **مصدر واحد** ويساوي ما يخصمه Kashier فعلاً (99/199/399)، وبروموكود AI56 يخصم بالضبط 5 ج.م، وكل إحصاء (تمارين/صفحات/قوالب/مجاني) موحّد ومطابق للواقع — حتى **في الترقية مع البرومو** وحتى عند تعديل أدمن وقت التشغيل.

- **الوضع الحالي:** الخادم موثوق وصحيح: `src/app/api/payment/create-session/route.ts:61-65` يخصم 99/199/399 والترقية = الفرق. لكن **9+ سلالم تخالفه:** `site_settings.pricing_plans` مزروع 299/699/1499؛ جدول `plans` مزروع 299/499/999 (`/api/admin/plans/route.ts:32-36` يعيده حرفياً ويرسمه `payment/page.tsx:406`)؛ `payment/page.tsx:50` `PLAN_PRICES={299,499,999}`؛ `SubscriptionGateModal.tsx:75,85,102`؛ `profile/subscription/page.tsx:25-29`؛ `billing/admin/dashboard/page.tsx:94-101` (تضخيم MRR ~3-5x)؛ `LockedOverlay.tsx:176`؛ `upgrade-emails.ts:147-148`. خطأ AI56 مؤكَّد: خصم ثابت 294 (افتراض basic=299) بينما الـ clamp يجعل النهائي 1 ج.م لا 5. الإحصاءات متناثرة (تمارين 45 معروض بينما الحقيقي 48؛ صفحات 89/143/188/215؛ مجاني "27").

- **خطوات الإصلاح (محصّنة):**
  1. **`NEW src/lib/pricing.ts`** — `PLAN_PRICES={basic:99,pro:199,vip:399}`, `PLAN_NAMES_AR`, `PLAN_ORDER`, `getPlanPrice`, `getUpgradeDiff`, و`PRODUCT_STATS={exercises:48,totalPages:215,readingPages:188,freePages:<محسوب>,templates:<مؤكَّد>,...}`, و`AI56_FINAL_PRICE=5`. آمن للاستيراد server+client.
  2. `create-session/route.ts:60-65,78-87` يستورد الثوابت بدل القيم المضمّنة (نفس المبالغ، يبقى المرساة).
  3. `NEW supabase/migrations/20260616_align_plan_prices.sql`: `UPDATE plans SET price=99/199/399`؛ وصلّح `site_settings.pricing_plans` بـ `jsonb_set`. حصّن GET في `/api/admin/plans/route.ts` ليطغى السعر من الكود: `price: getPlanPrice(p.id) || p.price`. صلّح بذور `create_plans_table.sql:35,43,53` و`supabase_landing_page.sql` ونصّ الميزة `143+ → 188+`. في `getPricingPlans()` (`promo.ts:192-210`) اطغَ `plan.price` من `PLAN_PRICES` بعد قراءة DB.
  4. **(تحصين عدائي إلزامي) أغلق مسار البرومو ومسار PUT:**
     - `src/app/api/promo/validate/route.ts:98-108` يقرأ `originalAmount` من جدول `plans` بلا وعي بالترقية (الجسم `{code, planId}` فقط) — **عدّله** ليقبل `isUpgrade + currentPlanId` ويحسب `original/final` على قاعدة الترقية `getPlanPrice(target)-getPlanPrice(current)` مرآةً لـ `create-session`. وإلّا في الترقية+البرومو يَعرض `payment/page.tsx:516-518` رقماً مخالفاً لما يُخصَم.
     - `src/app/api/admin/plans/[id]/route.ts:49,62-67` (PUT) يكتب `price` بلا حارس — اجعل السعر **مُتحكَّماً به من الكود**: ارفض/تجاهل `body.price`، واشتقّ كل أسعار الخادم (validate, create-session, admin GET) من `getPlanPrice()`. (قرّر مع المالك: code-controlled — موصى به — أو DB-controlled مع إسقاط الطغيان وإصلاح البذور والاعتماد على CI.)
  5. استبدل كل سلّم سعر client بالاستيراد من `pricing.ts`: `payment/page.tsx:49-50,384,493,514`؛ `SubscriptionGateModal.tsx:75,85,102`؛ `profile/subscription/page.tsx:25-29`؛ `billing/admin/dashboard/page.tsx:94-101`؛ `LockedOverlay.tsx:176`. فرق الترقية → `getUpgradeDiff(...)`.
  6. **AI56:** `NEW supabase/migrations/20260616_fix_ai56_promo.sql`: `UPDATE promo_codes SET discount_value=94, max_discount=94, allowed_plans=ARRAY['basic'] WHERE code='AI56';` (99-94=5). صلّح بذرة `20260410_create_ai56_promo_code.sql` وتعليقها. ارجِع `AI56_FINAL_PRICE` في نسخ الإعلان بدل الحرفي `5`.
  7. **مزامنة الإحصاءات (شاملة الأسطح المُغفَلة):** القيم القانونية: تمارين=48 (يفضَّل حسابها live من `allExercises`)، صفحات قراءة=188+، مجاني=محسوب من `SECTION_REGISTRY` (≈51 مع intro). صلّح: `admin/site-stats/route.ts:15`، `promo.ts:67,69,90`، `LockedOverlay.tsx:175,253,257`، `PricingSection.tsx:66-68`، `PainPointsSection.tsx:19`، `HeroSection.tsx:99`، `BookContentsSection.tsx:110`، `layout.tsx:39,47,53`، `upgrade-emails.ts:166`، `BlogCTA.tsx:15`، `bookData.ts:504,512`. **وأضِف الأسطح التي أغفلها التصميم:** `WhatYouLearn.tsx:82-86` (30+/55+/180+ مع تسمية القوالب خطأً كتمارين)، `FAQSection.tsx:22` (180+/55+)، `cart-recovery.ts:92` (40+).
     - **عدد القوالب 3-طرق-متضارب** (95 vs 55 vs 30+): اختر رقماً واحداً صحيحاً **بعد التحقق من بيانات القوالب الفعلية** (لا الافتراض 55)، اضبط `PRODUCT_STATS.templates` عليه، وحدّث `bookData.ts:504,512` (رغم استثنائه من grep).
     - **مجاني:** لا تُثبّت 21 ولا 27 (كلاهما خطأ)؛ احسبه من `SECTION_REGISTRY.freePageLimit` (مع intro=6 مجاني).
     - **نسخ خصم إيميل الترقية** `upgrade-emails.ts:144-148`: لا تبدّل القاعدة فقط (`299→99`) تاركاً المشتقّ `239/399`؛ أعِد حساب المخصوم من `getPlanPrice()` (مثلاً 99×0.8=79) أو احذف نسخة الـ20% المتضاربة. (`بدل 99 ← 239` خطأ صارخ.)
  8. **حارس CI (مصحّح — لا يُفشل البناء بنتائج إيجابية كاذبة):** التصميم اقترح `rg "\b(299|499|999|699|1499)\b"` وهو يطابق `#999`/`z-index:999`/`setHours(...,999)` — **مرفوض**. بدله: vitest يستورد الثوابت ويؤكّد بالمساواة العددية + grep **مُحدَّد بسياق السعر فقط** (`price|amount|ج\.م|EGP` ضمن مسافة قصيرة من الرقم، استثناء `*.css` و`z-index`/`setHours`/قيم اللون). الاختبار: `PLAN_PRICES==={99,199,399}`، `getUpgradeDiff('basic','pro')===100`، `99-94===AI56_FINAL_PRICE===5`، `PRODUCT_STATS.exercises===` طول `allExercises` live (48)، `freePages===` مجموع `SECTION_REGISTRY.freePageLimit`.

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - ترقية+برومو: المجموع المعروض على الشاشة يخالف ما يُخصَم (لأن validate يتجاهل الترقية) — يجب أن يتطابقا الآن.
  - أدمن يعدّل `PUT /api/admin/plans/basic price=150`: يجب ألّا تنشأ حالة "sticker=99 لكن `original_amount` في البرومو=150".
  - أسطح إحصاء مُغفَلة (`WhatYouLearn`, `FAQSection`, `cart-recovery`) لا تزال تعرض أرقاماً خاطئة.
  - حارس grep الأصلي يطابق `#999`/`setHours` فيُعطَّل ويصير مسرحاً.

  **اختبارات عدائية محدّدة:**
  1. `/payment?upgrade=true&currentPlan=basic` → اختر pro → أدخِل AI56. قارِن في DevTools `final_amount` من `/api/promo/validate` مع `amount` من `/api/payment/create-session` — **يجب أن يتطابقا**.
  2. كأدمن `PUT /api/admin/plans/basic price=150` ثم طبّق برومو كمستخدم على basic — تأكّد أن sticker و`original_amount` لا يختلفان.
  3. شغّل حارس grep الأصلي على شجرة نظيفة — يجب أن يثبت أنه يطابق `#999`؛ ثم أكّد أن الحارس المحصّن (سياق السعر) = صفر.
  4. اقرأ كل مكوّنات الهبوط للإحصاءات (لا قائمة الخطوة-7 فقط): `WhatYouLearn:84-86`, `FAQSection:22`, `cart-recovery:92`.
  5. احسب المجاني الحقيقي = 6+17+4+8×3 = 51؛ تأكّد ألّا يخالفه أي سطح.
  6. اعرض إيميل `upgrade_drip_3` بعد التبديل وتأكّد `Y < X` وكلاهما من 99/199.
  7. AI56 على basic end-to-end: `final_amount===5` AND `create-session amount===5` AND وصف Kashier يُظهر خصم 94.

  **معايير القبول المحصّنة:**
  - في الترقية مع أي برومو: المجموع المعروض = مبلغ جلسة Kashier (البرومو مطبّق على فرق الترقية).
  - تعديل أدمن للسعر إمّا مرفوض/متجاهَل بالكامل (code-controlled) أو منتشر باتّساق لكل: sticker + `promo/validate original_amount` + خصم create-session. لا حالة وسطية.
  - grep على كل `src` (بسياق السعر) = صفر من `{299,499,999,699,1499}`، وصفر من إحصاءات `{45 تمرين, 40+ تمرين, 95 قالب, 30+ قالب, 89 صفحة, 143, 180+, 27 صفحة}`، **دون** مطابقة CSS/وقت.
  - بعد الهجرات: `SELECT price FROM plans` = 99/199/399 AND `site_settings.pricing_plans` = 99/199/399 AND `discount_value` لـ AI56 = 94 — مؤكَّداً على DB الحيّ (انتبه: `supabase_landing_page.sql` يستخدم `ON CONFLICT DO NOTHING` فالـ UPDATE هو الفعّال).
  - vitest الحارس يفشل عند أي انحراف، و`npm run test` يشغّله فعلاً.

- **مخاطر:** سطحا كتابة (جدول `plans` + `site_settings`) قابلان لتعديل الأدمن وقت التشغيل (طغيان الكود يخفّف لكنه يجعل تعديل الأدمن no-op — أكّد القرار مع المالك)؛ لا تُعِد كتابة صفوف الدفع التاريخية؛ إصلاح MRR يخفض الإيراد المُبلّغ ~3x (أبلِغ المالك)؛ AI56 خصم ثابت 94 يلائم basic فقط (أبقِ `allowed_plans=['basic']` أو حوّله لنسبة)؛ تأكّد من وجود صف `site_settings.pricing_plans` فعلاً قبل افتراض خطأ الهبوط.

- **الجهد:** متوسط.

---

## WS3 — قمع يطلب البيع فعلاً — **P0**

- **الهدف:** كل CTA رئيسي وتدفّق ما-بعد-التسجيل يوجّه نحو الدفع (`/payment` مع باقة مختارة): هبوط → CTA شراء → تسجيل → دفع → Kashier، دون أن يُحجَز الزائر في القراءة المجانية، مع إبقاء مسار "جرّب مجاناً" **ثانوياً واضحاً**.

- **الوضع الحالي:** `register/page.tsx:142-150` يذهب دائماً لـ `/onboarding` متجاهلاً `needsPayment`؛ `getSafeRedirectPath` (`register:22`, `login:26`) لا يسمح بـ `/payment`؛ `HeroSection.tsx:112` و`MobileStickyBuy.tsx:47` و`FinalCTA.tsx:22-26` كلها → `/read/intro/1`؛ بطاقات الأسعار في الوضع العادي (`PricingSection.tsx:269-276` + `promo.ts:80,97,114`) → `/register` بلا باقة؛ `payment/page.tsx:120-131` يرتدّ لـ `/register` بلا context؛ `GuestBanner.tsx:23` تسجيل مجاني فقط.

- **خطوات الإصلاح (محصّنة):**
  1. أضِف `'/payment'` لقائمة `allowedPrefixes` في `getSafeRedirectPath` بـ **كلا** `register/page.tsx:22` و`login/page.tsx:26` (مع الإبقاء على حرّاس open-redirect: بدء بـ `/` واحد، لا `//`، لا `://`).
  2. `register/page.tsx:142-150`: بدل التحويل الثابت لـ `/onboarding`. اقرأ `planParam`. إن `needsPayment` أو `nextPath` يبدأ بـ `/payment` → `/payment?plan=...`. أبقِ تتبّع `trackFunnelStep` وأضِف `payment_intent`.
  3. **(تحصين عدائي) Google signup يعتمد على إشارة الخادم لا localStorage:** `register/page.tsx:182-187` — توجيه حسابات Google الجديدة لـ `/payment` يعتمد على **حساب أُنشئ للتوّ / `is_active=false`**، لا على `localStorage.getItem('user_learning_goal')` (علم بائت يهزم المنطق). وجّه فقط عند `result.isNewUser` (لا تطلق Lead/توجيه لمستخدم عائد يسجّل دخوله بزر Google).
  4. `payment/page.tsx:120-131`: عند غياب الكوكي → `router.push('/register?next=/payment&plan=...')` بدل `/register` العاري.
  5. `HeroSection.tsx:103-130`: الزر الأساسي (فرع لا-تقدّم) → `<Link href="#pricing">` "اشترك الآن — ابدأ من 99 ج.م" + `trackCtaClick`؛ تحته رابط **ثانوي** خافت → `/read/intro/1`. فرع المتقدّم يبقى "أكمل".
  6. `MobileStickyBuy.tsx:9-49`: الوجهة/النسخة → شراء (`#pricing`)، أبقِ إخفاءه على pricing لكن كزر شراء.
  7. `FinalCTA.tsx:22-27`: الزر الأساسي شراء + رابط مجاني ثانوي.
  8. `promo.ts:80,97,114` + `PricingSection.tsx:269-276`: `cta_link` → `/payment?plan=basic|pro|vip`؛ fallback → `/payment?plan=${plan.id}`.
  9. `GuestBanner.tsx:18-33`: CTA أساسي حامل-سعر → `/payment?plan=pro`، وتنزيل التسجيل لثانوي.
  10. `onboarding/page.tsx`: لا يقف بين شراء-نيّة والدفع (المشتري الجديد يذهب لـ `/payment` قبل onboarding أصلاً)؛ تحقّق ألّا يُجبَر دافع عليه.
  11. **توافق السعر في مسارات القمع (تحصين):** `SubscriptionGateModal.tsx:74-114` و`payment/page.tsx:50` → 99/199/399. **وأضِف `LockedOverlay`** (أغفله التصميم): `LockedOverlay.tsx:176` "من 299" → 99، و`:137/139/141` `router.push('/payment?uid=...')` → أضِف `?plan=` واحذف `uid` من الـ URL (الهوية من الكوكي).
  12. **سطحا CTA أغفلهما التصميم (تحصين عدائي إلزامي):** `BookContentsSection.tsx:165-170` (أساسي 🆓 → `/read/intro/1`، ثانوي → `/register`) و`RoadmapPath.tsx:30` (`/read/intro/1`) — حوّل الأساسي لشراء وأصلِح الثانوي لـ `/payment`.
  13. **التسليم بين الصفحات:** تأكّد أن `login` يحافظ على `next` عبر مناولة guest→`/payment`→`/register?next=/payment`→"تسجيل دخول بدلاً"→عودة لـ `/payment`.

- **🔴 التحقق العدائي:**

  > **تبعية حاسمة:** هدف "القمع يطلب البيع" **لا يُعتبَر محقّقاً إلا مع WS1** (gating الخادم). بلا paywall، الرابط المجاني "الثانوي" لا يزال يقود للكتاب كاملاً (بلوكان عبر URL: `/read/section-2/5`)، فالقمع تجميلي. **لا تُعلِن هذه الورشة منجَزة قبل أن يثبت WS1 أن `/read/section-2/5` لغير الدافع لا يعيد جسم النص.**

  **محاولات التفاف يجب أن تفشل:**
  - `curl -s /read/section-2/5` بلا كوكيز ثم grep لنثر مدفوع → يجب ألّا يوجد (بعد WS1).
  - حظر `verify-session` ثم فتح صفحة مقفولة → يجب ألّا تظهر (WS1 فشل-مغلق).
  - `BookContentsSection`/`RoadmapPath` لا تزالان تقودان لـ `/read/intro/1` كأساسي.
  - Google signup مع `user_learning_goal` مضبوط مسبقاً يُحوَّل لـ onboarding لا `/payment`.
  - سعر `/payment` من جدول `plans` لا الثوابت → 299/499/999 معروض بينما يُخصَم 99/199/399.

  **اختبارات عدائية محدّدة:**
  1. تسجيل بريد جديد → الوجهة `/payment` (لا `/onboarding` ولا `/read/intro/1`).
  2. متصفّح متخفّي → `/payment` → ارتداد لـ `/register?next=/payment` → أكمِل التسجيل → عودة لـ `/payment` بالباقة محدّدة.
  3. الهبوط على ≤768px: كل CTA أساسي شراء، والمجاني ثانوي يعمل.
  4. بطاقات الأسعار (وضع عادي) → `/payment?plan=basic|pro|vip` بالباقة محدّدة.
  5. preset `localStorage.user_learning_goal` ثم Google signup → يجب أن يصل `/payment`.
  6. اضغط CTA `BookContentsSection` بعد الإصلاح → يجب ألّا يذهب لـ `/read/intro/1`.
  7. قارِن سعر `/payment` المعروض بما يخصمه Kashier (شحنة اختبار) — يجب التطابق (تأكّد من صفوف جدول `plans` = 99/199/399، لا الثوابت فقط).

  **معايير القبول المحصّنة:**
  - **حارس grep CTA:** لا مكوّن تسويقي (Hero, FinalCTA, MobileStickyBuy, PricingSection, GuestBanner, **BookContentsSection, RoadmapPath**, BlogCTA) لديه CTA **أساسي** وجهته `/read/intro/1` أو `/register` العاري.
  - سعر `/payment` المعروض = ما يخصمه create-session، **مؤكَّداً مقابل استجابة `/api/admin/plans` الحيّة** لا الثوابت فقط.
  - لا سطح بيع (شاملاً `LockedOverlay.tsx:176`) يعرض 299/499/999.
  - أزرار `LockedOverlay` → `/payment` مع `plan` وبلا `uid` في الـ URL.
  - Google signup يصل `/payment` حتى مع `user_learning_goal` مضبوط مسبقاً (القرار من الخادم لا client).
  - `getSafeRedirectPath('/payment')==='/payment'` في register **و** login، والتسليم عبر login يحافظ على `next`.
  - غير دافع يطلب `/read/section-2/5` لا يستلم جسم النص (تبعية WS1).

- **مخاطر:** قد يُدفَع دافع عائد لـ `/payment` بلا داعٍ (خفّف: فقط عند `needsPayment===true`)؛ تحويل CTA من مجاني لشراء قد يقلّل التفاعل العلوي (مقصود، أبقِ الرابط المجاني الثانوي)؛ `#pricing` يعتمد على `id='pricing'`؛ تعديلات السعر client ثوابت قد تنحرف (الحارس + WS2 يخفّفان).

- **الجهد:** متوسط.

---

## WS7 — بريد دورة-الحياة والاسترداد الذي يُرسَل ويصل فعلاً — **P0/P1**

- **الهدف:** كل بريد دورة-حياة/استرداد (ترحيب، 6-إيميلات ترقية، 3-إيميلات سلّة، تنشئة lead-magnet، تذكيرات) يُرسَل للجمهور الصحيح، من دومين مُصادَق (SPF/DKIM/DMARC)، مع روابط إلغاء-اشتراك عاملة وأسعار مطابقة للمخصوم — فتُستردّ العملاء الدافئون والسلال بدل أن تذهب لأحد.

- **الوضع الحالي:** drip الترقية ميت: `upgrade-emails.ts:189-192` يستعلم `.is('plan_id', null)` بينما العمود الحقيقي `current_plan` (مؤكَّد على الكود الحيّ) → خطأ → صفر إرسال؛ السلّة تتخطّى الجميع: `cart-recovery.ts:163-170` يختار `plan_id` غير الموجود → كل صف null → تخطّي؛ `payment_intents.completed` لا يُضبَط `true` عند النجاح (نقاط النجاح في `webhook` و`activate` لا تلمسه)؛ لا ترحيب ولا صف `email_preferences` عند التسجيل (token إلغاء معطوب)؛ دومين الإرسال متضارب (`promptexpert.com`/`promptexpertbook.com`/`prompt-mr.com`)؛ lead-magnet PDF واحد ثم صمت؛ cron يومي بينما الكود يفترض ساعياً (`send-reminders` يتخطّى preferred_time الافتراضي 18:00 دائماً)؛ نسخ سعر خاطئة + بروموكود `COMEBACK10` غير معرّف.

- **خطوات الإصلاح (محصّنة):**
  1. `upgrade-emails.ts:189-192`: `.is('plan_id', null)` → `.is('current_plan', null)` + `.not('email','is',null)` + سجّل `fetchErr.message`.
  2. `cart-recovery.ts:163-170`: select `current_plan` بدل `plan_id`؛ الحارس `if (user.current_plan)`.
  3. `payment_intents.completed=true` في **كل** مسار نجاح (`webhook` ensureSubscription، `activate` createSubscription) بعد تحديث `is_active`، داخل try/catch لا يكسر التفعيل.
  4. `register/route.ts`: استورِد `ensureEmailPreferences, sendWelcomeEmail`؛ بعد إنشاء المستخدم (non-blocking) أنشئ صف التفضيلات (يضمن `unsubscribe_token` حقيقي) وأرسِل الترحيب.
  5. `NEW supabase_email_prefs_backfill.sql`: backfill صفوف `email_preferences` للمستخدمين الحاليين بلا صف.
  6. **توحيد الهوية (محصّن — 4 دومينات لا 2):** `NEW src/lib/email-config.ts` يصدّر `FROM_EMAIL, APP_URL, BRAND_DOMAIN` من env بنفس الافتراضات (الدومين الإنتاجي الحقيقي). استورِدها في `email.ts:21-22,104`, `upgrade-emails.ts:9-10,45`, `cart-recovery.ts:9-10,45`, `lead-magnet/route.ts:54-55`. **انتبه:** الـ fallback الحقيقي للمرسِل هو `noreply@promptexpert.com` (دومين رابع غير مُتحقَّق) في `email.ts:21`, `cart-recovery.ts:9`, `upgrade-emails.ts:9`, `lead-magnet:54` — يجب أن تشمله. تحقّق Resend من الدومين (SPF/DKIM/DMARC) قبل الاعتماد.
  7. **مزامنة cron (اختر واحداً):** يومي-صحيح: في `send-reminders` احذف بوّابة `±1h` (`:84-88`) واعتمد سقوف 1/يوم و3/أسبوع، واضبط `vercel.json` على وقت مساء القاهرة، **مع تحويل منطقة زمنية حقيقي Africa/Cairo (يعالج DST)** بدل `+2` المضمّن (`:87`) الخاطئ نصف العام؛ ووسّع نوافذ السلّة واختر **أعلى مؤشّر مؤهّل لم يُرسَل** بدل نطاقات صارمة.
  8. **نسخ السعر/البرومو:** `upgrade-emails.ts:147-148` → أسعار حقيقية محسوبة من `getPlanPrice()`؛ `cart-recovery.ts:105-114` `COMEBACK10`: **إمّا** أنشئه في `promo_codes` بـ `allowed_plans` يغطّي الباقة المُعلَنة **وأكّد قبوله على المسار الحقيقي `create-session` لا فقط `validate`** (validate يقرأ جدول `plans` ويتطلب مصادقة؛ create-session يعيد التحقق)، **أو** احذف الكود واربط `/payment` بلا كود.
  9. **تنشئة lead-magnet:** أضِف أعمدة لـ `lead_magnet_subscribers` (`nurture_step, last_nurture_at, converted, unsubscribed, unsubscribe_token`)؛ `NEW lead-nurture.ts` + cron؛ تخطّى من سجّل (مطابقة بريد case-insensitive).
  10. **(تحصين عدائي إلزامي) إلغاء الاشتراك — أصلِح مسار النقر الفعلي:** الرابط في الإيميل يشير لـ `${APP_URL}/unsubscribe` وهو **صفحة العميل** `src/app/unsubscribe/page.tsx` لا مسار الـ API. عدّل **كليهما:** أضِف حالات `upgrade/cart_recovery/lead_nurture` في `email/unsubscribe/route.ts:76-119` (وإلّا 400 "نوع غير صالح")، **و** أضِف التسميات العربية لهذه الأنواع في `unsubscribe/page.tsx:49-55` (وإلّا يَعرض الزرّ التوكِن الخام). توكِن `lead_nurture` يعيش في جدول مختلف → نفّذ بحث-جدول منفصل في الـ API.
  11. **(تحصين) جمهور drip لا يُقصَر على `current_plan`:** أضِف استثناء عند وجود subscription نشط أو دفعة `status='success'` (LEFT JOIN)، لأن دافعاً فشلت كتابة `current_plan` لديه يبقى في جمهور الترقية ويُنغَّص — `payment_intents.completed` يوقف السلّة فقط لا drip.
  12. **(تحصين) مطابقة اليوم المرنة:** `upgrade-emails.ts:226` يستخدم `t.day === daysSinceReg` — تشغيل يومي فائت يتخطّى خطوة drip للأبد. غيّره لـ "أعلى template `.day <= daysSinceReg` ولم يُسجَّل بعد".
  13. فهرس فريد جزئي على `email_log(user_id, email_type)` لمنع الإرسال المزدوج؛ عامِل انتهاك التفرّد كـ "أُرسِل" لا كخطأ.

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - النقر على رابط إلغاء من إيميل drip يصل صفحة العميل لا الـ API — يجب أن تَعرض تسمية عربية وتُفلِح (لا 400 ولا توكِن خام).
  - دافع `current_plan=NULL` (فشل كتابة) لا يزال يصله drip الترقية.
  - تشغيل cron فائت يتخطّى خطوة drip للأبد (المطابقة الصارمة لليوم).
  - دومين Resend غير مُتحقَّق → الإرسال يفشل صامتاً ويصل صفر بريد قابل للتسليم — لا حارس آلي.
  - `COMEBACK10` يَنجح في `validate` لكن يرفضه `create-session`.

  **اختبارات عدائية محدّدة:**
  1. اعرض HTML إيميل drip، استخرج رابط إلغاء، حمّله كمتصفّح (يصل صفحة `/unsubscribe`)، اضغط تأكيد → POST يعيد ok:true AND `upgrade_emails=false` AND التسمية عربية.
  2. ابذُر دافعاً: `payments.status='success'` + subscription نشط، لكن أجبِر `current_plan=NULL`؛ شغّل `/api/cron/upgrade-drip` → صفر صفوف drip له.
  3. ابذُر مستخدماً مجانياً `created_at=N+1` يوم (تخطّى يوم القالب) بلا صف drip سابق؛ شغّل → الخطوة الصحيحة لا تزال تُرسَل.
  4. اجعل Resend يرفض الدومين → شغّل الـ crons → يجب أن يَفلِغ الفحص الصحي البريد غير القابل للتسليم.
  5. أنشئ `COMEBACK10` في `promo_codes` بسعر جدول `plans` يخالف create-session → `POST /api/payment/create-session code=COMEBACK10` → أثبِت احتمال الرفض/خصم مختلف.
  6. شغّل `send-reminders` في شهر DST مصري → أكّد أن `+2` المضمّن يخطئ التوقيت؛ وعلى الجمعة أكّد أن streak/mission لا يضيعان للـ recap والسقوف صامدة.
  7. اشترِك lead ثم سجّل بنفس البريد → لا تنشئة ولا ترحيب-مزدوج؛ ولِـ lead غير مسجّل اضغط رابط `lead_nurture` → `unsubscribed=true` (بحث-جدول صحيح، لا 404).
  8. **حارس ساكن:** grep الملفات الأربعة عن `plan_id`, `promptexpert.com`, `promptexpertbook.com`, `COMEBACK10` → فشل البناء إن بقي أيّ منها.

  **معايير القبول المحصّنة:**
  - دافع (دفعة ناجحة و/أو subscription نشط) يصله **صفر** drip حتى لو `current_plan=NULL`.
  - تشغيل cron فائت لا يتخطّى أي خطوة drip للأبد.
  - فحص نشر/CI يفشل إن لم يُتحقَّق دومين `EMAIL_FROM` في Resend (Resend domains API)، وتنبيه عند تجاوز نسبة `status='failed'`.
  - أي بروموكود معلَن في إيميل يقبله **المسار الحقيقي** create-session (لا فقط validate)، وسعر validate = سعر create-session؛ وإلّا صفر أكواد في ملفات الإيميل.
  - مستخدم `preferred_time='18:00'` يصله تذكير في ساعة التشغيل المختارة، محسوبة بتحويل Africa/Cairo (DST-صحيح)، مؤكَّداً في DST وغير-DST.
  - lead غير مسجّل غير محوّل يصله day2/day5؛ بعد التسجيل (case-insensitive) أو نقر إلغاء `lead_nurture` (يقلب `unsubscribed=true` عبر بحث-الجدول) → لا مزيد.
  - الملفات الأربعة تستورد من `email-config.ts`؛ grep = صفر دومينات/`plan_id`؛ ووحدة تؤكّد العمود `current_plan` في `upgrade-emails.ts` و`cart-recovery.ts`.

- **مخاطر:** قفزة حجم (من 0 إلى backlog كامل — حُدّ السقف لكل تشغيل لتجنّب rate limit/spam)؛ سمعة دومين جديد (warm-up، DMARC ليس `p=reject` قبل التأكّد)؛ تعديل `payment_intents` يلمس ملفات المال (additive + try/catch، بعد تحديث `is_active`، لا يرمي)؛ روابط الإلغاء القديمة (user.id كتوكِن) تبقى 404 (مقبول)؛ هجرات SQL تُنشَر قبل الكود الذي يرجعها.

- **الجهد:** كبير.

---

## WS4 — الثقة والمصداقية وعكس المخاطر (لغريب يُدخِل بطاقة) — **P1**

- **الهدف:** زائر إعلاني لأول مرّة يلتقي بإشارات ثقة **صادقة وقابلة للتحقق فقط** (لا إحصاءات ملفّقة)، يصل لصفحات قانونية/استرداد/تواصل/مؤسِّس من footer دائم، يرى رموز دفع حقيقية عند الشراء، وضمان 30 يوم يربط بسياسة استرداد فعلية.

- **الوضع الحالي:** إحصاءات ملفّقة حيّة: `FAQSection.tsx:113-127` بطاقتا `+500/متعلم سعيد` و`4.9/5` (البطاقة الثالثة 30 يوم مشروعة)؛ `Testimonials.tsx:7-38,91-107` ملفّق لكنه **خامل** (محذوف من `page.tsx:17-23`)؛ لا صفحات قانونية إطلاقاً؛ لا `Footer`؛ الضمان نصّ بلا رابط (`PricingSection:127,198,289`, `HeroSection:138`, `FinalCTA:27`)؛ لا هوية مؤسِّس؛ رموز دفع emoji فقط؛ بريد دعم ودومين متضاربان. نظام شهادة حقيقي قابل للتحقق موجود (`src/app/certificate/[id]/page.tsx`).

- **خطوات الإصلاح (محصّنة):**
  1. `FAQSection.tsx:112-128`: احذف بطاقتي `+500` و`4.9/5`، أبقِ بطاقة 30 يوم (واربطها بـ `/refund-policy`). استبدلهما بإشارات **صادقة**: عدد الصفحات (رقم قانوني واحد — انظر التحصين أدناه) وشهادة قابلة للتحقق.
  2. `Testimonials.tsx:7-38,53-54,91-107`: اجعله fetch-only (احذف المصفوفة الملفّقة وشريط `4.9/500+/95%`؛ يرسم null عند الفراغ).
  3. **(تحصين عدائي إلزامي) `GamificationSection.tsx:11-26`:** يثبّت leaderboard أسماء وهمية ('أحمد م.' 3420) وشارات ملفّقة، ويصدّره barrel — احذف/حيّده (fetch-only أو توضيحي بلا أسماء/نقاط واقعية). **وسّع حارس CI ليمسح كل `src/components/landing/*` بغضّ النظر عن استيراد `page.tsx`** (التصميم قصره على المستورَد في `page.tsx` فيفلت Gamification).
  4. **رقم صفحات قانوني واحد (تحصين):** التصميم أضاف بطاقة `182` بينما الصفحة تَعرض `180+` (`FAQSection:22`)، `188+` (`PricingSection:66`)، `180+` (`WhatYouLearn:86`)، `182` (`layout.tsx:75` JSON-LD) — تناقض في نفس الصفحة. عرّف ثابتاً واحداً واستبدِل **كل** ظهور؛ أكّد أن DOM الحيّ يحوي قيمة واحدة فقط.
  5. `NEW` صفحات server: `refund-policy, terms, privacy, about, contact` بـ RTL عربي. `refund-policy` يحوي حرفياً "30" + مسار مطالبة (البريد القانوني). `terms` يذكر أسعار EGP المطابقة لـ `create-session:61-65`. `about` يحوي **اسماً بشرياً حقيقياً** (نشر محجوب ما دام placeholder الـ TODO).
  6. `NEW src/components/Footer.tsx` + تركيب في `layout.tsx`. **(تحصين)** على `/read/*` والمسارات المحمية: ارسم footer روابط-قانونية فقط أسفل المحتوى (لا يجلس تحت overlay القارئ)، **واكبت كتلة التسويق/رموز الدفع هناك**.
  7. رموز دفع حقيقية (`public/assets/payment/`) بدل emoji في `PricingSection:114,200,287-294` + `Footer`؛ سطر أمان صادق "الدفع عبر بوابة Kashier المؤمّنة" (لا أختام PCI/SSL لا نملكها).
  8. اربط **كل** ذكر ضمان بـ `<Link href="/refund-policy">` (`PricingSection:127,198,289`, `HeroSection:138`, `FinalCTA:27`, بطاقة `FAQSection`).
  9. **توضيح "بدون بطاقة ائتمان" (تحصين):** أصلِح **كليهما** `FinalCTA.tsx:27` **و** `HeroSection.tsx:140` (يجاور `:138` الضمان) — اقصر "لا بطاقة" على المعاينة المجانية منفصلاً عن ضمان الاشتراك المدفوع.
  10. توحيد بريد الدعم + الدومين (يتقاطع مع WS5): بريد قانوني واحد + ثابت `SITE_URL` واحد.
  11. أضِف الصفحات القانونية لـ `sitemap.ts`.
  12. **الشهادة "القابلة للتحقق" (تحصين):** `robots.ts:11` يحجب `/certificate/` والـ preview محاكاة ساكنة — إمّا انشر **عيّنة شهادة عامة قابلة للزحف ومربوطة** وأزِل حجبها، **أو** احذف كلمة "قابلة للتحقق" (لا ادّعاء بلا سند).

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - استيراد `GamificationSection` يُعيد شحن leaderboard وهمي والحارس (المقصور على page.tsx) لا يلتقطه.
  - تناقض الصفحات في نفس الصفحة (180/182/188).
  - emails من `noreply@promptexpert.com` (دومين رابع) بروابط `promptexpertbook.com` بينما العنوان vercel — تطابق-4-طرق مفقود.
  - footer تسويقي يجلس تحت قارئ مدفوع على `/read/*`.
  - صفحات قانونية فارغة-من-المضمون + مؤسِّس placeholder تمرّ بمعيار "200 + نص عربي + title".
  - "بدون بطاقة" يجاور ضمان استرداد في hero.

  **اختبارات عدائية محدّدة:**
  1. شغّل الحارس ثم استورِد `GamificationSection` في `page.tsx` وارسمه → يجب أن **يفشل** الحارس؛ ثم Ctrl-F 'أحمد م.'/'3420' → غائب.
  2. استخرج كل token عدد-صفحات من HTML الحيّ → مجموعة القيم المتمايزة = 1 (اليوم {180+,182,188+}=3).
  3. `grep -rniE 'promptexpert\.com|promptexpertbook\.com|vercel\.app' src/ .env.local` → صفر (عدا الدومين القانوني الواحد).
  4. curl عيّنة الشهادة المُعلَنة "قابلة للتحقق" → 200 + محتوى حقيقي، و`/robots.txt` لا يحجب المسار.
  5. `/read/intro/1` على جوال، مرّر للأسفل → روابط قانونية قابلة للوصول بلا تصادم، وكتلة رموز الدفع التسويقية **غير** معروضة على مسار القارئ.
  6. انشر مع مؤسِّس placeholder TODO → خط النشر **يحجب** (placeholder بوّابة نشر لا نجاح).
  7. Ctrl-F 'بدون بطاقة ائتمان' → لكل ظهور أكّد أنه ليس بجوار 'ضمان استرداد' بلا نسخة قصر (`HeroSection:138-143`).
  8. فحص RSC/view-source: العبارات الملفّقة غائبة من HTML الأوّلي **وحمولة hydration** (FAQSection مكوّن client).

  **معايير القبول المحصّنة:**
  - حارس `scripts/check-no-fake-stats.mjs` يمسح **كل** `src/components/landing/*` ويفشل على `/\+?500|500\+|4\.9|95%|متعلم سعيد|يوصون به/` **و** على أي leaderboard/أسماء واقعية مثبّتة.
  - ثابت عدد-صفحات واحد؛ DOM الحيّ يحوي قيمة واحدة فقط بين {180+,182,188+}.
  - اختبار على كل `src/ + .env.local` يؤكّد صفر مضيف غير الدومين القانوني الواحد (شاملاً `promptexpert.com`).
  - إن ظهرت "قابلة للتحقق" فهناك عيّنة شهادة عامة قابلة للزحف مربوطة و`robots` لا يحجبها؛ وإلّا تُحذف الكلمة.
  - footer قانوني قابل للوصول من كل مسار؛ على `/read/*` لا يجلس تحت overlay وكتلة الدفع التسويقية مكبوتة. مؤكَّداً على `/`, `/read/intro/1`, `/toc`, `/leaderboard`.
  - `refund-policy` يحوي "30" + مسار مطالبة؛ `/about` يحوي اسماً بشرياً (نشر محجوب على placeholder)؛ `terms` يذكر أسعار = `create-session:61-65`.
  - لا "بدون بطاقة" يجاور ضمان بلا قصر (`FinalCTA:27` **و** `HeroSection:138-143`).
  - كل ذكر ضمان داخل `<a>`/`<Link>` يصل `/refund-policy` (200)؛ عدد الأذكار = عدد الروابط.

- **مخاطر:** خفض الإثبات الاجتماعي قد يخفض التحويل قصيراً (اعتمد الأصول الصادقة)؛ نصّ السياسات وعد مُلزِم (المالك يؤكّد الشروط/الاسترداد/القانون المصري)؛ أسعار `terms` تبقى متزامنة مع `create-session` (تقاطع WS2)؛ علامات الدفع لها قواعد ترخيص؛ تغيير الدومين يؤثّر على إعادة توجيه الدفع (نسّق مع WS5).

- **الجهد:** كبير.

---

## WS5 — دومين إنتاجي مُعلَّم واحد في كل مكان — **P1**

- **الهدف:** `https://www.prompt-mr.com` هو الدومين الكنسي الوحيد في كل URL يصدره الموقع (canonical/OG، sitemap/robots، redirect/webhook Kashier، روابط Resend، بطاقات المشاركة، CAPI `event_source_url`)، مع 301 من apex+vercel إليه و`ar_EG`.

- **الوضع الحالي:** `.env.local:19` `NEXT_PUBLIC_SITE_URL=https://prompt-expert-book-ten.vercel.app`؛ لا ثابت مركزي و12 ملفاً بـ fallback مختلف (`prompt-mr.com` بلا www في layout/sitemap/robots؛ `promptexpertbook.com` في email/cart/upgrade/lead/referral/share)؛ `meta-capi.ts:118,152,181,212` يثبّت www حرفياً؛ سلاسل footer `promptexpert.com`؛ لا canonical؛ `openGraph.locale='ar_SA'`؛ لا 301.

- **خطوات الإصلاح (محصّنة):**
  1. `src/lib/config.ts`: `SITE_URL = (env || 'https://www.prompt-mr.com').replace(/\/$/,'')`, `SITE_DOMAIN`, `SUPPORT_EMAIL`.
  2. `.env.local:19` + Vercel Production → `https://www.prompt-mr.com`.
  3. استبدل fallbacks لكل ملف بـ `SITE_URL` (layout:17, sitemap:4, robots:3, email:22, cart:10, upgrade:10, lead:55, referral:123, share page:19, generate-card:11).
  4. `meta-capi.ts:118,152,181,212` تشتقّ من `SITE_URL` (يُفضّل من origin الطلب الفعلي).
  5. `layout.tsx`: `alternates:{canonical:'/'}`, `openGraph.url:SITE_URL`, locale `ar_EG`.
  6. `blog/[slug]/page.tsx:27` locale `ar_EG`. **(تحصين)** أضِف `openGraph.images` (مطلقة) و`openGraph.url` لـ blog (مفقودان → بطاقات blog بلا og:image).
  7. استبدل سلاسل footer `promptexpert.com` بـ `SITE_DOMAIN` (ShareCardRenderer:143, ShareCardPreview:36, share page:67, og route:190, email:104, upgrade:45, cart:45).
  8. `challenge/page.tsx:160` → `${SITE_URL}/challenge` (لا `window.location.origin`).
  9. **(تحصين) القرار الواحد للكنسة:** يُفضَّل apex→www في Vercel Domains UI، **ولا** تشحن 301 كود متضارباً معه؛ إن استُخدم `next.config.js` redirects فابدأ `permanent:false`، أضِف smoke test (`curl -IL`) يؤكّد 301 + Location صحيح وغياب loop قبل قلبه `true`.
  10. تحقّق Resend (DNS) + بريد دعم موحّد.
  11. **(تحصين عدائي إلزامي) fallbacks المرسِل + locale:** أضِف `EMAIL_FROM_DEFAULT='PromptMaster <noreply@prompt-mr.com>'` لـ config واستبدِل **الأربعة** `noreply@promptexpert.com` (`email.ts:21`, `cart-recovery.ts:9`, `upgrade-emails.ts:9`, `lead-magnet:54`) — وإلّا فشل معيار grep والإرسال من دومين غير مُتحقَّق. واشتقّ مسار المال base من `SITE_URL`: `create-session/route.ts:176` يقرأ env خاماً مع fallback لـ `origin` العميل — استبدِله بـ `SITE_URL` (أو env مُتحقَّق) بلا fallback لـ origin client للمضيف الكنسي.
  12. `NEW /api/health` يردّد `SITE_URL` المحلول، + اختبار domain-consistency يؤكّد: `SITE_URL` افتراضياً `^https://www\.prompt-mr\.com$` بلا slash نهائي، صفر `promptexpert(book)?\.com|vercel\.app|noreply@promptexpert`، صفر `ar_SA`، و`meta-capi.ts` بلا حرفي www.

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - معيار grep الأصلي يفشل لأن `noreply@promptexpert.com` (4 أسطر مرسِل) يطابق `promptexpert.com`.
  - مسار المال يقرأ env خاماً لا `SITE_URL`؛ التغيير الأهم (Vercel env) يدوي بلا حارس آلي (الاختبار يفحص الافتراض-عند-عدم-التعيين فقط).
  - `redirects()` بـ host `vercel.app` قد لا تُطلَق أو تتسبّب loop ضد قاعدة Vercel.
  - `ar_SA` يعود عبر ملفات جديدة.

  **اختبارات عدائية محدّدة:**
  1. طبّق الخطوات حرفياً ثم `grep -rn 'promptexpert.com' src/` → يعيد 4 (fallbacks المرسِل) مثبتاً عدم رضا المعيار #2 كما كُتِب.
  2. staging: أزِل `NEXT_PUBLIC_SITE_URL` و`EMAIL_FROM`، انشر، `POST /api/payment/create-session` و`/api/lead-magnet` → أكّد ارتداد redirect Kashier وFrom للمضيف/الدومين غير المُعلَّم.
  3. `curl -IL` لـ apex وvercel على النشر الحيّ → قفزة 301 واحدة لـ www بلا loop (اختبر حالة قاعدة Vercel apex↔www لكشف double-redirect).
  4. view-source `/blog/<slug>` في Meta Sharing Debugger → og:image يُرسَم فعلاً (اليوم لا يوجد) والمضيف www.
  5. `NEXT_PUBLIC_SITE_URL` بـ slash نهائي → `.replace(/\/$/,'')` يجرّده ولا `//payment/callback`.
  6. على apex قبل 301: `/challenge` ومشاركة واتساب → الرابط `${SITE_URL}/challenge` لا origin.
  7. grep لخرج `.next` المبني للتأكّد من غياب سلاسل promptexpert/vercel من ملف مفقود.

  **معايير القبول المحصّنة:**
  - `grep -rn 'promptexpert.com|promptexpertbook.com|prompt-expert-book-ten.vercel.app|noreply@promptexpert' src/` = صفر.
  - `grep -rn "ar_SA" src/` = صفر.
  - `/api/health` الحيّ يردّد `https://www.prompt-mr.com` (يؤكّد قيمة Vercel الحيّة لا الافتراض المحلّي فقط).
  - `create-session` يبني redirect/webhook من `SITE_URL`، بلا fallback لـ origin العميل للمضيف الكنسي (تأكيد بقراءة `:176,184,185`).
  - `curl -I` لـ apex وvercel → 301 واحد لـ www بلا loop (`curl -IL` ينتهي 200 على www، سلسلة طولها 1).
  - blog share: og:url + og:image مطلقة على www + `ar_EG`.
  - مع `EMAIL_FROM` غير مُعيَّن (staging): From = `noreply@prompt-mr.com` ويُسلَّم.
  - Meta Test Events: Pixel+CAPI بنفس `event_id` ونفس مضيف `event_source_url` = www على الموقع الحيّ.
  - `npm run build` + smoke test runtime لـ redirects يؤكّد الإطلاق.

- **مخاطر:** Kashier قد يكون له domain مُدرَج بالـ vercel — حدّثه **قبل/مع** تغيير env (أعلى مخاطرة للمال)؛ Firebase Auth authorized domains يجب أن يشمل www+apex؛ تجنّب loop بين 301 كود وقاعدة Vercel؛ Resend غير مُتحقَّق = بريد فاشل؛ 301 permanent مخبّأ بقوة (ابدأ `false`).

- **الجهد:** متوسط.

---

## WS6 — نزاهة تتبّع التحويل الإعلاني (كي تُحسِّن الإعلانات المدفوعة) — **P1 (إلزامي قبل صرف أي إعلان)**

- **الهدف:** كل حدث إيرادي (Purchase, InitiateCheckout, Lead, ViewContent, lead-magnet) يُطلَق مرّة من المتصفّح ومرّة من الخادم CAPI بـ `event_id` مشترك واحد، الدومين الحيّ الصحيح، وقيم EGP حقيقية متّسقة — فيُزيل Meta التكرار وترتفع جودة المطابقة وتُطلَق تحويلات GA4/Google Ads بثقة.

- **الوضع الحالي:** Purchase dedup معطوب: المتصفّح `meta-pixel.ts:95` يستخدم `orderId` الخام بينما `webhook/route.ts:125-132` لا يمرّر eventId فيفترض `purchase_${orderId}` (سلسلتان مختلفتان)؛ لا `event_id` مشترك لـ Lead/IC؛ قيم متضاربة (ViewContent 50 vs 5 vs 5)؛ Pixel id مثبّت في 4 أماكن؛ Google Ads no-op صامت؛ lead-magnet بلا تتبّع.

- **خطوات الإصلاح (محصّنة):**
  1. `NEW src/lib/tracking-config.ts`: `META_PIXEL_ID, SITE_URL, PLAN_PRICES, CONTENT_IDS, CURRENCY`, و`purchaseEventId(orderId)=`purchase_${orderId}`` مشترك. استبدل المثبّت في `meta-pixel.ts:17` و`meta-capi.ts:16`.
  2. **Purchase:** `meta-pixel.ts` `eventId = purchaseEventId(orderId)`؛ في `webhook` و`process-callback` مرّر `eventId` صريحاً.
  3. **IC مشترك:** `checkoutEventId(orderId)=`ic_${orderId}`` في create-session + payment/page.
  4. **Lead مشترك:** `leadEventId(userId)=`lead_${userId}`` في register/route + register/page.
  5. **قيم حقيقية:** اقتل defaults 5.00/50.00 (اجعل القيمة وسيطة **مطلوبة**).
  6. `meta-capi.ts:118,152,181,212` تشتقّ `event_source_url` من `SITE_URL` (يُفضّل origin الطلب).
  7. Pixel init+noscript من env (`layout.tsx:103-128`).
  8. Google Ads يطلق فعلاً + تحذير dev عند غياب الـ ID.
  9. lead-magnet: Pixel + CAPI Lead.
  10. اختبارات عقد dedup.
  - **(تحصينات عدائية إلزامية):**
    - **(أ) مسار Google:** `src/app/api/auth/google/route.ts` **لا** يستدعي `sendCAPILead` إطلاقاً — أضِفه مشروطاً بـ `isNewUser` بـ `leadEventId(userId)`؛ وفي `register/page.tsx` الفرع Google أطلِق `trackLead(userId)` فقط عند `result.isNewUser` (لا Lead لمستخدم عائد بزر Google).
    - **(ب) IC value:** `payment/page.tsx:50` يستخدم جدول رابعاً `{299,499,999}`؛ اجعل create-session يعيد `finalAmount` والباقة الكنسية، وأطلِق `trackInitiateCheckout(value, orderId)` بالقيمة المُعادة من الخادم — وإلّا القيمة المكرّرة تتعارض في كل ترقية/برومو.
    - **(ج) Purchase value:** `webhook/route.ts:121` `parseFloat(data.amount)` (قد=0) vs `process-callback:194` `payment.amount` — اجعل webhook يقرأ المبلغ من صف DB (أضِف `amount` للـ select) فيرسل المسـاران نفس المبلغ، أبداً 0.
    - **(د) CompleteRegistration:** browser-only بلا CAPI (`meta-pixel.ts:65`) — إمّا احذفه أو أعطِه `event_id` مشترك + CAPI، ووثّق أيّ حدث واحد (Lead vs CompleteRegistration) يُربَط كتحويل في الإعلانات.
    - (هـ) `sendCAPIViewContent` كود ميت (صفر مستدعين) — اربطه بمستدعٍ حقيقي بـ event_id مشترك أو احذفه؛ والاختبار يفحص القيمة التي **تُطلَق فعلاً** لا الكود الميت.
    - (و) تغطية webhook-only (إغلاق تبويب الجوال): Google Ads/GA4 client-only لا يُطلَقان — إمّا أضِف مساراً خادمياً (GA4 Measurement Protocol / Google Ads offline conversion بـ transaction_id=orderId) أو وثّق الحدّ صراحةً وكميّاً.

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - تسجيل Google (لا بريد): لا CAPI Lead خادمي (المسار غير معدَّل) → Lead متصفّح فقط بلا dedup.
  - تسجيل دخول Google لمستخدم قائم على صفحة register يطلق Lead جديداً كاذباً.
  - IC في ترقية/برومو: القيمة المعروضة (جدول 299/499/999) تخالف finalAmount الخادم رغم تطابق event_id.
  - webhook يسبق فيرسل Purchase بقيمة 0/خاطئة.
  - شراء بإغلاق تبويب: صفر تحويل Google Ads/GA4.
  - `event_source_url` يرتدّ لـ `prompt-mr.com` (افتراض خاطئ) عند غياب env بلا تحذير.

  **اختبارات عدائية محدّدة:**
  1. سجّل حساباً جديداً بزر Google → تأكّد من **وصول** CAPI Lead خادمي (بالإصلاح كما كُتِب: لن يصل) ثم سجّل دخولاً ثانياً → تأكّد من عدم إطلاق Lead ثانٍ.
  2. طبّق برومو على `/payment`، ادفع، التقِط IC المتصفّح (eventID+value) وحمولة CAPI IC → تأكّد عدم تطابق القيمة رغم تطابق event_id.
  3. أجبِر webhook على السبق (data.amount غائب) → Purchase الناجي بقيمة 0/خاطئة.
  4. ادفع على جوال وأغلِق التبويب فوراً → DebugView: صفر تحويل client-only.
  5. أزِل `NEXT_PUBLIC_SITE_URL` في preview → `event_source_url` يرتدّ لـ prompt-mr.com بلا تحذير.
  6. grep لـ `981605484819613` بعد الإصلاح → غائب من `layout.tsx` noscript `<img src>` تحديداً.
  7. lead-magnet: قارِن eventID المتصفّح بـ CAPI → تأكّد اختلافهما (التكرار المُعترَف به).
  8. `npm test` على تطبيق مُفسَد عمداً (يعيد `value:5.00` ويوجّه `event_source_url` لـ prompt-mr.com) → تأكّد فشل اختبارات dedup.

  **معايير القبول المحصّنة:**
  - Lead يُزال تكراره لـ **كلا** البريد وGoogle؛ مستخدم عائد بزر Google لا يُنتج Lead جديداً (مشروط `isNewUser`)؛ و`google/route.ts` يستدعي `sendCAPILead`.
  - قيمة IC متطابقة بايتياً بين المتصفّح وCAPI لـ (أ) باقة أساس (ب) برومو (ج) ترقية — مثبتاً إزالة جدول 299/499/999 من `payment/page.tsx:50`.
  - شراء يؤكّده webhook أولاً: Purchase الناجي بمبلغ EGP غير-صفري من صف DB.
  - `event_source_url` = origin النشر الحيّ؛ عند غياب env تنبيه إنتاجي AND fallback لـ origin الطلب (لا prompt-mr.com). صفر حرفي prompt-mr.com/prompt-expert-book في `meta-capi.ts`.
  - حرفي `981605484819613` في ملف واحد فقط (`tracking-config.ts`)؛ اختبار يفشل إن ظهر في meta-pixel/meta-capi/أيّ من موقعَي layout (init **و** noscript img).
  - Google Ads يُطلَق لشراء webhook-only عبر مسار خادمي، **أو** الحدّ موثّق ومُعترَف به صراحةً وكميّاً (لا عميل دافع ينتج صفر تحويل صامتاً).
  - CompleteRegistration محذوف أو بـ event_id مشترك+CAPI، مع توثيق الحدث الكنسي للربط.
  - `npm test` يشمل اختبارات تفشل عند: عودة default 5.00/50.00؛ تباعد event_id بين العميل والخادم؛ اشتقاق `event_source_url` من prompt-mr.com عند تعيين env مختلف؛ إغفال `google/route.ts` لـ `sendCAPILead`.

- **مخاطر:** تغيير eventID يكسر dedup الأحداث التاريخية لحظياً (غيّر الطرفين بنشرة واحدة)؛ env خاطئ يُعيد خطأ الدومين (طبّع + تحذير)؛ جعل value مطلوباً تغيير توقيع كاسر (حدّث كل callsite)؛ webhook بلا fbp/fbc (dedup عبر event_id مشترك)؛ Google Ads يتطلب gtag محمَّلاً.

- **الجهد:** متوسط.

---

## WS8 — تحصين صلابة مسار المال (احفظ كل دافع، لا خسارة صامتة) — **P1**

- **الهدف:** كل عميل مخصوم ينتهي بـ `is_active=true` أياً كان مسار التفعيل (webhook/callback/self-service/cron)، التفعيل فقط عند تطابق المبلغ المدفوع مع المستحق، حذف الـ webhook الميت/الخاطئ، صمود حدود المعدّل على serverless، وتنبيه عند أي رفض/فشل — بلا 200 صامت يخفي عدم-تفعيل.

- **الوضع الحالي:** 4 مسارات تفعيل؛ **BUG A** `verify/route.ts:64-72` يُحدِّث `current_plan`/`plan_expires_at` لكن **لا** `is_active` (مؤكَّد على الكود الحيّ — قفل كامن)؛ **BUG B** `verify-by-order/route.ts:133-139` مثله؛ webhook ميت ثانٍ `src/app/api/webhooks/kashier/route.ts` بمفتاح/حقول خاطئة؛ لا حارس مبلغ؛ لا cron مصالحة؛ حدود المعدّل sync (لا تصمد cross-instance)؛ لا تنبيه خارجي.

- **خطوات الإصلاح (محصّنة):**
  1. `NEW src/lib/payment-activation.ts` `activatePaidSubscription(...)` — مصدر تفعيل واحد: حارس مبلغ (`paid >= owed` بتسامح 0.5 EGP، مع `parseFloat` صريح لسلسلة Kashier)، idempotency على `payment_id`، `is_active:true` إلزامي. كل المسارات تمرّ عبره.
  2. BUG A: `verify/route.ts:66-72` أضِف `is_active:true` (يُفضّل عبر `activatePaidSubscription`).
  3. BUG B: `verify-by-order/route.ts:133-139` مثله + أضِف `amount` للـ select.
  4. حارس المبلغ في كل مسار verify/callback/webhook. **(تحصين عدائي إلزامي)** قيمة الحالة عند عدم التطابق: **لا** تستخدم `'amount_mismatch'` (تنتهك `supabase_payments.sql:24 CHECK (status IN ('pending','success','failed','expired'))` → الكتابة مرفوضة وتُبتلَع صامتاً) — استخدم `'failed'` **أو** اشحن هجرة تضيف القيمة للـ CHECK. وأعِد تشغيل الحارس على فرع `process-callback:41-64` (existingSuccess) الذي يتجاوزه. **ابدأ log-only (burn-in) قبل الحجب الصلب** كي لا تقفل دافعاً شرعياً.
  5. **(تحصين) لا تحذف `webhooks/kashier` قبل تأكيد لوحة Kashier:** `docs/.../02-stage-4-report.md:459` يوثّق أن الـ webhook المُعَدّ يشير لـ `/api/webhooks/kashier` (المسار المُراد حذفه) — يناقض افتراض "ميت". احذف **فقط** بعد أن يؤكّد المالك (سجلّ webhook test-mode حيّ) أنه يحلّ لـ `/api/payment/webhook`؛ ووثّق وأصلِح السطر. ورحّل سلوك `is_verified:true` الوحيد (`:139`) إن لزم.
  6. `NEW src/app/api/cron/reconcile-payments/route.ts` كل 15 دقيقة — يصالح pending عالقة (إغلاق تبويب الجوال) بحارس Bearer CRON_SECRET. **(تحصين)** `event_id` حتمي مشترك (`purchase_${payment.id}` أو `kashier_order_id`) عبر webhook/process-callback/activate/reconcile كي لا يُحسَب Purchase 2-3 مرّات؛ أطلِق Purchase فقط عند انتقال pending→success.
  7. بدّل كل مسارات المال + promo لـ `checkRateLimitAsync` (Upstash). **(تحصين)** أضِف تأكيد startup/health يسجّل/ينبّه عند `useRedis===false` في الإنتاج (الـ grep وحده لا يكفي — fallback صامت).
  8. `NEW src/lib/alert.ts` `alertMoneyPath(...)` (POST اختياري بمهلة 3s + console.error دائماً، لا يرمي)؛ اربطه بكل فرع رفض/فشل.
  9. **(تحصين) تصنيف فشل webhook:** أعِد 500 **فقط** للأخطاء العابرة (شبكة/DB timeout) كي يُعيد Kashier؛ أعِد 200+تنبيه للرفض الدائم (عدم تطابق مبلغ، باقة غير صالحة، انتهاك CHECK) كي لا يَلوب Kashier للأبد.
  10. `NEW src/__tests__/api/payment-activation.test.ts` — `is_active:true` دائماً في users.update (مساري الإنشاء والموجود-مسبقاً)؛ underpay → لا insert/لا تفعيل؛ overpay/مطابق → تفعيل؛ idempotency. **(تحصين)** اختبار يؤكّد قيمة حالة عدم-التطابق ترضي CHECK الحيّ؛ واختبار يؤكّد `verify` و`verify-by-order` يمرّان عبر `activatePaidSubscription`.
  11. **(تحصين) تدقيق `is_verified`:** grep كل قراءات `is_verified` (`firebase_auth_middleware.ts:90`، profile route، إلخ)؛ إن اعتمد عليها أي gate أضِف `is_verified:true` لـ `activatePaidSubscription`؛ وإلّا وثّق الإسقاط (خطوة صلبة لا مؤجَّلة).

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - قيمة `'amount_mismatch'` تنتهك CHECK فتُبتلَع الكتابة صامتاً (200 يخفي عدم-تفعيل — المحظور).
  - حذف `webhooks/kashier` بينما لوحة Kashier تشير إليه يُصفّر التفعيل الخادمي.
  - حارس المبلغ يحجب دافعاً شرعياً (سلسلة `'199.00'`/فرق ترقية/finalAmount برومو).
  - `process-callback` existingSuccess يتجاوز حارس المبلغ.
  - reconcile + callback متأخّر يطلقان Purchase مكرّراً (بلا event_id مشترك).
  - حدود المعدّل تفشل-مفتوحة لـ in-memory عند غياب Upstash (الـ grep يمرّ).
  - 500-عند-فشل + إعادة Kashier يضخّم فشل CHECK الدائم لـ loop لانهائي.

  **اختبارات عدائية محدّدة:**
  1. underpay: insert amount=199، stub `verifyPaymentSession.data.amount='99'`، اضرب process-callback → (أ) لا subscription (ب) `is_active` false (ج) حالة الدفع قيمة CHECK-صالحة + تنبيه. إن بقيت 'pending' بلا سجلّ = فشل.
  2. أكّد URL لوحة Kashier خارج-النطاق ثم `curl -i /api/webhooks/kashier` و`/api/payment/webhook` بعد الحذف → الحيّ هو payment، والميت 404. إن أظهر سجلّ webhook test-mode أنه ضرب `/api/webhooks/kashier` فالحذف غير آمن = فشل.
  3. ترقية pro→vip (فرق 200) end-to-end → تفعيل ينجح والحارس لا يحجب (تحليل سلسلة صحيح).
  4. سباق reconcile + activate fallback متزامنين على pending واحدة → subscription واحد، `is_active=true`، **Purchase واحد** يصل Meta. أكثر = فشل.
  5. حدّ المعدّل مع Upstash غير مُعيَّن: اضرب create-session فوق 5/ساعة من نسختين → الحدّ **لا** يصمد (يوثّق الفشل-مفتوح) ويسجّل `useRedis=false`؛ ثم عيّن وأكّد 429 cross-instance بمفتاح `rl:*`.
  6. أجبِر فشل CHECK داخل webhook SUCCESS → يجب 200 (لا 500) كي لا يُعيد Kashier للأبد + تنبيه واحد. 500 = فشل.
  7. POST مباشر لـ verify وverify-by-order (BUG A/B) لمستخدم جديد session SUCCESS → `is_active` true؛ ثم `/exercises` بلا تحويل لـ `/payment`.
  8. تدقيق `is_verified`: grep كل قراءة؛ لكل gate أنشئ دافعاً عبر المسار المُصلَح وأكّد المرور.

  **معايير القبول المحصّنة:**
  - دافع عبر **أي** مسار → `is_active=true` (مؤكَّد بأن حمولة users.update تشمله في كل مسار).
  - قيمة حالة عدم-التطابق ترضي CHECK الحيّ (اختبار يُدخِل صفاً ويؤكّد نجاح UPDATE)؛ وإن أُدخِلت قيمة جديدة فالهجرة في الـ PR.
  - underpay > 0.5 EGP (بـ parseFloat صريح): لا subscription، `is_active` false، تنبيه، حالة CHECK-صالحة، والحارس يعمل على فرع existingSuccess؛ وburn-in log-only قبل الحجب الصلب (تغيير مُبوَّب منفصل).
  - الحارس لا يحجب شرعيّاً: اختبارات تغطّي `'199'`/`'199.00'`/فرق ترقية/finalAmount برومو — كلها تُفعِّل.
  - حذف `webhooks/kashier` فقط بعد تأكيد المالك أن اللوحة تحلّ لـ `/api/payment/webhook` (سجلّ test-mode حيّ)؛ تحديث الوثيقة؛ ومعالجة `is_verified`. `curl /api/webhooks/kashier` → 404.
  - pending SUCCESS → success + `is_active=true` خلال تشغيل reconcile (≤15د) بلا عودة المستخدم؛ تشغيل ثانٍ recovered:0؛ **Purchase مرّة واحدة** عبر reconcile + أي callback/webhook متزامن (event_id حتمي مشترك).
  - كل المسارات تستدعي `checkRateLimitAsync` **و** Upstash مُعَدّ في الإنتاج (تأكيد `useRedis===true` + مفتاح `rl:*` بعد ضرب مسار محدود). الـ grep وحده غير كافٍ.
  - 500 للعابر فقط (Kashier يعيد) + تنبيه؛ 200 + تنبيه للرفض الدائم (بلا loop لانهائي).
  - كل رفض/فشل (توقيع غير صالح، payment-not-found، عدم تطابق، خطأ كتابة تفعيل مبتلَع) يُنتج `[ALERT]` + POST عند تعيين `ALERT_WEBHOOK_URL` بمهلة 3s صلبة لا تؤخّر 200 ولا ترمي.
  - vitest + اختبار تراجع يؤكّد `verify`/`verify-by-order` يمرّان عبر `activatePaidSubscription`؛ build/typecheck ينجح.

- **مخاطر:** سلبيات-كاذبة لحارس المبلغ (سلسلة/وحدة مختلفة — قارِن بـ parseFloat + tolerance؛ ابدأ log-only)؛ 500 يُعيد فيجب idempotency صارم؛ حذف webhook قد يكسر إن أشارت اللوحة إليه (أكّد أولاً)؛ إسقاط `is_verified` (دقّق قبله)؛ Upstash env يجب أن يكون مُعَدّاً؛ cron كل 15د (حُدّ الدفعة + أرضية 10د تتجنّب سباق)؛ helper التنبيه لا يرمي/يحجب.

- **الجهد:** متوسط.

---

## WS9 — سرعة الجوال و SSR والاكتشاف العضوي — **P1/P2**

- **الهدف:** الـ hero يُرسَم في HTML الخادم بلا Firebase/bcrypt في الحزمة الأولى؛ المحتوى المجاني-دائماً يُرسَم خادمياً وقابل للزحف؛ sitemap/robots/metadata تعكس الواقع؛ وتكلفة الأنيميشن على Android المتوسّط تُقلَّص بحيث لا يتلعثم التمرير — **مع إصلاح تسريب المحتوى المدفوع في الحزمة (لا مجرّد عَرَض الزاحف).**

- **الوضع الحالي:** `HeroSection.tsx:7` و`Navigation.tsx:7` يستوردان `authSystem` الذي يجرّ bcryptjs + firebase (eager init)؛ نصّ hero داخل Motion `ssr:false` فقط؛ 3 طبقات أنيميشن دائمة؛ `Robot.tsx` `<Image fill>` بلا `sizes` + poster 499KB؛ كل `/read` `'use client'` فارغ للزاحف؛ `section-8/9/10` بلا layout metadata؛ sitemap drift؛ `PromoBanner`/`.nav` متراكبان (نفس z-index 1000، لا `--promo-h`).

- **خطوات الإصلاح (محصّنة):**
  1. اقسم `HeroSection` لـ Server Component (h1/p/CTA كنصّ خام في HTML) + جزيرة client صغيرة للاستئناف؛ احذف `dynamic({ssr:false})`؛ fade عبر CSS لا opacity:0 inline؛ احترم `prefers-reduced-motion`.
  2. أخرِج firebase+bcryptjs من حزمة `/`: lazy-init firebase (`getFirebaseAuth()` memoized)، dynamic-import للـ password/auth_system داخل register/login/profile، واعتمد `Navigation` على SubscriptionContext + fetch verify-session.
  3. **(تحصين عدائي إلزامي — المشكلة الجذرية #1) لا تسرّب المحتوى المدفوع للحزمة:** التصميم خطوة 3 يُبقي تدفّق `data={unitNData}` بلا تغيير — **مرفوض**. حوّل استيراد بيانات الفصل لـ Server Component يمرّر للجزيرة client **فقط** الكتل المجانية/التشويق للصفحات المقفولة، ولا يُضمّن نصّ الكتل المقفولة في props/حمولة RSC لغير الدافع. اجلب الكتل المدفوعة من مسار API مُصادَق (نفس WS1) بعد تحقّق الدفع server-side. **هذا يربط WS9 بـ WS1 — لا تَعتبِر WS9 منجَزاً قبل أن يثبت أن chunk صفحة مقفولة لا يحوي نصّها.**
  4. **(تحصين) appendix/glossary/library** (3 مكوّنات client منفصلة، 40 URL في sitemap) لها نفس تسريب blur — مرّرها على نفس خطّ الخادم أو قُصّ محتواها المقفول خادمياً.
  5. **(تحصين) firebase+bcrypt على `/read/*`:** `SectionPage.tsx:10` (+appendix/glossary/library/section-2..10) لا تزال تجرّ `authSystem` — طبّق نفس lazy/dynamic، أو اعتمد `verifySession()` خفيفاً (كوكي فقط).
  6. layout metadata لـ `section-8/9/10`.
  7. **(تحصين) sitemap:** **استبعِد** الصفحات غير-القابلة-للزحف (لا مجرّد خفض الأولوية)؛ اقدِ sitemap من مجموعة الصفحات التي تجتاز بوّابة محتوى-SSR (المجانية).
  8. قلّص الأنيميشن على الجوال: `UnifiedBackground` يعيد null < 768px أو reduced-motion؛ `Robot` طبقة float واحدة خفيفة وأوقِف 13 نقطة على الجوال؛ `BackgroundParticles` أوقِف rAF عند الخفاء وخفّض العدد.
  9. `sizes` لكل `<Image fill>` + ضغط `robot-new.png` < 150KB.
  10. **(تحصين) fail-open:** `SectionPage.tsx:75,187-189` افتراض `hasPaid=false` فشل-مغلق للصفحات غير-المجانية.
  11. `PromoBanner`/`.nav`: قِس ارتفاع البانر (بعد استقرار أنيميشن الدخول) → `--promo-h`؛ `.nav top: var(--promo-h,0px)`؛ padding المحتوى `calc(--promo-h + --header-h)`؛ z-index البانر فوق nav.

- **🔴 التحقق العدائي:**

  **محاولات التفاف يجب أن تفشل:**
  - فتح `/read/section-2/10` مقفولة، حذف blur من DevTools → يجب ألّا يُقرأ النص (المحتوى محذوف لا مُخفى).
  - chunks JS لـ `/read/section-7/1` تحوي جملة من unit7 مدفوع (99KB يُشحَن).
  - حمولة `.rsc/__next_f` لصفحة مقفولة تحمل محتوى مدفوع لغير مصادَق.
  - appendix/glossary/library لا تزال تسرّب.
  - حظر verify-session → الصفحة المقفولة بلا blur (fail-open).
  - sitemap يُعلِن ~160 URL فارغة للزاحف (soft-404).
  - firebase/bcrypt chunk في first-load لـ `/read`.

  **اختبارات عدائية محدّدة:**
  1. `/read/section-2/10` كزائر، احذف `filter:blur` → إن صار النص مقروءاً = فشل.
  2. Network tab JS لـ `/read/section-7/1`، ابحث جملة من عمق unit7 → إن وُجدت فالـ 99KB يُشحَن لكل متصفّح.
  3. `curl` حمولة `.rsc/__next_f` لصفحة مقفولة، grep نصّ مقفول → يجب الغياب.
  4. `/read/appendix/5`, `/read/glossary/3`, `/library/8` كزائر، احذف blur → تأكّد عدم التسريب.
  5. حظر `/api/auth/verify-session` على `/read/section-3/10` → تأكّد عدم ظهور بلا blur.
  6. `/sitemap.xml`: 10 URL غير-مجانية عشوائية، `curl` بلا JS → نصّ قابل للزحف فعلاً (فارغ = soft-404).
  7. `next build` ثم افحص first-load JS لـ `/read/section-1/1` → إن وُجد firebase/bcrypt chunk فالإزالة لم تغطّ القارئ.
  8. فعّل promo على 360px → nav غير مخفيّ خلف البانر، زرّ الإغلاق قابل للنقر، وبعد الإغلاق nav يعود top:0 بلا فجوة `--promo-h`.

  **معايير القبول المحصّنة:**
  - **اختبار تسريب الحزمة السلبي (الحاسم):** بعد `next build`، grep **كل** chunks first-load لصفحة مقفولة (`/read/section-2/10`, `/read/appendix/1`, `/read/glossary/1`, `/library/1`) عن جملة مميّزة من بياناتها → غائبة. نصّ الفصل المقفول لا يظهر في أي chunk لمتصفّح غير مصادَق.
  - **اختبار تسريب DOM runtime:** بعد hydration وحذف blur، `document.body.innerText` لصفحة مقفولة = تشويق + CTA فقط، لا الجسم؛ وحمولة RSC بلا محتوى مقفول.
  - تكرار ذلك لـ appendix/glossary/library صراحةً.
  - **fail-closed:** مع حظر verify-session تُرسَم حالة التشويق لا المحتوى الكامل.
  - first-load `/read` بلا firebase/app, firebase/auth, bcryptjs (لا `/` فقط).
  - **sitemap مبوّب-بالمحتوى:** كل URL يُصدره sitemap يعيد (بلا JS) نصّاً > N حرفاً؛ المقفولة/غير-SSR **مستبعَدة**.
  - **تراجع التظليل:** highlight على صفحة مجانية يُعاد ربطه بعد refactor (استمرارية `data-block-index`).
  - hero في HTML الخادم (`curl /` يطابق 'اختصر' + CTA `/read/intro/1`)؛ حزمة `/` بلا firebase/bcrypt.
  - layout metadata فريدة لـ section-8/9/10.
  - `--promo-h` يُضبَط على الارتفاع المستقرّ ويُصفَّر عند الإغلاق؛ nav top = `var(--promo-h)`؛ padding = `calc(--promo-h + --header-h)` على 1440px و360px.

- **مخاطر:** code-split bcrypt/firebase قد يكسر auth إن افترض callsite التوفّر المتزامن (await كل dynamic import؛ أعِد اختبار signup/الدفع end-to-end)؛ سباق lazy-init firebase (memoize نفس الـ promise)؛ SSR للمحتوى يجب أن يحفظ `data-block-index` (`SectionPage.tsx:443`) وإلّا تنكسر التظليلات؛ عدم تطابق hydration (RTL/motion)؛ `generateStaticParams` يزيد وقت البناء؛ إزالة Motion يجب ألّا تُعيد opacity:0 أوّلي؛ تعطيل الأنيميشن يغيّر التصميم (أكّد مع المالك)؛ `var(--promo-h)` يؤثّر على كل صفحة (تأكّد أن الافتراضي 0px لا يغيّر شيئاً)؛ ضغط poster يؤثّر على OG/video poster؛ كشف الفصول المجانية للفهرسة يجب أن يطابق `freePageLimit` بالضبط.

- **الجهد:** كبير.

---

## خطة التنفيذ المرحلية

### الموجة 1 — P0 (هذا الأسبوع) — "أعطِ سبباً للدفع واطلب المال وحصّل البريد"
- **WS1** Paywall على الخادم — أساس كل شيء (بلا paywall لا سبب للدفع).
- **WS2** توحيد السعر — يجب أن يسبق/يصاحب WS3 (القمع يمرّ عبر أسعار GateModal/payment/LockedOverlay).
- **WS3** القمع يطلب البيع — **يعتمد على WS1** (الرابط المجاني الثانوي بلا paywall = تجميل) و**WS2** (لا يَعرض سعراً لن يُخصَم).
- **WS7** إصلاح أعطال البريد (`plan_id`/`current_plan`، الترحيب، الإلغاء) — كسب سريع لاسترداد دافئين بلا اعتماد على غيره؛ نسخ السعر فيه تعتمد **WS2**.

> ترتيب داخل الموجة: WS2 → WS1 → WS3 (لأن WS3 يستهلك ثوابت WS2 وبوّابة WS1)، وWS7 بالتوازي.

### الموجة 2 — P1 (أسبوعان) — "اجعل التحويل ممكناً وآمناً وقابلاً للقياس"
- **WS5** توحيد الدومين — **يجب أن يسبق WS6** (CAPI `event_source_url` يعتمد على الدومين الحيّ) و**يصاحب WS4** (الصفحات القانونية/الـ footer/الروابط).
- **WS4** المصداقية والصفحات القانونية — متطلّب امتثال بوّابة الدفع وثقة الغريب؛ يتقاطع مع WS5 (دومين/بريد) وWS2 (أسعار `terms`).
- **WS6** تتبّع التحويل — **يعتمد على WS5** (دومين) و**WS2** (قيم EGP) — **بوّابة إلزامية قبل أي إعلان**.
- **WS8** تحصين مسار المال — مستقلّ نسبياً، لكن `event_id` فيه يتقاطع مع WS6 (dedup) ودومين webhook مع WS5.

> تبعية حرجة: **لا تشغّل إعلانات قبل اكتمال WS6 + WS2 + WS1 + WS3.**

### الموجة 3 — P2 (شهر) — "وسّع القناة العضوية والجوال"
- **WS9** السرعة/SSR/SEO — **يعتمد على WS1** (تسريب الحزمة جزء مشترك؛ يجب ألّا يُشحَن المحتوى المقفول)، ويستفيد من WS5 (canonical/sitemap على الدومين الموحّد).

---

## بوابة الجاهزية للإطلاق الإعلاني (Go-Live Checklist)

> كل بند يجب أن يكون **أخضر** قبل صرف أول جنيه على الإعلانات. كلها بنود عدائية (محاولة الالتفاف يجب أن تفشل).

**1) Paywall حقيقي (WS1):**
- [ ] `GET /api/content/section-3/4` بلا كوكيز → 402 بلا `contentBlocks`؛ `.../section-3/1` → 200+جسم.
- [ ] `rg -F '<عبارة مقفولة>' .next/static && public/**` = صفر لكل من: وحدة مقفولة، `specializationContent` expectedOutput، `glossaryData`، `appendixData`، `recapsData` keyQuote.
- [ ] حذف blur من DevTools على صفحة مقفولة (شاملة glossary/appendix/library/التخصص) → لا نص.
- [ ] حظر verify-session → الصفحة المقفولة تبقى مقفولة (فشل-مغلق).
- [ ] `is_active=true` بلا subscription → 200+جسم (لا قفل دافع).
- [ ] حارس CI: صفر مستورِد client لبيانات الكتاب/التخصص/recap/glossary.

**2) السعر موحّد (WS2):**
- [ ] الهبوط + `/payment` + GateModal + LockedOverlay + profile + admin = 99/199/399 (صفر 299/499/999/699/1499 بسياق سعر).
- [ ] ترقية + برومو: المعروض = مبلغ Kashier (البرومو على فرق الترقية).
- [ ] AI56 على basic → 5 ج.م في validate **و** create-session **و** وصف Kashier (خصم 94).
- [ ] `SELECT price FROM plans` = 99/199/399 AND `site_settings.pricing_plans` = 99/199/399 (DB الحيّ).
- [ ] إحصاءات موحّدة: تمارين=48، صفحات=رقم واحد (188+)، قوالب=رقم واحد مؤكَّد، مجاني=محسوب من `SECTION_REGISTRY` (≈51).
- [ ] تعديل أدمن للسعر إمّا مرفوض كلياً أو منتشر لكل سطح (لا حالة وسطية).

**3) القمع يطلب البيع (WS3):**
- [ ] تسجيل بريد/Google جديد → `/payment` (حتى مع `localStorage.user_learning_goal` مسبق).
- [ ] حلقة guest→`/payment`→`/register?next=/payment`→عودة بالباقة محدّدة، بلا dead-end.
- [ ] صفر CTA أساسي → `/read/intro/1` أو `/register` عارٍ في Hero/FinalCTA/MobileStickyBuy/Pricing/GuestBanner/**BookContentsSection/RoadmapPath**/BlogCTA.
- [ ] سعر `/payment` المعروض = ما يخصمه Kashier (مقابل `/api/admin/plans` الحيّ).

**4) المصداقية (WS4):**
- [ ] صفر إحصاءات ملفّقة في DOM/hydration الحيّ (شاملاً `GamificationSection` ولو غير مستورَد)؛ الحارس يمسح كل `landing/*`.
- [ ] `/terms,/privacy,/refund-policy,/about,/contact` → 200 بمضمون حقيقي؛ `refund-policy` يحوي "30"+مسار مطالبة؛ `/about` باسم بشري حقيقي (نشر محجوب على placeholder).
- [ ] footer قانوني على كل مسار (روابط فقط على `/read/*`، بلا كتلة دفع تسويقية، بلا تصادم).
- [ ] كل ضمان مربوط بـ `/refund-policy`؛ رموز دفع حقيقية تُحمَّل؛ لا "بدون بطاقة" يجاور ضمان بلا قصر (Hero+FinalCTA).
- [ ] "قابلة للتحقق" مدعومة بعيّنة شهادة عامة قابلة للزحف أو محذوفة.

**5) الدومين الموحّد (WS5):**
- [ ] `grep -rn 'promptexpert.com|promptexpertbook.com|*.vercel.app|noreply@promptexpert' src/ .env.local` = صفر.
- [ ] `grep -rn 'ar_SA' src/` = صفر.
- [ ] `/api/health` الحيّ يردّد `https://www.prompt-mr.com`.
- [ ] `curl -IL` apex + vercel → 301 واحد لـ www بلا loop.
- [ ] لوحة Kashier + Firebase authorized domains + Resend (SPF/DKIM/DMARC) محدّثة لـ www.

**6) تتبّع التحويل (WS6) — بوّابة الإعلان الأهم:**
- [ ] Purchase/IC/Lead كلها deduped (Browser+Server) بـ event_id مشترك في Meta Test Events.
- [ ] Lead لـ Google signup له CAPI خادمي؛ لا Lead لمستخدم عائد بزر Google.
- [ ] قيمة IC متطابقة client/CAPI في أساس/برومو/ترقية (لا جدول 299/499/999).
- [ ] Purchase value غير-صفري وصحيح حتى لو سبق webhook.
- [ ] `event_source_url` = www على الموقع الحيّ؛ صفر prompt-mr.com حرفي في meta-capi.
- [ ] `981605484819613` في `tracking-config.ts` فقط (شاملاً noscript img).
- [ ] Google Ads يطلق (أو حدّ webhook-only موثّق وكميّ).
- [ ] الحدث الكنسي للربط (Lead vs CompleteRegistration) موثّق.

**7) صلابة مسار المال (WS8):**
- [ ] `verify` و`verify-by-order` يضبطان `is_active=true` (BUG A/B).
- [ ] حارس المبلغ: underpay لا يفعّل، حالة CHECK-صالحة، تنبيه؛ ولا يحجب شرعيّاً (سلسلة/ترقية/برومو).
- [ ] `webhooks/kashier` محذوف **بعد** تأكيد لوحة Kashier تحلّ لـ `/api/payment/webhook`؛ 404.
- [ ] reconcile cron يصالح pending SUCCESS ≤15د؛ Purchase مرّة واحدة (event_id مشترك).
- [ ] كل مسارات المال على `checkRateLimitAsync` **و** Upstash مُعَدّ (`useRedis=true`، مفتاح `rl:*`).
- [ ] 500 للعابر / 200+تنبيه للدائم (لا loop)؛ تنبيه على كل رفض/فشل.

**8) البريد يُرسَل ويصل (WS7):**
- [ ] drip الترقية + السلّة يُرسَلان (`current_plan` لا `plan_id`)؛ دافع (subscription/payment) يصله صفر drip حتى لو `current_plan=NULL`.
- [ ] الترحيب + صف `email_preferences` عند التسجيل؛ إلغاء الاشتراك يعمل من **صفحة العميل** بتسمية عربية لـ upgrade/cart/lead_nurture.
- [ ] دومين Resend مُتحقَّق (فحص آلي يفشل النشر إن لا)؛ البريد يصل Primary بـ SPF/DKIM/DMARC=pass.
- [ ] أي بروموكود في إيميل يقبله **create-session** الحقيقي (أو محذوف).
- [ ] التوقيت بـ Africa/Cairo (DST-صحيح)؛ مستخدم 18:00 يصله تذكير؛ تشغيل فائت لا يتخطّى drip للأبد.

**(P2 — ليس بوّابة إعلان، لكن للقناة العضوية) WS9:**
- [ ] chunk صفحة مقفولة بلا نصّها (يتقاطع مع بند 1)؛ sitemap مبوّب-بالمحتوى؛ hero في SSR؛ `/` و`/read` بلا firebase/bcrypt.
