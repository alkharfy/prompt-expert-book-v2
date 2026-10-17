import envelopes from './envelopes.json'

export type Expression = 'happy' | 'curious' | 'surprised' | 'annoyed' | 'wink'

export interface GuideCard {
    bad?: string
    good?: string
    note?: string
}

export interface GuideLine {
    /** Second at which this line starts in the audio (measured from pauses). */
    start: number
    expression: Expression
    text: string
    card?: GuideCard
    /** Last line: robot leans toward the bubble and the CTA shows. */
    cta?: boolean
}

export interface GuideScenario {
    id: 's1' | 's2' | 's3'
    audio: string
    duration: number
    /** Mouth opening per 50ms, one digit 0–9 (from scripts in video-content/avatar-scenarios.md). */
    envelope: string
    lines: GuideLine[]
}

const ACCOUNTS_CARD: GuideCard = {
    bad: 'اعمل لي حسابات الشركة',
    good: 'أنا محاسب في شركة توريدات صغيرة. ده شيت مبيعات الشهر. طلّع لي إجمالي كل عميل ورتّبهم من الأكبر للأصغر.',
}

const EMAIL_CARD: GuideCard = {
    bad: 'اكتب إيميل لمديري أطلب إجازة',
    good: 'أنا موظف في قسم المبيعات، ومديري بيحب الكلام المختصر. اكتب له رسالة قصيرة ومحترمة أطلب فيها إجازة يوم الخميس عشان ظرف عائلي.',
}

export const GUIDE_SCENARIOS: GuideScenario[] = [
    {
        id: 's1',
        audio: '/assets/avatar/s1.mp3',
        duration: 27.5,
        envelope: envelopes.s1,
        lines: [
            { start: 0, expression: 'happy', text: 'أهلاً بيك! أنا برومبت ماستر، وهكون معاك في رحلتك مع الذكاء الاصطناعي خطوة بخطوة.' },
            { start: 6.5, expression: 'curious', text: 'تعرف أغلب الناس بيبدأوا إزاي؟ بيكتبوا له: اعمل لي حسابات الشركة. وخلاص!' },
            { start: 11.9, expression: 'surprised', text: 'فيطلّع لهم جدول شكله حلو جداً... وأرقامه مالهاش أي علاقة بالشركة!', card: { bad: ACCOUNTS_CARD.bad } },
            { start: 17.5, expression: 'happy', text: 'العيب مش فيه، العيب في الطلب. وأنا هعلّمك تكلّمه صح، لحد ما يبقى مساعدك الشخصي في شغلك.', card: ACCOUNTS_CARD, cta: true },
        ],
    },
    {
        id: 's2',
        audio: '/assets/avatar/s2.mp3',
        duration: 27.6,
        envelope: envelopes.s2,
        lines: [
            { start: 0, expression: 'wink', text: 'أهلاً! أنا برومبت ماستر.' },
            { start: 2.8, expression: 'curious', text: 'جرّبت قبل كده تقول للذكاء الاصطناعي: اكتب لي إيميل لمديري أطلب إجازة؟' },
            { start: 7.7, expression: 'annoyed', text: 'يكتب لك: «عزيزي المدير المحترم، أتمنى أن تكون في أتم الصحة والعافية»... ولا كأنك بتكلّم وزير!', card: { bad: EMAIL_CARD.bad } },
            { start: 16.2, expression: 'happy', text: 'لكن لو قلت له إنت مين، ومديرك مين، وعايز إيه بالظبط، هيكتب بأسلوبك إنت. وأول نتيجة هتشوفها في دقيقة.', card: EMAIL_CARD, cta: true },
        ],
    },
    {
        id: 's3',
        audio: '/assets/avatar/s3.mp3',
        duration: 26.5,
        envelope: envelopes.s3,
        lines: [
            { start: 0, expression: 'happy', text: 'أهلاً بيك! أنا برومبت ماستر، مرشدك هنا.' },
            { start: 3.6, expression: 'wink', text: 'خليني أقولك سر... الذكاء الاصطناعي ساعات بيغلط. وهو واثق جداً من نفسه!' },
            { start: 8.8, expression: 'surprised', text: 'تسأله عن رقم أو معلومة، يرد عليك بكل ثقة، وهو مألّفها من دماغه! واللي بيسلّم الكلام ده من غير ما يراجعه، بيتحرج قدّام مديره.', card: { note: 'الرد كان مترتب وواثق... بس المعلومة نفسها مش موجودة أصلاً.' } },
            { start: 19.7, expression: 'happy', text: 'أنا هعلّمك تطلب منه صح، وتعرف إمتى بيغلط قبل ما تسلّم.', cta: true },
        ],
    },
]

/** 0–1 mouth opening at a given second. */
export function mouthLevel(scenario: GuideScenario, t: number): number {
    const i = Math.floor(t * 20)
    const ch = scenario.envelope.charCodeAt(i)
    if (Number.isNaN(ch)) return 0
    return Math.max(0, Math.min(9, ch - 48)) / 9
}

export function lineAt(scenario: GuideScenario, t: number): number {
    let idx = 0
    scenario.lines.forEach((line, i) => {
        if (t >= line.start) idx = i
    })
    return idx
}
