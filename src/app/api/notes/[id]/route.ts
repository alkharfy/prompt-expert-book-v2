import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// =====================================================
// API: /api/notes/[id] — PUT (update) & DELETE
// =====================================================

const VALID_COLORS = ['orange', 'yellow', 'green', 'blue', 'purple'] as const
const MAX_NOTE_TEXT = 2000

function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return ''
    return text
        .replace(/[<>'"]/g, '') // إزالة HTML tags وعلامات الاقتباس
        .replace(/javascript\s*:/gi, '') // إزالة javascript: protocol (مع مسافات)
        .replace(/vbscript\s*:/gi, '') // إزالة vbscript: protocol
        .replace(/data\s*:/gi, '') // إزالة data: protocol
        .replace(/on\w+\s*=/gi, '') // إزالة event handlers
        .replace(/&lt;/gi, '') // إزالة encoded <
        .replace(/&gt;/gi, '') // إزالة encoded >
        .replace(/&#/g, '') // إزالة HTML numeric entities
        .replace(/\\u00/gi, '') // إزالة unicode escapes
        .replace(/expression\s*\(/gi, '') // إزالة CSS expression()
        .replace(/url\s*\(/gi, '') // إزالة CSS url()
        .trim()
}

// PUT: تعديل ملاحظة
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const rateLimit = checkRateLimit(`notes-put-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const { id } = await params

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'معرف الملاحظة غير صالح' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from('user_notes')
            .select('user_id')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) {
            apiLogger.error('Error fetching note for update', fetchError)
            return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
        }

        if (!existing) {
            return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 })
        }

        if (existing.user_id !== userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
        }

        const body = await request.json()
        const { note_text, highlight_color } = body

        const updateData: Record<string, unknown> = {}

        // Update note_text if provided
        if (note_text !== undefined) {
            if (note_text === null || note_text === '') {
                updateData.note_text = null
            } else {
                if (typeof note_text !== 'string') {
                    return NextResponse.json({ error: 'note_text غير صالح' }, { status: 400 })
                }
                if (note_text.length > MAX_NOTE_TEXT) {
                    return NextResponse.json(
                        { error: `الملاحظة تتجاوز الحد الأقصى (${MAX_NOTE_TEXT} حرف)` },
                        { status: 400 }
                    )
                }
                updateData.note_text = sanitizeText(note_text)
            }
        }

        // Update highlight_color if provided
        if (highlight_color !== undefined) {
            if (!VALID_COLORS.includes(highlight_color)) {
                return NextResponse.json({ error: 'لون غير صالح' }, { status: 400 })
            }
            updateData.highlight_color = highlight_color
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('user_notes')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            apiLogger.error('Error updating note', error)
            return NextResponse.json({ error: 'خطأ في تحديث الملاحظة' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err) {
        apiLogger.error('Notes PUT error', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// DELETE: حذف ملاحظة
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const rateLimit = checkRateLimit(`notes-del-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const { id } = await params

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'معرف الملاحظة غير صالح' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Verify ownership before delete
        const { data: existing, error: fetchError } = await supabase
            .from('user_notes')
            .select('user_id')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) {
            apiLogger.error('Error fetching note for delete', fetchError)
            return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
        }

        if (!existing) {
            return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 })
        }

        if (existing.user_id !== userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
        }

        const { error } = await supabase
            .from('user_notes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            apiLogger.error('Error deleting note', error)
            return NextResponse.json({ error: 'خطأ في حذف الملاحظة' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        apiLogger.error('Notes DELETE error', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
