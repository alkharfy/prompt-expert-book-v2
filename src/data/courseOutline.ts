import { PRODUCT_STATS } from '@/lib/pricing'

/**
 * The course as the TOC shows it: the free intro, then five levels.
 * A level with a sectionId is out; the rest show «بينزل قريب» with their planned lessons
 * (docs/curriculum/levels-2-5/map.md). Lesson titles of released levels must match the
 * page titles in the reader data (src/__tests__/course-outline.test.ts checks this).
 */
export interface CourseLevel {
    id: 'intro' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5'
    /** Reader section (/read/<sectionId>/<page>); null while the level is still being written. */
    sectionId: string | null
    /** The marker the reader saves in reading_progress.completed_chapters when the level is finished. */
    chapter: number
    label: string
    name: string
    icon: string
    time: string
    out: string
    free?: boolean
    lessons: string[]
}

export const COURSE_LEVELS: CourseLevel[] = [
    {
        id: 'intro', sectionId: 'intro', chapter: 0, label: 'التمهيد', name: 'تعرف الـ AI هيفيدك في إيه', icon: '🚀', free: true,
        time: 'حوالي 15 دقيقة', out: 'أول طلب جرّبته بنفسك، وعرفت الـ AI بيغلط إمتى',
        lessons: ['عمرك فكرت إنك بتستخدم الـ AI غلط؟', 'في حاجات عمرك ما تكتبها للـ AI… تعرفها؟', 'واثق في رد الـ AI بكام في المية؟'],
    },
    {
        id: 'l1', sectionId: 'section-1', chapter: 1, label: 'المستوى 1', name: 'بتستخدمه صح', icon: '🧠',
        time: 'حوالي 3 ساعات', out: 'شغلانة من شغلك اتعملت واتراجعت بدليل قبل ما تتسلّم',
        lessons: ['هو الـ AI بيفهم فعلاً… ولا بيخمّن؟', 'أداتك جاهزة؟', 'ليه رده دايماً عام؟', 'بتبدأ من الأول كل مرة الرد ميعجبكش؟', 'إيه اللي عمره ما يتكتب؟', 'عندك ملف ومش فاضي تقراه؟', 'واثق فيه بكام في المية؟', 'محتاج حاجة تتشاف بكرة الصبح؟', '🎓 شغلانة من شغلك، من أولها لآخرها'],
    },
    {
        id: 'l2', sectionId: 'section-2', chapter: 2, label: 'المستوى 2', name: 'بتطلب زي المحترف', icon: '💡',
        time: 'حوالي 3 ساعات', out: '«شنطة طلباتك»: طلبات جاهزة لأكتر شغلانات بتعملها',
        lessons: ['إيه اللي يستاهل تديه للـ AI أصلاً؟', 'بتشرحله 3 مرات ولسه مش فاهم؟ وريه مثال', 'بتنقل الأرقام من الشات للشيت بإيدك؟', 'رده بيبان مترجم؟', 'عندك صورة إيصال متكرمش؟', 'جالك فويس وإنت في اجتماع؟', 'ملفين ومش متطابقين؟', 'شغلانة كبيرة ومش عارف تبدأ منين؟', '🎓 شنطة طلباتك'],
    },
    {
        id: 'l3', sectionId: 'section-3', chapter: 3, label: 'المستوى 3', name: 'بتجهّزه لشغلك', icon: '🛠️',
        time: 'حوالي 3 ساعات', out: '«مساعد شغلانتك»: بيعمل شغلانة بتتكرر من غير ما تشرح كل مرة',
        lessons: ['ليه بتشرحله كل مرة من الأول؟', 'هو فاكر عنك إيه بالظبط؟', 'لو زميل جديد مسك شغلك بكرة، هيعرف يعمله؟', 'بيرد من دماغه ولا من الملف؟', 'محتاجه جاهز دايماً؟', 'تعتمد عليه من أول تجربة؟', 'غلط؟ صلّح الدليل مش الرد', '🎓 مساعد شغلانتك'],
    },
    {
        id: 'l4', sectionId: null, chapter: 4, label: 'المستوى 4', name: 'بيشتغل معاك', icon: '🤝',
        time: 'حوالي ساعتين ونص', out: 'مهمة فيها كذا خطوة اتنفّذت بخطة إنت وافقت عليها',
        lessons: ['سؤال ولا مهمة؟', 'بحث في 10 دقايق… بس مين راجع المصادر؟', 'سيبه يشتغل… وإنت فين؟', 'توصّله بإيميلك؟ استنى', 'لما يمشي ورا كلام حد تاني', '🎓 مهمة من شغلك'],
    },
    {
        id: 'l5', sectionId: null, chapter: 5, label: 'المستوى 5', name: 'نظام شغلك', icon: '🏗️',
        time: 'حوالي ساعتين + أسبوع شغل', out: 'تقرير «قبل وبعد» بالأرقام، وقواعد لفريقك',
        lessons: ['وفّرت قد إيه بجد؟', 'تدفع اشتراك ولا المجاني كفاية؟', 'فريقك كله بيستخدمه… كل واحد على مزاجه؟', 'لو اتنقلت بكرة، شغلك يكمّل؟', '🎓 تقرير «قبل وبعد»'],
    },
]

/** Old book chapters: open to subscribers until Levels 4–5 come out. */
export const BOOK_CHAPTERS = [
    { n: 4, title: 'الطلبات المتسلسلة', note: 'شغلانة كبيرة على كذا خطوة' },
    { n: 5, title: 'الجودة والتصحيح', note: 'تراجع النتيجة وتصلّح الطلب' },
    { n: 6, title: 'صور وصوت وفيديو', note: 'تشتغل بأكتر من نوع ملف' },
    { n: 7, title: 'وكلاء AI', note: 'أدوات بتنفّذ مهام عنك تحت عينك' },
    { n: 8, title: 'AI على ملفاتك', note: 'يرد من مصادرك، وتتأكد من إجابته' },
    { n: 9, title: 'تطبيقات عملية', note: 'أمثلة حسب مجالك' },
    { n: 10, title: 'تكمّل تتطور', note: 'تتابع الجديد وتقدّم خدمة' },
]

export const COURSE_EXTRAS = [
    { icon: '📚', name: 'مكتبة القوالب', note: `${PRODUCT_STATS.templates} قالب جاهز تنسخه`, href: '/library/1' },
    { icon: '🎒', name: 'شنطة طلباتك', note: 'كل طلب حفظته من الدروس', href: '/notes' },
    { icon: '📝', name: 'الملحق', note: 'تمارين وإجابات', href: '/read/appendix/1' },
]

export const isReleased = (level: CourseLevel) => level.sectionId !== null
export const lessonHref = (level: CourseLevel, lesson: number) => `/read/${level.sectionId}/${lesson + 1}`
export const bookChapterHref = (n: number) => `/read/section-${n}/1`
