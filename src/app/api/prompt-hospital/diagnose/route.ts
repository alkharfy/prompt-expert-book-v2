import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { getAuthenticatedUser, hasActiveSubscription } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Model configuration (same as chat route)
type ModelProvider = 'openai' | 'google' | 'groq'

interface ModelConfig {
    provider: ModelProvider
    apiModel: string
    label: string
    baseURL?: string
}

// Same model set as app/api/chat/route.ts (see the retirement notes there).
const MODEL_CONFIG: Record<string, ModelConfig> = {
    'gpt-oss-120b': { provider: 'groq', apiModel: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
    'gpt-6-luna': { provider: 'openai', apiModel: 'gpt-6-luna', label: 'GPT-6 Luna' },
    'gemini-3.8-flash': { provider: 'google', apiModel: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
}

const validModels = Object.keys(MODEL_CONFIG) as [string, ...string[]]

const DiagnoseRequestSchema = z.object({
    prompt: z.string().min(1).max(3000),
    model: z.enum(validModels),
})

const HOSPITAL_SYSTEM_PROMPT = `أنت "طبيب البرومبتات" المتخصص في تشخيص وعلاج البرومبتات المريضة.
مهمتك: تحليل البرومبت المقدم وتقديم تقرير طبي شامل.

يجب أن يكون ردك بتنسيق JSON صارم كالتالي:
{
  "patientName": "اسم وصفي مجازي للبرومبت المريض (مثل: البرومبت الغامض، البرومبت المشتت)",
  "vitalSigns": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "context": <0-100>,
    "structure": <0-100>,
    "actionability": <0-100>,
    "constraints": <0-100>
  },
  "overallHealth": <0-100>,
  "symptoms": ["عرض 1", "عرض 2", "عرض 3"],
  "diagnosis": "التشخيص الرئيسي بأسلوب طبي مجازي وممتع",
  "diseases": ["اسم المرض 1", "اسم المرض 2"],
  "prescription": ["وصفة علاجية 1 - تعليمات محددة", "وصفة علاجية 2", "وصفة علاجية 3"],
  "healedPrompt": "البرومبت بعد العلاج الكامل - يجب أن يكون تحسيناً حقيقياً وعملياً",
  "doctorNotes": "ملاحظات الطبيب العامة والنصائح"
}

قواعد:
1. أجب دائماً بالعربية
2. استخدم مصطلحات طبية بشكل مجازي وممتع (مثل: "يعاني من فقر معلوماتي حاد")
3. كن دقيقاً في التقييم - لا تبالغ في الإيجابية أو السلبية
4. البرومبت المُعالَج يجب أن يكون تحسيناً حقيقياً وعملياً مع كل العناصر (دور + سياق + مهمة + تنسيق + قيود)
5. أرجع JSON فقط بدون أي نص إضافي قبله أو بعده
6. لا تستخدم markdown code blocks - أرجع JSON خام مباشرة`

// Non-streaming AI calls
async function callOpenAI(config: ModelConfig, prompt: string): Promise<string> {
    const { default: OpenAI } = await import('openai')

    const apiKey = config.baseURL?.includes('deepseek')
        ? process.env.DEEPSEEK_API_KEY
        : config.baseURL
        ? process.env.XAI_API_KEY
        : process.env.OPENAI_API_KEY

    if (!apiKey) throw new Error(`API key not configured for ${config.label}`)

    const client = new OpenAI({ apiKey, baseURL: config.baseURL })

    const response = await client.chat.completions.create({
        model: config.apiModel,
        messages: [
            { role: 'system', content: HOSPITAL_SYSTEM_PROMPT },
            { role: 'user', content: `شخّص هذا البرومبت:\n\n${prompt}` },
        ],
        // Reasoning model: no custom temperature; reasoning shares this budget.
        reasoning_effort: 'low',
        max_completion_tokens: 4096,
    })

    return response.choices[0]?.message?.content || ''
}

async function callGemini(config: ModelConfig, prompt: string): Promise<string> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: config.apiModel,
        systemInstruction: HOSPITAL_SYSTEM_PROMPT,
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    })

    const result = await model.generateContent(`شخّص هذا البرومبت:\n\n${prompt}`)
    return result.response.text()
}

async function callGroq(config: ModelConfig, prompt: string): Promise<string> {
    const { default: Groq } = await import('groq-sdk')

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY not configured')

    const client = new Groq({ apiKey })

    const response = await client.chat.completions.create({
        model: config.apiModel,
        messages: [
            { role: 'system', content: HOSPITAL_SYSTEM_PROMPT },
            { role: 'user', content: `شخّص هذا البرومبت:\n\n${prompt}` },
        ],
        temperature: 0.4,
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: 4096,
    })

    return response.choices[0]?.message?.content || ''
}

function parseAIResponse(text: string) {
    // Try direct parse
    try {
        return JSON.parse(text)
    } catch {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0])
            } catch {
                // Give up
            }
        }
    }
    return null
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح - سجّل الدخول أولاً' }, { status: 401 })
        }

        // SECURITY: Subscription check — prompt hospital is a premium feature
        const hasSub = await hasActiveSubscription(userId)
        if (!hasSub) {
            return NextResponse.json(
                { error: 'يرجى الاشتراك لاستخدام هذه الميزة' },
                { status: 403 }
            )
        }

        // Rate limit
        const rateResult = checkRateLimit(`hospital:${userId}`, RATE_LIMITS.HOSPITAL_DIAGNOSE)
        if (!rateResult.allowed) {
            return NextResponse.json({
                error: `تجاوزت الحد المسموح (${RATE_LIMITS.HOSPITAL_DIAGNOSE.maxRequests} تشخيص/يوم). حاول بعد ${rateResult.retryAfter} ثانية.`,
            }, { status: 429 })
        }

        // Parse request
        const body = await request.json()
        const parsed = DiagnoseRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }

        const { prompt, model } = parsed.data
        const config = MODEL_CONFIG[model]
        if (!config) {
            return NextResponse.json({ error: 'موديل غير معروف' }, { status: 400 })
        }

        // Call AI based on provider
        let aiResponse: string
        switch (config.provider) {
            case 'openai':
                aiResponse = await callOpenAI(config, prompt)
                break
            case 'google':
                aiResponse = await callGemini(config, prompt)
                break
            case 'groq':
                aiResponse = await callGroq(config, prompt)
                break
            default:
                return NextResponse.json({ error: 'مزود غير مدعوم' }, { status: 400 })
        }

        // Parse AI response
        const diagnosis = parseAIResponse(aiResponse)
        if (!diagnosis) {
            dbLogger.error('[Hospital] Failed to parse AI response:', aiResponse.substring(0, 200))
            return NextResponse.json({ error: 'فشل في تحليل رد الذكاء الاصطناعي. جرب مرة أخرى.' }, { status: 500 })
        }

        // Validate required fields
        if (!diagnosis.healedPrompt || !diagnosis.vitalSigns) {
            dbLogger.error('[Hospital] Missing required fields in diagnosis')
            return NextResponse.json({ error: 'الرد ناقص. جرب موديل مختلف.' }, { status: 500 })
        }

        return NextResponse.json(diagnosis)

    } catch (err) {
        dbLogger.error('[Hospital] Diagnose error:', err)
        return NextResponse.json({ error: 'حدث خطأ أثناء التشخيص. حاول مرة أخرى أو جرب موديل مختلف.' }, { status: 500 })
    }
}
