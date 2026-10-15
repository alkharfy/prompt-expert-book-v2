// «أول تجربة من شغلك» — one Egyptian, EGP example per profession.
// Used twice with the SAME request (one exercise, not two):
//   1. Onboarding result screen: a pre-written practice reply with ONE planted
//      mistake → «صح ولا غلط؟» (no live AI call).
//   2. Intro page 1: the live try — copy the request into ChatGPT/Gemini and review.
// Every number here is dummy data; the arithmetic in `feedback`/`reviewTip` is checked
// by src/__tests__/data/profession-tries.test.ts.

import type { ProfessionId } from '@/types/learning'

export interface ProfessionTry {
  id: ProfessionId
  icon: string
  /** Tile label on the «بتشتغل إيه؟» screen. */
  label: string
  /** Short noun phrase for «من شغلك كـ…». */
  asRole: string
  /** The clear request (who you are + the data + the output + limits). */
  request: string
  /** What the practice reply claimed — always contains the planted mistake. */
  claim: string
  /** Names the mistake and the correct value. */
  feedback: string
  /** How to review the live answer on intro page 1. */
  reviewTip: string
}

export const PROFESSION_TRIES: Record<ProfessionId, ProfessionTry> = {
  accounting: {
    id: 'accounting',
    icon: '📊',
    label: 'محاسب أو مالية',
    asRole: 'محاسب',
    request:
      'أنا محاسب في شركة صغيرة. دي فواتير موردين لسه متدفعتش:\n' +
      'مورد الورق 3,400 جنيه — مستحقة 5 نوفمبر\n' +
      'مورد الحبر 1,850 جنيه — مستحقة 12 نوفمبر\n' +
      'شركة الصيانة 2,700 جنيه — مستحقة 1 نوفمبر\n' +
      'رتّبهم من الأقرب للأبعد في جدول، واكتب الإجمالي.\n' +
      'لو فيه معلومة ناقصة اسألني بدل ما تفترض.',
    claim: 'الإجمالي: 8,950 جنيه.',
    feedback: '3,400 + 1,850 + 2,700 = 7,950 جنيه، مش 8,950.',
    reviewTip:
      'اجمع بنفسك: 3,400 + 1,850 + 2,700 = 7,950 جنيه. واتأكد إن شركة الصيانة (1 نوفمبر) أول واحدة في الجدول.',
  },
  hr_admin: {
    id: 'hr_admin',
    icon: '🧑‍💼',
    label: 'HR أو شغل إداري',
    asRole: 'HR',
    request:
      'أنا HR في شركة توزيع في الجيزة. اكتبلي إعلان وظيفة «مندوب مبيعات» في أقل من 80 كلمة، بالعامية:\n' +
      'المرتب 7,000 جنيه + عمولة، الشغل من 9 لـ 5، ولازم رخصة قيادة.\n' +
      'متضيفش أي ميزة أو شرط مش مكتوب هنا.',
    claim: 'الإعلان فيه: «مرتب 7,000 جنيه + عمولة + تأمين صحي شامل».',
    feedback: '«تأمين صحي» مش في طلبك أصلاً. الـ AI ضاف ميزة من عنده — ولو الإعلان اتنشر كده، هتتسأل عليها.',
    reviewTip:
      'قارن الإعلان بطلبك سطر سطر: المرتب، والمواعيد، والرخصة. أي ميزة أو شرط مش مكتوب في طلبك، امسحه.',
  },
  teacher: {
    id: 'teacher',
    icon: '👩‍🏫',
    label: 'مدرس',
    asRole: 'مدرس',
    request:
      'أنا مدرس رياضة لتالتة إعدادي. اكتبلي 3 مسائل على النسبة المئوية من الحياة اليومية في مصر (خصومات بالجنيه، فواتير، درجات)، ومعاها الحل بالخطوات.\n' +
      'خلّي الأرقام سهلة على الحساب الذهني.',
    claim: 'مسألة: قميص بـ 400 جنيه وعليه خصم 25%. الحل: السعر بعد الخصم 325 جنيه.',
    feedback: '25% من 400 = 100 جنيه، يعني السعر بعد الخصم 300 جنيه، مش 325.',
    reviewTip:
      'حل مسألة واحدة على الأقل بنفسك قبل ما توزّع. مثلاً: خصم 25% على 400 جنيه = 300 جنيه.',
  },
  marketing_business: {
    id: 'marketing_business',
    icon: '📣',
    label: 'تسويق أو صاحب بيزنس',
    asRole: 'صاحب بيزنس',
    request:
      'عندي محل حلويات في المنصورة. اكتبلي بوست فيسبوك قصير بالعامية لعرض:\n' +
      'علبة كحك كيلو بـ 280 جنيه بدل 350، لحد آخر الشهر.\n' +
      'متقولش «أقل سعر في مصر» ولا أي ادعاء مش موجود هنا.',
    claim: 'البوست بيقول: «خصم 30% على علبة الكحك — بـ 280 جنيه بس!»',
    feedback: '350 − 280 = 70 جنيه، يعني الخصم 20%، مش 30%. نسبة غلط في إعلان ممكن تعملك مشكلة مع الزبون.',
    reviewTip:
      'احسب الخصم بنفسك: 350 − 280 = 70 جنيه = 20%. ولو البوست فيه ادعاء مش في طلبك، امسحه.',
  },
  sales_service: {
    id: 'sales_service',
    icon: '🤝',
    label: 'مبيعات أو خدمة عملاء',
    asRole: 'خدمة عملاء',
    request:
      'أنا في خدمة العملاء في شركة إنترنت. عميل بيشتكي إن النت فاصل من يومين وعايز يلغي.\n' +
      'اكتبلي رد قصير ومحترم بالعامية: نعتذر، والفني هيكلمه خلال 24 ساعة، وخصم 50 جنيه على الشهر الجاي.\n' +
      'متوعدوش بأي حاجة غير دول.',
    claim: 'الرد فيه: «…وهنرجعلك فلوس الشهر ده كله».',
    feedback: 'انت عرضت خصم 50 جنيه بس، مش فلوس الشهر كله. وعد زيادة من الـ AI ممكن يتحسب على الشركة.',
    reviewTip:
      'اتأكد إن الرد فيه الـ 3 حاجات بس: اعتذار، وفني خلال 24 ساعة، وخصم 50 جنيه — ومفيش أي وعد زيادة.',
  },
  student_jobseeker: {
    id: 'student_jobseeker',
    icon: '🎓',
    label: 'طالب أو بدوّر على شغل',
    asRole: 'بدوّر على شغل',
    request:
      'أنا خريج تجارة وبدوّر على أول شغل في الحسابات. خبرتي: تدريب 3 شهور في مكتب محاسبة، وExcel كويس.\n' +
      'اكتبلي «نبذة عني» للـ CV في 3 سطور.\n' +
      'متضيفش أي خبرة أو شهادة مش مكتوبة هنا.',
    claim: 'النبذة بتقول: «خبرة سنتين في المحاسبة وإجادة Excel».',
    feedback: 'انت عندك تدريب 3 شهور، مش خبرة سنتين. الجملة دي هتتسأل عليها في الإنترفيو.',
    reviewTip:
      'قارن كل جملة في النبذة بخبرتك الحقيقية. أي خبرة أو شهادة مش عندك، امسحها.',
  },
  programmer: {
    id: 'programmer',
    icon: '💻',
    label: 'مبرمج',
    asRole: 'مبرمج',
    request:
      'أنا مطوّر Python. عندي ملف Excel فيه عمودين: اسم المنتج والسعر بالجنيه.\n' +
      'اكتبلي سكريبت يطلّع المنتجات اللي سعرها أكتر من 500 جنيه، ويحسب متوسط أسعارهم.\n' +
      'لو محتاج أسماء الأعمدة اسألني بدل ما تفترض.',
    claim: 'لو الأسعار 600 و800 و300، المتوسط هيطلع 566.67 جنيه.',
    feedback: 'الـ 300 مش أكتر من 500، فالمتوسط (600 + 800) ÷ 2 = 700 جنيه، مش 566.67.',
    reviewTip:
      'جرّب السكريبت على 3 منتجات تحسبها بإيدك: 600 و800 و300 ← المتوسط لازم يطلع 700.',
  },
  other: {
    id: 'other',
    icon: '✨',
    label: 'حاجة تانية',
    asRole: 'أي حد',
    request:
      'عايز أنظّم مصاريف البيت الشهر ده: إيجار 4,500 جنيه، كهربا 650، أكل 3,200، مواصلات 900، نت 350.\n' +
      'اعملي جدول بالبند والمبلغ، ورتّبه من الأكبر للأصغر، واكتب الإجمالي.\n' +
      'لو فيه رقم مش واضح اسألني بدل ما تفترض.',
    claim: 'الإجمالي: 10,600 جنيه.',
    feedback: '4,500 + 650 + 3,200 + 900 + 350 = 9,600 جنيه، مش 10,600.',
    reviewTip:
      'اجمع بنفسك: 4,500 + 650 + 3,200 + 900 + 350 = 9,600 جنيه. لو الإجمالي في الرد مختلف، يبقى فيه غلط.',
  },
}

/** «كمحاسب» / «كـHR»: the joined ك needs a tatweel only before a Latin word. */
export function asRolePhrase(item: ProfessionTry): string {
  return `${/^[A-Za-z]/.test(item.asRole) ? 'كـ' : 'ك'}${item.asRole}`
}

export function getProfessionTry(id: string | null | undefined): ProfessionTry {
  return (id && PROFESSION_TRIES[id as ProfessionId]) || PROFESSION_TRIES.other
}
