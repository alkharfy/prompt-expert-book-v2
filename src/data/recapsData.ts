// بيانات ملخصات الفصول — Chapter Recaps
// المرحلة 4: ملخصات نهاية كل فصل

import { SECTION_REGISTRY } from '@/config/sections'
import { EXERCISE_COUNTS_BY_SECTION } from '@/config/learningCatalog'

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
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-1')!.pageCount, estimatedMinutes: 180, exercises: EXERCISE_COUNTS_BY_SECTION['section-1'] },
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
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-2')!.pageCount, estimatedMinutes: 180, exercises: EXERCISE_COUNTS_BY_SECTION['section-2'] },
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
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-3')!.pageCount, estimatedMinutes: 195, exercises: EXERCISE_COUNTS_BY_SECTION['section-3'] },
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
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-4')!.pageCount, estimatedMinutes: 155, exercises: EXERCISE_COUNTS_BY_SECTION['section-4'] },
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
        stats: { pages: SECTION_REGISTRY.find(section => section.id === 'section-5')!.pageCount, estimatedMinutes: 185, exercises: EXERCISE_COUNTS_BY_SECTION['section-5'] },
    },
}

/**
 * Get recap data for a section
 */
export function getRecapForSection(sectionId: string): ChapterRecap | null {
    return recapsData[sectionId] || null
}
