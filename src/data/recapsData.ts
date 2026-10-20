// بيانات ملخصات الفصول — Chapter Recaps
// المرحلة 4: ملخصات نهاية كل فصل

import { SECTION_REGISTRY } from '@/config/sections'

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
        chapterLabel: 'المستوى ١',
        chapterTitle: 'بتستخدمه صح',
        keyTakeaways: [
            {
                icon: '🧠',
                title: 'بيتوقّع، مش بيدوّر',
                description: 'الـ AI بيتوقّع الكلام اللي شكله صح، فممكن يغلط وهو واثق.',
            },
            {
                icon: '🎯',
                title: 'شروط القبول الأول',
                description: 'مين هيقرا، والشكل، ولازم يبقى فيه إيه — وبعدها الخمس حاجات.',
            },
            {
                icon: '🔍',
                title: 'راجع بدليل',
                description: 'الأرقام، والأسامي والتواريخ، والوعود، والمصادر، وشروط القبول.',
            },
            {
                icon: '🔐',
                title: 'متشاركش',
                description: 'البيانات المتخبية في الملاحظات والنص بتتشال قبل أي رفع.',
            },
        ],
        proTip: {
            text: 'اعمل نفس شغلانة المشروع تاني مرتين الأسبوع ده، وسجّل وقت كل مرة بالمراجعة.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في المستوى الجاي...',
            description: 'بتطلب زي المحترف: طلبات جاهزة لأكتر شغلاناتك، والمستر بيصحّحها.',
            icon: '🔮',
        },
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-1')!.pageCount, estimatedMinutes: 180, exercises: 9 },
    },

    'section-2': {
        sectionId: 'section-2',
        chapterLabel: 'المستوى ٢',
        chapterTitle: 'بتطلب زي المحترف',
        keyTakeaways: [
            {
                icon: '🧭',
                title: 'يستاهل ولا لأ؟',
                description: 'بتتكرر؟ بتاخد وقت؟ ليها أصل؟ الغلط تمنه إيه؟',
            },
            {
                icon: '🧩',
                title: 'وريه مثال',
                description: 'مثالين أو تلاتة مختلفين + قاعدة واحدة، و[  ] مكان اللي بيتغيّر.',
            },
            {
                icon: '📸',
                title: 'صورة وفويس وملفين',
                description: '«لو مش واضح، اكتب [مش واضح]»، وكل فرق جنبه مكانه في الاتنين.',
            },
            {
                icon: '🪜',
                title: 'قسّمها',
                description: 'نضّف ← حلّل ← اكتب، وراجع رقم بين كل خطوة.',
            },
        ],
        proTip: {
            text: 'استخدم طلب من شنطتك في شغلانة حقيقية الأسبوع ده، وقيس وقته بالمراجعة.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في المستوى الجاي...',
            description: 'بتجهّزه لشغلك: تعلّمه طريقة شغلك مرة، فيعمل الشغلانة اللي بتتكرر من غير ما تشرح.',
            icon: '🔮',
        },
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-2')!.pageCount, estimatedMinutes: 180, exercises: 8 },
    },

    'section-3': {
        sectionId: 'section-3',
        chapterLabel: 'المستوى ٣',
        chapterTitle: 'بتجهّزه لشغلك',
        keyTakeaways: [
            {
                icon: '🗂️',
                title: 'بيعرف منين؟',
                description: 'المحادثة · التعليمات الدائمة · الذاكرة · المساحة. والمحادثة الطويلة بتضعف: ملخص تسليم ومحادثة جديدة.',
            },
            {
                icon: '🧠',
                title: 'الذاكرة تحت إيدك',
                description: 'بتشوفها وتصلّحها وتمسح منها من الإعدادات، و«ملف شغلي» الأداة تكتب مسودته وإنت تراجعه.',
            },
            {
                icon: '📘',
                title: 'دليل التشغيل',
                description: 'الهدف · الخطوات · القواعد · مثالين · شروط القبول · إمتى يوقف ويسأل. مكتوب لزميل جديد.',
            },
            {
                icon: '📁',
                title: 'الملفات المرجعية',
                description: 'قصيرة ونضيفة وعليها تاريخ ونسخة واحدة، و«لو مش موجود، قول مش موجود».',
            },
            {
                icon: '🧪',
                title: 'اختبره وصلّح الدليل',
                description: '6 حالات بإجاباتها قبل التجربة، وكل غلطة تبقى قاعدة في الدليل مش تصليح في الرد.',
            },
        ],
        proTip: {
            text: 'استخدم المساعد في شغلانتك الأسبوع ده، وكل غلطة تقابلك: قاعدة في الدليل، وسطر في سجل التغييرات.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في المستوى الجاي...',
            description: 'بيشتغل معاك: تسلّمه مهمة فيها كذا خطوة، وتراقبه، وتوقّفه لو غلط.',
            icon: '🔮',
        },
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-3')!.pageCount, estimatedMinutes: 195, exercises: 7 },
    },

    'section-4': {
        sectionId: 'section-4',
        chapterLabel: 'المستوى ٤',
        chapterTitle: 'بيشتغل معاك',
        keyTakeaways: [
            {
                icon: '📝',
                title: 'ورقة التكليف',
                description: 'الهدف · المدخلات · التسليم · الحدود · نقط الموافقة · إمتى يوقف ويسأل. و«اعرض الخطة واستنى» قبل أي مهمة.',
            },
            {
                icon: '🔎',
                title: 'مراجعة مصادر البحث',
                description: 'اللينك مش دليل: بيفتح؟ مين نشره؟ إمتى؟ والجملة نفسها موجودة؟',
            },
            {
                icon: '⏸️',
                title: 'نقط وقوف وسجل',
                description: 'بعد كل خطوة يوقف، وإنت تطابق رقم بإيدك وتكتب سطر في السجل قبل «كمّل».',
            },
            {
                icon: '🔐',
                title: 'الصلاحيات',
                description: 'يقرا بس · مسودة · بعد موافقتك · ممنوع. والفلوس والحساب البنكي والمسح ممنوعين على الأداة.',
            },
            {
                icon: '↩️',
                title: 'الكلام المدسوس والاسترجاع',
                description: 'أي كلام جوه صفحة أو إيميل بيانات مش أوامر. ولو مشي وراه: وقّف · بلّغ · احتفظ بالدليل · ألغِ وصلّح · رجّع من الأصل · اكتب.',
            },
        ],
        proTip: {
            text: 'أي مهمة فيها أكتر من خطوة الأسبوع ده: ابدأها بـ «اعرض الخطة واستنى»، واكتب السجل وإنت ماشي.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'في المستوى الجاي...',
            description: 'نظام شغلك: طريقة شغل بالـ AI ليك أو لفريقك، وتقيس وفّرت قد إيه بالأرقام.',
            icon: '🔮',
        },
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-4')!.pageCount, estimatedMinutes: 155, exercises: 7 },
    },

    'section-5': {
        sectionId: 'section-5',
        chapterLabel: 'المستوى ٥',
        chapterTitle: 'نظام شغلك',
        keyTakeaways: [
            {
                icon: '🧮',
                title: 'القياس',
                description: 'الوقت معاه = تحضير + تشغيل + مراجعة وتصليح. والتوفير الصافي بيطرح كمان وقت تصليح اللي فلت.',
            },
            {
                icon: '💳',
                title: 'تدفع ولا لأ',
                description: 'الحد بيخلص فعلاً؟ الميزة موجودة ببلاش في أداة تانية؟ والسعر قدام الساعات اللي اتوفرت.',
            },
            {
                icon: '⏰',
                title: 'مهمة متجدولة',
                description: 'بتشتغل في ميعادها وتبعتلك إنت بس: تذكير أو مسودة. والإرسال والفلوس بإيدك.',
            },
            {
                icon: '🧩',
                title: 'المهارة والكونكتر',
                description: 'الدليل باسم ووصف بيشتغل في أي محادثة. والأداة تفتح ملفاتك بنفسها: القراية لوحدها، والكتابة بموافقتك كل مرة.',
            },
            {
                icon: '📄',
                title: 'قواعد الفريق وشنطة التسليم',
                description: 'صفحة قواعد بـ 6 أجزاء، وشنطة نص تتنقل لأي زميل أو أي أداة.',
            },
        ],
        proTip: {
            text: 'كل شهر: سطر في شيت القياس، ومراجعة للدليل. الأدوات بتتغيّر، والطريقة دي بتفضل.',
            icon: '💡',
        },
        nextChapterTeaser: {
            title: 'وبعد الكورس...',
            description: 'الورش: صورة لشغلك، وفيديو من وصف، وسكريبت إعلان، وصوت، وأكتر.',
            icon: '🛠️',
        },
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-5')!.pageCount, estimatedMinutes: 185, exercises: 9 },
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
                description: "صممت دور الوكيل وأدواته وقواعده. تنفيذ مهام حقيقية يحتاج ربط الأدوات فعليًا واختبار الصلاحيات وحالات الفشل.",
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
                description: 'تعرفت على أهم الاتجاهات التقنية المتوقعة في السنوات القادمة وتأثيرها على حياتك.',
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
