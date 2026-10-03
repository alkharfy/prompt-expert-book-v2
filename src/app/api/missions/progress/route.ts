import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { updateMissionProgress } from '@/lib/missions'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// =====================================================
// API: /api/missions/progress — POST (update mission progress)
// =====================================================

/**
 * POST /api/missions/progress
 * Body: { action_type: string, value?: number }
 * 
 * action_type values:
 * - 'read_page' — عند قراءة صفحة
 * - 'complete_exercise' — عند إكمال تمرين
 * - 'perfect_score' — عند إجابة صحيحة من أول مرة
 * - 'add_note' — عند إضافة ملاحظة
 * - 'highlight_text' — عند تظليل نص
 * - 'add_bookmark' — عند إضافة bookmark
 * - 'use_tool' — عند استخدام أداة
 * - 'chat_message' — عند إرسال رسالة شات
 * - 'maintain_streak' — تسجيل نشاط اليوم
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`missions-progress-${userId}`, { maxRequests: 60, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const body = await request.json()
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        const { action_type, value } = body

        // Exercise milestones are emitted once by the validated completion
        // handler, after the server grades or records known course practice.
        if (action_type === 'complete_exercise' || action_type === 'perfect_score') {
            return NextResponse.json({ error: 'تُسجّل مهام التمارين من نتيجة الحفظ على الخادم' }, { status: 403 })
        }

        if (!action_type || typeof action_type !== 'string') {
            return NextResponse.json(
                { error: 'action_type مطلوب' },
                { status: 400 }
            )
        }

        const validActions = [
            'read_page', 'complete_exercise', 'perfect_score',
            'add_note', 'highlight_text', 'add_bookmark',
            'use_tool', 'chat_message', 'maintain_streak',
        ]

        if (!validActions.includes(action_type)) {
            return NextResponse.json(
                { error: 'action_type غير صالح' },
                { status: 400 }
            )
        }

        const increment = typeof value === 'number' && value > 0 ? Math.min(value, 10) : 1

        const result = await updateMissionProgress(userId, action_type, increment)

        return NextResponse.json({
            success: true,
            updated: result.updatedMissions.length,
            completed: result.completedMissions.map(m => ({
                id: m.id,
                points_earned: m.points_earned,
                template_id: m.mission_template_id,
            })),
            all_clear: result.allClear,
            total_points_earned: result.totalPointsEarned,
        })

    } catch (err: unknown) {
        apiLogger.error('Error in POST /api/missions/progress', err)
        return NextResponse.json(
            { error: 'حدث خطأ في تحديث التقدم' },
            { status: 500 }
        )
    }
}
