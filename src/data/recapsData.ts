// بيانات ملخصات الفصول — Chapter Recaps
// المرحلة 4: ملخصات نهاية كل فصل

export interface ChapterRecap {
    sectionId: string
    chapterLabel: string
    chapterTitle: string
    keyTakeaways: {
        icon: string
        title: string
        description: string
    }[]
    proTip: {
        text: string
        icon: string
    }
    nextChapterTeaser: {
        title: string
        description: string
        icon: string
    } | null
    stats: {
        pages: number
        estimatedMinutes: number
        exercises: number
    }
    keyQuote?: {
        text: string
        pageNumber: number
    }
}

export const recapsData: Record<string, ChapterRecap> = {
    'section-1': {
        sectionId: 'section-1',
        chapterLabel: 'الفصل 01',
        chapterTitle: 'عالم الذكاء الاصطناعي',
        keyTakeaways: [
            {
                icon: '🧠',
                title: 'الذكاء الاصطناعي التوليدي',
                description: 'تعرفت على أساسيات AI التوليدي وكيف يختلف عن البرمجة التقليدية — هو بيفهم السياق ويولّد محتوى جديد.',
            },
            {
                icon: '🔤',
                title: 'دور البرومبت الأساسي',
                description: 'البرومبت هو طريقتك للتواصل مع AI. كل ما كنت أوضح، كل ما النتيجة تبقى أحسن.',
            },
            {
                icon: '⚙️',
                title: 'أدوات AI المختلفة',
                description: 'كل أداة (ChatGPT, Claude, Gemini) ليها نقاط قوة مختلفة — المهم تعرف تختار الأنسب لمهمتك.',
            },
            {
                icon: '🎯',
                title: 'العقلية الصح',
                description: 'AI مش بيحل محلك — هو أداة بتضاعف إنتاجيتك لو عرفت تستخدمها صح.',
            },
        ],
        proTip: {
            text: 'جرب تفتح ChatGPT أو Claude وتطلب منه يشرحلك مفهوم صعب في مجالك — شوف الفرق لما تكون محدد في طلبك vs لما تكون عام.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتجرّب بنفسك! هتفتح أدوات AI وتبدأ أول محادثة حقيقية وتتعلم أساسيات التعامل.',
            icon: '🔮',
        },
        stats: { pages: 17, estimatedMinutes: 25, exercises: 3 },
        keyQuote: {
            text: 'البرومبت مش مجرد سؤال — ده لغة جديدة بينك وبين الذكاء الاصطناعي.',
            pageNumber: 3,
        },
    },

    'section-2': {
        sectionId: 'section-2',
        chapterLabel: 'الفصل 02',
        chapterTitle: 'تجربتك الأولى',
        keyTakeaways: [
            {
                icon: '💻',
                title: 'بيئة العمل',
                description: 'تعلمت إزاي تجهّز بيئة عملك وتفتح أول محادثة مع AI بطريقة منظمة.',
            },
            {
                icon: '📝',
                title: 'المحادثة الفعالة',
                description: 'السياق هو المفتاح — كل ما وفرت معلومات أكتر لـ AI، كل ما الإجابة تبقى أدق وأفيد.',
            },
            {
                icon: '🔄',
                title: 'التكرار والتحسين',
                description: 'أول إجابة مش دايماً الأحسن — التعديل والmتابعة هما سر النتائج المميزة.',
            },
            {
                icon: '⚡',
                title: 'اختصارات مهمة',
                description: 'تعلمت حيل وأوامر بتوفر وقت وبتحسن جودة التفاعل مع أدوات AI المختلفة.',
            },
        ],
        proTip: {
            text: 'ابدأ كل محادثة جديدة بتحديد: مين أنت، إيه المهمة، وإيه المطلوب بالتحديد. ده بيفرق جداً في جودة الإجابة.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم إطار GOLDS — نظام احترافي لكتابة برومبتات تعطي نتائج مذهلة في كل مرة!',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 25, exercises: 3 },
    },

    'section-3': {
        sectionId: 'section-3',
        chapterLabel: 'الفصل 03',
        chapterTitle: 'إطار GOLDS للبرومبتات',
        keyTakeaways: [
            {
                icon: '🏆',
                title: 'إطار GOLDS',
                description: 'G (Goal) + O (Output) + L (Limits) + D (Details) + S (Style) — 5 عناصر لبرومبت احترافي.',
            },
            {
                icon: '🎯',
                title: 'تحديد الهدف بدقة',
                description: 'الهدف الواضح هو أول خطوة — لازم تعرف بالظبط إيه اللي عايز AI يعمله.',
            },
            {
                icon: '📐',
                title: 'التحكم في المخرجات',
                description: 'تعلمت تحدد شكل المخرجات (جدول، قائمة، فقرات) وطولها وأسلوبها.',
            },
            {
                icon: '✨',
                title: 'الأسلوب والنبرة',
                description: 'تحديد النبرة (رسمية، ودية، تقنية) بيخلي النتيجة تناسب جمهورك المستهدف.',
            },
        ],
        proTip: {
            text: 'في المرة الجاية اللي تحتاج فيها AI، اكتب البرومبت باستخدام GOLDS: حدد الهدف، المخرج، الحدود، التفاصيل، والأسلوب. قارن النتيجة بسؤال عادي!',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم الـ Prompt Chaining — إزاي تربط برومبتات ببعض لبناء مشاريع كاملة!',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 25, exercises: 4 },
        keyQuote: {
            text: 'البرومبت المحترف مش طويل — هو منظم.',
            pageNumber: 5,
        },
    },

    'section-4': {
        sectionId: 'section-4',
        chapterLabel: 'الفصل 04',
        chapterTitle: 'البرومبتات المتسلسلة',
        keyTakeaways: [
            {
                icon: '🔗',
                title: 'Prompt Chaining',
                description: 'بدل سؤال واحد كبير — قسّم المهمة الكبيرة لخطوات صغيرة متسلسلة والنتائج بتكون أحسن بكتير.',
            },
            {
                icon: '📋',
                title: 'بناء خطة عمل',
                description: 'تعلمت إزاي تخطط مشروع كامل باستخدام سلسلة برومبتات مترابطة.',
            },
            {
                icon: '🔄',
                title: 'التغذية الراجعة',
                description: 'كل خطوة بتغذي اللي بعدها — النتيجة من برومبت بتبقى مدخل للبرومبت اللي بعده.',
            },
            {
                icon: '🏗️',
                title: 'مشروع حقيقي',
                description: 'طبّقت Prompt Chaining على مشروع حقيقي من الفكرة للتنفيذ.',
            },
        ],
        proTip: {
            text: 'لما تيجي تبني محتوى أو مشروع كبير، ابدأ بـ "Step 1: اعملي مخطط" وبعدها "Step 2: فصّل كل جزء" — النتيجة هتبقى أفضل 10x.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم إزاي تتأكد إن مخرجات AI بجودة عالية — وإزاي تكتشف وتصلح الأخطاء!',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 25, exercises: 3 },
    },

    'section-5': {
        sectionId: 'section-5',
        chapterLabel: 'الفصل 05',
        chapterTitle: 'الجودة والتصحيح',
        keyTakeaways: [
            {
                icon: '🔍',
                title: 'اكتشاف الأخطاء',
                description: 'AI بيغلط أحياناً — تعلمت إزاي تكتشف "الهلوسات" والمعلومات الخاطئة.',
            },
            {
                icon: '✅',
                title: 'التحقق من الجودة',
                description: 'تعلمت خطوات عملية للتحقق من دقة وجودة مخرجات AI قبل الاعتماد عليها.',
            },
            {
                icon: '🛠️',
                title: 'التصحيح المتقدم',
                description: 'لو AI أعطاك نتيجة مش كويسة — تعلمت إزاي تعدّل البرومبت عشان يتحسن.',
            },
            {
                icon: '📊',
                title: 'معايير التقييم',
                description: 'تعلمت معايير واضحة لتقييم جودة المخرجات: الدقة، الاكتمال، الأسلوب، والفائدة.',
            },
        ],
        proTip: {
            text: 'دايماً اطلب من AI يراجع شغله: "راجع إجابتك وصلح أي أخطاء" — ده بسيط بس بيحسن النتيجة.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هنخرج من عالم النص! هتتعلم إزاي تستخدم AI مع الصور والصوت والفيديو.',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 25, exercises: 3 },
    },

    'section-6': {
        sectionId: 'section-6',
        chapterLabel: 'الفصل 06',
        chapterTitle: 'الذكاء متعدد الوسائط',
        keyTakeaways: [
            {
                icon: '🖼️',
                title: 'تحليل وتوليد الصور',
                description: 'تعلمت إزاي تستخدم AI لتحليل الصور وتوليد صور جديدة باحترافية.',
            },
            {
                icon: '🎵',
                title: 'الصوت والنصوص',
                description: 'تعلمت إزاي تحوّل الكلام لنص والعكس — وإزاي تستخدم ده عملياً.',
            },
            {
                icon: '🎬',
                title: 'الفيديو والمحتوى المرئي',
                description: 'اكتشفت إمكانيات AI في إنشاء واديت الفيديو والعروض التقديمية.',
            },
            {
                icon: '🎨',
                title: 'برومبتات الصور الاحترافية',
                description: 'تعلمت إزاي تكتب برومبتات محددة تنتج صور بجودة عالية ومتناسقة.',
            },
        ],
        proTip: {
            text: 'لما تطلب توليد صورة، كن محدد جداً: حدد الأسلوب (realistic, cartoon, minimalist)، الإضاءة، الألوان، والزاوية.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم عن وكلاء الذكاء الاصطناعي — أنظمة ذكية بتشتغل لوحدها وبتنفذ مهام معقدة!',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 30, exercises: 3 },
    },

    'section-7': {
        sectionId: 'section-7',
        chapterLabel: 'الفصل 07',
        chapterTitle: 'وكلاء الذكاء الاصطناعي',
        keyTakeaways: [
            {
                icon: '🤖',
                title: 'ما هي الوكلاء AI Agents',
                description: 'تعلمت الفرق بين الـ chatbot العادي والوكيل الذكي اللي بياخد قرارات وينفذ مهام.',
            },
            {
                icon: '🔧',
                title: 'الأدوات والتكامل',
                description: 'الوكلاء بيستخدموا أدوات (بحث، كود، APIs) — تعلمت إزاي تربطهم ببعض.',
            },
            {
                icon: '📋',
                title: 'تصميم Workflow',
                description: 'تعلمت إزاي تصمم workflow لوكيل ذكي: المهمة → الخطوات → الأدوات → النتيجة.',
            },
            {
                icon: '🚀',
                title: 'بناء وكيل متكامل',
                description: 'طبقت عملياً وبنيت وكيل ذكي قادر ينفذ مهام حقيقية من البداية للنهاية.',
            },
        ],
        proTip: {
            text: 'ابدأ باستخدام وكلاء جاهزين (مثل Custom GPTs) قبل ما تحاول تبني وكيل من الصفر. افهم المنطق الأول ثم طوّر.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم عن RAG — إزاي تخلي AI يشتغل ببياناتك الخاصة!',
            icon: '🔮',
        },
        stats: { pages: 18, estimatedMinutes: 30, exercises: 3 },
    },

    'section-8': {
        sectionId: 'section-8',
        chapterLabel: 'الفصل 08',
        chapterTitle: 'RAG والبيانات الخاصة',
        keyTakeaways: [
            {
                icon: '🗄️',
                title: 'ليه AI مش بيعرف بياناتك',
                description: 'فهمت ليه AI بيرد بمعلومات عامة — وإزاي RAG بيحل المشكلة دي.',
            },
            {
                icon: '🔗',
                title: 'Retrieval Augmented Generation',
                description: 'تعلمت إزاي تربط AI ببياناتك الخاصة عشان يرد بمعلومات دقيقة ومحدثة.',
            },
            {
                icon: '📊',
                title: 'التطبيقات العملية',
                description: 'شفت أمثلة حقيقية: chatbot لشركة، محرك بحث ذكي، مساعد لتحليل المستندات.',
            },
            {
                icon: '⚡',
                title: 'تحسين الجودة',
                description: 'تعلمت إزاي تحسّن جودة RAG: تنظيف البيانات، Chunking الصح، واختيار Embeddings.',
            },
        ],
        proTip: {
            text: 'جرب أداة مثل NotebookLM من Google — ارفعلها ملفات PDF وابدأ اسألها أسئلة. ده أبسط شكل من RAG!',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'هتتعلم إزاي تطبق AI في مجالات مختلفة: التسويق، البزنس، التعليم، والإبداع!',
            icon: '🔮',
        },
        stats: { pages: 16, estimatedMinutes: 22, exercises: 3 },
    },

    'section-9': {
        sectionId: 'section-9',
        chapterLabel: 'الفصل 09',
        chapterTitle: 'AI للصناعات والتخصصات',
        keyTakeaways: [
            {
                icon: '📈',
                title: 'AI للتسويق والمبيعات',
                description: 'تعلمت إزاي تستخدم AI لكتابة محتوى تسويقي، تحليل السوق، وبناء استراتيجيات.',
            },
            {
                icon: '💼',
                title: 'AI للبزنس والإدارة',
                description: 'اكتشفت إزاي AI بيساعد في اتخاذ القرارات، التخطيط، وتحسين العمليات.',
            },
            {
                icon: '📚',
                title: 'AI للتعليم والبحث',
                description: 'تعلمت إزاي تستخدم AI كمدرس شخصي وكأداة بحث أكاديمية قوية.',
            },
            {
                icon: '🎨',
                title: 'AI للإبداع والفنون',
                description: 'شفت إزاي AI بيدعم الإبداع في الكتابة، التصميم، الموسيقى، والفنون.',
            },
        ],
        proTip: {
            text: 'اختار مجال واحد من اللي اتعلمتهم وطبّق 3 برومبتات عملية فيه هذا الأسبوع. التطبيق العملي هو اللي بيثبت المعرفة.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في الفصل القادم...',
            description: 'الفصل الأخير! هنتكلم عن مستقبل AI وإزاي تستعد للتغييرات القادمة.',
            icon: '🔮',
        },
        stats: { pages: 16, estimatedMinutes: 22, exercises: 3 },
    },

    'section-10': {
        sectionId: 'section-10',
        chapterLabel: 'الفصل 10',
        chapterTitle: 'المستقبل والخطوات القادمة',
        keyTakeaways: [
            {
                icon: '🔮',
                title: 'اتجاهات AI القادمة',
                description: 'تعرفت على أهم الاتجاهات التقنية المتوقعة في 2025-2027 وتأثيرها على حياتك.',
            },
            {
                icon: '💪',
                title: 'المهارات المطلوبة',
                description: 'عرفت إيه المهارات اللي محتاج تطورها عشان تفضل متقدم في عصر AI.',
            },
            {
                icon: '🗺️',
                title: 'خريطة الطريق',
                description: 'عندك دلوقتي خريطة واضحة: إيه اللي تتعلمه بعدين وإزاي تستمر.',
            },
            {
                icon: '🏆',
                title: 'إنت بقيت خبير',
                description: 'مبروك! عدّيت على كل الأساسيات والمتقدم — دلوقتي دورك تطبق وتشارك!',
            },
        ],
        proTip: {
            text: 'ابدأ مشروع شخصي يستخدم AI هذا الأسبوع — حتى لو بسيط. أحسن طريقة للتعلم هي التطبيق المستمر.',
            icon: '💡',
        },
        nextChapterTeaser: null, // Last chapter
        stats: { pages: 16, estimatedMinutes: 22, exercises: 2 },
        keyQuote: {
            text: 'الخبير مش اللي يعرف كل حاجة — ده اللي يعرف يسأل الأسئلة الصح.',
            pageNumber: 14,
        },
    },
}

/**
 * Get recap data for a section
 */
export function getRecapForSection(sectionId: string): ChapterRecap | null {
    return recapsData[sectionId] || null
}
