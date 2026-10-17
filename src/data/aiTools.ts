/**
 * «الأفضل لكل مهمة — من وجهة نظرنا»: المكان الوحيد اللي فيه أسامي الأدوات ولينكاتها.
 * الأدوات والحدود المجانية بتتغير كتير، فلما تتراجع غيّر REVIEWED وراجع كل سطر.
 * المصادر (أكتوبر 2026): صفحة Flow الرسمية «Where you can use Flow» (مصر موجودة، 18+)،
 * وFlow بيدّي الحسابات المجانية 50 كريدت في اليوم (فيديو Lite = 10 كريدت).
 */

export const AI_TOOLS_REVIEWED = 'أكتوبر 2026'

export type ToolPlan = 'free' | 'limited' | 'paid'

export interface AiTool {
    name: string
    url: string
    plan: ToolPlan
}

export interface AiToolTask {
    icon: string
    task: string
    tip: string
    tools: [AiTool, AiTool]
}

export const PLAN_LABEL: Record<ToolPlan, string> = {
    free: 'مجاني',
    limited: 'مجاني بحدود',
    paid: 'بفلوس',
}

/** The first rows are the ones the lesson uses today; the rest open on tap. */
export const AI_TOOLS_SHOWN = 4

export const AI_TOOL_TASKS: AiToolTask[] = [
    {
        icon: '✍️',
        task: 'كتابة ورسايل وتلخيص',
        tip: 'إيميل، رد على عميل، تقرير، تلخيص ملف طويل.',
        tools: [
            { name: 'ChatGPT', url: 'https://chatgpt.com', plan: 'limited' },
            { name: 'Claude', url: 'https://claude.ai', plan: 'limited' },
        ]
    },
    {
        icon: '📊',
        task: 'تحليل شيت وأرقام',
        tip: 'ارفع الشيت واسأله: الإجمالي، والأعلى، والمقارنة بالشهر اللي فات. ابدأ بشيت تجريبي من غير بيانات عملاء أو موظفين.',
        tools: [
            { name: 'ChatGPT', url: 'https://chatgpt.com', plan: 'limited' },
            { name: 'Claude', url: 'https://claude.ai', plan: 'limited' },
        ]
    },
    {
        icon: '🖼️',
        task: 'صور وبوسترات',
        tip: 'إعلان، صورة منتج، بوست سوشيال. والكتابة العربي جوه الصورة لسه ساعات بتطلع مكسّرة.',
        tools: [
            { name: 'Gemini', url: 'https://gemini.google.com', plan: 'limited' },
            { name: 'ChatGPT', url: 'https://chatgpt.com', plan: 'limited' },
        ]
    },
    {
        icon: '🎬',
        task: 'فيديو',
        tip: 'Flow بيدّي الحسابات المجانية رصيد كل يوم يكفي كام فيديو قصير، بس ممكن يطلب اشتراك أو يتوقف وقت الزحمة. Kling فيه رصيد مجاني برضه، بس ممكن يتأخر.',
        tools: [
            { name: 'Flow', url: 'https://labs.google/flow', plan: 'limited' },
            { name: 'Kling', url: 'https://klingai.com', plan: 'limited' },
        ]
    },
    {
        icon: '🔎',
        task: 'بحث بمصادر',
        tip: 'بيدّيك اللينكات اللي جاب منها الكلام، فتفتحها وتتأكد.',
        tools: [
            { name: 'Perplexity', url: 'https://www.perplexity.ai', plan: 'limited' },
            { name: 'Gemini', url: 'https://gemini.google.com', plan: 'limited' },
        ]
    },
    {
        icon: '📚',
        task: 'تذاكر وتفهم من ملفاتك',
        tip: 'ارفع ملفاتك، وهو يشرحها ويلخّصها ويعملك أسئلة وملخص صوتي.',
        tools: [
            { name: 'NotebookLM', url: 'https://notebooklm.google.com', plan: 'limited' },
            { name: 'ChatGPT', url: 'https://chatgpt.com', plan: 'limited' },
        ]
    },
    {
        icon: '🎙️',
        task: 'صوت وتعليق صوتي',
        tip: 'ElevenLabs بيقرا النص بتاعك بصوت باللهجة المصرية (والمجاني للتجربة، مش للاستخدام التجاري). NotebookLM بيعمل ملخص صوتي زي البودكاست من ملفاتك.',
        tools: [
            { name: 'ElevenLabs', url: 'https://elevenlabs.io', plan: 'limited' },
            { name: 'NotebookLM', url: 'https://notebooklm.google.com', plan: 'limited' },
        ]
    },
    {
        icon: '📽️',
        task: 'عروض تقديمية',
        tip: 'من فكرة أو ملف لعرض جاهز في دقايق، وبعدين تعدّل عليه.',
        tools: [
            { name: 'Gamma', url: 'https://gamma.app', plan: 'limited' },
            { name: 'Canva', url: 'https://www.canva.com', plan: 'limited' },
        ]
    },
    {
        icon: '💻',
        task: 'برمجة',
        tip: 'للمبرمجين: Claude Code بفلوس، وCodex فيه مجاني بحدود. مش محتاجها في الكورس ده.',
        tools: [
            { name: 'Claude Code', url: 'https://claude.com/product/claude-code', plan: 'paid' },
            { name: 'Codex', url: 'https://chatgpt.com/codex', plan: 'limited' },
        ]
    },
]
