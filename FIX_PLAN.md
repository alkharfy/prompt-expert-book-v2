# خطة إصلاح المشاكل المتبقية - Prompt Expert Book

> آخر تحديث: 2026-02-20
> الحالة: مرجع للإصلاحات المستقبلية

---

## المشكلة 0: [حرج جداً] التفعيل التلقائي للحسابات الجديدة بدون دفع 🔴 ✅ تم الإصلاح

### الوصف
عند إنشاء أي حساب جديد (بالإيميل عبر AuthSystem أو بحساب Google)، الحساب يتفعل تلقائياً كأن المستخدم دفع. السبب أن عدة أماكن في الكود تضع `is_active: true` عند إنشاء المستخدم، و endpoint التفعيل يثق في هذا الفلاج كدليل على الدفع.

### سلسلة الخطأ الكاملة (قبل الإصلاح)
```
مستخدم جديد يسجل بجوجل
    → POST /api/auth/google
    → يُنشأ بـ is_active: true (خطأ #2)
    → يزور صفحة محمية
    → Middleware يفحص الاشتراك
    → activate endpoint يشوف is_active: true → يرجع hasPaid: true (خطأ #3)
    → المستخدم يحصل على وصول كامل بدون دفع
```

### الإصلاحات المطبقة (5 تغييرات في 4 ملفات)

#### ✅ إصلاح 0.1: `src/lib/auth_system.ts` — تسجيل Client-side
- `is_active: true` → `is_active: false`
- `is_phone_verified: true` → `is_phone_verified: false`

#### ✅ إصلاح 0.2: `src/app/api/auth/google/route.ts` — مستخدم جوجل جديد
- `is_active: true` → `is_active: false`

#### ✅ إصلاح 0.3: `src/app/api/auth/google/route.ts` — مستخدم قديم
- حذف بلوك التفعيل التلقائي `if (!existingUser.is_active) { update is_active: true }`
- استبداله بتحديث `firebase_uid` و `is_verified` فقط (بدون تغيير `is_active`)

#### ✅ إصلاح 0.4: `src/app/api/payment/activate/route.ts` — Legacy Check
- حذف الاعتماد على `is_active` وحده كدليل دفع
- الشرط الجديد: `user.current_plan && user.plan_expires_at && new Date(plan_expires_at) > new Date()`

#### ✅ إصلاح 0.5: `src/lib/subscription.ts` — Strategy 3
- إضافة التحقق من `plan_expires_at` أنه في المستقبل
- الشرط الجديد: `user.is_active && isValid` (حيث isValid = plan_expires_at > now)

#### ✅ إصلاح 0.6: `src/app/api/auth/verify-code/route.ts` — تحقق الكود يفعّل الحساب
- كان: `update({ is_verified: true, is_active: true })` ← يفعّل الحساب عند تأكيد الإيميل!
- أصبح: `update({ is_verified: true })` ← يأكد الإيميل فقط بدون تفعيل الاشتراك

### ⚠️ خطوة يدوية مطلوبة: إصلاح البيانات في قاعدة البيانات
```sql
-- تشغيل هذا في Supabase SQL Editor لإلغاء تفعيل المستخدمين بدون دفع حقيقي
UPDATE users SET is_active = false 
WHERE is_active = true 
AND id NOT IN (
    SELECT DISTINCT user_id FROM payments WHERE status = 'success'
) 
AND id NOT IN (
    SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active'
);
```

---

## المشكلة 1: [حرج] 5 Payment Routes تقبل userId من Body

### الوصف
هذه الـ routes تقبل `userId` من request body بدلاً من استخراجه من cookies، مما يسمح لأي شخص بانتحال هوية مستخدم آخر.

### الملفات المتأثرة

#### 1.1 `src/app/api/payment/verify/route.ts`
- **السطر 108:** `let { sessionId, userId } = body`
- يقبل userId مباشرة من body ويستخدمه للتحقق من المدفوعات

#### 1.2 `src/app/api/payment/verify-by-user/route.ts`
- **السطر 21:** `const { userId } = body`
- يستخدم userId غير موثوق لاستعلام المدفوعات (سطر 50-56)

#### 1.3 `src/app/api/payment/activate/route.ts`
- **السطر 22:** `const { userId } = await request.json()`
- يفعّل اشتراكات لأي userId بدون تحقق

#### 1.4 `src/app/api/payment/verify-by-order/route.ts`
- يحتاج فحص - قد يقبل userId من body أيضاً

#### 1.5 `src/app/api/payment/process-callback/route.ts`
- يحتاج فحص - callback من بوابة الدفع

### خطة الإصلاح
```
لكل route:
1. إضافة import { cookies } from 'next/headers'
2. استخراج userId من cookies بدلاً من body:
   const cookieStore = await cookies()
   const userId = cookieStore.get('ebook_user_id')?.value
3. إضافة التحقق من session_token (انظر المشكلة 2)
4. إرجاع 401 إذا لم يوجد userId في cookies
```

### ملاحظات
- `create-session/route.ts` تم إصلاحه بالفعل كمرجع
- process-callback قد يحتاج معاملة خاصة لأنه يُستدعى من Kashier webhook

---

## المشكلة 2: [عالي] 17 Route تتحقق من user_id فقط بدون session_token

### الوصف
هذه الـ routes تستخرج `ebook_user_id` فقط من cookies بدون التحقق من `ebook_session_token`، مما يعني أن معرفة user_id كافية للوصول.

### الملفات المتأثرة

| # | الملف | الدالة الضعيفة | الأسطر |
|---|-------|---------------|--------|
| 1 | `src/app/api/reading-progress/route.ts` | `getUserIdFromCookies()` | 19-23 |
| 2 | `src/app/api/notes/route.ts` | `getUserIdFromCookies()` | 28-32 |
| 3 | `src/app/api/chat/route.ts` | `getUserIdFromCookies()` | 132-136 |
| 4 | `src/app/api/missions/route.ts` | `getUserIdFromCookies()` | 21-25 |
| 5 | `src/app/api/streak/route.ts` | `getUserIdFromCookies()` | 16-20 |
| 6 | `src/app/api/email/preferences/route.ts` | `getUserIdFromCookies()` | 17-21 |
| 7 | `src/app/api/subscription/status/route.ts` | مباشر | 28-30 |
| 8-17 | باقي الـ routes | متنوع | - |

### خطة الإصلاح: إنشاء middleware مشترك

#### الخطوة 1: إنشاء `src/lib/auth-middleware.ts`
```typescript
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    return createClient(url, key)
}

export async function getAuthenticatedUser(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    const supabase = getSupabaseAdmin()
    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    return session ? userId : null
}
```

#### الخطوة 2: استبدال كل `getUserIdFromCookies()` بـ `getAuthenticatedUser()`
```
في كل ملف:
1. import { getAuthenticatedUser } from '@/lib/auth-middleware'
2. حذف الدالة المحلية getUserIdFromCookies()
3. استبدال الاستدعاء:
   - قبل: const userId = await getUserIdFromCookies()
   - بعد: const userId = await getAuthenticatedUser()
```

### ملاحظات
- `db-operation/route.ts` و `admin/check-access/route.ts` تم إصلاحهم بالفعل كمرجع
- يجب اختبار كل route بعد التغيير للتأكد من عدم كسر الوظائف

---

## المشكلة 3: [متوسط] Race Conditions في Promo Codes ✅ تم الإصلاح

### الوصف
عمليات القراءة ثم الكتابة على `promo_codes.current_uses` غير ذرية (atomic)، مما يسمح لعدة مستخدمين باستخدام نفس الكود تجاوزاً للحد الأقصى.

### المواقع المتأثرة

#### 3.1 فحص الحد الأقصى (Read-then-Check)
- **`src/app/api/promo/validate/route.ts` سطر 51:**
  ```
  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses)
  ```
- **`src/app/api/payment/create-session/route.ts` سطر 115:**
  ```
  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses)
  ```

#### 3.2 تحديث العداد يدوياً (Read-Modify-Write)
- **`src/app/api/payment/create-session/route.ts` أسطر 153-162:**
  ```
  // يقرأ القيمة الحالية
  const { data: currentPromo } = await supabase.from('promo_codes')
      .select('current_uses').eq('id', promo.id).single()
  // يحسب القيمة الجديدة
  const newCount = Math.max(0, currentPromo.current_uses - existingUses.length)
  // يكتب القيمة — بدون حماية من التعديل المتزامن!
  await supabase.from('promo_codes').update({ current_uses: newCount }).eq('id', promo.id)
  ```

#### 3.3 استدعاء RPC بعد التسجيل (Timing Issue)
- **`src/app/api/payment/create-session/route.ts` سطر 259:**
  ```
  await supabase.rpc('increment_promo_uses', { promo_id: promoId })
  ```
  يُستدعى بعد تسجيل الدفع — إذا فشل، العداد يصبح غير متسق

### خطة الإصلاح: استخدام Database Functions

#### الخطوة 1: إنشاء دالة PostgreSQL ذرية
```sql
CREATE OR REPLACE FUNCTION try_use_promo_code(
    p_promo_id UUID,
    p_user_id UUID,
    p_payment_id UUID,
    p_original_amount NUMERIC,
    p_discount_amount NUMERIC,
    p_final_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_uses INT;
    v_max_uses INT;
BEGIN
    -- قفل الصف لمنع التعديل المتزامن
    SELECT current_uses, max_uses INTO v_current_uses, v_max_uses
    FROM promo_codes WHERE id = p_promo_id FOR UPDATE;

    -- فحص الحد الأقصى
    IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
        RETURN FALSE;
    END IF;

    -- تسجيل الاستخدام وزيادة العداد في نفس المعاملة
    INSERT INTO promo_code_uses (promo_code_id, user_id, payment_id, original_amount, discount_amount, final_amount)
    VALUES (p_promo_id, p_user_id, p_payment_id, p_original_amount, p_discount_amount, p_final_amount);

    UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = p_promo_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### الخطوة 2: استبدال الكود في create-session/route.ts
```
حذف أسطر 153-162 (التحديث اليدوي) و 246-260 (التسجيل المنفصل)
استبدالهم باستدعاء واحد:
  const { data: promoUsed } = await supabase.rpc('try_use_promo_code', {
      p_promo_id: promoId,
      p_user_id: userId,
      p_payment_id: paymentRecord.id,
      p_original_amount: plan.price,
      p_discount_amount: discountAmount,
      p_final_amount: finalAmount
  })
```

---

## المشكلة 4: [متوسط] Race Conditions في Streaks ✅ تم الإصلاح

### الوصف
الدالة البديلة `manualStreakUpdate` في streak route تستخدم نمط Read-Modify-Write بدون حماية ذرية.

### الموقع المتأثر
- **`src/app/api/streak/route.ts` أسطر 134-205**
  - سطر 138-142: قراءة البيانات الحالية
  - سطر 144-176: حساب القيم الجديدة في JavaScript
  - سطر 178-188: كتابة القيم بدون قفل

### خطة الإصلاح

#### الخطوة 1: التأكد من وجود دالة `update_user_streak` في PostgreSQL
```sql
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_date DATE;
    v_current INT;
    v_longest INT;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_date, v_current, v_longest
    FROM user_gamification WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO user_gamification (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (p_user_id, 1, 1, v_today);
        RETURN;
    END IF;

    IF v_last_date = v_today THEN
        RETURN; -- تم التحديث اليوم بالفعل
    ELSIF v_last_date = v_today - 1 THEN
        v_current := v_current + 1;
    ELSE
        v_current := 1;
    END IF;

    v_longest := GREATEST(v_longest, v_current);

    UPDATE user_gamification
    SET current_streak = v_current,
        longest_streak = v_longest,
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

#### الخطوة 2: حذف الدالة البديلة وجعل الـ RPC هو المسار الوحيد
```
في streak/route.ts:
- حذف دالة manualStreakUpdate بالكامل (أسطر 134-205)
- في حالة فشل RPC، إرجاع خطأ بدلاً من محاولة التحديث اليدوي
```

---

## المشكلة 5: [متوسط] localStorage للـ Achievements بدون تحقق Server ✅ تم الإصلاح

### الوصف
إنجازات المستخدم تُتبع في localStorage فقط، مما يسمح بالتلاعب عبر DevTools.

### المواقع المتأثرة

| الملف | المفتاح | السطر | الخطورة |
|-------|---------|-------|---------|
| `src/app/achievements/page.tsx` | `claimed_rewards` | 93 | عالي - يحدد الإنجازات المفتوحة |
| `src/app/achievements/page.tsx` | `certificate_shared` | 105 | متوسط |
| `src/app/achievements/page.tsx` | `tools_used` | 108-110 | متوسط |
| `src/app/achievements/page.tsx` | `is_top_10` | 112 | متوسط |
| `src/components/reading/SectionPage.tsx` | `claimed_rewards` | 180-182, 371 | عالي - يسجل المكافآت المطالب بها |
| `src/components/tools/RunningProjectHub.tsx` | `running_project_*` | 53, 62, 72, 77 | منخفض |

### خطة الإصلاح

#### الخطوة 1: إنشاء جدول `user_achievements` في Supabase
```sql
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_id)
);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT USING (user_id = auth.uid());
```

#### الخطوة 2: إنشاء API endpoint
```
src/app/api/achievements/route.ts
- GET: جلب إنجازات المستخدم من قاعدة البيانات
- POST: تسجيل إنجاز جديد (مع التحقق من الشروط server-side)
```

#### الخطوة 3: تحديث achievements/page.tsx
```
- استبدال قراءة localStorage بطلب API
- الاحتفاظ بـ localStorage كـ cache فقط (وليس مصدر الحقيقة)
- التحقق من الإنجازات server-side قبل منحها
```

### ملاحظات
- هذا تغيير هيكلي كبير يحتاج اختبار شامل
- يمكن تنفيذه تدريجياً: البدء بالإنجازات ذات القيمة العالية (المكافآت المالية) أولاً

---

## المشكلة 6: [متوسط] Session Token Generation Fallback ضعيف ✅ تم الإصلاح

### الوصف
عند عدم توفر `crypto.randomUUID()`، يستخدم fallback يعتمد على `Date.now()` و `Math.random()` غير آمنين.

### الموقع
- **`src/lib/auth_system.ts` أسطر 196-201:**
  ```typescript
  private generateSessionToken(): string {
      const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
            + Math.random().toString(36).substring(2, 10)
      return 'sess_' + uuid + '_' + Date.now().toString(36)
  }
  ```

### المخاطر
- `Math.random()` ليس CSPRNG — يمكن التنبؤ به
- `Date.now()` يضيف ~0 bits من entropy (معروف تقريباً)
- المهاجم يحتاج فقط تخمين ~53 bit بدلاً من 128 bit

### خطة الإصلاح
```typescript
private generateSessionToken(): string {
    // crypto.randomUUID متوفر في Node.js 19+ و جميع المتصفحات الحديثة
    // إذا لم يتوفر، استخدم crypto.getRandomValues كبديل آمن
    let uuid: string
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uuid = crypto.randomUUID()
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // بديل آمن باستخدام getRandomValues
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        uuid = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    } else {
        // هذا لا يجب أن يحدث في بيئة Node.js/Browser حديثة
        throw new Error('No secure random generator available')
    }
    return 'sess_' + uuid + '_' + Date.now().toString(36)
}
```

### ملاحظات
- في بيئة Next.js server-side، `crypto` متوفر دائماً
- الـ fallback الأصلي قد لا يُستدعى أبداً عملياً، لكن يجب إصلاحه للأمان

---

## المشكلة 7: [متوسط] FeatureGate يعمل Client-side فقط ✅ تم الإصلاح

### الوصف
المكوّن `FeatureGate` يتحقق من الصلاحيات في المتصفح فقط. الـ middleware يحمي الصفحات الكاملة، لكن المكونات الفرعية داخل الصفحات تعتمد على client-side check فقط.

### المواقع المتأثرة

| الصفحة | الـ Feature | الملف |
|--------|-----------|-------|
| Achievements | `gamification` | `src/app/achievements/page.tsx:273` |
| Exercises | `exercises` | `src/app/exercises/page.tsx:187` |
| Tools | `tools` | `src/app/tools/page.tsx:83` |
| Running Project | `tools` | `src/app/running-project/page.tsx:40` |
| Prompt Hospital | `tools` | `src/app/prompt-hospital/page.tsx:44` |

### خطة الإصلاح
```
الخيار المفضل: التحقق Server-side في layout أو page component
1. في كل page.tsx متأثر:
   - قراءة subscription status من Supabase مباشرة (server component)
   - إذا لم يملك المستخدم الصلاحية → redirect إلى صفحة الترقية
   - حذف FeatureGate wrapper لأنه أصبح غير ضروري

الخيار البديل: إضافة middleware rules
1. في middleware.ts:
   - إضافة مسارات /achievements, /exercises, /tools, /running-project, /prompt-hospital
   - فحص subscription plan وredirect إذا لزم الأمر
```

### ملاحظات
- الـ middleware يحمي بالفعل بعض المسارات — يحتاج التأكد أن كل المسارات مغطاة
- FeatureGate يمكن الاحتفاظ به كتحسين UX إضافي (يخفي الزر قبل المحاولة)

---

## ترتيب الأولوية للتنفيذ

| الأولوية | المشكلة | الجهد المطلوب | التأثير |
|----------|---------|-------------|---------|
| 1 | Payment routes userId من body | صغير | حرج - احتيال مالي |
| 2 | Middleware مشترك للـ session validation | متوسط | عالي - 17 route ضعيف |
| 3 | Session token fallback | صغير | متوسط - ملف واحد |
| 4 | Race conditions promo codes | متوسط | متوسط - يحتاج SQL |
| 5 | Race conditions streaks | صغير | متوسط - حذف fallback |
| 6 | FeatureGate server-side | متوسط | متوسط - 5 صفحات |
| 7 | localStorage achievements | كبير | متوسط - إعادة هيكلة |

---

## ملاحظات عامة

- تشغيل `npm run build` بعد كل تغيير للتأكد من عدم كسر شيء
- اختبار تسجيل الدخول والدفع يدوياً بعد إصلاح المشاكل 1 و 2
- المشاكل 3 و 4 تحتاج تنفيذ SQL migration في Supabase
- المشكلة 7 هي الأكبر من حيث حجم التغييرات المطلوبة

---
---

# 🔴 نتائج الفحص الأمني المتعمق — 2026-02-20

> تم فحص شامل لجميع ملفات المشروع بما يشمل كل API routes، middleware، auth system، payment system، admin routes، cookies، rate limiting، وأي نقطة ضعف ممكنة.

---

## المشكلة 8: [حرج جداً] استبدال الجهاز بدون مصادقة — اختراق أي حساب بمعرفة الإيميل فقط 🔴 ✅ تم الإصلاح

### الوصف
الـ endpoint `/api/auth/devices/replace` يقبل إيميل المستخدم من الـ body بدون أي تحقق من هوية المتصل. أي شخص يعرف إيميل مستخدم يقدر يسرق حسابه بالكامل.

### الملف المتأثر
- **`src/app/api/auth/devices/replace/route.ts`** — الملف بالكامل (146 سطر)

### كيف يعمل الهجوم
```
المهاجم يرسل:
POST /api/auth/devices/replace
{
    "email": "victim@example.com",
    "oldDeviceId": "أي قيمة حتى لو وهمية"
}

→ الخادم يبحث عن المستخدم بالإيميل (سطر 51)
→ يحذف الجهاز القديم (سطر 63) — حتى لو الـ oldDeviceId غلط، الحذف يفشل بصمت
→ يُنشئ جهاز جديد + جلسة جديدة (سطر 97-107)
→ يرسل cookies صالحة للمهاجم (سطر 120-128)
→ المهاجم الآن يملك جلسة صالحة لحساب الضحية!
```

### لماذا هو خطير جداً
- لا يحتاج أي كلمة مرور
- لا يحتاج أي session token
- يكفي فقط معرفة إيميل الضحية (يمكن تخمينه)
- Rate limit موجود لكنه (10 محاولات/5 دقائق) مش كافي لمنع استهداف فردي

### خطة الإصلاح
```typescript
// يجب أن يتطلب مصادقة:
// الخيار 1: المستخدم يكون مسجل دخول بالفعل (يبدل جهاز من جلسة أخرى)
const userId = await getAuthenticatedUser()
if (!userId) return 401

// الخيار 2: يطلب كلمة المرور مع الطلب (إذا كان هذا flow استبدال جهاز أثناء login)
const { email, password, oldDeviceId } = body
// التحقق من كلمة المرور أولاً قبل السماح
```

---

## المشكلة 9: [حرج جداً] DB Operation Proxy يسمح بترقية الحساب لـ Admin + VIP مجاناً 🔴 ✅ تم الإصلاح

### الوصف
الـ endpoint `/api/auth/db-operation` هو proxy عام يسمح للمستخدم بتنفيذ عمليات CRUD على قاعدة البيانات. المشكلة أنه يسمح بتعديل **أي عمود** في جدول `users` بما فيها `is_admin` و `current_plan` و `is_active`.

### الملف المتأثر
- **`src/app/api/auth/db-operation/route.ts`** — أسطر 58, 105-115

### كيف يعمل الهجوم
```json
// هجوم 1: ترقية نفسك لـ Admin
POST /api/auth/db-operation
{
    "operation": "update",
    "table": "users",
    "data": { "is_admin": true }
}

// هجوم 2: تفعيل اشتراك VIP مجاني
POST /api/auth/db-operation
{
    "operation": "update",
    "table": "users",
    "data": {
        "current_plan": "premium",
        "is_active": true,
        "plan_expires_at": "2030-01-01T00:00:00Z"
    }
}

// هجوم 3: إدخال صفوف في users
POST /api/auth/db-operation
{
    "operation": "insert",
    "table": "users",
    "data": { "email": "hacker@evil.com", "is_admin": true }
}
```

### لماذا هو خطير جداً
- `ensureUserFilter` يقيد العمليات على صف المستخدم الحالي فقط — لكن **لا يقيد الأعمدة**
- المستخدم يقدر يخلي نفسه Admin + يفعّل اشتراك مجاني بطلب واحد
- `select('*')` يسمح بقراءة `password_hash` من جدولها

### خطة الإصلاح
```typescript
// إضافة whitelist للأعمدة القابلة للتعديل لكل جدول
const WRITABLE_COLUMNS: Record<string, string[]> = {
    users: ['full_name', 'phone_number'], // فقط البيانات الشخصية
    reading_progress: ['current_page', 'bookmarks', 'completed_chapters', 'completion_percentage'],
    bookmarks: ['section_id', 'page_id', 'note'],
    // sessions و devices و verification_codes: لا يسمح بالتعديل
}

const READABLE_COLUMNS: Record<string, string> = {
    users: 'id, email, full_name, phone_number, is_verified, created_at',
    // ... باقي الجداول
}

// في عملية update: فلترة الأعمدة
case 'update': {
    const allowedCols = WRITABLE_COLUMNS[table]
    if (!allowedCols) return 403
    const safeData: Record<string, any> = {}
    for (const col of allowedCols) {
        if (col in data) safeData[col] = data[col]
    }
    if (Object.keys(safeData).length === 0) return 400
    // ...
}

// في عملية select: منع SELECT *
case 'select': {
    const safeSelect = READABLE_COLUMNS[table] || selectFields || '*'
    query = supabase.from(table).select(safeSelect)
    // ...
}
```

---

## المشكلة 10: [حرج جداً] Profile API يُرجع `password_hash` وكل بيانات المستخدم الحساسة 🔴 ✅ تم الإصلاح

### الوصف
الـ endpoint `/api/user/profile` يستخدم `SELECT *` ويرجع **كل** أعمدة جدول users بما فيها `password_hash`.

### الملف المتأثر
- **`src/app/api/user/profile/route.ts`** — سطر 30, 44, 109

### كيف يعمل الهجوم
```
أي مستخدم مسجل يرسل:
GET /api/user/profile

الاستجابة تحتوي على:
{
    "user": {
        "id": "...",
        "email": "...",
        "password_hash": "$2b$10$...",  ← هاش كلمة المرور!
        "is_admin": false,
        "firebase_uid": "...",
        "current_plan": null,
        ...كل الأعمدة
    }
}
```

### خطة الإصلاح
```typescript
// تحديد الأعمدة المطلوبة فقط
const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, phone_number, is_verified, is_active, created_at')
    .eq('id', userId)
    .single()
```

---

## المشكلة 11: [حرج] Session Token بدون httpOnly في Google Auth و Device Replace 🔴 ✅ تم الإصلاح

### الوصف
كوكيز الـ session token مضبوطة بـ `httpOnly: false` في مسارين، مما يعني أن أي XSS يقدر يسرق الجلسة.

### الملفات المتأثرة

| الملف | httpOnly | المفروض |
|-------|---------|---------|
| `src/app/api/auth/login/route.ts` سطر 198 | `session_token: true` ✅ | صحيح |
| `src/app/api/auth/google/route.ts` سطر 155 | **`false` ❌** | يجب `true` |
| `src/app/api/auth/devices/replace/route.ts` سطر 122 | **`false` ❌** | يجب `true` |

### خطة الإصلاح
```typescript
// في google/route.ts و devices/replace/route.ts:
// session_token يجب أن يكون httpOnly: true
cookieStore.set('ebook_session_token', sessionToken, { 
    ...cookieOptions, 
    httpOnly: true  // ← إضافة هذا
})
// باقي الكوكيز (user_id, device_id) يمكن أن تبقى httpOnly: false
```

---

## المشكلة 12: [حرج] API Routes تتجاوز middleware — ميزات مدفوعة بدون اشتراك ✅ تم الإصلاح

### الوصف
كل مسارات `/api/` معتبرة "عامة" في الـ middleware (سطر 80). يعني أي مستخدم مسجل بدون اشتراك يقدر يستخدم ميزات مدفوعة مباشرة عبر API.

### الملف المتأثر
- **`middleware.ts`** — سطر 80: `pathname.startsWith('/api/')` يجعل كل API routes عامة

### الميزات المدفوعة المتاحة بدون دفع
| API Route | الميزة | التكلفة |
|-----------|--------|---------|
| `/api/chat` | دردشة AI | تكلفة API كل رسالة |
| `/api/prompt-hospital/diagnose` | تشخيص البرومبت | تكلفة API |
| `/api/missions`, `/api/missions/progress` | المهمات (gamification) | — |
| `/api/achievements/claimed` | الإنجازات | — |
| `/api/notes` | الملاحظات | — |

### خطة الإصلاح
```typescript
// إضافة فحص اشتراك في الـ API routes المدفوعة:
// في كل route مدفوع:
import { getUserSubscription } from '@/lib/subscription'

const subscription = await getUserSubscription(userId)
if (!subscription || subscription.status !== 'active') {
    return NextResponse.json(
        { error: 'يرجى الاشتراك لاستخدام هذه الميزة' },
        { status: 403 }
    )
}
```

---

## المشكلة 13: [عالي] Webhook HMAC يستخدم `===` بدلاً من `timingSafeEqual` ✅ تم الإصلاح

### الوصف
مقارنة التوقيع في Kashier webhook تستخدم مقارنة عادية `===` بدلاً من `timingSafeEqual`، مما يسمح بهجوم قياس الوقت (timing attack).

### الملف المتأثر
- **`src/app/api/webhooks/kashier/route.ts`** — سطر 53

### الكود الحالي
```typescript
// مكتوب "مقارنة آمنة" لكنه استخدم === !
const isValid = signature === expectedSignature
```

### خطة الإصلاح
```typescript
import { timingSafeEqual } from 'crypto'

const isValid = signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
```

---

## المشكلة 14: [عالي] process-callback يثق في paymentStatus من redirect كـ fallback ✅ تم الإصلاح

### الوصف
إذا لم يتوفر `kashier_session_id` للتحقق عبر API، الـ process-callback يثق في `paymentStatus` من redirect URL — اللي ممكن يتلاعب بها.

### الملف المتأثر
- **`src/app/api/payment/process-callback/route.ts`** — أسطر 122-125

### الكود الحالي
```typescript
// Fallback: إذا لم يتوفر session_id للتحقق عبر API
if (!verified && !payment.kashier_session_id && 
    (paymentStatus === 'SUCCESS' || paymentStatus === 'success')) {
    verified = true  // ← يثق في بيانات الـ redirect!
}
```

### خطة الإصلاح
```typescript
// حذف الـ fallback بالكامل — يجب دائماً التحقق عبر Kashier API
// إذا لم يتوفر session_id، يرجع خطأ
if (!verified) {
    dbLogger.error(`[process-callback] Cannot verify payment ${payment.id} - no session_id`)
    return NextResponse.json({
        success: false,
        error: 'لم يتم التحقق من الدفع — يرجى التواصل مع الدعم'
    })
}
```

---

## المشكلة 15: [عالي] لا يوجد Rate Limiting على promo/validate — يمكن تخمين أكواد الخصم ✅ تم الإصلاح

### الوصف
الـ endpoint `/api/promo/validate` لا يتطلب مصادقة ولا يوجد عليه rate limiting، مما يسمح بتجربة أكواد خصم بشكل آلي.

### الملف المتأثر
- **`src/app/api/promo/validate/route.ts`**

### خطة الإصلاح
```typescript
// إضافة rate limiting
const rateLimitResult = checkRateLimit(`promo-validate:${clientIP}`, { 
    maxAttempts: 5, windowMs: 60_000  // 5 محاولات في الدقيقة
})
if (!rateLimitResult.allowed) {
    return NextResponse.json({ ok: false, error: 'تم تجاوز الحد' }, { status: 429 })
}
```

---

## المشكلة 16: [عالي] Admin Subscription Routes تستخدم client-side auth ✅ تم الإصلاح

### الوصف
الـ routes `/api/admin/subscriptions/cancel` و `extend` تستخدم `authSystem.getCurrentUserId()` اللي بيقرأ `document.cookie` — وهو undefined في server-side.

### الملفات المتأثرة
- **`src/app/api/admin/subscriptions/cancel/route.ts`** — سطر 30
- **`src/app/api/admin/subscriptions/extend/route.ts`** — سطر 30

### خطة الإصلاح
```typescript
// استبدال:
const userId = authSystem.getCurrentUserId()

// بـ:
import { getAuthenticatedUser } from '@/lib/auth-middleware'
const userId = await getAuthenticatedUser()
```

---

## المشكلة 17: [متوسط] لا يوجد Rate Limiting على Payment Routes ✅ تم الإصلاح

### الملفات المتأثرة
- `src/app/api/payment/create-session/route.ts`
- `src/app/api/payment/verify/route.ts`
- `src/app/api/payment/verify-by-order/route.ts`
- `src/app/api/payment/verify-by-user/route.ts`
- `src/app/api/payment/process-callback/route.ts`
- `src/app/api/payment/activate/route.ts`

### خطة الإصلاح
إضافة rate limiting لكل route:
- `create-session`: 3 محاولات/ساعة لكل مستخدم
- `verify*`: 10 محاولات/دقيقة لكل مستخدم
- `process-callback`: 5 محاولات/دقيقة لكل مستخدم
- `activate`: 10 محاولات/دقيقة لكل مستخدم

---

## المشكلة 18: [متوسط] verify-code يقبل userId من body — يمكن تأكيد حساب شخص آخر ✅ تم الإصلاح

### الوصف
الـ endpoint `/api/auth/verify-code` يقبل `userId` من request body بدون التحقق من هوية المتصل.

### الملف المتأثر
- **`src/app/api/auth/verify-code/route.ts`** — سطر 13

### المخاطر
- Rate limiting مبني على IP+userId — يمكن تجاوزه بتدوير IPs
- يسمح بمحاولة brute-force الكود لحساب شخص آخر
- الكود المكون من أرقام قليلة يسهل تخمينه

### خطة الإصلاح
إضافة lockout على مستوى userId بغض النظر عن الـ IP + تحديد عدد المحاولات لكل كود.

---

## ترتيب الأولوية الجديد (شامل)

| الأولوية | المشكلة | الخطورة | الحالة |
|----------|---------|---------|--------|
| 🔴 1 | #8 Device Replace بدون مصادقة — اختراق حسابات | **حرج جداً** | ✅ تم |
| 🔴 2 | #9 DB Proxy يسمح بترقية لـ Admin + VIP | **حرج جداً** | ✅ تم |
| 🔴 3 | #10 Profile API يرجع password_hash | **حرج جداً** | ✅ تم |
| 🔴 4 | #11 Session Token بدون httpOnly | **حرج** | ✅ تم |
| 🔴 5 | #12 API Routes تتجاوز middleware | **حرج** | ✅ تم |
| 🟠 6 | #13 Webhook HMAC timing attack | **عالي** | ✅ تم |
| 🟠 7 | #14 process-callback يثق في redirect | **عالي** | ✅ تم |
| 🟠 8 | #15 لا rate limit على promo validate | **عالي** | ✅ تم |
| 🟠 9 | #16 Admin routes auth مكسور | **عالي** | ✅ تم |
| 🟡 10 | #1 Payment userId من body | **حرج** | ✅ سابقاً |
| 🟡 11 | #2 Session validation مفقود | **عالي** | ✅ سابقاً |
| 🟡 12 | #17 لا rate limit على payments | **متوسط** | ✅ تم |
| 🟡 13 | #18 verify-code userId من body | **متوسط** | ✅ تم |