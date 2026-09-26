import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * استخراج userId من cookies مع التحقق من الجلسة
 */
async function getAuthenticatedUser(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    const supabase = getSupabaseAdmin()
    const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    return session ? userId : null
}

/**
 * POST /api/auth/db-operation
 * Proxy for client-side Supabase operations that need service_role access.
 * يتطلب مصادقة المستخدم ويقيد العمليات على بيانات المستخدم الحالي فقط.
 */
export async function POST(request: NextRequest) {
    try {
        const authenticatedUserId = await getAuthenticatedUser()
        if (!authenticatedUserId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح - يرجى تسجيل الدخول' },
                { status: 401 }
            )
        }

        // SECURITY: Rate limiting to prevent abuse of generic DB proxy
        const rateLimit = checkRateLimit(`db-op-${authenticatedUserId}`, { maxRequests: 60, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { ok: false, error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { operation, table, data, filters, select: selectFields } = body

        // Whitelist of allowed tables (payments removed - should use dedicated payment endpoints)
        const ALLOWED_TABLES = [
            'users', 'sessions', 'devices', 'reading_progress',
            'bookmarks', 'verification_codes',
            'exercise_progress', 'user_exercise_stats', 'user_gamification', 'points_history',
            'user_notes'
        ]

        // SECURITY: Column whitelists to prevent privilege escalation
        // Only these columns can be modified via this proxy
        const WRITABLE_COLUMNS: Record<string, string[]> = {
            users: ['full_name', 'phone_number'], // NO: is_admin, is_active, current_plan, password_hash, plan_expires_at
            reading_progress: ['current_page', 'bookmarks', 'completed_chapters', 'completion_percentage'],
            bookmarks: ['section_id', 'page_id', 'note', 'title'],
            exercise_progress: ['exercise_id', 'exercise_type', 'section_id', 'is_completed', 'is_correct', 'user_answer', 'points_earned', 'completed_at', 'last_attempt_at'],
            user_exercise_stats: ['total_completed', 'total_correct', 'total_points', 'quizzes_completed', 'fill_blanks_completed', 'prompt_builders_completed', 'last_exercise_at'],
            user_gamification: ['total_points', 'current_level', 'points_to_next_level', 'current_streak', 'longest_streak', 'last_activity_date', 'exercises_completed', 'chapters_completed', 'total_reading_time_minutes'],
            points_history: ['points', 'action_type', 'action_details'],
            // sessions, devices, verification_codes: read-only through this proxy
        }

        // SECURITY: Safe columns to return (never return password_hash, is_admin via proxy)
        const READABLE_COLUMNS: Record<string, string> = {
            users: 'id, email, full_name, phone_number, is_verified, is_active, created_at, current_plan, plan_expires_at',
            sessions: 'id, user_id, device_id, expires_at, created_at',
            devices: 'id, user_id, device_id, device_info, last_used, registered_at, is_active',
            reading_progress: 'id, user_id, current_page, total_pages, bookmarks, completed_chapters, completion_percentage',
            bookmarks: 'id, user_id, section_id, page_id, note, title, created_at',
            verification_codes: 'id, user_id, is_used, created_at',
            exercise_progress: '*',
            user_exercise_stats: '*',
            user_gamification: '*',
            points_history: 'id, user_id, points, action_type, created_at',
            user_notes: 'id, user_id, created_at',
        }

        if (!ALLOWED_TABLES.includes(table) && operation !== 'rpc') {
            return NextResponse.json(
                { ok: false, error: `Table ${table} not allowed` },
                { status: 400 }
            )
        }

        if (!['select', 'insert', 'update', 'delete', 'upsert', 'rpc'].includes(operation)) {
            return NextResponse.json(
                { ok: false, error: `Operation ${operation} not allowed` },
                { status: 400 }
            )
        }

        // SECURITY: Only allow delete on specific tables
        const DELETABLE_TABLES = ['bookmarks', 'sessions', 'devices']

        // فرض أن كل العمليات تكون على بيانات المستخدم الحالي فقط
        const ensureUserFilter = (filtersArr: any[] | undefined): any[] => {
            const userFilter = { op: 'eq', column: 'user_id', value: authenticatedUserId }
            if (!filtersArr) return [userFilter]
            // استبدال أي فلتر user_id بالقيمة الصحيحة من الجلسة
            const cleaned = filtersArr.filter((f: any) => f.column !== 'user_id')
            return [...cleaned, userFilter]
        }

        const supabase = getSupabaseAdmin()
        let query: any

        switch (operation) {
            case 'select': {
                // SECURITY: Use safe column list, never allow SELECT *
                const safeSelect = READABLE_COLUMNS[table] || selectFields || 'id'
                query = supabase.from(table).select(safeSelect)
                const safeFilters = ensureUserFilter(filters)
                for (const f of safeFilters) {
                    if (f.op === 'eq') query = query.eq(f.column, f.value)
                    else if (f.op === 'neq') query = query.neq(f.column, f.value)
                    else if (f.op === 'in') query = query.in(f.column, f.value)
                    else if (f.op === 'gte') query = query.gte(f.column, f.value)
                    else if (f.op === 'lte') query = query.lte(f.column, f.value)
                    else if (f.op === 'gt') query = query.gt(f.column, f.value)
                    else if (f.op === 'lt') query = query.lt(f.column, f.value)
                    else if (f.op === 'like') query = query.like(f.column, f.value)
                }
                if (body.order) query = query.order(body.order.column, { ascending: body.order.ascending ?? true })
                if (body.limit) query = query.limit(body.limit)
                if (body.single) query = query.single()
                if (body.maybeSingle) query = query.maybeSingle()
                const selectResult = await query
                return NextResponse.json({ ok: true, data: selectResult.data, error: selectResult.error ? 'فشل في جلب البيانات' : null })
            }

            case 'insert': {
                // SECURITY: Only allow insert to tables with writable columns defined
                const insertAllowed = WRITABLE_COLUMNS[table]
                if (!insertAllowed) {
                    return NextResponse.json(
                        { ok: false, error: `Insert not allowed on table ${table}` },
                        { status: 403 }
                    )
                }
                // Filter data to only allowed columns + user_id
                const safeInsertData: Record<string, any> = { user_id: authenticatedUserId }
                for (const col of insertAllowed) {
                    if (col in data) safeInsertData[col] = data[col]
                }
                query = supabase.from(table).insert(safeInsertData)
                if (body.returnData) query = query.select().single()
                const insertResult = await query
                return NextResponse.json({ ok: true, data: insertResult.data, error: insertResult.error ? 'فشل في إضافة البيانات' : null })
            }

            case 'update': {
                // SECURITY: Only allow updating whitelisted columns
                const updateAllowed = WRITABLE_COLUMNS[table]
                if (!updateAllowed) {
                    return NextResponse.json(
                        { ok: false, error: `Update not allowed on table ${table}` },
                        { status: 403 }
                    )
                }
                // Filter data to only allowed columns
                const safeUpdateData: Record<string, any> = {}
                for (const col of updateAllowed) {
                    if (col in data) safeUpdateData[col] = data[col]
                }
                if (Object.keys(safeUpdateData).length === 0) {
                    return NextResponse.json(
                        { ok: false, error: 'No allowed fields to update' },
                        { status: 400 }
                    )
                }
                const safeFilters = ensureUserFilter(filters)
                query = supabase.from(table).update(safeUpdateData)
                for (const f of safeFilters) {
                    if (f.op === 'eq') query = query.eq(f.column, f.value)
                }
                if (body.returnData) query = query.select().single()
                const updateResult = await query
                return NextResponse.json({ ok: true, data: updateResult.data, error: updateResult.error ? 'فشل في تحديث البيانات' : null })
            }

            case 'delete': {
                // SECURITY: Only allow delete on specific tables
                if (!DELETABLE_TABLES.includes(table)) {
                    return NextResponse.json(
                        { ok: false, error: `Delete not allowed on table ${table}` },
                        { status: 403 }
                    )
                }
                const safeFilters = ensureUserFilter(filters)
                query = supabase.from(table).delete()
                for (const f of safeFilters) {
                    if (f.op === 'eq') query = query.eq(f.column, f.value)
                }
                const deleteResult = await query
                return NextResponse.json({ ok: true, data: deleteResult.data, error: deleteResult.error ? 'فشل في حذف البيانات' : null })
            }

            case 'upsert': {
                const upsertAllowed = WRITABLE_COLUMNS[table]
                if (!upsertAllowed) {
                    return NextResponse.json(
                        { ok: false, error: `Upsert not allowed on table ${table}` },
                        { status: 403 }
                    )
                }
                const safeUpsertData: Record<string, any> = { user_id: authenticatedUserId }
                for (const col of upsertAllowed) {
                    if (col in data) safeUpsertData[col] = data[col]
                }
                
                const onConflict = body.onConflict || 'user_id'
                const upsertResult = await supabase
                    .from(table)
                    .upsert(safeUpsertData, { onConflict })
                
                return NextResponse.json({ ok: true, data: upsertResult.data, error: upsertResult.error ? upsertResult.error.message || 'فشل في حفظ البيانات' : null })
            }

            case 'rpc': {
                const ALLOWED_RPCS = [
                    'update_exercise_stats_atomic',
                    'update_gamification_atomic'
                ]
                const rpcName = body.rpcName
                if (!rpcName || !ALLOWED_RPCS.includes(rpcName)) {
                    return NextResponse.json(
                        { ok: false, error: `RPC ${rpcName} not allowed` },
                        { status: 403 }
                    )
                }
                // Inject user_id into params for security
                const rpcParams = { ...body.rpcParams, p_user_id: authenticatedUserId }
                const rpcResult = await supabase.rpc(rpcName, rpcParams)
                return NextResponse.json({ ok: true, data: rpcResult.data, error: rpcResult.error ? rpcResult.error.message : null })
            }

            default:
                return NextResponse.json({ ok: false, error: 'Unknown operation' }, { status: 400 })
        }
    } catch (error) {
        // Do not leak error details in production
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
