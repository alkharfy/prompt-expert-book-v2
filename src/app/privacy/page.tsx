import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية في PromptMaster — البيانات التي نجمعها، الغرض منها، وكيف نحميها ونحترم خصوصيتك.',
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

export default function PrivacyPage() {
  return (
    <main style={page}>
      <h1 style={h1}>سياسة الخصوصية</h1>
      <p style={lead}>آخر تحديث: 2026</p>

      <p style={p}>
        خصوصيتك تهمّنا. توضّح هذه السياسة أنواع البيانات التي نجمعها في PromptMaster،
        وكيف نستخدمها ونحميها، وما هي حقوقك تجاهها.
      </p>

      <h2 style={h2}>البيانات التي نجمعها</h2>
      <ul style={{ ...p, paddingInlineStart: '22px' }}>
        <li>بيانات الحساب: الاسم والبريد الإلكتروني ورقم الهاتف الذي تزوّدنا به عند التسجيل.</li>
        <li>
          بيانات الدفع: تتم معالجة عمليات الدفع عبر مزوّد الدفع <strong>Kashier</strong>،
          ولا نقوم بتخزين بيانات بطاقتك البنكية على خوادمنا.
        </li>
        <li>بيانات الاستخدام: تقدّمك في المحتوى والتمارين وأوقات الدخول لتحسين تجربتك.</li>
        <li>بيانات تقنية: نوع المتصفح والجهاز وعنوان الـ IP لأغراض الأمان والتشغيل.</li>
      </ul>

      <h2 style={h2}>الغرض من جمع البيانات</h2>
      <p style={p}>
        نستخدم هذه البيانات لإنشاء حسابك وتسجيل دخولك، وتفعيل اشتراكك ومعالجة مدفوعاتك،
        وحفظ تقدّمك في التعلّم، وتقديم الدعم الفني، وتحسين المحتوى والخدمة، وإرسال إشعارات
        مرتبطة بحسابك ونشاطك.
      </p>

      <h2 style={h2}>عدم بيع البيانات</h2>
      <p style={p}>
        نحن <strong>لا نبيع بياناتك الشخصية</strong> ولا نؤجّرها لأي طرف ثالث. نشاركها فقط
        مع مزوّدي الخدمة الضروريين لتشغيل المنصة (مثل مزوّد الدفع ومزوّد البنية التقنية)
        وفي حدود ما يلزم لأداء الخدمة، أو عند وجود التزام قانوني يفرض ذلك.
      </p>

      <h2 style={h2}>ملفات تعريف الارتباط والبيكسل</h2>
      <p style={p}>
        نستخدم ملفات تعريف الارتباط (Cookies) لإبقائك مسجّل الدخول وتذكّر تفضيلاتك. كما
        نستخدم أدوات قياس مثل بيكسل التتبّع (Pixel) لفهم أداء المنصة وقياس فعالية حملاتنا.
        يمكنك ضبط متصفحك لرفض ملفات تعريف الارتباط، مع العلم أن بعض الميزات قد لا تعمل
        بشكل كامل عندئذٍ.
      </p>

      <h2 style={h2}>حماية البيانات وحقوقك</h2>
      <p style={p}>
        نتّخذ إجراءات تقنية وتنظيمية معقولة لحماية بياناتك. يحق لك طلب الاطلاع على بياناتك
        أو تصحيحها أو حذف حسابك. لممارسة أي من هذه الحقوق راسلنا على البريد أدناه.
      </p>

      <h2 style={h2}>التواصل بشأن الخصوصية</h2>
      <p style={p}>
        لأي استفسار أو طلب يتعلّق بخصوصيتك وبياناتك، تواصل معنا على{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a>.
      </p>
    </main>
  )
}
