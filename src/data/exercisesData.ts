// =====================================================
// بيانات التمارين التفاعلية — محدّثة لتغطي 10 وحدات
// Exercises Data for Interactive Learning — Updated for 10 Units
// =====================================================

// أنواع التمارين
interface QuizData {
    type: 'quiz'
    exerciseId: string
    sectionId: string
    question: string
    options: { id: string; text: string }[]
    correctAnswerId: string
    explanation: string
    points: number
}

interface FillBlankData {
    type: 'fill_blank'
    exerciseId: string
    sectionId: string
    title: string
    textWithBlanks: string
    blanks: { id: string; correctAnswer: string; alternatives?: string[] }[]
    hint?: string
    points: number
}

import { PageContent } from '@/types/book';
interface PromptBuilderData {
    type: 'prompt_builder'
    exerciseId: string
    sectionId: string
    title: string
    description: string
    steps: { id: string; label: string; placeholder: string; example: string; required?: boolean }[]
    templateFormat: string
    exampleOutput?: string
    points: number
}

export type ExerciseData = QuizData | FillBlankData | PromptBuilderData

// =====================================================
// القسم 1 — عالم الذكاء الاصطناعي التوليدي
// =====================================================

const section1Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s1-1',
        sectionId: 'section-1',
        question: 'كيف يولّد الذكاء الاصطناعي التوليدي النصوص؟',
        options: [
            { id: 'a', text: 'يفهم المعنى ويفكر مثل الإنسان' },
            { id: 'b', text: 'يتوقع الكلمة التالية بناءً على الاحتمالات الرياضية' },
            { id: 'c', text: 'ينسخ النصوص من قاعدة بيانات مخزنة' },
            { id: 'd', text: 'يترجم الأفكار مباشرة من الإنترنت' }
        ],
        correctAnswerId: 'b',
        explanation: 'الذكاء الاصطناعي التوليدي يعمل بتوقع الكلمة التالية الأكثر احتمالاً بناءً على السياق السابق، وليس عن طريق الفهم الحقيقي أو النسخ من قاعدة بيانات.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s1-2',
        sectionId: 'section-1',
        question: 'ما هي "نافذة السياق" (Context Window) في نماذج الذكاء الاصطناعي؟',
        options: [
            { id: 'a', text: 'عدد الأسئلة التي يمكن طرحها في جلسة واحدة' },
            { id: 'b', text: 'الحد الأقصى من التوكنات التي يستطيع النموذج معالجتها دفعة واحدة' },
            { id: 'c', text: 'سرعة الرد على الأسئلة' },
            { id: 'd', text: 'عدد اللغات التي يدعمها النموذج' }
        ],
        correctAnswerId: 'b',
        explanation: 'نافذة السياق هي الحد الأقصى من التوكنات (الكلمات/الأجزاء) التي يستطيع النموذج قراءتها ومعالجتها في طلب واحد. كلما كانت أكبر، زادت قدرة النموذج على التعامل مع نصوص طويلة.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s1-1',
        sectionId: 'section-1',
        title: 'مفاهيم أساسية في الذكاء الاصطناعي',
        textWithBlanks: 'يقوم الذكاء الاصطناعي بتقسيم النص إلى وحدات صغيرة تسمى [blank1]، وتعتمد بنية النماذج الحديثة على معمارية [blank2] التي ظهرت عام 2017. من أهم مشاكل النماذج ظاهرة [blank3] حيث يختلق النموذج معلومات غير صحيحة.',
        blanks: [
            { id: 'blank1', correctAnswer: 'توكنات', alternatives: ['tokens', 'توكنز', 'رموز'] },
            { id: 'blank2', correctAnswer: 'Transformer', alternatives: ['المحولات', 'ترانسفورمر', 'transformer'] },
            { id: 'blank3', correctAnswer: 'الهلوسة', alternatives: ['hallucination', 'هلوسة', 'الهلوسه'] }
        ],
        hint: 'فكّر في البنية الأساسية للنماذج اللغوية الكبيرة وكيف تعالج النصوص',
        points: 15
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s1-3',
        sectionId: 'section-1',
        question: 'لماذا تواجه نماذج الذكاء الاصطناعي تحديات خاصة مع اللغة العربية؟',
        options: [
            { id: 'a', text: 'لأن العربية لغة صعبة جداً' },
            { id: 'b', text: 'لأن بيانات التدريب العربية أقل من الإنجليزية وطريقة التوكنة مختلفة' },
            { id: 'c', text: 'لأن النماذج لا تدعم اللغة العربية أصلاً' },
            { id: 'd', text: 'لأن العربية لا يمكن تحويلها لتوكنات' }
        ],
        correctAnswerId: 'b',
        explanation: 'النماذج تدربت على بيانات إنجليزية أكثر بكثير من العربية، كما أن طريقة تقسيم النص العربي لتوكنات تختلف عن الإنجليزية (الكلمة العربية قد تحتاج توكنات أكثر).',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s1-4',
        sectionId: 'section-1',
        question: 'ما الفرق بين "حد المعرفة" (Knowledge Cutoff) و"نافذة السياق"؟',
        options: [
            { id: 'a', text: 'لا فرق بينهما' },
            { id: 'b', text: 'حد المعرفة هو آخر تاريخ تدرب عليه النموذج، ونافذة السياق هي حجم النص الذي يعالجه دفعة واحدة' },
            { id: 'c', text: 'نافذة السياق هي عدد الأسئلة اليومية المسموحة' },
            { id: 'd', text: 'حد المعرفة هو سرعة الرد فقط' }
        ],
        correctAnswerId: 'b',
        explanation: 'حد المعرفة (Knowledge Cutoff) هو التاريخ الذي توقفت عنده بيانات تدريب النموذج، أما نافذة السياق فهي الحد الأقصى من التوكنات التي يعالجها في طلب واحد.',
        points: 10
    }
]

// =====================================================
// القسم 2 — تجربتك الأولى مع الذكاء الاصطناعي
// =====================================================

const section2Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s2-1',
        sectionId: 'section-2',
        question: 'ما هي العناصر الأربعة الأساسية لأي برومبت فعّال؟',
        options: [
            { id: 'a', text: 'السؤال، الجواب، التعليق، التقييم' },
            { id: 'b', text: 'الفعل (Action)، الموضوع (Topic)، القيود (Constraints)، الشكل (Format)' },
            { id: 'c', text: 'المقدمة، المحتوى، الخاتمة، المراجع' },
            { id: 'd', text: 'اللغة، الطول، الأسلوب، المصادر' }
        ],
        correctAnswerId: 'b',
        explanation: 'العناصر الأربعة هي: الفعل (ماذا تريد)، الموضوع (عن ماذا)، القيود (الشروط والمحددات)، والشكل (كيف تريد المخرجات).',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s2-2',
        sectionId: 'section-2',
        question: 'ما هي تقنية "Few-shot Learning"؟',
        options: [
            { id: 'a', text: 'تدريب النموذج من الصفر' },
            { id: 'b', text: 'إعطاء النموذج أمثلة قليلة داخل البرومبت ليتعلم النمط المطلوب' },
            { id: 'c', text: 'استخدام كاميرا لالتقاط صور' },
            { id: 'd', text: 'تقليل عدد الكلمات في البرومبت' }
        ],
        correctAnswerId: 'b',
        explanation: 'Few-shot Learning تعني إعطاء النموذج عدة أمثلة (2-5) داخل البرومبت حتى يفهم النمط أو الأسلوب المطلوب ويطبقه على المهمة الجديدة.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s2-1',
        sectionId: 'section-2',
        title: 'إعدادات النموذج الأساسية',
        textWithBlanks: 'إعداد [blank1] يتحكم في مدى إبداعية الإجابات — القيمة [blank2] تعطي إجابات دقيقة ومحددة، بينما القيمة العالية (0.7-1) تعطي إجابات [blank3] ومتنوعة.',
        blanks: [
            { id: 'blank1', correctAnswer: 'Temperature', alternatives: ['الحرارة', 'درجة الحرارة', 'temperature'] },
            { id: 'blank2', correctAnswer: '0', alternatives: ['صفر', 'المنخفضة', 'القليلة'] },
            { id: 'blank3', correctAnswer: 'إبداعية', alternatives: ['متنوعة', 'ابداعية', 'خلاقة', 'مبتكرة'] }
        ],
        hint: 'فكّر في إعداد التحكم الذي يؤثر على "عشوائية" الإجابات',
        points: 15
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s2-1',
        sectionId: 'section-2',
        title: 'بناء أول برومبت احترافي',
        description: 'طبّق العناصر الأربعة (الفعل، الموضوع، القيود، الشكل) لبناء برومبت متكامل يطلب من AI كتابة محتوى تعليمي.',
        steps: [
            { id: 'action', label: 'الفعل (Action)', placeholder: 'ماذا تريد من AI أن يفعل؟', example: 'اكتب مقالة تعليمية', required: true },
            { id: 'topic', label: 'الموضوع (Topic)', placeholder: 'عن أي موضوع؟', example: 'عن أساسيات البرمجة للمبتدئين', required: true },
            { id: 'constraints', label: 'القيود (Constraints)', placeholder: 'ما الشروط والمحددات؟', example: 'باللغة العربية، مناسبة لعمر 15-20 سنة، بدون مصطلحات تقنية معقدة', required: true },
            { id: 'format', label: 'الشكل (Format)', placeholder: 'كيف تريد المخرجات؟', example: 'على شكل نقاط مرقمة مع أمثلة عملية، لا تتجاوز 500 كلمة', required: true }
        ],
        templateFormat: '[action] [topic]. [constraints]. المخرجات: [format]',
        exampleOutput: 'اكتب مقالة تعليمية عن أساسيات البرمجة للمبتدئين. باللغة العربية، مناسبة لعمر 15-20 سنة، بدون مصطلحات تقنية معقدة. المخرجات: على شكل نقاط مرقمة مع أمثلة عملية، لا تتجاوز 500 كلمة.',
        points: 20
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s2-3',
        sectionId: 'section-2',
        question: 'ما هو أفضل أسلوب لتحسين نتائج AI عندما لا تعجبك الإجابة الأولى؟',
        options: [
            { id: 'a', text: 'تكرار نفس البرومبت مرات عديدة' },
            { id: 'b', text: 'تغيير النموذج فوراً' },
            { id: 'c', text: 'التحسين التدريجي بإضافة تفاصيل وقيود أكثر للبرومبت' },
            { id: 'd', text: 'كتابة البرومبت بالإنجليزية فقط' }
        ],
        correctAnswerId: 'c',
        explanation: 'التحسين التدريجي (Iterative Improvement) هو الأسلوب الأفضل — أضف تفاصيل، عدّل القيود، وحدد الشكل المطلوب بدقة أكبر في كل محاولة.',
        points: 10
    }
]

// =====================================================
// القسم 3 — إطار GOLDS للبرومبت الفعّال
// =====================================================

const section3Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s3-1',
        sectionId: 'section-3',
        question: 'ما الذي يمثله حرف G في إطار GOLDS؟',
        options: [
            { id: 'a', text: 'Generate — التوليد' },
            { id: 'b', text: 'Goal — الهدف' },
            { id: 'c', text: 'Guide — الإرشاد' },
            { id: 'd', text: 'Grammar — القواعد' }
        ],
        correctAnswerId: 'b',
        explanation: 'حرف G يمثل Goal (الهدف) — وهو أول وأهم عنصر في إطار GOLDS. الهدف يجب أن يكون واضحاً، قابلاً للقياس، وواقعياً.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s3-1',
        sectionId: 'section-3',
        title: 'عناصر إطار GOLDS',
        textWithBlanks: 'إطار GOLDS يتكون من 5 عناصر: G يمثل [blank1]، O يمثل [blank2] (شكل المخرجات)، L يمثل [blank3] (التحكم في الحجم)، D يمثل Details (التفاصيل والسياق)، S يمثل Style (الأسلوب والنبرة).',
        blanks: [
            { id: 'blank1', correctAnswer: 'Goal', alternatives: ['الهدف', 'هدف', 'goal'] },
            { id: 'blank2', correctAnswer: 'Output', alternatives: ['المخرجات', 'مخرجات', 'output', 'الشكل'] },
            { id: 'blank3', correctAnswer: 'Length', alternatives: ['الطول', 'طول', 'length', 'الحجم'] }
        ],
        hint: 'كل حرف في GOLDS يمثل عنصراً أساسياً لكتابة برومبت احترافي',
        points: 15
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s3-2',
        sectionId: 'section-3',
        question: 'ما هي تقنية "Chain of Thought" (سلسلة التفكير)؟',
        options: [
            { id: 'a', text: 'كتابة عدة برومبتات متتابعة' },
            { id: 'b', text: 'طلب من AI أن يفكر خطوة بخطوة ويوضح منطقه قبل الإجابة' },
            { id: 'c', text: 'ربط عدة نماذج AI ببعض' },
            { id: 'd', text: 'تكرار السؤال بطرق مختلفة' }
        ],
        correctAnswerId: 'b',
        explanation: 'Chain of Thought تعني توجيه النموذج ليفكر خطوة بخطوة ويعرض منطقه، مما يحسن جودة الإجابة خاصة في المسائل المعقدة. يمكن تفعيلها بإضافة "فكّر خطوة بخطوة" للبرومبت.',
        points: 10
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s3-1',
        sectionId: 'section-3',
        title: 'تطبيق إطار GOLDS الكامل',
        description: 'استخدم إطار GOLDS لكتابة برومبت احترافي متكامل. كل خطوة تمثل عنصراً من عناصر الإطار.',
        steps: [
            { id: 'goal', label: 'G — الهدف (Goal)', placeholder: 'ما الهدف الواضح والقابل للقياس؟', example: 'كتابة خطة تسويقية لإطلاق تطبيق توصيل طعام', required: true },
            { id: 'output', label: 'O — المخرجات (Output)', placeholder: 'ما شكل المخرجات المطلوب؟', example: 'وثيقة منظمة بعناوين فرعية وجداول', required: true },
            { id: 'length', label: 'L — الطول (Length)', placeholder: 'ما الحجم المطلوب؟', example: '1500-2000 كلمة، 5-7 أقسام رئيسية', required: true },
            { id: 'details', label: 'D — التفاصيل (Details)', placeholder: 'ما السياق والمتطلبات؟', example: 'سوق مصري، ميزانية محدودة، جمهور 18-35 سنة، منافسون: طلبات وأوتوجرام', required: true },
            { id: 'style', label: 'S — الأسلوب (Style)', placeholder: 'ما النبرة والمستوى؟', example: 'أسلوب احترافي ولكن مبسّط، مناسب لعرض على مستثمرين', required: true }
        ],
        templateFormat: 'الهدف: [goal]\n\nالمخرجات: [output]\n\nالطول: [length]\n\nالتفاصيل: [details]\n\nالأسلوب: [style]',
        exampleOutput: 'الهدف: كتابة خطة تسويقية لإطلاق تطبيق توصيل طعام\n\nالمخرجات: وثيقة منظمة بعناوين فرعية وجداول\n\nالطول: 1500-2000 كلمة، 5-7 أقسام رئيسية\n\nالتفاصيل: سوق مصري، ميزانية محدودة، جمهور 18-35 سنة، منافسون: طلبات وأوتوجرام\n\nالأسلوب: أسلوب احترافي ولكن مبسّط، مناسب لعرض على مستثمرين',
        points: 25
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s3-3',
        sectionId: 'section-3',
        question: 'ما الفرق بين إطار GOLDS وإطار CO-STAR؟',
        options: [
            { id: 'a', text: 'لا فرق — هما نفس الإطار بأسماء مختلفة' },
            { id: 'b', text: 'GOLDS يركز على الهدف والمخرجات، بينما CO-STAR يركز على السياق والدور' },
            { id: 'c', text: 'CO-STAR للبرمجة فقط وGOLDS للكتابة فقط' },
            { id: 'd', text: 'GOLDS أقدم من CO-STAR' }
        ],
        correctAnswerId: 'b',
        explanation: 'إطار GOLDS يبدأ بالهدف ويركز على شكل المخرجات والتحكم في الطول، بينما CO-STAR يبدأ بالسياق (Context) ويركز على تعيين الدور (Role). كل إطار له نقاط قوة مختلفة.',
        points: 10
    }
]

// =====================================================
// القسم 4 — البرومبتات المتسلسلة وبناء المشاريع
// =====================================================

const section4Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s4-1',
        sectionId: 'section-4',
        question: 'ما هو مفهوم "Prompt Chaining" (تسلسل البرومبتات)؟',
        options: [
            { id: 'a', text: 'كتابة برومبت طويل جداً في رسالة واحدة' },
            { id: 'b', text: 'تقسيم مهمة كبيرة إلى سلسلة برومبتات متتابعة، ناتج كل واحد يصبح مدخل التالي' },
            { id: 'c', text: 'إرسال نفس البرومبت لعدة نماذج مختلفة' },
            { id: 'd', text: 'حفظ البرومبتات في ملف واحد' }
        ],
        correctAnswerId: 'b',
        explanation: 'Prompt Chaining يعني تقسيم المهمة الكبيرة إلى خطوات صغيرة متتابعة، حيث يكون ناتج كل برومبت هو مدخل البرومبت التالي. هذا يعطيك تحكم ودقة أعلى.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s4-2',
        sectionId: 'section-4',
        question: 'ما هو نمط "السلسلة الشرطية" (Conditional Chain)؟',
        options: [
            { id: 'a', text: 'تنفيذ كل الخطوات بالترتيب دائماً' },
            { id: 'b', text: 'تنفيذ خطوات مختلفة حسب نتيجة الخطوة السابقة (if-then)' },
            { id: 'c', text: 'تنفيذ كل الخطوات في نفس الوقت' },
            { id: 'd', text: 'تكرار نفس الخطوة عدة مرات' }
        ],
        correctAnswerId: 'b',
        explanation: 'السلسلة الشرطية تعني أن المسار يتغير حسب النتيجة — مثلاً: لو المحتوى تقني → استخدم أسلوب تقني، لو المحتوى عام → استخدم أسلوب مبسّط.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s4-1',
        sectionId: 'section-4',
        title: 'أنماط التسلسل الأساسية',
        textWithBlanks: 'من أنماط التسلسل: النمط [blank1] حيث تُنفذ الخطوات واحدة تلو الأخرى، والنمط [blank2] حيث تُنفذ عدة خطوات في وقت واحد، ونمط [blank3] حيث يتحكم برومبت رئيسي في توزيع المهام على برومبتات فرعية.',
        blanks: [
            { id: 'blank1', correctAnswer: 'التتابعي', alternatives: ['المتتابع', 'Sequential', 'التسلسلي', 'sequential'] },
            { id: 'blank2', correctAnswer: 'المتوازي', alternatives: ['التوازي', 'Parallel', 'parallel', 'المتزامن'] },
            { id: 'blank3', correctAnswer: 'المنسق', alternatives: ['Orchestrator', 'المنظم', 'orchestrator', 'المنسق-العمال'] }
        ],
        hint: 'فكّر في طرق تنظيم تنفيذ المهام: واحدة تلو الأخرى، أو معاً، أو بتنسيق مركزي',
        points: 15
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s4-1',
        sectionId: 'section-4',
        title: 'تصميم سلسلة برومبتات لمشروع',
        description: 'صمّم سلسلة من 4 برومبتات متتابعة لبناء موقع ويب بسيط، بحيث ناتج كل خطوة يكون مدخل الخطوة التالية.',
        steps: [
            { id: 'step1', label: 'الخطوة 1 — التخطيط', placeholder: 'برومبت تخطيط هيكل الموقع', example: 'حدد هيكل موقع لمطعم مصري: الصفحات الأساسية، المحتوى المطلوب في كل صفحة، والتسلسل الهرمي', required: true },
            { id: 'step2', label: 'الخطوة 2 — المحتوى', placeholder: 'برومبت كتابة المحتوى (يستخدم ناتج الخطوة 1)', example: 'بناءً على الهيكل التالي [ناتج الخطوة 1]، اكتب المحتوى النصي لكل صفحة', required: true },
            { id: 'step3', label: 'الخطوة 3 — التصميم', placeholder: 'برومبت التصميم المرئي (يستخدم ناتج الخطوة 2)', example: 'بناءً على المحتوى التالي [ناتج الخطوة 2]، صمّم wireframe نصي لكل صفحة', required: true },
            { id: 'step4', label: 'الخطوة 4 — المراجعة', placeholder: 'برومبت المراجعة النهائية', example: 'راجع المشروع الكامل [كل النواتج] وقدّم قائمة تحسينات مقترحة', required: true }
        ],
        templateFormat: 'سلسلة البرومبتات:\n\n1️⃣ التخطيط: [step1]\n\n2️⃣ المحتوى: [step2]\n\n3️⃣ التصميم: [step3]\n\n4️⃣ المراجعة: [step4]',
        points: 25
    }
]

// =====================================================
// القسم 5 — الجودة والتصحيح المتقدم
// =====================================================

const section5Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s5-1',
        sectionId: 'section-5',
        question: 'ما هو "فخ المسار السعيد" (Happy Path Trap)؟',
        options: [
            { id: 'a', text: 'اختبار البرومبت في كل الحالات الممكنة' },
            { id: 'b', text: 'الاكتفاء باختبار الحالة المثالية فقط وتجاهل الحالات الاستثنائية' },
            { id: 'c', text: 'كتابة برومبت إيجابي دائماً' },
            { id: 'd', text: 'استخدام أمثلة ناجحة فقط في التدريب' }
        ],
        correctAnswerId: 'b',
        explanation: 'فخ المسار السعيد يعني الاكتفاء باختبار الحالة المثالية (مدخلات مثالية = نتائج ممتازة) وتجاهل الحالات الاستثنائية والمدخلات غير المتوقعة التي قد تسبب فشل البرومبت.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s5-2',
        sectionId: 'section-5',
        question: 'ما هي الفئات الخمس لفشل البرومبت؟',
        options: [
            { id: 'a', text: 'فشل اللغة، فشل السرعة، فشل الذاكرة، فشل الشبكة، فشل التكلفة' },
            { id: 'b', text: 'فشل الغموض، فشل السياق، فشل الشكل، فشل الهلوسة، فشل الحدود' },
            { id: 'c', text: 'فشل المدخل، فشل المعالجة، فشل المخرج، فشل التخزين، فشل العرض' },
            { id: 'd', text: 'فشل التوكنات، فشل النموذج، فشل الخادم، فشل العميل، فشل الشبكة' }
        ],
        correctAnswerId: 'b',
        explanation: 'الفئات الخمس هي: فشل الغموض (برومبت غير واضح)، فشل السياق (معلومات ناقصة)، فشل الشكل (بنية المخرجات تنكسر)، فشل الهلوسة (اختلاق معلومات)، وفشل الحدود (حالات استثنائية لم تُعالج).',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s5-1',
        sectionId: 'section-5',
        title: 'تقنيات ضمان الجودة',
        textWithBlanks: 'تقنية [blank1] تعني توليد عدة إجابات لنفس السؤال ثم اختيار الأكثر تكراراً. إطار [blank2] يجمع بين التفكير المنطقي واتخاذ الإجراءات. ومصطلح [blank3] يشير لعلم تصميم السياق المثالي للنموذج.',
        blanks: [
            { id: 'blank1', correctAnswer: 'Self-Consistency', alternatives: ['الاتساق الذاتي', 'self-consistency', 'self consistency'] },
            { id: 'blank2', correctAnswer: 'ReAct', alternatives: ['react', 'REACT', 'React', 'ريأكت'] },
            { id: 'blank3', correctAnswer: 'Context Engineering', alternatives: ['هندسة السياق', 'context engineering'] }
        ],
        hint: 'فكّر في تقنيات التحقق من الإجابات والأطر المعروفة لتحسين أداء النماذج',
        points: 15
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s5-1',
        sectionId: 'section-5',
        title: 'كتابة برومبت مقاوم للفشل',
        description: 'اكتب برومبت يتضمن إجراءات وقائية ضد أنواع الفشل المختلفة. أضف قيود واضحة وتعليمات للتعامل مع الحالات الاستثنائية.',
        steps: [
            { id: 'task', label: 'المهمة الأساسية', placeholder: 'ما المهمة المطلوبة؟', example: 'اكتب ملخصاً لمقال عن الذكاء الاصطناعي', required: true },
            { id: 'anti-ambiguity', label: 'ضد الغموض', placeholder: 'أضف تعريفات واضحة وأمثلة', example: 'الملخص يعني استخراج 5-7 نقاط رئيسية فقط، وليس إعادة صياغة المقال كاملاً', required: true },
            { id: 'anti-hallucination', label: 'ضد الهلوسة', placeholder: 'أضف قيود على المصادر', example: 'لا تضف أي معلومات غير موجودة في النص الأصلي. إذا كانت المعلومة غير واضحة، اكتب "غير محدد في النص"', required: true },
            { id: 'anti-boundary', label: 'ضد فشل الحدود', placeholder: 'أضف تعامل مع الحالات الاستثنائية', example: 'إذا كان المقال قصيراً جداً (أقل من 100 كلمة)، اكتب "المقال قصير جداً للتلخيص" بدل محاولة التلخيص', required: true }
        ],
        templateFormat: 'المهمة: [task]\n\nقواعد الوضوح: [anti-ambiguity]\n\nقواعد الدقة: [anti-hallucination]\n\nالحالات الاستثنائية: [anti-boundary]',
        points: 25
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s5-3',
        sectionId: 'section-5',
        question: 'ما هو "Prompt Injection" (حقن البرومبت)؟',
        options: [
            { id: 'a', text: 'إضافة معلومات مفيدة للبرومبت' },
            { id: 'b', text: 'هجوم أمني يحاول تجاوز تعليمات النظام الأصلية بتضمين أوامر خبيثة في المدخلات' },
            { id: 'c', text: 'تقنية لتحسين جودة البرومبت' },
            { id: 'd', text: 'طريقة لزيادة سرعة الاستجابة' }
        ],
        correctAnswerId: 'b',
        explanation: 'Prompt Injection هو هجوم أمني حيث يتم تضمين تعليمات خبيثة داخل مدخلات المستخدم لمحاولة تجاوز تعليمات النظام الأصلية وجعل النموذج يتصرف بطريقة غير مقصودة.',
        points: 10
    }
]

// =====================================================
// القسم 6 — الذكاء الاصطناعي متعدد الوسائط
// =====================================================

const section6Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s6-1',
        sectionId: 'section-6',
        question: 'ما المقصود بـ "الذكاء الاصطناعي متعدد الوسائط" (Multi-modal AI)؟',
        options: [
            { id: 'a', text: 'ذكاء اصطناعي يعمل على أجهزة متعددة' },
            { id: 'b', text: 'ذكاء اصطناعي يتعامل مع أنواع بيانات مختلفة: نصوص وصور وصوت وفيديو' },
            { id: 'c', text: 'ذكاء اصطناعي يدعم لغات متعددة' },
            { id: 'd', text: 'ذكاء اصطناعي يستخدم عدة خوارزميات في نفس الوقت' }
        ],
        correctAnswerId: 'b',
        explanation: 'Multi-modal AI يعني أن النموذج يستطيع فهم ومعالجة أنواع مختلفة من البيانات في نفس الطلب: نصوص + صور + صوت + فيديو.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s6-2',
        sectionId: 'section-6',
        question: 'ما هو إطار SSCT لتحليل الصور؟',
        options: [
            { id: 'a', text: 'Subject, Size, Color, Time' },
            { id: 'b', text: 'Subject, Style, Composition, Technical — الموضوع، الأسلوب، التكوين، التقنية' },
            { id: 'c', text: 'Simple, Structured, Complex, Technical' },
            { id: 'd', text: 'Source, Scale, Content, Type' }
        ],
        correctAnswerId: 'b',
        explanation: 'إطار SSCT يتكون من: Subject (الموضوع الرئيسي)، Style (الأسلوب الفني)، Composition (التكوين والترتيب)، Technical (الجوانب التقنية كالإضاءة والألوان).',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s6-1',
        sectionId: 'section-6',
        title: 'أطر إنشاء الصور',
        textWithBlanks: 'لإنشاء صور بالذكاء الاصطناعي، يُستخدم إطار [blank1] الذي يركز على: الموضوع، لوحة الألوان، الصور، التكوين، والعاطفة. بينما لإنشاء فيديوهات يُستخدم إطار [blank2] الذي يركز على الحركة والأجواء والموضوع والاستمرارية.',
        blanks: [
            { id: 'blank1', correctAnswer: 'SPICE', alternatives: ['spice', 'سبايس'] },
            { id: 'blank2', correctAnswer: 'MASC', alternatives: ['masc', 'ماسك'] }
        ],
        hint: 'أطر مخصصة لتوليد المحتوى المرئي — واحد للصور وآخر للفيديو',
        points: 15
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s6-3',
        sectionId: 'section-6',
        question: 'ما هو "Negative Prompt" (البرومبت السلبي) في إنشاء الصور؟',
        options: [
            { id: 'a', text: 'برومبت يطلب صوراً حزينة' },
            { id: 'b', text: 'تعليمات تحدد ما لا تريده في الصورة (عناصر يجب تجنبها)' },
            { id: 'c', text: 'برومبت خاطئ يجب تصحيحه' },
            { id: 'd', text: 'تقييم سلبي لجودة الصورة' }
        ],
        correctAnswerId: 'b',
        explanation: 'البرومبت السلبي (Negative Prompt) يحدد العناصر التي لا تريدها في الصورة، مثل: "بدون خلفية معقدة، بدون نص، بدون تشويه في الأيدي". هذا يساعد في تحسين جودة النتيجة.',
        points: 10
    }
]

// =====================================================
// القسم 7 — وكلاء الذكاء الاصطناعي والأتمتة
// =====================================================

const section7Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s7-1',
        sectionId: 'section-7',
        question: 'ما هو الفرق الأساسي بين "وكيل AI" و"برومبت عادي"؟',
        options: [
            { id: 'a', text: 'الوكيل أسرع في الاستجابة' },
            { id: 'b', text: 'الوكيل يستطيع التفكير واتخاذ قرارات واستخدام أدوات وتنفيذ إجراءات بشكل مستقل' },
            { id: 'c', text: 'الوكيل يعمل بدون إنترنت' },
            { id: 'd', text: 'لا فرق — الوكيل هو مجرد برومبت طويل' }
        ],
        correctAnswerId: 'b',
        explanation: 'وكيل AI = LLM + أدوات + حلقة تنفيذ. الوكيل يستطيع التفكير، اتخاذ القرارات، استدعاء أدوات خارجية (بحث، تنفيذ كود، إرسال بريد...)، وتنفيذ سلسلة إجراءات بشكل مستقل.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s7-1',
        sectionId: 'section-7',
        title: 'إطار ATLAS لبناء الوكلاء',
        textWithBlanks: 'إطار ATLAS يتكون من: A يمثل [blank1] (النموذج اللغوي)، T يمثل [blank2] (الأدوات المتاحة)، L يمثل Logic (قواعد التفكير)، A يمثل Actions (الإجراءات)، S يمثل [blank3] (حواجز الأمان).',
        blanks: [
            { id: 'blank1', correctAnswer: 'Agent', alternatives: ['الوكيل', 'agent', 'الوكيل الذكي'] },
            { id: 'blank2', correctAnswer: 'Tools', alternatives: ['الأدوات', 'tools', 'أدوات'] },
            { id: 'blank3', correctAnswer: 'Safety', alternatives: ['الأمان', 'safety', 'الحماية', 'حواجز الأمان'] }
        ],
        hint: 'كل حرف في ATLAS يمثل مكوناً أساسياً من مكونات وكيل الذكاء الاصطناعي',
        points: 15
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s7-2',
        sectionId: 'section-7',
        question: 'ما هو بروتوكول MCP (Model Context Protocol)؟',
        options: [
            { id: 'a', text: 'لغة برمجة جديدة لبناء الوكلاء' },
            { id: 'b', text: 'معيار موحد يسمح لنماذج AI بالاتصال بأدوات وخدمات خارجية بطريقة قياسية' },
            { id: 'c', text: 'بروتوكول شبكة للاتصال بين الخوادم' },
            { id: 'd', text: 'أداة لضغط البيانات' }
        ],
        correctAnswerId: 'b',
        explanation: 'MCP (Model Context Protocol) هو معيار مفتوح يوفر واجهة موحدة تسمح لنماذج الذكاء الاصطناعي بالاتصال بأدوات وخدمات مختلفة بطريقة قياسية — مثل USB للأدوات الذكية.',
        points: 10
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s7-1',
        sectionId: 'section-7',
        title: 'تصميم System Prompt لوكيل ذكي',
        description: 'صمّم System Prompt لوكيل ذكي متخصص يستخدم إطار ATLAS. حدد دوره، أدواته، قواعده، وحواجز أمانه.',
        steps: [
            { id: 'agent-role', label: 'A — دور الوكيل', placeholder: 'من هو هذا الوكيل وما تخصصه؟', example: 'أنت وكيل خدمة عملاء متخصص في متجر إلكتروني لبيع الملابس', required: true },
            { id: 'tools', label: 'T — الأدوات المتاحة', placeholder: 'ما الأدوات التي يستطيع استخدامها؟', example: 'يمكنك: البحث في كتالوج المنتجات، تتبع الطلبات، حساب تكلفة الشحن، إنشاء كوبون خصم', required: true },
            { id: 'logic', label: 'L — قواعد التفكير', placeholder: 'كيف يفكر ويتخذ القرارات؟', example: 'ابدأ بفهم مشكلة العميل أولاً، ثم ابحث في النظام، قدّم حلولاً مرتبة من الأسهل للأصعب', required: true },
            { id: 'safety', label: 'S — حواجز الأمان', placeholder: 'ما الحدود التي لا يتجاوزها؟', example: 'لا تعطِ خصماً أكثر من 20%، لا تشارك بيانات عملاء آخرين، حوّل للدعم البشري إذا كانت المشكلة مالية', required: true }
        ],
        templateFormat: '## دور الوكيل\n[agent-role]\n\n## الأدوات المتاحة\n[tools]\n\n## قواعد التفكير\n[logic]\n\n## حواجز الأمان\n[safety]',
        points: 25
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s7-3',
        sectionId: 'section-7',
        question: 'متى يُفضل استخدام "Workflow" بدل "Agent" كامل؟',
        options: [
            { id: 'a', text: 'دائماً — الـ Workflow أفضل في كل الحالات' },
            { id: 'b', text: 'عندما تكون الخطوات محددة مسبقاً ولا تحتاج قرارات ديناميكية' },
            { id: 'c', text: 'فقط عندما لا يتوفر نموذج AI' },
            { id: 'd', text: 'عندما تكون المهمة بسيطة جداً وتحتاج رد سريع فقط' }
        ],
        correctAnswerId: 'b',
        explanation: 'الـ Workflow أفضل عندما تكون الخطوات معروفة ومحددة مسبقاً (مثل: استقبل الطلب → تحقق → نفذ → أرسل تأكيد). أما الوكيل الكامل فهو للمهام التي تحتاج تفكير وقرارات ديناميكية.',
        points: 10
    }
]

// =====================================================
// القسم 8 — RAG: ربط AI بمعرفتك الخاصة
// =====================================================

const section8Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s8-1',
        sectionId: 'section-8',
        question: 'ما المشكلة التي يحلها RAG (Retrieval-Augmented Generation)؟',
        options: [
            { id: 'a', text: 'بطء الذكاء الاصطناعي في الاستجابة' },
            { id: 'b', text: 'عدم معرفة النموذج ببيانات شركتك أو مستنداتك الخاصة' },
            { id: 'c', text: 'عدم قدرة النموذج على إنشاء صور' },
            { id: 'd', text: 'تكلفة استخدام الذكاء الاصطناعي العالية' }
        ],
        correctAnswerId: 'b',
        explanation: 'RAG يحل مشكلة أن النموذج لا يعرف بياناتك الخاصة (مستندات الشركة، قاعدة المعرفة، سياسات العمل...). يبحث في بياناتك أولاً ثم يضيف المعلومات ذات الصلة للبرومبت.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s8-2',
        sectionId: 'section-8',
        question: 'ما هي الخطوات الأربع الأساسية لنظام RAG؟',
        options: [
            { id: 'a', text: 'تدريب، اختبار، نشر، مراقبة' },
            { id: 'b', text: 'تخزين (Storage)، استرجاع (Retrieval)، تعزيز (Augmentation)، توليد (Generation)' },
            { id: 'c', text: 'جمع، تنظيف، تحليل، عرض' },
            { id: 'd', text: 'قراءة، فهم، تلخيص، كتابة' }
        ],
        correctAnswerId: 'b',
        explanation: 'الخطوات الأربع: 1) تخزين المستندات في قاعدة معرفة، 2) استرجاع الأجزاء ذات الصلة بالسؤال، 3) تعزيز البرومبت بالمعلومات المسترجعة، 4) توليد الإجابة بناءً على السياق المُعزز.',
        points: 10
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s8-1',
        sectionId: 'section-8',
        title: 'مفاهيم RAG الأساسية',
        textWithBlanks: 'لتخزين المستندات في نظام RAG، يتم تقسيمها لأجزاء صغيرة عبر عملية [blank1]، ثم تحويل كل جزء لتمثيل رقمي (vector) عبر [blank2]. يتم تخزين هذه المتجهات في [blank3] للبحث السريع لاحقاً.',
        blanks: [
            { id: 'blank1', correctAnswer: 'Chunking', alternatives: ['التقطيع', 'chunking', 'التجزئة', 'تقسيم'] },
            { id: 'blank2', correctAnswer: 'Embeddings', alternatives: ['التضمينات', 'embeddings', 'embedding', 'التمثيلات المتجهة'] },
            { id: 'blank3', correctAnswer: 'قاعدة بيانات متجهة', alternatives: ['Vector Database', 'vector database', 'قاعدة متجهات', 'vector DB'] }
        ],
        hint: 'فكّر في المراحل الثلاث لتحويل مستند نصي إلى شيء يمكن البحث فيه بالمعنى',
        points: 15
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s8-3',
        sectionId: 'section-8',
        question: 'ما الفرق بين RAG وFine-tuning لتخصيص النموذج؟',
        options: [
            { id: 'a', text: 'لا فرق — نفس الشيء بأسماء مختلفة' },
            { id: 'b', text: 'RAG يضيف بياناتك كسياق مع كل طلب، بينما Fine-tuning يعيد تدريب النموذج على بياناتك' },
            { id: 'c', text: 'Fine-tuning أرخص وأسرع دائماً' },
            { id: 'd', text: 'RAG يعمل فقط مع النصوص، وFine-tuning مع الصور' }
        ],
        correctAnswerId: 'b',
        explanation: 'RAG يبحث في بياناتك ويضيفها كسياق للبرومبت (بدون تغيير النموذج). Fine-tuning يعيد تدريب النموذج نفسه على بياناتك (تغيير دائم). RAG أرخص وأسهل في التحديث.',
        points: 10
    }
]

// =====================================================
// القسم 9 — AI في عالم الأعمال: تطبيقات متخصصة
// =====================================================

const section9Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s9-1',
        sectionId: 'section-9',
        question: 'عند كتابة محتوى تسويقي بالذكاء الاصطناعي، ما الأسلوب الأفضل لضمان الجودة؟',
        options: [
            { id: 'a', text: 'كتابة برومبت واحد والاكتفاء بأول نتيجة' },
            { id: 'b', text: 'نسخ محتوى المنافسين وتعديله' },
            { id: 'c', text: 'طلب 3 نسخ مختلفة (A/B/C) ثم اختيار الأفضل وتحسينه' },
            { id: 'd', text: 'الكتابة يدوياً بالكامل بدون AI' }
        ],
        correctAnswerId: 'c',
        explanation: 'أسلوب الـ 3 نسخ (A/B/C) يعطيك تنوع في الأفكار والأساليب، ثم تختار الأفضل وتطلب تحسينات محددة عليه. هذا يوفر وقتاً ويعطي نتائج أعلى جودة.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s9-2',
        sectionId: 'section-9',
        question: 'أي من هذه الأدوات مخصصة لبناء مواقع وتطبيقات باستخدام AI بدون كود تقليدي؟',
        options: [
            { id: 'a', text: 'ChatGPT وClaude فقط' },
            { id: 'b', text: 'v0, Bolt, Lovable, Cursor' },
            { id: 'c', text: 'Photoshop وFigma' },
            { id: 'd', text: 'Excel وGoogle Sheets' }
        ],
        correctAnswerId: 'b',
        explanation: 'أدوات مثل v0 (من Vercel)، Bolt، Lovable، وCursor مصممة خصيصاً لبناء مواقع وتطبيقات بمساعدة AI — تحول الوصف النصي لكود وواجهات عمل.',
        points: 10
    },
    {
        type: 'prompt_builder',
        exerciseId: 'pb-s9-1',
        sectionId: 'section-9',
        title: 'كتابة حملة إعلانية بـ AI',
        description: 'صمّم برومبت لإنشاء حملة إعلانية كاملة على وسائل التواصل الاجتماعي لمنتج أو خدمة من اختيارك.',
        steps: [
            { id: 'product', label: 'المنتج/الخدمة', placeholder: 'وصف المنتج أو الخدمة', example: 'تطبيق لتعلم اللغة الإنجليزية — يستهدف الشباب العربي 18-30 سنة', required: true },
            { id: 'platform', label: 'المنصة والميزانية', placeholder: 'المنصة الإعلانية والميزانية', example: 'إعلانات Instagram وTikTok، ميزانية 5000 جنيه شهرياً', required: true },
            { id: 'content-request', label: 'المحتوى المطلوب', placeholder: 'ماذا تريد AI أن يكتب؟', example: 'اكتب 3 نسخ مختلفة للإعلان: نسخة فكاهية، نسخة تحفيزية، نسخة تعليمية. كل نسخة بعنوان + نص + CTA', required: true },
            { id: 'brand-voice', label: 'هوية العلامة التجارية', placeholder: 'الأسلوب والنبرة المطلوبة', example: 'نبرة شبابية وودودة، استخدم عامية مصرية خفيفة، تجنب المصطلحات الإنجليزية المعقدة', required: true }
        ],
        templateFormat: '## المنتج\n[product]\n\n## المنصة والميزانية\n[platform]\n\n## المحتوى المطلوب\n[content-request]\n\n## هوية العلامة\n[brand-voice]',
        points: 25
    },
    {
        type: 'fill_blank',
        exerciseId: 'fill-s9-1',
        sectionId: 'section-9',
        title: 'أدوات AI للمطورين',
        textWithBlanks: 'أداة [blank1] من GitHub تساعد في إكمال الكود تلقائياً داخل المحرر. أداة [blank2] هي محرر كود كامل مبني على AI. وأداة [blank3] من Vercel تحول الوصف النصي إلى واجهات ويب جاهزة.',
        blanks: [
            { id: 'blank1', correctAnswer: 'Copilot', alternatives: ['GitHub Copilot', 'copilot', 'كوبايلوت'] },
            { id: 'blank2', correctAnswer: 'Cursor', alternatives: ['cursor', 'كيرسور'] },
            { id: 'blank3', correctAnswer: 'v0', alternatives: ['V0', 'في زيرو'] }
        ],
        hint: 'أدوات شهيرة يستخدمها المطورون يومياً للبرمجة بمساعدة الذكاء الاصطناعي',
        points: 15
    }
]

// =====================================================
// القسم 10 — مستقبل AI: ماذا بعد؟
// =====================================================

const section10Exercises: ExerciseData[] = [
    {
        type: 'quiz',
        exerciseId: 'quiz-s10-1',
        sectionId: 'section-10',
        question: 'ما الفرق بين "نماذج التفكير" (Reasoning Models) والنماذج العادية؟',
        options: [
            { id: 'a', text: 'نماذج التفكير أسرع في الاستجابة' },
            { id: 'b', text: 'نماذج التفكير تأخذ وقتاً أطول للتفكير بعمق قبل الإجابة، مما يعطي نتائج أدق للمسائل المعقدة' },
            { id: 'c', text: 'لا فرق بينهما' },
            { id: 'd', text: 'نماذج التفكير تعمل فقط مع الصور' }
        ],
        correctAnswerId: 'b',
        explanation: 'نماذج التفكير (مثل GPT-6 Astra ووضع Extended Thinking في Claude) تقضي وقتاً أطول في "التفكير العميق" قبل الإجابة — أبطأ لكن أدق في المسائل المعقدة كالرياضيات والمنطق والبرمجة.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s10-2',
        sectionId: 'section-10',
        question: 'ما المقصود بـ "AI على الجهاز" (On-Device AI)؟',
        options: [
            { id: 'a', text: 'استخدام AI عبر الإنترنت فقط' },
            { id: 'b', text: 'تشغيل نماذج ذكاء اصطناعي محلياً على جهازك بدون إنترنت' },
            { id: 'c', text: 'شراء جهاز مخصص للذكاء الاصطناعي' },
            { id: 'd', text: 'حماية الجهاز من الفيروسات بالذكاء الاصطناعي' }
        ],
        correctAnswerId: 'b',
        explanation: 'On-Device AI يعني تشغيل نماذج AI محلياً على جهازك (باستخدام أدوات مثل Ollama أو LM Studio) بدون الحاجة للإنترنت — مما يوفر الخصوصية والتحكم الكامل.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s10-3',
        sectionId: 'section-10',
        question: 'ما التحول الأساسي في "عصر الوكلاء" (Agentic AI Era)؟',
        options: [
            { id: 'a', text: 'التحول من نماذج نصية لنماذج صوتية' },
            { id: 'b', text: 'التحول من AI كأداة تنفذ مهمة واحدة إلى AI كنظام يبني ويدير أنظمة كاملة' },
            { id: 'c', text: 'التحول من الحاسوب للموبايل' },
            { id: 'd', text: 'التحول من الإنجليزية للعربية' }
        ],
        correctAnswerId: 'b',
        explanation: 'عصر الوكلاء يعني التحول من "AI يحل مهمة واحدة" إلى "AI يبني ويدير أنظمة كاملة" — وكلاء متعاونون يخططون وينفذون ويراقبون مشاريع كاملة.',
        points: 10
    },
    {
        type: 'quiz',
        exerciseId: 'quiz-s10-4',
        sectionId: 'section-10',
        question: 'لماذا تظل مهارات "هندسة البرومبت" مهمة رغم تطور النماذج؟',
        options: [
            { id: 'a', text: 'لأن النماذج الجديدة لا تعمل بدون برومبت' },
            { id: 'b', text: 'لأن الأطر والتفكير المنظم أهم من الأداة — النماذج تتغير لكن مهارات التواصل الفعال مع AI تبقى' },
            { id: 'c', text: 'لأن الشركات تطلب هذه المهارة فقط' },
            { id: 'd', text: 'لأن النماذج لن تتطور أكثر من كده' }
        ],
        correctAnswerId: 'b',
        explanation: 'الأطر (مثل GOLDS وATLAS) والتفكير المنظم هي مهارات دائمة — حتى لو تغيرت النماذج والأدوات، القدرة على التواصل بوضوح وتنظيم المتطلبات وتصميم الأنظمة ستظل ذات قيمة عالية.',
        points: 10
    }
]

// =====================================================
// تجميع كل التمارين
// =====================================================

export const allExercises: Record<string, ExerciseData[]> = {
    'section-1': section1Exercises,
    'section-2': section2Exercises,
    'section-3': section3Exercises,
    'section-4': section4Exercises,
    'section-5': section5Exercises,
    'section-6': section6Exercises,
    'section-7': section7Exercises,
    'section-8': section8Exercises,
    'section-9': section9Exercises,
    'section-10': section10Exercises
}

// معلومات الأقسام
export const sectionInfo: Record<string, { title: string; icon: string; totalPoints: number }> = {
    'section-1': {
        title: 'عالم الذكاء الاصطناعي التوليدي',
        icon: '🧠',
        totalPoints: section1Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-2': {
        title: 'تجربتك الأولى مع AI',
        icon: '🚀',
        totalPoints: section2Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-3': {
        title: 'إطار GOLDS للبرومبت الفعّال',
        icon: '🏆',
        totalPoints: section3Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-4': {
        title: 'البرومبتات المتسلسلة وبناء المشاريع',
        icon: '🔗',
        totalPoints: section4Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-5': {
        title: 'الجودة والتصحيح المتقدم',
        icon: '🔍',
        totalPoints: section5Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-6': {
        title: 'AI متعدد الوسائط',
        icon: '🎨',
        totalPoints: section6Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-7': {
        title: 'وكلاء AI والأتمتة',
        icon: '🤖',
        totalPoints: section7Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-8': {
        title: 'RAG — ربط AI بمعرفتك',
        icon: '📚',
        totalPoints: section8Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-9': {
        title: 'AI في عالم الأعمال',
        icon: '💼',
        totalPoints: section9Exercises.reduce((sum, ex) => sum + ex.points, 0)
    },
    'section-10': {
        title: 'مستقبل AI',
        icon: '🔮',
        totalPoints: section10Exercises.reduce((sum, ex) => sum + ex.points, 0)
    }
}
