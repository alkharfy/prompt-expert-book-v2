/**
 * «المستر بيصحّح» — the model call (server only). Shared by /api/grade and scripts/try-grader.ts.
 */
import { graderResponseSchema, type GradeRubric } from '@/lib/grader'

/**
 * Which paid API grades. GRADER_PROVIDER picks it; otherwise a dedicated Gemini key wins, then OpenAI.
 * Both paid APIs keep requests out of model training (Gemini's FREE tier does not — never point this at it).
 */
export type Provider = 'gemini' | 'openai'
export function graderProvider(): Provider {
    const chosen = process.env.GRADER_PROVIDER
    if (chosen === 'gemini' || chosen === 'openai') return chosen
    if (process.env.GRADER_GEMINI_API_KEY) return 'gemini'
    return process.env.OPENAI_API_KEY ? 'openai' : 'gemini'
}

async function callGemini(system: string, user: string, schema: object): Promise<string> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const apiKey = process.env.GRADER_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('grader key missing')
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: process.env.GRADER_MODEL || 'gemini-3.8-flash',
        systemInstruction: system,
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
            // The SDK's Schema type is stricter than the plain JSON schema we build; the API accepts it.
            responseSchema: schema as never,
        },
    })
    const result = await model.generateContent(user, { timeout: 25_000 })
    return result.response.text()
}

async function callOpenAI(system: string, user: string, schema: object): Promise<string> {
    const { default: OpenAI } = await import('openai')
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('grader key missing')
    const client = new OpenAI({ apiKey, timeout: 25_000 })
    // GPT-6 models reason first: no custom temperature, and reasoning shares the token budget.
    const response = await client.chat.completions.create({
        model: process.env.GRADER_MODEL || 'gpt-6-luna',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        reasoning_effort: 'low',
        max_completion_tokens: 2500,
        response_format: { type: 'json_schema', json_schema: { name: 'grade', strict: true, schema: schema as Record<string, unknown> } },
    })
    return response.choices[0]?.message?.content || ''
}

/** Sends the prompt to the chosen paid API and returns its raw JSON text. */
export async function gradeWithModel(rubric: GradeRubric, system: string, user: string): Promise<string> {
    const provider = graderProvider()
    const schema = graderResponseSchema(rubric, provider)
    return provider === 'openai' ? callOpenAI(system, user, schema) : callGemini(system, user, schema)
}
