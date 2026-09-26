import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'سياسة الاسترداد',
  description: 'سياسة استرداد الأموال في PromptMaster — ضمان استرداد خلال 30 يوماً وكيفية تقديم طلب الاسترداد.',
}

const page: React.CSSProperties = {
  maxWidth: '780px',
  margin: '60px auto',
  padding: '0 20px 80px',
  color: '#ddd',
  lineHeight: 1.9,
}
const h1: React.CSSProperties = { color: '#FF6B35', fontSize: '30px', marginBottom: '8px' }
const lead: React.CSSProperties = { color: '#888', fontSize: '14px', marginBottom: '32px' }
const h2: React.CSSProperties = { color: '#fff', fontSize: '21px', marginTop: '36px', marginBottom: '12px' }
const p: React.CSSProperties = { fontSize: '16px', marginBottom: '14px' }
const link: React.CSSProperties = { color: '#FF6B35', textDecoration: 'none' }

export default function RefundPolicyPage() {
  return (
    <main style={page}>
      <h1 style={h1}>سياسة الاسترداد</h1>
      <p style={lead}>آخر تحديث: 2026</p>

      <p style={p}>
        نحن في PromptMaster واثقون من قيمة المحتوى الذي نقدّمه، ونريدك أن تشترك وأنت مطمئن.
        لذلك نوفّر <strong>ضمان استرداد خلال 30 يوماً</strong> من تاريخ الشراء. إذا لم تكن
        راضياً عن اشتراكك خلال هذه المدة، يمكنك طلب استرداد كامل لقيمة ما دفعته.
      </p>

      <h2 style={h2}>مدة الضمان</h2>
      <p style={p}>
        تبدأ مدة الضمان البالغة <strong>30</strong> يوماً من لحظة إتمام عملية الدفع بنجاح.
        أي طلب استرداد يُقدَّم خلال هذه الـ 30 يوماً يُعالَج وفق هذه السياسة دون الحاجة إلى
        ذكر سبب محدد.
      </p>

      <h2 style={h2}>كيفية تقديم طلب الاسترداد</h2>
      <p style={p}>
        لتقديم طلب الاسترداد، أرسل بريداً إلكترونياً إلى{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a> متضمّناً
        المعلومات المطلوبة التالية حتى نتمكّن من التحقق من طلبك ومعالجته بسرعة:
      </p>
      <ul style={{ ...p, paddingInlineStart: '22px' }}>
        <li>رقم الطلب (الموجود في رسالة تأكيد الشراء).</li>
        <li>البريد الإلكتروني الذي استخدمته عند الاشتراك.</li>
        <li>سبب الطلب (اختياري — يساعدنا على تحسين الخدمة).</li>
      </ul>
      <p style={p}>
        ضع في عنوان الرسالة عبارة «طلب استرداد» ليصل طلبك إلى الفريق المختص مباشرة.
      </p>

      <h2 style={h2}>مدة المعالجة</h2>
      <p style={p}>
        نراجع الطلب ونؤكّد استلامه عادةً خلال يومي عمل. بعد الموافقة، تتم إعادة المبلغ
        بالطريقة نفسها التي تم بها الدفع، وقد تستغرق المعاملة من 5 إلى 14 يوم عمل لتظهر
        في حسابك حسب البنك أو مزوّد الدفع.
      </p>

      <h2 style={h2}>حالات لا يشملها الاسترداد</h2>
      <p style={p}>
        لا ينطبق الضمان على الطلبات المقدَّمة بعد مرور 30 يوماً من تاريخ الشراء، ولا على
        أي مخالفة لشروط الاستخدام مثل مشاركة الحساب أو إعادة توزيع المحتوى. في هذه الحالات
        قد يُرفض طلب الاسترداد.
      </p>

      <h2 style={h2}>لديك سؤال؟</h2>
      <p style={p}>
        إذا احتجت أي مساعدة بخصوص الاسترداد أو الفوترة، تواصل معنا على{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a> وسنكون سعداء
        بمساعدتك.
      </p>
    </main>
  )
}
