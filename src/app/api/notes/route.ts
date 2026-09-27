import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { recordNoteCreation } from '@/lib/gamification'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// =====================================================
// API: /api/notes — GET (list) & POST (create)
// =====================================================

const VALID_COLORS = ['orange', 'yellow', 'green', 'blue', 'purple'] as const
const MAX_NOTE_TEXT = 2000
const MAX_HIGHLIGHTED_TEXT = 1000
const MAX_NOTES_PER_USER = 500

/**
 * تنظيف النص من HTML/XSS
 */
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

// GET: جلب ملاحظات المستخدم
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`notes-get-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Optional filters
        const { searchParams } = new URL(request.url)
        const sectionId = searchParams.get('section_id')
        const pageNumber = searchParams.get('page_number')

        let query = supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (sectionId) {
            query = query.eq('section_id', sectionId)
        }

        if (pageNumber) {
            const pn = parseInt(pageNumber)
            if (!isNaN(pn)) {
                query = query.eq('page_number', pn)
            }
        }

        const { data, error } = await query

        if (error) {
            apiLogger.error('Error fetching notes', error)
            return NextResponse.json({ error: 'خطأ في جلب الملاحظات' }, { status: 500 })
        }

        return NextResponse.json({ data: data || [] })
    } catch (err) {
        apiLogger.error('Notes GET error', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: إنشاء ملاحظة/تظليل جديد
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`notes-post-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Check notes limit
        const { count, error: countError } = await supabase
            .from('user_notes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)

        if (countError) {
            apiLogger.error('Error counting notes', countError)
            return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
        }

        if ((count || 0) >= MAX_NOTES_PER_USER) {
            return NextResponse.json(
                { error: `تم الوصول للحد الأقصى (${MAX_NOTES_PER_USER} ملاحظة)` },
                { status: 400 }
            )
        }

        const body = await request.json()
        const {
            section_id,
            page_number,
            highlighted_text,
            text_start_offset,
            text_end_offset,
            content_block_index,
            note_text,
            highlight_color,
        } = body

        // Validation
        if (!section_id || typeof section_id !== 'string') {
            return NextResponse.json({ error: 'section_id مطلوب' }, { status: 400 })
        }

        if (page_number === undefined || typeof page_number !== 'number' || page_number < 1) {
            return NextResponse.json({ error: 'page_number غير صالح' }, { status: 400 })
        }

        // Must have either highlighted_text or note_text
        if (!highlighted_text && !note_text) {
            return NextResponse.json({ error: 'يجب إدخال نص مظلل أو ملاحظة' }, { status: 400 })
        }

        // Validate & sanitize highlighted_text
        let cleanHighlightedText: string | null = null
        if (highlighted_text) {
            if (typeof highlighted_text !== 'string') {
                return NextResponse.json({ error: 'highlighted_text غير صالح' }, { status: 400 })
            }
            if (highlighted_text.length > MAX_HIGHLIGHTED_TEXT) {
                return NextResponse.json(
                    { error: `النص المظلل يتجاوز الحد الأقصى (${MAX_HIGHLIGHTED_TEXT} حرف)` },
                    { status: 400 }
                )
            }
            cleanHighlightedText = sanitizeText(highlighted_text)
        }

        // Validate & sanitize note_text
        let cleanNoteText: string | null = null
        if (note_text) {
            if (typeof note_text !== 'string') {
                return NextResponse.json({ error: 'note_text غير صالح' }, { status: 400 })
            }
            if (note_text.length > MAX_NOTE_TEXT) {
                return NextResponse.json(
                    { error: `الملاحظة تتجاوز الحد الأقصى (${MAX_NOTE_TEXT} حرف)` },
                    { status: 400 }
                )
            }
            cleanNoteText = sanitizeText(note_text)
        }

        // Validate highlight_color
        const color = highlight_color && VALID_COLORS.includes(highlight_color)
            ? highlight_color
            : 'orange'

        // Validate offsets
        const startOffset = typeof text_start_offset === 'number' ? text_start_offset : null
        const endOffset = typeof text_end_offset === 'number' ? text_end_offset : null
        const blockIndex = typeof content_block_index === 'number' ? content_block_index : null

        // Insert
        const { data, error } = await supabase
            .from('user_notes')
            .insert({
                user_id: userId,
                section_id: sanitizeText(section_id),
                page_number,
                highlighted_text: cleanHighlightedText,
                text_start_offset: startOffset,
                text_end_offset: endOffset,
                content_block_index: blockIndex,
                note_text: cleanNoteText,
                highlight_color: color,
            })
            .select()
            .single()

        if (error) {
            apiLogger.error('Error creating note', error)
            return NextResponse.json({ error: 'خطأ في إنشاء الملاحظة' }, { status: 500 })
        }

        // منح نقاط Gamification (fire and forget)
        recordNoteCreation(userId, supabase).catch((err: unknown) => {
            apiLogger.error('Error recording note gamification', err)
        })

        // تحديث تقدم المهام اليومية (fire and forget)
        import('@/lib/missions').then(({ updateMissionProgress }) => {
            const actionType = cleanHighlightedText ? 'highlight_text' : 'add_note'
            updateMissionProgress(userId, actionType).catch((err: unknown) => {
                apiLogger.error('Error updating mission progress', err)
            })
        }).catch((err: unknown) => {
            apiLogger.error('Error importing missions module', err)
        })

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (err: unknown) {
        apiLogger.error('Notes POST error', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
