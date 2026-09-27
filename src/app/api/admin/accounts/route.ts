import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { adminAuth } from '@/lib/firebase_admin'
import { hashPassword } from '@/lib/password'
import { ensureEmailPreferences } from '@/lib/email'
import { TOTAL_BOOK_PAGES } from '@/lib/config'
import { dbLogger } from '@/lib/logger'

/**
 * Admin: Complimentary (free) accounts
 *
 * حسابات مجانية يصدرها الأدمن (مثلاً لموظفي العملاء) بدون أي دفع.
 * الاشتراك المجاني = صف في subscriptions بدون payment_id، فيمر من نفس
 * فحوصات الوصول التي يمر بها الاشتراك المدفوع (middleware + getServerAccess).
 *
 * GET  — قائمة الاشتراكات المجانية (payment_id IS NULL)
 * POST — إنشاء حساب جديد (Firebase + users) أو تفعيل باقة مجانية لحساب موجود
 *        Body: { fullName, email, planId: 'basic'|'pro'|'vip', durationDays: 30|90|180|365 }
 *        كلمة المرور تُولَّد على الخادم وتُعاد مرة واحدة فقط في الاستجابة.
 *
 * @module api/admin/accounts
 */

const CreateAccountSchema = z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    planId: z.enum(['basic', 'pro', 'vip']),
    durationDays: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
})

async function requireAdmin(): Promise<string | null> {
    const userId = await getAuthenticatedUser()
    if (!userId) return null
    const { data } = await (getSupabaseAdmin().from('users') as any)
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle()
    return data?.is_admin ? userId : null
}

// No look-alike characters (0/O, 1/l/I) so the password survives being read aloud or retyped.
const PASSWORD_ALPHABETS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789']

function generatePassword(length = 12): string {
    const all = PASSWORD_ALPHABETS.join('')
    // One from each class guarantees mixed case + digits, the rest uniformly random.
    const chars = PASSWORD_ALPHABETS.map(set => set[randomInt(set.length)])
    while (chars.length < length) chars.push(all[randomInt(all.length)])
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join('')
}

export async function GET() {
    try {
        if (!(await requireAdmin())) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
        }
        const { data, error } = await (getSupabaseAdmin().from('subscriptions') as any)
            .select('id, plan_id, status, starts_at, expires_at, created_at, users!inner(email, full_name)')
            .is('payment_id', null)
            .order('created_at', { ascending: false })
            .limit(500)
        if (error) {
            dbLogger.error('[admin/accounts] list error:', error)
            return NextResponse.json({ ok: false, error: 'Failed to fetch accounts' }, { status: 500 })
        }
        return NextResponse.json({ ok: true, accounts: data || [] })
    } catch (err) {
        dbLogger.error('[admin/accounts] GET error:', err)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const adminId = await requireAdmin()
        if (!adminId) {
            return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 403 })
        }

        const parsed = CreateAccountSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'بيانات غير صالحة — راجع الاسم والإيميل والباقة والمدة' }, { status: 400 })
        }
        const { fullName, email, planId, durationDays } = parsed.data

        const supabase = getSupabaseAdmin()
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + durationDays)

        const { data: existingUser, error: lookupError } = await (supabase.from('users') as any)
            .select('id, full_name')
            .eq('email', email)
            .maybeSingle()
        if (lookupError) throw lookupError

        let userId: string
        let password: string | null = null

        if (existingUser) {
            // Existing account: grant the plan, never touch the owner's password.
            userId = existingUser.id
            const { data: activeSub } = await (supabase.from('subscriptions') as any)
                .select('id, expires_at')
                .eq('user_id', userId)
                .eq('status', 'active')
                .gt('expires_at', now.toISOString())
                .maybeSingle()
            if (activeSub) {
                return NextResponse.json({
                    ok: false,
                    error: `هذا الحساب لديه اشتراك نشط حتى ${new Date(activeSub.expires_at).toLocaleDateString('ar-EG')}. استخدم «تمديد» بدلاً من ذلك.`,
                }, { status: 409 })
            }
            // A lapsed row still marked 'active' would violate the one-active-per-user index.
            await (supabase.from('subscriptions') as any)
                .update({ status: 'expired' })
                .eq('user_id', userId)
                .eq('status', 'active')
                .lte('expires_at', now.toISOString())
        } else {
            password = generatePassword()
            let firebaseUid: string
            let createdFirebaseUser = false
            try {
                const existingFirebase = await adminAuth.getUserByEmail(email).catch(() => null)
                if (existingFirebase) {
                    // Firebase user without a DB row (e.g. an abandoned signup) — adopt it with the new password.
                    await adminAuth.updateUser(existingFirebase.uid, { password, displayName: fullName, emailVerified: true })
                    firebaseUid = existingFirebase.uid
                } else {
                    const created = await adminAuth.createUser({ email, password, displayName: fullName, emailVerified: true })
                    firebaseUid = created.uid
                    createdFirebaseUser = true
                }
            } catch (err) {
                dbLogger.error('[admin/accounts] Firebase user creation failed:', err)
                return NextResponse.json({ ok: false, error: 'تعذّر إنشاء حساب الدخول (Firebase)' }, { status: 502 })
            }

            const { data: newUser, error: insertError } = await (supabase.from('users') as any)
                .insert({
                    firebase_uid: firebaseUid,
                    email,
                    password_hash: await hashPassword(password),
                    full_name: fullName,
                    phone_number: '',
                    is_phone_verified: false,
                    is_verified: true,
                    is_active: true,
                    current_plan: planId,
                    plan_expires_at: expiresAt.toISOString(),
                })
                .select('id')
                .single()
            if (insertError || !newUser) {
                dbLogger.error('[admin/accounts] users insert failed:', insertError)
                if (createdFirebaseUser) await adminAuth.deleteUser(firebaseUid).catch(() => {})
                return NextResponse.json({ ok: false, error: 'تعذّر حفظ الحساب في قاعدة البيانات' }, { status: 500 })
            }
            userId = newUser.id

            const { error: progressError } = await (supabase.from('reading_progress') as any).insert({
                user_id: userId,
                current_page: 1,
                total_pages: TOTAL_BOOK_PAGES,
                bookmarks: [],
                completed_chapters: [],
                completion_percentage: 0,
            })
            if (progressError) dbLogger.error('[admin/accounts] reading_progress insert failed:', progressError)
            ensureEmailPreferences(userId).catch(() => { /* non-critical */ })
        }

        const { data: subscription, error: subError } = await (supabase.from('subscriptions') as any)
            .insert({
                user_id: userId,
                plan_id: planId,
                payment_id: null,
                status: 'active',
                starts_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
            })
            .select('id')
            .single()
        if (subError || !subscription) {
            dbLogger.error('[admin/accounts] subscription insert failed:', subError)
            return NextResponse.json({ ok: false, error: 'تم إنشاء الحساب لكن تعذّر تفعيل الباقة — أعد المحاولة لنفس الإيميل' }, { status: 500 })
        }

        if (existingUser) {
            const { error: userError } = await (supabase.from('users') as any)
                .update({ current_plan: planId, plan_expires_at: expiresAt.toISOString(), is_active: true, is_verified: true })
                .eq('id', userId)
            if (userError) throw userError
        }

        dbLogger.info(`[admin/accounts] admin ${adminId} granted free ${planId} (${durationDays}d) to user ${userId}${existingUser ? ' (existing account)' : ''}`)

        return NextResponse.json({
            ok: true,
            existingAccount: !!existingUser,
            account: {
                subscriptionId: subscription.id,
                fullName: existingUser?.full_name || fullName,
                email,
                planId,
                expiresAt: expiresAt.toISOString(),
                // Returned exactly once — never stored in plain text or logged.
                password,
            },
        })
    } catch (err) {
        dbLogger.error('[admin/accounts] POST error:', err)
        return NextResponse.json({ ok: false, error: 'حدث خطأ غير متوقع' }, { status: 500 })
    }
}
