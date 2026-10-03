// Prompt Hospital - بيانات التحديات
// 8 تحديات تغطي أمراض البرومبت المختلفة

// استيراد نظام التقييم المشترك
export { checkPatterns, evaluateCriterion } from '@/lib/exerciseScoring'
export type { ScoringCriterion } from '@/lib/exerciseScoring'
import type { ScoringCriterion } from '@/lib/exerciseScoring'

export interface PromptDisease {
    id: string
    exerciseId: string
    name: string
    icon: string
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    points: number
    sickPrompt: string
    diseases: string[]
    hints: string[]
    scoringCriteria: ScoringCriterion[]
    idealPrompt: string
}

export const hospitalChallenges: PromptDisease[] = [
    {
        id: 'vagueness',
        exerciseId: 'hospital-challenge-vagueness',
        name: 'متلازمة الغموض',
        icon: '🌫️',
        description: 'البرومبت يعاني من غموض شديد - لا يوضح ما المطلوب بالتحديد',
        difficulty: 'easy',
        points: 15,
        sickPrompt: 'اكتب لي شيء عن التسويق',
        diseases: ['غموض المطلوب', 'غياب التفاصيل'],
        hints: [
            'حدد نوع المحتوى المطلوب (مقال؟ خطة؟ منشور؟)',
            'أضف الجمهور المستهدف والهدف من المحتوى',
        ],
        scoringCriteria: [
            { id: 'specificity', name: 'التحديد', weight: 30, check: 'has_specificity', description: 'هل حدد نوع المحتوى؟' },
            { id: 'context', name: 'السياق', weight: 25, check: 'has_context', description: 'هل أضاف سياقاً؟' },
            { id: 'format', name: 'المخرجات', weight: 25, check: 'has_format', description: 'هل حدد تنسيق المخرجات؟' },
            { id: 'length', name: 'الطول', weight: 20, check: 'minimum_length', description: 'هل البرومبت كافي الطول؟' },
        ],
        idealPrompt: 'أنت خبير تسويق رقمي متخصص في وسائل التواصل الاجتماعي. اكتب لي خطة محتوى لمدة أسبوع لحساب إنستغرام لمتجر ملابس نسائية يستهدف الفئة العمرية 25-35. اكتب المحتوى على شكل جدول يتضمن: اليوم، نوع المنشور، النص، والهاشتاقات المقترحة.',
    },
    {
        id: 'no-role',
        exerciseId: 'hospital-challenge-no-role',
        name: 'فقدان الهوية',
        icon: '🎭',
        description: 'البرومبت لا يحدد دوراً أو شخصية للذكاء الاصطناعي',
        difficulty: 'easy',
        points: 15,
        sickPrompt: 'ساعدني أكتب خطة عمل لمشروع مطعم',
        diseases: ['غياب الدور', 'عدم تحديد الخبرة المطلوبة'],
        hints: [
            'ابدأ بتحديد من يجب أن يكون AI (مستشار أعمال؟ شيف؟)',
            'حدد مستوى الخبرة المطلوب والتخصص',
        ],
        scoringCriteria: [
            { id: 'role', name: 'الدور', weight: 35, check: 'contains_role', description: 'هل حدد دوراً للذكاء الاصطناعي؟' },
            { id: 'specificity', name: 'التحديد', weight: 25, check: 'has_specificity', description: 'هل حدد تفاصيل المشروع؟' },
            { id: 'constraints', name: 'القيود', weight: 20, check: 'has_constraints', description: 'هل أضاف قيوداً؟' },
            { id: 'format', name: 'التنسيق', weight: 20, check: 'has_format', description: 'هل حدد تنسيق المخرجات؟' },
        ],
        idealPrompt: 'أنت مستشار أعمال محترف متخصص في قطاع المطاعم والضيافة بخبرة 15 عاماً. ساعدني في كتابة خطة عمل شاملة لمطعم طعام صحي في الرياض يستهدف الموظفين. يجب أن تتضمن الخطة: ملخص تنفيذي، تحليل السوق، الخطة التشغيلية، والتوقعات المالية. اكتبها بتنسيق احترافي مع عناوين واضحة.',
    },
    {
        id: 'no-context',
        exerciseId: 'hospital-challenge-no-context',
        name: 'نقص السياق الحاد',
        icon: '📭',
        description: 'البرومبت يفتقد لأي معلومات خلفية - الذكاء الاصطناعي لا يعرف الظروف',
        difficulty: 'medium',
        points: 20,
        sickPrompt: 'اكتب إيميل اعتذار',
        diseases: ['غياب السياق', 'غياب المستلم', 'غياب سبب الاعتذار'],
        hints: [
            'حدد لمن الاعتذار ولماذا',
            'أضف معلومات عن العلاقة (رسمي؟ شخصي؟) والموقف',
        ],
        scoringCriteria: [
            { id: 'context', name: 'السياق', weight: 35, check: 'has_context', description: 'هل وفر السياق والمعلومات الخلفية؟' },
            { id: 'specificity', name: 'التحديد', weight: 25, check: 'has_specificity', description: 'هل حدد التفاصيل؟' },
            { id: 'role', name: 'الدور', weight: 20, check: 'contains_role', description: 'هل حدد دوراً؟' },
            { id: 'constraints', name: 'القيود', weight: 20, check: 'has_constraints', description: 'هل أضاف قيوداً على الطول والأسلوب؟' },
        ],
        idealPrompt: 'أنت كاتب محتوى محترف متخصص في المراسلات الرسمية.\n\nالسياق: تأخر تسليم المشروع أسبوعين عن الموعد المحدد بسبب مشاكل تقنية غير متوقعة.\n\nالمهمة: اكتب إيميل اعتذار رسمي من مدير المشروع إلى العميل. الإيميل يجب أن يكون مهنياً، يعترف بالخطأ، ويقدم خطة تعويض مع موعد تسليم جديد. الطول: 150-200 كلمة.',
    },
    {
        id: 'mixed-instructions',
        exerciseId: 'hospital-challenge-mixed',
        name: 'تشوش التعليمات',
        icon: '🌀',
        description: 'البرومبت يخلط عدة طلبات غير مترابطة في طلب واحد',
        difficulty: 'medium',
        points: 20,
        sickPrompt: 'اكتب لي مقال عن الذكاء الاصطناعي وترجمه للإنجليزية وأعطني ملخص وسوّ لي عرض تقديمي منه',
        diseases: ['تعدد الطلبات', 'عدم الترتيب', 'غياب الأولويات'],
        hints: [
            'ركّز على طلب واحد أو رتب الطلبات بخطوات واضحة',
            'حدد الأولوية والتسلسل المنطقي',
        ],
        scoringCriteria: [
            { id: 'structure', name: 'الهيكلة', weight: 35, check: 'has_steps', description: 'هل رتب الطلبات بخطوات؟' },
            { id: 'specificity', name: 'التحديد', weight: 25, check: 'has_specificity', description: 'هل حدد كل طلب بوضوح؟' },
            { id: 'format', name: 'التنسيق', weight: 20, check: 'has_format', description: 'هل حدد تنسيق كل مخرج؟' },
            { id: 'constraints', name: 'القيود', weight: 20, check: 'has_constraints', description: 'هل وضع حدوداً لكل خطوة؟' },
        ],
        idealPrompt: 'أنت كاتب محتوى تقني متخصص في الذكاء الاصطناعي.\n\nالمهمة: اكتب مقالاً عن تأثير الذكاء الاصطناعي على سوق العمل في 2026.\n\nالمواصفات:\n- الطول: 800-1000 كلمة\n- الجمهور: رواد أعمال عرب\n- ابدأ بمقدمة جاذبة، ثم 3 محاور رئيسية، ثم خاتمة\n- أضف إحصائيات وأرقام حديثة\n\nملاحظة: ركّز على المقال العربي فقط حالياً. سأطلب الترجمة والملخص لاحقاً.',
    },
    {
        id: 'no-format',
        exerciseId: 'hospital-challenge-no-format',
        name: 'غياب التنسيق',
        icon: '📝',
        description: 'البرومبت لا يحدد شكل المخرجات المطلوبة',
        difficulty: 'medium',
        points: 20,
        sickPrompt: 'أعطني معلومات عن لغة بايثون',
        diseases: ['غياب تنسيق المخرجات', 'عدم تحديد العمق', 'غياب الجمهور المستهدف'],
        hints: [
            'حدد شكل المخرجات (جدول، قائمة، مقال، خطوات)',
            'حدد مستوى التفصيل والجمهور المستهدف',
        ],
        scoringCriteria: [
            { id: 'format', name: 'التنسيق', weight: 30, check: 'has_format', description: 'هل حدد تنسيق المخرجات؟' },
            { id: 'specificity', name: 'التحديد', weight: 25, check: 'has_specificity', description: 'هل حدد جانباً معيناً؟' },
            { id: 'context', name: 'السياق', weight: 25, check: 'has_context', description: 'هل حدد الجمهور والمستوى؟' },
            { id: 'constraints', name: 'القيود', weight: 20, check: 'has_constraints', description: 'هل حدد قيوداً؟' },
        ],
        idealPrompt: 'أنت مدرس برمجة محترف. أعطني دليلاً مبسطاً عن لغة بايثون لمبتدئ يريد تعلم البرمجة ذاتياً.\n\nالتنسيق المطلوب:\n1. مقدمة (3 أسطر): لماذا بايثون؟\n2. جدول: أهم 10 مفاهيم أساسية مع شرح مبسط ومثال كود لكل مفهوم\n3. قائمة: أفضل 5 مصادر تعلم مجانية بالعربية\n4. خارطة طريق: خطة تعلم لمدة 3 أشهر\n\nتجنب المصطلحات التقنية المعقدة بدون شرح.',
    },
    {
        id: 'too-short',
        exerciseId: 'hospital-challenge-too-short',
        name: 'سوء التغذية المعلوماتي',
        icon: '🦴',
        description: 'البرومبت قصير جداً ولا يحتوي على معلومات كافية',
        difficulty: 'easy',
        points: 15,
        sickPrompt: 'لخص',
        diseases: ['قصر مفرط', 'فقدان كامل للمعلومات', 'غياب الموضوع'],
        hints: [
            'حدد ماذا تريد تلخيصه بالضبط',
            'أضف النص أو الموضوع المطلوب تلخيصه والطول المطلوب',
        ],
        scoringCriteria: [
            { id: 'length', name: 'الطول', weight: 25, check: 'minimum_length', description: 'هل البرومبت كافي الطول؟' },
            { id: 'context', name: 'السياق', weight: 30, check: 'has_context', description: 'هل وفر المحتوى للتلخيص؟' },
            { id: 'format', name: 'التنسيق', weight: 25, check: 'has_format', description: 'هل حدد شكل الملخص؟' },
            { id: 'constraints', name: 'القيود', weight: 20, check: 'has_constraints', description: 'هل حدد طول الملخص؟' },
        ],
        idealPrompt: 'لخّص المقال التالي في 5 نقاط رئيسية، مع التركيز على: الأرقام والإحصائيات، التوصيات العملية، والاستنتاجات.\n\nالمقال:\n[نص المقال هنا]\n\nالتنسيق: نقاط مرقمة، كل نقطة في سطرين كحد أقصى.\nاللغة: عربية فصحى مبسطة.',
    },
    {
        id: 'no-constraints',
        exerciseId: 'hospital-challenge-no-constraints',
        name: 'انفلات القيود',
        icon: '🔓',
        description: 'البرومبت بدون أي قيود أو حدود - الذكاء الاصطناعي حر تماماً',
        difficulty: 'hard',
        points: 25,
        sickPrompt: 'اكتب قصة عن فتاة تحب القراءة',
        diseases: ['غياب القيود', 'عدم تحديد النوع الأدبي', 'غياب مواصفات الشخصية'],
        hints: [
            'أضف قيوداً على الطول، الأسلوب، والجمهور المستهدف',
            'حدد تفاصيل الشخصية والحبكة والنوع الأدبي',
        ],
        scoringCriteria: [
            { id: 'constraints', name: 'القيود', weight: 30, check: 'has_constraints', description: 'هل أضاف قيوداً وحدوداً؟' },
            { id: 'specificity', name: 'التحديد', weight: 25, check: 'has_specificity', description: 'هل حدد التفاصيل؟' },
            { id: 'role', name: 'الدور', weight: 20, check: 'contains_role', description: 'هل حدد دور الذكاء الاصطناعي؟' },
            { id: 'format', name: 'التنسيق', weight: 25, check: 'has_format', description: 'هل حدد شكل المخرجات؟' },
        ],
        idealPrompt: 'أنت كاتب قصص أطفال محترف.\n\nاكتب قصة قصيرة عن فتاة عمرها 12 سنة تكتشف مكتبة سحرية في حيها القديم.\n\nالمواصفات:\n- الطول: 500-700 كلمة\n- الجمهور: أطفال 10-14 سنة\n- النوع: مغامرة مع عنصر فانتازيا خفيف\n- يجب أن تتضمن: وصف الشخصية، تحدٍ تواجهه، درس مستفاد\n- الأسلوب: سرد مشوّق مع حوارات\n- تجنب: العنف والمحتوى المخيف\n- النهاية: مفتوحة تمهّد لجزء ثاني',
    },
    {
        id: 'everything-wrong',
        exerciseId: 'hospital-challenge-everything-wrong',
        name: 'الحالة الحرجة',
        icon: '🚨',
        description: 'البرومبت يعاني من كل الأمراض مجتمعة - حالة طوارئ!',
        difficulty: 'hard',
        points: 30,
        sickPrompt: 'سوّ حاجة حلوة',
        diseases: ['غموض كامل', 'غياب كل العناصر', 'عدم قابلية التنفيذ'],
        hints: [
            'حدد ماذا تريد أولاً - ما "الحاجة الحلوة"؟',
            'ابنِ البرومبت بالكامل: دور + سياق + مهمة + تنسيق + قيود',
        ],
        scoringCriteria: [
            { id: 'role', name: 'الدور', weight: 20, check: 'contains_role', description: 'هل حدد دوراً؟' },
            { id: 'context', name: 'السياق', weight: 20, check: 'has_context', description: 'هل وفر السياق؟' },
            { id: 'specificity', name: 'التحديد', weight: 20, check: 'has_specificity', description: 'هل حدد المطلوب بدقة؟' },
            { id: 'format', name: 'التنسيق', weight: 15, check: 'has_format', description: 'هل حدد التنسيق؟' },
            { id: 'constraints', name: 'القيود', weight: 15, check: 'has_constraints', description: 'هل أضاف قيوداً؟' },
            { id: 'length', name: 'الطول', weight: 10, check: 'minimum_length', description: 'هل الطول كافٍ؟' },
        ],
        idealPrompt: 'أنت مصمم ومسوّق رقمي محترف.\n\nأحتاج منك تصميم فكرة لحملة تسويقية على إنستغرام لإطلاق تطبيق جديد لتوصيل الطعام الصحي في جدة.\n\nالمطلوب:\n1. اسم الحملة وشعار جذاب\n2. وصف 5 منشورات مع النص والهاشتاقات\n3. جدول زمني للنشر (أسبوع واحد)\n4. اقتراحات للتعاون مع مؤثرين\n\nالجمهور: شباب 20-35 مهتمين بالصحة واللياقة\nالأسلوب: عصري، مرح، محفّز\nتجنب: المبالغة في الوعود الصحية',
    },
]
