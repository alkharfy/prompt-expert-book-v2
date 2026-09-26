# 📋 خطة تطوير نظام الاشتراكات والدفع — كتاب خبير البرومبتات

> **تاريخ الإنشاء:** 12 فبراير 2026  
> **الإصدار:** 1.0  
> **الهدف:** تطوير نظام دفع متكامل عبر كاشير مع تحكم كامل في الوصول للمحتوى حسب الباقة المشتراة

---

## 📑 فهرس الخطة

1. [تحليل الوضع الحالي](#-1-تحليل-الوضع-الحالي)
2. [تعريف الباقات ومستويات الوصول](#-2-تعريف-الباقات-ومستويات-الوصول)
3. [تعديلات قاعدة البيانات](#-3-تعديلات-قاعدة-البيانات)
4. [تطوير نظام التحقق من الباقات (Server-Side)](#-4-تطوير-نظام-التحقق-من-الباقات-server-side)
5. [تطوير Middleware للحماية](#-5-تطوير-middleware-للحماية)
6. [تحديث نظام الدفع عبر كاشير](#-6-تحديث-نظام-الدفع-عبر-كاشير)
7. [تحديث واجهة اختيار الباقات](#-7-تحديث-واجهة-اختيار-الباقات)
8. [تحديث نظام التحكم في المحتوى](#-8-تحديث-نظام-التحكم-في-المحتوى)
9. [تحديث المكونات (Components)](#-9-تحديث-المكونات-components)
10. [تطوير لوحة الإدارة](#-10-تطوير-لوحة-الإدارة)
11. [Webhook للتحديث التلقائي](#-11-webhook-للتحديث-التلقائي)
12. [الاختبار والنشر](#-12-الاختبار-والنشر)
13. [خريطة الملفات المتأثرة](#-13-خريطة-الملفات-المتأثرة)
14. [ترتيب التنفيذ](#-14-ترتيب-التنفيذ)

---

## 🔍 1. تحليل الوضع الحالي

### ✅ ما هو موجود حالياً

| المكون | الحالة | الملف |
|--------|--------|-------|
| تكامل كاشير (إنشاء جلسة + تحقق) | ✅ يعمل | `src/lib/kashier.ts` |
| صفحة اختيار الباقات | ✅ موجودة (3 باقات) | `src/app/payment/page.tsx` |
| صفحة نتيجة الدفع (Callback) | ✅ موجودة | `src/app/payment/callback/page.tsx` |
| API إنشاء جلسة الدفع | ✅ يعمل | `src/app/api/payment/create-session/route.ts` |
| API التحقق من الدفع | ✅ يعمل | `src/app/api/payment/verify/route.ts` |
| جدول المدفوعات في DB | ✅ موجود | `supabase_payments.sql` |
| نظام المصادقة (تسجيل/دخول) | ✅ يعمل | `src/lib/auth_system.ts` |
| التحقق من حالة الدفع | ✅ يعمل (ثنائي: دفع/لا) | `auth_system.ts → checkPaymentStatus()` |
| LockedOverlay للمحتوى المقفل | ✅ يعمل | `src/components/reading/LockedOverlay.tsx` |
| أقسام الكتاب (11 قسم) | ✅ مُعرَّفة | `src/config/sections.ts` |
| نظام النقاط والإنجازات | ✅ يعمل | `src/lib/gamification.ts` |
| نظام التمارين | ✅ يعمل | `src/app/exercises/page.tsx` |
| أدوات البرومبت (مولد/محلل/مقارن) | ✅ يعمل | `src/app/tools/page.tsx` |
| الشهادات | ✅ يعمل | `src/app/achievements/page.tsx` |
| الشات الذكي | ✅ يعمل | `src/app/api/chat/route.ts` |

### ⚠️ المشاكل والنقائص الحرجة

| المشكلة | التفاصيل | الخطورة |
|---------|----------|---------|
| **لا يوجد تمييز بين الباقات** | `checkPaymentStatus()` يتحقق فقط من وجود دفع ناجح بدون النظر لـ `plan_id` | 🔴 حرجة |
| **لا يوجد Middleware** | لا يوجد ملف `middleware.ts` — كل الحماية client-side فقط (يمكن تجاوزها) | 🔴 حرجة |
| **لا يوجد Auth Context** | مجلد `src/context/` فارغ — كل مكون يجلب حالة المصادقة بشكل مستقل | 🟡 متوسطة |
| **الكوكيز غير آمنة** | الكوكيز ليست `httpOnly` (معرضة لـ XSS) | 🟡 متوسطة |
| **تناقض في الأسعار** | الكود: 299/499/999 ج.م — البيانات في DB: 299/699/1499 ج.م | 🟡 متوسطة |
| **لا يوجد حقل باقة في جدول users** | بعد الدفع لا يتم تخزين الباقة على مستوى المستخدم | 🔴 حرجة |
| **لا يوجد تاريخ انتهاء للاشتراك** | الدفع مرة واحدة بدون مدة صلاحية واضحة | 🟡 متوسطة |
| **Rate Limiter في الذاكرة فقط** | يُفقد عند إعادة تشغيل السيرفر ولا يُشارك بين instances | 🟡 متوسطة |
| **نوع payments غير معرف في DB types** | الكود يستخدم `as any` للتعامل مع جدول payments | 🟡 متوسطة |

### 📊 هيكل المحتوى الحالي

```
المحتوى المجاني (بدون تسجيل):
├── المقدمة كاملة (6 صفحات)
└── الفصل 01 — أول 4 صفحات

المحتوى المدفوع (بعد التسجيل والدفع):
├── الفصل 01 — باقي الصفحات (13 صفحة)
├── الفصل 02-10 (18×9 = 162 صفحة)  
├── المكتبة (12 صفحة قوالب)
├── الملحقات (20 صفحة)
├── المسرد (8 صفحات)
├── التمارين التفاعلية (quiz, fill_blank, prompt_builder)
├── الأدوات (مولد/محلل/مقارن البرومبتات)
├── الشات الذكي
├── الشهادة
└── الإنجازات والمتصدرين
```

---

## 💰 2. تعريف الباقات ومستويات الوصول

### الباقات المقترحة

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          الباقة الأساسية (Basic)                        │
│                            💲 299 ج.م                                   │
│─────────────────────────────────────────────────────────────────────────│
│  ✅ قراءة الكتاب كامل (10 فصول + مقدمة + ملحقات + مسرد)              │
│  ✅ مكتبة القوالب (50+ قالب)                                           │
│  ✅ حفظ تقدم القراءة                                                   │
│  ✅ العلامات المرجعية (Bookmarks)                                       │
│  ✅ الوصول لمدة سنة                                                    │
│  ❌ التمارين التفاعلية                                                  │
│  ❌ أدوات البرومبت (مولد/محلل/مقارن)                                   │
│  ❌ الشات الذكي                                                        │
│  ❌ الشهادة                                                            │
│  ❌ نظام النقاط والمتصدرين                                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          الباقة المتقدمة (Pro)                          │
│                       💲 499 ج.م  ⭐ الأكثر شيوعاً                      │
│─────────────────────────────────────────────────────────────────────────│
│  ✅ كل مميزات الأساسية                                                 │
│  ✅ التمارين التفاعلية (اختبارات + ملء فراغات + بناء برومبت)           │
│  ✅ نظام النقاط والإنجازات والمتصدرين                                  │
│  ✅ شهادة إتمام معتمدة                                                 │
│  ✅ تحديثات مجانية مدى الحياة                                           │
│  ❌ أدوات البرومبت (مولد/محلل/مقارن)                                   │
│  ❌ الشات الذكي                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          باقة VIP                                       │
│                            💲 999 ج.م                                   │
│─────────────────────────────────────────────────────────────────────────│
│  ✅ كل مميزات المتقدمة                                                 │
│  ✅ أدوات البرومبت (مولد/محلل/مقارن الردود)                            │
│  ✅ الشات الذكي (مساعد AI شخصي)                                        │
│  ✅ دعم أولوية                                                         │
│  ✅ وصول مبكر للمحتوى الجديد                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### جدول صلاحيات الباقات (Permission Matrix)

| الميزة | مجاني | basic | pro | vip |
|--------|-------|-------|-----|-----|
| المقدمة | ✅ | ✅ | ✅ | ✅ |
| الفصل 1 (أول 4 صفحات) | ✅ | ✅ | ✅ | ✅ |
| الفصل 1 (كامل) | ❌ | ✅ | ✅ | ✅ |
| الفصول 2-10 | ❌ | ✅ | ✅ | ✅ |
| المكتبة | ❌ | ✅ | ✅ | ✅ |
| الملحقات والمسرد | ❌ | ✅ | ✅ | ✅ |
| العلامات المرجعية | ❌ | ✅ | ✅ | ✅ |
| حفظ تقدم القراءة | ❌ | ✅ | ✅ | ✅ |
| التمارين التفاعلية | ❌ | ❌ | ✅ | ✅ |
| نظام النقاط والإنجازات | ❌ | ❌ | ✅ | ✅ |
| المتصدرين (مشاركة) | ❌ | ❌ | ✅ | ✅ |
| المتصدرين (مشاهدة) | ✅ | ✅ | ✅ | ✅ |
| الشهادة | ❌ | ❌ | ✅ | ✅ |
| مولد البرومبتات | ❌ | ❌ | ❌ | ✅ |
| محلل البرومبتات | ❌ | ❌ | ❌ | ✅ |
| مقارن الردود | ❌ | ❌ | ❌ | ✅ |
| الشات الذكي | ❌ | ❌ | ❌ | ✅ |

---

## 🗄️ 3. تعديلات قاعدة البيانات

### 3.1 إضافة جدول الاشتراكات (subscriptions)

```sql
-- =====================================================
-- جدول الاشتراكات — Subscriptions Table
-- يربط المستخدم بالباقة المفعلة وتاريخ الانتهاء
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- ربط بالمستخدم (مستخدم واحد = اشتراك واحد نشط)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- بيانات الباقة
    plan_id TEXT NOT NULL CHECK (plan_id IN ('basic', 'pro', 'vip')),
    
    -- ربط بعملية الدفع
    payment_id UUID REFERENCES payments(id),
    
    -- الحالة
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'upgraded')),
    
    -- التواريخ
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,  -- تاريخ انتهاء الاشتراك
    
    -- الترقية
    upgraded_from UUID REFERENCES subscriptions(id),  -- إذا تم الترقية من باقة سابقة
    
    -- تتبع
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للبحث السريع
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);
CREATE UNIQUE INDEX idx_subscriptions_active_user ON subscriptions(user_id) WHERE status = 'active';

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription"
    ON subscriptions FOR SELECT
    USING (true);  -- service_role يتحقق في الـ API

CREATE POLICY "service_manage_subscriptions"
    ON subscriptions FOR ALL
    USING (true);
```

### 3.2 إضافة جدول صلاحيات الباقات (plan_features)

```sql
-- =====================================================
-- جدول صلاحيات الباقات — Plan Features Lookup
-- يحدد ما يتضمنه كل مستوى اشتراك
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('basic', 'pro', 'vip')),
    feature_key TEXT NOT NULL,  -- مفتاح الميزة
    is_enabled BOOLEAN DEFAULT true,
    
    UNIQUE(plan_id, feature_key)
);

-- بيانات الصلاحيات
INSERT INTO plan_features (plan_id, feature_key) VALUES
    -- Basic
    ('basic', 'reading'),
    ('basic', 'bookmarks'),
    ('basic', 'library'),
    ('basic', 'progress_tracking'),
    -- Pro
    ('pro', 'reading'),
    ('pro', 'bookmarks'),
    ('pro', 'library'),
    ('pro', 'progress_tracking'),
    ('pro', 'exercises'),
    ('pro', 'gamification'),
    ('pro', 'leaderboard'),
    ('pro', 'certificate'),
    -- VIP
    ('vip', 'reading'),
    ('vip', 'bookmarks'),
    ('vip', 'library'),
    ('vip', 'progress_tracking'),
    ('vip', 'exercises'),
    ('vip', 'gamification'),
    ('vip', 'leaderboard'),
    ('vip', 'certificate'),
    ('vip', 'tools'),
    ('vip', 'chat');
```

### 3.3 تحديث جدول users — إضافة حقل الباقة

```sql
-- إضافة أعمدة الباقة للمستخدم (للوصول السريع بدون JOIN)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_plan TEXT DEFAULT NULL 
    CHECK (current_plan IN ('basic', 'pro', 'vip', NULL));
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL;
```

### 3.4 دالة التحقق من الصلاحية

```sql
-- =====================================================
-- دالة للتحقق من صلاحية المستخدم لميزة معينة
-- =====================================================

CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
BEGIN
    -- جلب الباقة النشطة
    SELECT plan_id INTO v_plan
    FROM subscriptions
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_plan IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- التحقق من الميزة
    RETURN EXISTS (
        SELECT 1 FROM plan_features
        WHERE plan_id = v_plan
          AND feature_key = p_feature
          AND is_enabled = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- دالة جلب باقة المستخدم النشطة
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE(plan_id TEXT, expires_at TIMESTAMPTZ, status TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.plan_id, s.expires_at, s.status
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND s.expires_at > NOW()
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.5 تحديث database.types.ts

```typescript
// إضافة في src/lib/database.types.ts

// داخل Tables:
subscriptions: {
    Row: {
        id: string
        user_id: string
        plan_id: 'basic' | 'pro' | 'vip'
        payment_id: string | null
        status: 'active' | 'expired' | 'cancelled' | 'upgraded'
        starts_at: string
        expires_at: string
        upgraded_from: string | null
        created_at: string
        updated_at: string
    }
    Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
}

plan_features: {
    Row: {
        id: string
        plan_id: 'basic' | 'pro' | 'vip'
        feature_key: string
        is_enabled: boolean
    }
    Insert: Omit<Database['public']['Tables']['plan_features']['Row'], 'id'>
    Update: Partial<Database['public']['Tables']['plan_features']['Row']>
}

// تحديث users:
// إضافة:
//   current_plan: 'basic' | 'pro' | 'vip' | null
//   plan_expires_at: string | null

// إضافة نوع payments المفقود:
payments: {
    Row: {
        id: string
        user_id: string
        kashier_session_id: string | null
        kashier_order_id: string
        amount: number
        currency: string
        plan_id: 'basic' | 'pro' | 'vip'
        payment_method: string | null
        status: 'pending' | 'success' | 'failed' | 'expired'
        created_at: string
        paid_at: string | null
        notes: string | null
    }
    Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
    Update: Partial<Database['public']['Tables']['payments']['Row']>
}
```

---

## 🔐 4. تطوير نظام التحقق من الباقات (Server-Side)

### 4.1 إنشاء ملف جديد: `src/lib/subscription.ts`

```typescript
// Subscription System — نظام إدارة الاشتراكات
// يتحقق من باقة المستخدم وصلاحياته

import { supabase } from './supabase'
import { dbLogger } from './logger'

// ============ أنواع الباقات ============

export type PlanId = 'basic' | 'pro' | 'vip'

export type FeatureKey = 
    | 'reading'      // قراءة الكتاب
    | 'bookmarks'    // العلامات المرجعية
    | 'library'      // مكتبة القوالب
    | 'progress_tracking' // تتبع التقدم
    | 'exercises'    // التمارين التفاعلية
    | 'gamification' // النقاط والإنجازات
    | 'leaderboard'  // المتصدرين
    | 'certificate'  // الشهادة
    | 'tools'        // أدوات البرومبت
    | 'chat'         // الشات الذكي

// ============ خريطة الصلاحيات (In-Memory Cache) ============

const PLAN_FEATURES: Record<PlanId, FeatureKey[]> = {
    basic: ['reading', 'bookmarks', 'library', 'progress_tracking'],
    pro: ['reading', 'bookmarks', 'library', 'progress_tracking', 
          'exercises', 'gamification', 'leaderboard', 'certificate'],
    vip: ['reading', 'bookmarks', 'library', 'progress_tracking',
          'exercises', 'gamification', 'leaderboard', 'certificate',
          'tools', 'chat']
}

// ============ أسعار الباقات ============

export const PLAN_PRICES: Record<PlanId, { name: string; nameAr: string; price: number; duration: number }> = {
    basic: { name: 'Basic', nameAr: 'الأساسية', price: 299, duration: 365 },
    pro:   { name: 'Pro', nameAr: 'المتقدمة', price: 499, duration: 365 },
    vip:   { name: 'VIP', nameAr: 'VIP', price: 999, duration: 365 }
}

// ============ دوال التحقق ============

export interface UserSubscription {
    planId: PlanId
    status: 'active' | 'expired' | 'cancelled'
    expiresAt: string
    features: FeatureKey[]
}

/**
 * جلب اشتراك المستخدم النشط
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('plan_id, status, expires_at')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error || !data) return null

        const planId = data.plan_id as PlanId
        return {
            planId,
            status: data.status,
            expiresAt: data.expires_at,
            features: PLAN_FEATURES[planId] || []
        }
    } catch (err) {
        dbLogger.error('Error fetching subscription', err)
        return null
    }
}

/**
 * التحقق من أن المستخدم يملك صلاحية لميزة معينة
 */
export async function userHasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
    const sub = await getUserSubscription(userId)
    if (!sub) return false
    return sub.features.includes(feature)
}

/**
 * التحقق السريع من الباقة (بدون جلب التفاصيل)
 */
export function planHasFeature(planId: PlanId, feature: FeatureKey): boolean {
    return PLAN_FEATURES[planId]?.includes(feature) ?? false
}

/**
 * تفعيل اشتراك بعد الدفع الناجح
 */
export async function activateSubscription(
    userId: string, 
    planId: PlanId, 
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const plan = PLAN_PRICES[planId]
        if (!plan) return { success: false, error: 'باقة غير صالحة' }

        const now = new Date()
        const expiresAt = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000)

        // إلغاء أي اشتراك نشط سابق
        await supabase
            .from('subscriptions')
            .update({ status: 'upgraded', updated_at: now.toISOString() })
            .eq('user_id', userId)
            .eq('status', 'active')

        // إنشاء الاشتراك الجديد
        const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: planId,
                payment_id: paymentId,
                status: 'active',
                starts_at: now.toISOString(),
                expires_at: expiresAt.toISOString()
            })

        if (insertError) {
            dbLogger.error('Error creating subscription', insertError)
            return { success: false, error: 'فشل في تفعيل الاشتراك' }
        }

        // تحديث الباقة في جدول المستخدم (للوصول السريع)
        await supabase
            .from('users')
            .update({ 
                current_plan: planId,
                plan_expires_at: expiresAt.toISOString()
            })
            .eq('id', userId)

        return { success: true }
    } catch (err) {
        dbLogger.error('Error activating subscription', err)
        return { success: false, error: 'حدث خطأ في تفعيل الاشتراك' }
    }
}

/**
 * الترقية من باقة لأخرى
 */
export async function upgradeSubscription(
    userId: string,
    newPlanId: PlanId,
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    // نفس منطق التفعيل — الاشتراك القديم يتحول لـ 'upgraded'
    return activateSubscription(userId, newPlanId, paymentId)
}
```

### 4.2 إنشاء API للتحقق من الصلاحية: `src/app/api/subscription/check/route.ts`

```typescript
// GET /api/subscription/check?userId=xxx
// أو
// GET /api/subscription/check?userId=xxx&feature=exercises

import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscription, userHasFeature } from '@/lib/subscription'

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId')
    const feature = request.nextUrl.searchParams.get('feature')

    if (!userId) {
        return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })
    }

    // إذا تم تحديد ميزة، تحقق منها فقط
    if (feature) {
        const hasAccess = await userHasFeature(userId, feature as any)
        return NextResponse.json({ hasAccess, feature })
    }

    // وإلا أرجع تفاصيل الاشتراك كاملة
    const subscription = await getUserSubscription(userId)
    
    return NextResponse.json({
        hasSubscription: !!subscription,
        subscription: subscription ? {
            planId: subscription.planId,
            status: subscription.status,
            expiresAt: subscription.expiresAt,
            features: subscription.features
        } : null
    })
}
```

---

## 🛡️ 5. تطوير Middleware للحماية

### 5.1 إنشاء ملف `book2/middleware.ts` (الجذر)

> **ملاحظة هامة:** حالياً لا يوجد أي middleware — هذا يعني أن أي شخص يمكنه الوصول لأي route مباشرة عبر URL.

```typescript
// middleware.ts — حماية المسارات على مستوى السيرفر
import { NextRequest, NextResponse } from 'next/server'

// المسارات المحمية وما تحتاجه من صلاحيات
const PROTECTED_ROUTES: Record<string, string | null> = {
    // null = يحتاج تسجيل دخول فقط (أي باقة)
    '/read/section-2': 'reading',
    '/read/section-3': 'reading',
    '/read/section-4': 'reading',
    '/read/section-5': 'reading',
    '/read/section-6': 'reading',
    '/read/section-7': 'reading',
    '/read/section-8': 'reading',
    '/read/section-9': 'reading',
    '/read/section-10': 'reading',
    '/read/appendix': 'reading',
    '/read/glossary': 'reading',
    '/library': 'reading',
    '/exercises': 'exercises',
    '/tools': 'tools',
    '/achievements': null,  // أي مستخدم مسجل
    '/leaderboard': null,
    '/bookmarks': 'bookmarks',
    '/profile': null,
}

// المسارات المحمية للـ API
const PROTECTED_API_ROUTES: Record<string, string> = {
    '/api/chat': 'chat',
    '/api/exercises': 'exercises',
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // تحقق من الكوكيز
    const sessionToken = request.cookies.get('ebook_session_token')?.value
    const userId = request.cookies.get('ebook_user_id')?.value
    const deviceId = request.cookies.get('ebook_device_id')?.value

    const isAuthenticated = !!(sessionToken && userId && deviceId)

    // تحقق من المسارات المحمية
    for (const [route, feature] of Object.entries(PROTECTED_ROUTES)) {
        if (pathname.startsWith(route)) {
            if (!isAuthenticated) {
                // غير مسجل → صفحة الدخول
                const loginUrl = new URL('/login', request.url)
                loginUrl.searchParams.set('next', pathname)
                return NextResponse.redirect(loginUrl)
            }
            // ملاحظة: التحقق من الباقة يتم على مستوى الـ component/API
            // لأن الـ middleware لا يمكنه الاتصال بقاعدة البيانات بسهولة في Edge Runtime
            break
        }
    }

    // حماية API routes
    for (const [route, feature] of Object.entries(PROTECTED_API_ROUTES)) {
        if (pathname.startsWith(route) && !isAuthenticated) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/read/:path*',
        '/library/:path*',
        '/exercises/:path*',
        '/tools/:path*',
        '/achievements/:path*',
        '/bookmarks/:path*',
        '/profile/:path*',
        '/api/chat/:path*',
    ]
}
```

---

## 💳 6. تحديث نظام الدفع عبر كاشير

### 6.1 تحديث `src/app/api/payment/create-session/route.ts`

**التغييرات المطلوبة:**
- توحيد الأسعار مع `PLAN_PRICES` من `subscription.ts`
- إزالة الأسعار المكررة hardcoded

```typescript
// التغيير المطلوب في create-session/route.ts:

// بدلاً من:
const plans: Record<string, { name: string; price: number }> = {
    basic: { name: 'الأساسية', price: 299 },
    pro: { name: 'المتقدمة', price: 499 },
    vip: { name: 'VIP', price: 999 }
}

// يصبح:
import { PLAN_PRICES } from '@/lib/subscription'

const plan = PLAN_PRICES[planId as PlanId]
if (!plan) {
    return NextResponse.json({ error: 'باقة غير صالحة' }, { status: 400 })
}

// واستخدام plan.price و plan.nameAr
```

### 6.2 تحديث `src/app/api/payment/verify/route.ts`

**التغييرات المطلوبة:**
- بعد التحقق من الدفع الناجح → تفعيل الاشتراك تلقائياً

```typescript
// بعد التأكد من verifyResult.paid:

import { activateSubscription } from '@/lib/subscription'

if (verifyResult.paid) {
    // 1. تحديث حالة الدفع
    await supabase.from('payments').update({
        status: 'success',
        paid_at: new Date().toISOString(),
        payment_method: verifyResult.data?.method || null
    }).eq('kashier_session_id', sessionId)

    // 2. جلب plan_id من سجل الدفع
    const { data: paymentRecord } = await supabase
        .from('payments')
        .select('id, plan_id')
        .eq('kashier_session_id', sessionId)
        .single()

    // 3. تفعيل الاشتراك ✨
    if (paymentRecord) {
        await activateSubscription(
            userId, 
            paymentRecord.plan_id as PlanId, 
            paymentRecord.id
        )
    }

    return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'تم الدفع وتفعيل الاشتراك بنجاح',
        userId,
        planId: paymentRecord?.plan_id
    })
}
```

### 6.3 إنشاء Webhook Endpoint: `src/app/api/payment/webhook/route.ts`

> **لماذا؟** إذا أغلق المستخدم المتصفح بعد الدفع قبل العودة للـ callback، يضمن الـ webhook تفعيل اشتراكه.

```typescript
// POST /api/payment/webhook
// يستقبل إشعارات من كاشير عند تغيير حالة الدفع

import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSession } from '@/lib/kashier'
import { activateSubscription } from '@/lib/subscription'
import { supabase } from '@/lib/supabase'
import { dbLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, paymentStatus, orderId } = body

        dbLogger.info('Webhook received:', { sessionId, paymentStatus, orderId })

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
        }

        // التحقق من كاشير
        const verifyResult = await verifyPaymentSession(sessionId)

        if (verifyResult.paid) {
            // جلب بيانات الدفع
            const { data: payment } = await supabase
                .from('payments')
                .select('id, user_id, plan_id, status')
                .eq('kashier_session_id', sessionId)
                .single()

            if (payment && payment.status !== 'success') {
                // تحديث حالة الدفع
                await supabase.from('payments').update({
                    status: 'success',
                    paid_at: new Date().toISOString(),
                    payment_method: verifyResult.data?.method || null
                }).eq('id', payment.id)

                // تفعيل الاشتراك
                await activateSubscription(
                    payment.user_id,
                    payment.plan_id,
                    payment.id
                )

                dbLogger.info('Subscription activated via webhook', { 
                    userId: payment.user_id, 
                    planId: payment.plan_id 
                })
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        dbLogger.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
```

---

## 🎨 7. تحديث واجهة اختيار الباقات

### 7.1 تحديث `src/app/payment/page.tsx`

**التغييرات المطلوبة:**

```typescript
// استيراد الأسعار من المصدر الموحد
// بدلاً من تعريف PLANS محلياً:

const PLANS: PlanInfo[] = [
    {
        id: 'basic',
        name: 'الأساسية',
        price: 299,
        features: [
            'الكتاب كامل (10 فصول + مكتبة + ملحقات)',
            'حفظ تقدم القراءة',
            'العلامات المرجعية',
            'الوصول لمدة سنة'
        ],
        excluded: [  // ✨ جديد — ميزات غير متاحة
            'التمارين التفاعلية',
            'أدوات البرومبت',
            'الشات الذكي',
            'الشهادة'
        ]
    },
    {
        id: 'pro',
        name: 'المتقدمة',
        price: 499,
        popular: true,  // ✨ علامة الأكثر شيوعاً
        features: [
            'كل مميزات الأساسية',
            'التمارين التفاعلية (اختبارات + بناء برومبت)',
            'نظام النقاط والإنجازات',
            'شهادة إتمام معتمدة',
            'تحديثات مجانية مدى الحياة'
        ],
        excluded: [
            'أدوات البرومبت',
            'الشات الذكي'
        ]
    },
    {
        id: 'vip',
        name: 'VIP',
        price: 999,
        features: [
            'كل مميزات المتقدمة',
            'مولد البرومبتات الذكي',
            'محلل البرومبتات',
            'مقارن الردود',
            'الشات الذكي (مساعد AI شخصي)',
            'دعم أولوية',
            'وصول مبكر للمحتوى الجديد'
        ],
        excluded: []
    }
]
```

### 7.2 إضافة صفحة ترقية الباقة: `src/app/payment/upgrade/page.tsx`

> **لماذا؟** مستخدم باقة Basic يحتاج طريقة للترقية لـ Pro أو VIP

```
الوظيفة:
1. يعرض الباقة الحالية
2. يعرض الباقات الأعلى مع فارق السعر
3. يحوّل لصفحة الدفع بالمبلغ الكامل للباقة الجديدة
4. بعد الدفع → يلغي الباقة القديمة ويفعل الجديدة
```

---

## 🔒 8. تحديث نظام التحكم في المحتوى

### 8.1 تحديث `src/lib/auth_system.ts`

**التغييرات على `checkPaymentStatus()`:**

```typescript
// الدالة الحالية (تبقى للتوافق):
async checkPaymentStatus(userId?: string): Promise<boolean> {
    // ... الكود الحالي يبقى كما هو
}

// ✨ دالة جديدة — التحقق من الباقة والميزات:
async checkFeatureAccess(feature: FeatureKey, userId?: string): Promise<{
    hasAccess: boolean
    planId: PlanId | null
    needsUpgrade: boolean
}> {
    const targetUserId = userId || this.getCurrentUserId()
    if (!targetUserId) return { hasAccess: false, planId: null, needsUpgrade: false }

    const subscription = await getUserSubscription(targetUserId)
    
    if (!subscription) {
        return { hasAccess: false, planId: null, needsUpgrade: false }
    }

    const hasAccess = subscription.features.includes(feature)
    return {
        hasAccess,
        planId: subscription.planId,
        needsUpgrade: !hasAccess
    }
}

// ✨ جلب معلومات الاشتراك كاملة:
async getSubscriptionInfo(userId?: string): Promise<UserSubscription | null> {
    const targetUserId = userId || this.getCurrentUserId()
    if (!targetUserId) return null
    return getUserSubscription(targetUserId)
}
```

### 8.2 تحديث `src/components/reading/LockedOverlay.tsx`

**التغييرات المطلوبة:**
- إضافة حالة `needs_upgrade` — المستخدم دفع لكن باقته لا تشمل هذه الميزة
- عرض رسالة مخصصة حسب الحالة

```typescript
type UserStatus = 'loading' | 'unauthenticated' | 'unpaid' | 'needs_upgrade' | 'paid'

// في checkStatus:
const subscription = await authSystem.getSubscriptionInfo(userId)

if (!subscription) {
    setStatus('unpaid')  // لم يدفع أصلاً
} else if (!subscription.features.includes(requiredFeature)) {
    setStatus('needs_upgrade')  // دفع لكن باقة أقل
    setCurrentPlan(subscription.planId)
} else {
    setStatus('paid')
    onClose()
}

// رسائل مختلفة حسب الحالة:
// unpaid → "اشترك الآن للوصول" → /payment
// needs_upgrade → "هذه الميزة متاحة في باقة Pro/VIP — رقّي باقتك" → /payment/upgrade
```

### 8.3 إنشاء ملف جديد: `src/components/FeatureGate.tsx`

> **مكون عام** يغلف أي محتوى ويتحقق من الصلاحية

```typescript
'use client'

interface FeatureGateProps {
    feature: FeatureKey
    children: React.ReactNode
    fallback?: React.ReactNode  // ما يظهر لو مش مسموح
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)
    const [subscription, setSubscription] = useState<UserSubscription | null>(null)

    useEffect(() => {
        const check = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) { setHasAccess(false); return }
            
            const sub = await authSystem.getSubscriptionInfo(userId)
            setSubscription(sub)
            setHasAccess(sub?.features.includes(feature) ?? false)
        }
        check()
    }, [feature])

    if (hasAccess === null) return <LoadingSpinner />
    if (!hasAccess) return fallback || <UpgradePrompt feature={feature} currentPlan={subscription?.planId} />
    return <>{children}</>
}
```

---

## 🧩 9. تحديث المكونات (Components)

### 9.1 تحديث `src/app/exercises/page.tsx`

```typescript
// إضافة في بداية الـ component:
import FeatureGate from '@/components/FeatureGate'

// تغليف المحتوى:
return (
    <FeatureGate feature="exercises" fallback={<ExercisesLockedPage />}>
        {/* المحتوى الحالي للتمارين */}
    </FeatureGate>
)
```

### 9.2 تحديث `src/app/tools/page.tsx`

```typescript
// تغليف كل أداة:
return (
    <FeatureGate feature="tools" fallback={<ToolsLockedPage />}>
        {/* أدوات البرومبت */}
    </FeatureGate>
)
```

### 9.3 تحديث `src/app/api/chat/route.ts`

```typescript
// إضافة تحقق من الباقة قبل معالجة الرسالة:
import { userHasFeature } from '@/lib/subscription'

export async function POST(request: NextRequest) {
    const { userId, message } = await request.json()

    // التحقق من صلاحية الشات
    const hasChat = await userHasFeature(userId, 'chat')
    if (!hasChat) {
        return NextResponse.json({ 
            error: 'الشات الذكي متاح في باقة VIP فقط',
            needsUpgrade: true,
            requiredPlan: 'vip'
        }, { status: 403 })
    }

    // ... باقي الكود الحالي
}
```

### 9.4 تحديث `src/app/achievements/page.tsx`

```typescript
// الشهادة تحتاج باقة Pro أو VIP:
import { userHasFeature } from '@/lib/subscription'

// في قسم الشهادة:
const canGetCertificate = await userHasFeature(userId, 'certificate')
if (!canGetCertificate) {
    // عرض رسالة "الشهادة متاحة في باقة المتقدمة أو VIP"
}
```

### 9.5 تحديث `src/components/Navigation.tsx`

```typescript
// بدلاً من checkPaymentStatus (boolean):
// استخدام getSubscriptionInfo للحصول على الباقة

const subscription = await authSystem.getSubscriptionInfo(userId)
setIsPaid(!!subscription)
setPlanId(subscription?.planId || null)

// إخفاء/إظهار عناصر القائمة حسب الباقة:
// - التمارين: pro + vip فقط
// - الأدوات: vip فقط
// - الشات: vip فقط
```

### 9.6 إنشاء `src/context/SubscriptionContext.tsx`

> **لماذا؟** تجنب تكرار جلب بيانات الاشتراك في كل مكون

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authSystem } from '@/lib/auth_system'
import type { UserSubscription, FeatureKey } from '@/lib/subscription'

interface SubscriptionContextType {
    subscription: UserSubscription | null
    isLoading: boolean
    hasFeature: (feature: FeatureKey) => boolean
    refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    subscription: null,
    isLoading: true,
    hasFeature: () => false,
    refresh: async () => {}
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [subscription, setSubscription] = useState<UserSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refresh = async () => {
        const sub = await authSystem.getSubscriptionInfo()
        setSubscription(sub)
        setIsLoading(false)
    }

    useEffect(() => { refresh() }, [])

    const hasFeature = (feature: FeatureKey) => {
        return subscription?.features.includes(feature) ?? false
    }

    return (
        <SubscriptionContext.Provider value={{ subscription, isLoading, hasFeature, refresh }}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export const useSubscription = () => useContext(SubscriptionContext)
```

### 9.7 تحديث `src/app/layout.tsx`

```typescript
// تغليف التطبيق بـ SubscriptionProvider:
import { SubscriptionProvider } from '@/context/SubscriptionContext'

export default function RootLayout({ children }) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <SubscriptionProvider>
                    {children}
                </SubscriptionProvider>
            </body>
        </html>
    )
}
```

---

## 👨‍💼 10. تطوير لوحة الإدارة

### 10.1 صفحة إدارة الاشتراكات: `src/app/admin/subscriptions/page.tsx`

```
الوظائف:
├── عرض جميع الاشتراكات (مع فلاتر: نشط/منتهي/ملغي)
├── البحث بالإيميل أو الاسم
├── عرض تفاصيل اشتراك (الباقة، تاريخ البدء، الانتهاء، الدفعات)
├── تفعيل/إلغاء اشتراك يدوياً
├── تمديد اشتراك
├── تغيير باقة مستخدم
└── إحصائيات:
    ├── عدد المشتركين حسب الباقة
    ├── الإيرادات الشهرية
    ├── معدل التجديد
    └── أكثر الباقات مبيعاً
```

### 10.2 API إدارة الاشتراكات: `src/app/api/admin/subscriptions/route.ts`

```
GET  /api/admin/subscriptions         → قائمة الاشتراكات (مع pagination)
POST /api/admin/subscriptions/activate → تفعيل يدوي
POST /api/admin/subscriptions/cancel   → إلغاء
POST /api/admin/subscriptions/extend   → تمديد
```

---

## 🔔 11. Webhook للتحديث التلقائي

### 11.1 تحديث `src/lib/kashier.ts`

```typescript
// إضافة webhookUrl في createPaymentSession:

const sessionResult = await createPaymentSession({
    orderId,
    amount: plan.price.toFixed(2),
    customerEmail: user.email,
    customerReference: userId,
    description: `اشتراك - باقة ${plan.nameAr}`,
    redirectUrl,
    webhookUrl: `${baseUrl}/api/payment/webhook`  // ✨ جديد
})
```

### 11.2 إعدادات كاشير Dashboard

```
في لوحة تحكم كاشير:
1. Settings → Webhooks
2. إضافة URL: https://your-domain.com/api/payment/webhook
3. Events: payment.success, payment.failed
4. اختبار الـ webhook
```

---

## 🧪 12. الاختبار والنشر

### 12.1 خطة الاختبار

```
┌──────────────────────────────────────────────────────────────┐
│                    سيناريوهات الاختبار                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. مستخدم جديد (غير مسجل):                                 │
│     ✓ يرى المقدمة + أول 4 صفحات من الفصل 1                  │
│     ✓ يُمنع من الوصول لباقي الفصول                           │
│     ✓ يُمنع من التمارين والأدوات                             │
│     ✓ يُحوَّل لصفحة التسجيل                                 │
│                                                              │
│  2. مستخدم مسجل (بدون دفع):                                 │
│     ✓ يُحوَّل لصفحة الباقات عند محاولة القراءة               │
│     ✓ يرى الباقات الثلاثة مع الأسعار                        │
│     ✓ يستطيع اختيار باقة والدفع عبر كاشير                   │
│                                                              │
│  3. مستخدم باقة Basic (299 ج.م):                             │
│     ✓ يقرأ جميع الفصول                                      │
│     ✓ يحفظ علامات مرجعية                                    │
│     ✓ يُمنع من التمارين → يرى رسالة ترقية                   │
│     ✓ يُمنع من الأدوات → يرى رسالة ترقية                    │
│     ✓ يُمنع من الشات → يرى رسالة ترقية                      │
│     ✓ زر "رقّي باقتك" يعمل بشكل صحيح                       │
│                                                              │
│  4. مستخدم باقة Pro (499 ج.م):                               │
│     ✓ كل مميزات Basic                                       │
│     ✓ التمارين تعمل (quiz + fill_blank + prompt_builder)     │
│     ✓ النقاط والإنجازات تتحدث                               │
│     ✓ الشهادة متاحة عند إكمال 9 فصول                        │
│     ✓ يُمنع من الأدوات → يرى رسالة ترقية لـ VIP             │
│     ✓ يُمنع من الشات → يرى رسالة ترقية لـ VIP               │
│                                                              │
│  5. مستخدم باقة VIP (999 ج.م):                               │
│     ✓ كل المميزات بدون استثناء                               │
│     ✓ الأدوات الثلاثة تعمل                                  │
│     ✓ الشات الذكي يعمل                                      │
│                                                              │
│  6. انتهاء الاشتراك:                                         │
│     ✓ بعد سنة يتحول الاشتراك لـ expired                     │
│     ✓ المستخدم يُمنع من المحتوى المدفوع                     │
│     ✓ يرى رسالة تجديد الاشتراك                              │
│                                                              │
│  7. الترقية:                                                  │
│     ✓ مستخدم Basic يرقي لـ Pro → الباقة تتحدث فوراً        │
│     ✓ مستخدم Pro يرقي لـ VIP → الباقة تتحدث فوراً          │
│     ✓ الباقة القديمة تتحول لـ upgraded                       │
│                                                              │
│  8. Webhook:                                                  │
│     ✓ الدفع يتفعل حتى لو المتصفح أُغلق                     │
│     ✓ لا يتم التفعيل مرتين (idempotency)                    │
│                                                              │
│  9. الأمان:                                                   │
│     ✓ لا يمكن الوصول للمحتوى المحمي عبر URL مباشر          │
│     ✓ API ترفض الطلبات بدون مصادقة                           │
│     ✓ API تتحقق من الباقة قبل تنفيذ العملية                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 12.2 بيئة الاختبار

```
كاشير Test Mode:
- NEXT_PUBLIC_KASHIER_MODE=test
- استخدام بطاقات الاختبار:
  - نجاح: 5123 4567 8901 2346 (أي تاريخ مستقبلي + أي CVV)
  - فشل: 5123 4567 8901 2345
```

### 12.3 خطوات النشر

```
1. تنفيذ SQL migrations على Supabase (بالترتيب):
   a. supabase_subscriptions.sql      ← جدول الاشتراكات
   b. supabase_plan_features.sql      ← جدول صلاحيات الباقات
   c. supabase_users_plan_columns.sql ← إضافة أعمدة للمستخدم

2. إضافة environment variables:
   - KASHIER_WEBHOOK_SECRET (اختياري — للتحقق من Webhook)

3. نشر الكود على Vercel

4. إعداد Webhook في كاشير Dashboard:
   - URL: https://your-domain.com/api/payment/webhook

5. اختبار الدفع في Test Mode

6. التحويل لـ Live Mode:
   - تغيير NEXT_PUBLIC_KASHIER_MODE=live
   - تحديث مفاتيح API
```

---

## 📁 13. خريطة الملفات المتأثرة

### ملفات جديدة (يجب إنشاؤها) 🆕

| الملف | الوصف |
|-------|-------|
| `src/lib/subscription.ts` | نظام إدارة الاشتراكات والصلاحيات |
| `src/context/SubscriptionContext.tsx` | React Context لحالة الاشتراك |
| `src/components/FeatureGate.tsx` | مكون حارس للميزات المحمية |
| `src/components/UpgradePrompt.tsx` | مكون رسالة الترقية |
| `middleware.ts` | حماية المسارات على مستوى السيرفر |
| `src/app/api/payment/webhook/route.ts` | Webhook endpoint لكاشير |
| `src/app/api/subscription/check/route.ts` | API التحقق من الاشتراك |
| `src/app/payment/upgrade/page.tsx` | صفحة ترقية الباقة |
| `src/app/admin/subscriptions/page.tsx` | لوحة إدارة الاشتراكات |
| `src/app/api/admin/subscriptions/route.ts` | API إدارة الاشتراكات |
| `supabase_subscriptions.sql` | SQL لجدول الاشتراكات |
| `supabase_plan_features.sql` | SQL لجدول صلاحيات الباقات |

### ملفات موجودة (يجب تعديلها) ✏️

| الملف | التعديل المطلوب |
|-------|----------------|
| `src/lib/auth_system.ts` | إضافة `checkFeatureAccess()` و `getSubscriptionInfo()` |
| `src/lib/database.types.ts` | إضافة أنواع subscriptions, plan_features, payments |
| `src/app/api/payment/create-session/route.ts` | استخدام `PLAN_PRICES` الموحدة |
| `src/app/api/payment/verify/route.ts` | تفعيل الاشتراك بعد الدفع الناجح |
| `src/app/payment/page.tsx` | تحديث الباقات (ميزات + استثناءات) |
| `src/app/payment/callback/page.tsx` | إضافة معلومات الباقة في النتيجة |
| `src/components/reading/LockedOverlay.tsx` | إضافة حالة `needs_upgrade` |
| `src/components/reading/SectionPage.tsx` | التحقق من ميزة `reading` |
| `src/components/Navigation.tsx` | إخفاء/إظهار عناصر حسب الباقة |
| `src/app/layout.tsx` | تغليف بـ `SubscriptionProvider` |
| `src/app/exercises/page.tsx` | تغليف بـ `FeatureGate feature="exercises"` |
| `src/app/tools/page.tsx` | تغليف بـ `FeatureGate feature="tools"` |
| `src/app/api/chat/route.ts` | التحقق من ميزة `chat` |
| `src/app/achievements/page.tsx` | التحقق من ميزة `certificate` |
| `src/config/sections.ts` | لا تغيير (الهيكل مناسب) ✅ |
| `src/lib/kashier.ts` | لا تغيير (يعمل بشكل صحيح) ✅ |

---

## 📅 14. ترتيب التنفيذ (Phases)

### المرحلة 1: الأساسيات (الأولوية القصوى) 🔴

```
المدة المقدرة: 2-3 أيام
─────────────────────────────────────────────
الخطوة 1.1: إنشاء SQL migrations
  → supabase_subscriptions.sql
  → supabase_plan_features.sql  
  → تعديل جدول users (إضافة current_plan + plan_expires_at)
  → تنفيذ على Supabase

الخطوة 1.2: إنشاء src/lib/subscription.ts
  → أنواع الباقات والصلاحيات
  → PLAN_PRICES + PLAN_FEATURES
  → getUserSubscription()
  → userHasFeature()
  → activateSubscription()

الخطوة 1.3: تحديث database.types.ts
  → إضافة أنواع subscriptions, plan_features, payments

الخطوة 1.4: تحديث verify/route.ts
  → تفعيل الاشتراك بعد الدفع الناجح
  → استيراد activateSubscription

الخطوة 1.5: تحديث create-session/route.ts
  → استخدام PLAN_PRICES الموحدة
```

### المرحلة 2: الحماية والتحكم 🟡

```
المدة المقدرة: 2-3 أيام
─────────────────────────────────────────────
الخطوة 2.1: إنشاء middleware.ts
  → حماية المسارات الأساسية

الخطوة 2.2: إنشاء SubscriptionContext
  → src/context/SubscriptionContext.tsx
  → تغليف في layout.tsx

الخطوة 2.3: إنشاء FeatureGate + UpgradePrompt
  → مكونات الحماية والترقية

الخطوة 2.4: تحديث auth_system.ts
  → checkFeatureAccess()
  → getSubscriptionInfo()

الخطوة 2.5: تحديث LockedOverlay.tsx
  → إضافة حالة needs_upgrade
  → رسائل مخصصة حسب الحالة
```

### المرحلة 3: حماية الميزات 🟢

```
المدة المقدرة: 1-2 يوم
─────────────────────────────────────────────
الخطوة 3.1: تغليف exercises/page.tsx بـ FeatureGate
الخطوة 3.2: تغليف tools/page.tsx بـ FeatureGate
الخطوة 3.3: تحديث chat API route
الخطوة 3.4: تحديث achievements (الشهادة)
الخطوة 3.5: تحديث Navigation (إخفاء/إظهار)
```

### المرحلة 4: واجهة الدفع والترقية 🔵

```
المدة المقدرة: 1-2 يوم
─────────────────────────────────────────────
الخطوة 4.1: تحديث payment/page.tsx (الباقات المحدثة)
الخطوة 4.2: إنشاء payment/upgrade/page.tsx
الخطوة 4.3: تحديث payment/callback/page.tsx
الخطوة 4.4: إنشاء API subscription/check
```

### المرحلة 5: Webhook + إدارة 🟣

```
المدة المقدرة: 1-2 يوم
─────────────────────────────────────────────
الخطوة 5.1: إنشاء payment/webhook/route.ts
الخطوة 5.2: إنشاء admin/subscriptions (صفحة + API)
الخطوة 5.3: إعداد Webhook في كاشير Dashboard
```

### المرحلة 6: الاختبار والنشر ⚫

```
المدة المقدرة: 1-2 يوم
─────────────────────────────────────────────
الخطوة 6.1: اختبار جميع السيناريوهات (Test Mode)
الخطوة 6.2: إصلاح أي مشاكل
الخطوة 6.3: التحويل لـ Live Mode
الخطوة 6.4: مراقبة أول عمليات دفع حقيقية
```

---

## 📐 رسم معماري — تدفق الدفع والوصول

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────────┐
│  Landing  │────▶│ Register │────▶│  Payment  │────▶│   Kashier    │
│   Page    │     │   Page   │     │   Page    │     │  (External)  │
└──────────┘     └──────────┘     └───────────┘     └──────┬───────┘
                                                           │
                                     ┌─────────────────────┤
                                     ▼                     ▼
                              ┌─────────────┐    ┌──────────────────┐
                              │  Callback   │    │   Webhook API    │
                              │   Page      │    │  (Backup verify) │
                              └──────┬──────┘    └────────┬─────────┘
                                     │                    │
                                     ▼                    ▼
                              ┌──────────────────────────────┐
                              │     Verify API               │
                              │  → Check Kashier status      │
                              │  → Update payments table     │
                              │  → activateSubscription()    │
                              │    → Create subscription     │
                              │    → Update user.current_plan│
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌───────────────────────────────┐
                              │       Subscription Active      │
                              │  ┌──────────────────────────┐ │
                              │  │ subscriptions table       │ │
                              │  │ plan_id: basic/pro/vip   │ │
                              │  │ expires_at: +365 days    │ │
                              │  └──────────────────────────┘ │
                              └───────────────┬───────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                 ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
                 │   Basic     │     │     Pro      │     │     VIP      │
                 │ ──────────  │     │ ──────────── │     │ ──────────── │
                 │ ✅ القراءة  │     │ ✅ القراءة   │     │ ✅ القراءة   │
                 │ ✅ المكتبة  │     │ ✅ المكتبة   │     │ ✅ المكتبة   │
                 │ ✅ العلامات │     │ ✅ العلامات  │     │ ✅ العلامات  │
                 │ ❌ التمارين │     │ ✅ التمارين  │     │ ✅ التمارين  │
                 │ ❌ الأدوات  │     │ ❌ الأدوات   │     │ ✅ الأدوات   │
                 │ ❌ الشات    │     │ ❌ الشات     │     │ ✅ الشات     │
                 │ ❌ الشهادة  │     │ ✅ الشهادة   │     │ ✅ الشهادة   │
                 └─────────────┘     └──────────────┘     └──────────────┘
```

---

## 📐 رسم معماري — فحص الصلاحية عند الطلب

```
   المستخدم يطلب صفحة/ميزة
              │
              ▼
   ┌─────────────────────┐
   │    Middleware.ts     │
   │  (Edge Runtime)     │
   │                     │
   │  ✓ كوكيز موجودة؟   │──── لا ──▶ Redirect /login
   │                     │
   └──────────┬──────────┘
              │ نعم
              ▼
   ┌─────────────────────┐
   │   Component Load    │
   │  (Client-Side)      │
   │                     │
   │  SubscriptionContext │
   │  → hasFeature(x)?   │
   │                     │
   └──────────┬──────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
   ✅ OK   ❌ No Sub  ❌ Wrong Plan
     │        │        │
     ▼        ▼        ▼
  محتوى    صفحة     رسالة
  عادي    الدفع     الترقية
```

---

## ⚠️ ملاحظات مهمة

1. **تناقض الأسعار الحالي:**
   - في الكود: basic=299, pro=499, vip=999
   - في DB seed: basic=299, pro=699, vip=1499
   - **القرار:** يجب توحيد الأسعار في `PLAN_PRICES` بملف `subscription.ts` كمصدر وحيد

2. **الأمان:**
   - الكوكيز حالياً ليست `httpOnly` (معرضة لـ XSS)
   - يُفضل نقل الـ session management لـ server-side cookies
   - الـ middleware يحمي من الوصول المباشر عبر URL

3. **التوافق مع المستخدمين الحاليين:**
   - المستخدمون الذين دفعوا قبل هذا التحديث يحتاجون migration
   - يجب إنشاء script يقرأ `payments` ذات `status=success` ويُنشئ لهم subscriptions
   - يمكن منحهم باقة `pro` كإعداد افتراضي (أو حسب `plan_id` المسجل)

4. **انتهاء الاشتراك:**
   - يُفضل إنشاء Cron Job (Vercel Cron أو Supabase Edge Function) يفحص الاشتراكات المنتهية يومياً
   - أو التحقق عند كل طلب: `expires_at > NOW()`

5. **كاشير Webhook:**
   - يحتاج domain حقيقي (لا يعمل مع localhost)
   - يُختبر أولاً في Test Mode
   - يُفضل إضافة تحقق من signature لأمان الـ webhook

---

> **هذا الملف هو المرجع الرئيسي لعملية التطوير. كل تعديل يجب أن يُوثَّق هنا بعد التنفيذ.**  
> آخر تحديث: 12 فبراير 2026
