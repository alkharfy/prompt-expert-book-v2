/**
 * تحدي PromptMaster — 7 أيام لاحتراف AI
 * PromptMaster Challenge — 7 Days to AI Mastery
 *
 * هيكل التحدي: 7 أيام × (مهمة + وقت + نتيجة + مكافأة)
 * المجموع: 700 نقطة + 7 شارات + شهادة إتمام
 */

export interface ChallengeDay {
    day: number;
    title: string;
    subtitle: string;
    emoji: string;
    task: string;
    duration: string;
    expectedResult: string;
    points: number;
    badge: string;
    badgeEmoji: string;
    hint: string;
    relatedUnit: number;
}

export const challengeDays: ChallengeDay[] = [
    {
        day: 1,
        title: 'أول Prompt احترافي',
        subtitle: 'اكتب prompt بإطار GOLDS واحصل على نتيجة مذهلة',
        emoji: '🚀',
        task: 'افتح ChatGPT أو Claude واكتب prompt باستخدام إطار GOLDS:\n\n• G (Goal): حدد هدفك بوضوح\n• O (Output): حدد شكل المخرج (قائمة؟ مقالة؟ جدول؟)\n• L (Length): حدد الطول\n• D (Details): أضف تفاصيل السياق\n• S (Style): حدد الأسلوب والنبرة\n\nاختر أي موضوع يهمك — سيرة ذاتية، خطة عمل، أو حل مشكلة.',
        duration: '10 دقائق',
        expectedResult: 'Screenshot للنتيجة — قبل GOLDS وبعده',
        points: 50,
        badge: 'البداية',
        badgeEmoji: '🌱',
        hint: 'المفتاح: كن محدداً جداً في الهدف والمخرج. "اكتبلي حاجة عن التسويق" ≠ "اكتبلي 5 نصائح تسويقية لمتجر ملابس أونلاين على Instagram بأسلوب مرح"',
        relatedUnit: 3
    },
    {
        day: 2,
        title: 'خلّي AI يكتبلك',
        subtitle: 'اكتب 3 بوستات سوشيال ميديا باستخدام AI',
        emoji: '✍️',
        task: 'اكتب 3 بوستات جاهزة للنشر على Instagram أو Facebook:\n\n1. بوست تعليمي (نصائح أو معلومات)\n2. بوست تفاعلي (سؤال أو poll)\n3. بوست ترويجي (عرض أو خدمة)\n\nاستخدم ChatGPT لكتابة كل بوست مع الـ caption والـ hashtags وأفضل وقت للنشر.',
        duration: '15 دقيقة',
        expectedResult: '3 بوستات كاملة جاهزة للنشر',
        points: 75,
        badge: 'الكاتب',
        badgeEmoji: '📝',
        hint: 'حدد الجمهور المستهدف في البرومبت. بوست لطالب جامعي يختلف تماماً عن بوست لصاحب بيزنس.',
        relatedUnit: 9
    },
    {
        day: 3,
        title: 'صمّم من غير ما تكون مصمم',
        subtitle: 'ولّد 3 صور احترافية بالـ AI',
        emoji: '🎨',
        task: 'استخدم أي أداة توليد صور (DALL-E / Ideogram / Midjourney) لتوليد 3 صور:\n\n1. صورة منتج أو خدمة\n2. صورة شخصية احترافية أو avatar\n3. صورة إبداعية أو فنية\n\nطبّق إطار SSCT: Subject, Style, Composition, Technical',
        duration: '15 دقيقة',
        expectedResult: '3 صور احترافية بجودة عالية',
        points: 75,
        badge: 'المصمم',
        badgeEmoji: '🎨',
        hint: 'Ideogram الأفضل للنص العربي في الصور. DALL-E الأسهل للمبتدئين.',
        relatedUnit: 6
    },
    {
        day: 4,
        title: 'حلّل بيانات في دقايق',
        subtitle: 'خلّي AI يحلل بيانات ويطلع insights',
        emoji: '📊',
        task: 'حمّل أي ملف بيانات (Excel أو CSV) على ChatGPT Code Interpreter:\n\n• يمكنك استخدام بياناتك الشخصية (مصاريف، مبيعات)\n• أو حمّل dataset مجاني من Kaggle\n\nاطلب من AI:\n1. ملخص البيانات\n2. 5 insights رئيسية\n3. رسم بياني واحد على الأقل\n4. توصيات عملية',
        duration: '10 دقائق',
        expectedResult: '5 insights + رسم بياني من بيانات حقيقية',
        points: 100,
        badge: 'المحلل',
        badgeEmoji: '📊',
        hint: 'لو مش عارف تلاقي بيانات: جرب تعمل جدول بمصاريفك الشهرية وحمّله.',
        relatedUnit: 9
    },
    {
        day: 5,
        title: 'اتكلم مع AI زي المحترفين',
        subtitle: 'استخدم Prompt Chaining (سلسلة 3 prompts مترابطة)',
        emoji: '🔗',
        task: 'نفّذ مشروع صغير باستخدام سلسلة من 3 prompts مترابطة:\n\nPrompt 1: ابحث وجمّع معلومات عن [موضوع]\nPrompt 2: من المعلومات دي، اكتب [مخرج محدد]\nPrompt 3: راجع وحسّن [المخرج] مع [معايير محددة]\n\nمثال: ابحث عن اتجاهات AI في 2026 ← اكتب مقالة من البحث ← راجعها وحسّنها',
        duration: '15 دقيقة',
        expectedResult: 'مشروع صغير مكتمل من 3 خطوات',
        points: 100,
        badge: 'المحترف',
        badgeEmoji: '⛓️',
        hint: 'مفتاح Prompt Chaining: كل prompt يبني على نتيجة اللي قبله. خذ output الأول واستخدمه كـ input للثاني.',
        relatedUnit: 4
    },
    {
        day: 6,
        title: 'الـ AI Agent بتاعك',
        subtitle: 'خلّي AI يعمل بحث كامل بشكل مستقل',
        emoji: '🤖',
        task: 'اطلب من AI (ChatGPT مع البحث أو Perplexity) يعمل research كامل عن موضوع يهمك:\n\n1. حدد السؤال البحثي بدقة\n2. اطلب مصادر حقيقية\n3. اطلب تقرير منظم (مقدمة + نقاط رئيسية + خلاصة)\n4. اطلب قائمة الخطوات التالية\n\nالموضوع يمكن يكون: فرصة عمل، تقنية جديدة، سوق محدد...',
        duration: '10 دقائق',
        expectedResult: 'تقرير بحثي من صفحة واحدة مع مصادر',
        points: 100,
        badge: 'الباحث',
        badgeEmoji: '🔍',
        hint: 'Perplexity هو الأفضل للبحث — لأنه بيوفر مصادر مباشرة. Claude مع Extended Thinking ممتاز للتحليل العميق.',
        relatedUnit: 7
    },
    {
        day: 7,
        title: 'اكسب أول فلوس',
        subtitle: 'صمّم عرض خدمة AI واحد وانشره فعلاً',
        emoji: '💰',
        task: 'صمّم عرض خدمة AI كامل وانشره على منصة فريلانس:\n\n1. اختار خدمة من الـ 7 خدمات (فصل 10)\n2. استخدم ChatGPT لكتابة عرض احترافي يتضمن:\n   • اسم الخدمة ووصفها\n   • 3 مستويات تسعير\n   • ما يحصل عليه العميل\n   • مدة التسليم\n3. سجّل على مستقل أو خمسات أو Fiverr\n4. انشر العرض فعلاً!\n5. قدّم على أول 3 مشاريع',
        duration: '20 دقيقة',
        expectedResult: 'عرض خدمة منشور فعلاً على منصة فريلانس',
        points: 200,
        badge: 'رائد الأعمال',
        badgeEmoji: '🏆',
        hint: 'أول عرض مش لازم يكون مثالي. المهم تبدأ — هتتحسن مع كل عميل.',
        relatedUnit: 10
    }
];

export const challengeInfo = {
    title: 'تحدي PromptMaster — 7 أيام لاحتراف AI',
    description: '7 أيام من المهام العملية لتحويل مهاراتك في AI إلى نتائج حقيقية',
    totalPoints: 700,
    totalBadges: 7,
    completionBadge: 'خبير التحدي 🏅',
    completionCertificate: true,
};
