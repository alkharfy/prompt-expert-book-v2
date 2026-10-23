// Models the chat and prompt-hospital routes can call.
// Keep in sync with MODEL_OPTIONS in components/chat/ChatWindow.tsx. Retired upstream (404) as of
// 2026-09: gemini-2.0-flash (Google, 2026-06-01) and llama-3.3-70b-versatile (Groq, 2026-08-16).
// Grok / DeepSeek need XAI_API_KEY / DEEPSEEK_API_KEY — re-add here and in the UI option lists
// once those keys are set in Vercel.

export type ModelProvider = 'openai' | 'google' | 'groq'

export interface ModelConfig {
    provider: ModelProvider
    apiModel: string
    label: string
    baseURL?: string
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
    'gpt-oss-120b': { provider: 'groq', apiModel: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
    'gpt-6-luna': { provider: 'openai', apiModel: 'gpt-6-luna', label: 'GPT-6 Luna' },
    'gemini-3.8-flash': { provider: 'google', apiModel: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
}

export const validModels = Object.keys(MODEL_CONFIG) as [string, ...string[]]

/** The key for an OpenAI-compatible model: DeepSeek or xAI when it has their baseURL, else OpenAI. */
export function openAICompatibleKey(config: ModelConfig): string | undefined {
    if (config.baseURL?.includes('deepseek')) return process.env.DEEPSEEK_API_KEY
    if (config.baseURL) return process.env.XAI_API_KEY
    return process.env.OPENAI_API_KEY
}
