import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'من نحن',
  description: 'تعرّف على رسالة PromptMaster: تعليم الذكاء الاصطناعي بالعربي بطريقة عملية تفاعلية للجميع.',
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

export default function AboutPage() {
  return (
    <main style={page}>
      <h1 style={h1}>من نحن</h1>
      <p style={lead}>PromptMaster</p>

      <p style={p}>
        PromptMaster منصة تعليمية عربية هدفها أن تجعل الذكاء الاصطناعي مهارة في متناول كل
        شخص يتحدّث العربية — لا حكراً على من يتقن الإنجليزية أو البرمجة. نؤمن أن أدوات الذكاء
        الاصطناعي أصبحت جزءاً من العمل والدراسة والحياة اليومية، وأن من حقّ المتحدث بالعربية
        أن يتعلّم استخدامها بإتقان وبلغته.
      </p>

      <h2 style={h2}>رسالتنا</h2>
      <p style={p}>
        مهمّتنا أن نأخذك تعلّم الأساسيات وتطبيقها في استخدام الذكاء الاصطناعي عبر محتوى عملي
        مبسّط بالعربية. نركّز على التطبيق لا الحفظ: تمارين تفاعلية، أمثلة واقعية، وأدوات
        تساعدك على كتابة أوامر (Prompts) أفضل، وبناء مشاريعك، وتوظيف هذه المهارة في عملك أو
        مصدر دخل جديد.
      </p>

      <h2 style={h2}>لماذا بالعربية؟</h2>
      <p style={p}>
        معظم المحتوى الجيّد عن الذكاء الاصطناعي متاح بالإنجليزية، وهذا يترك فجوة كبيرة أمام
        ملايين المتعلّمين العرب. نسعى لسدّ هذه الفجوة بمحتوى أصيل مكتوب بالعربية يراعي
        السياق والاحتياج الحقيقي للمستخدم العربي.
      </p>

      <h2 style={h2}>قيمنا</h2>
      <p style={p}>
        نلتزم بالصدق في ما نَعِد به، وبالوضوح في المحتوى والأسعار، وباحترام وقت المتعلّم
        وخصوصيته. لا نَعِد بنتائج خارقة، بل نقدّم أساساً متيناً وأدوات عملية تبني مهارة
        حقيقية تبقى معك.
      </p>

      <h2 style={h2}>كيف تستخدم المحتوى؟</h2>
      <p style={p}>ابدأ بالمعاينة المجانية، ثم جرّب برومبتًا على مهمة حقيقية. القوالب نقطة بداية تعدّلها حسب احتياجك؛ راجع المعلومات والنتائج ولا تضع بيانات سرية في أدوات عامة. الأمثلة التعليمية والشخصيات داخل الدروس ليست شهادات عملاء.</p>

      <h2 style={h2}>تواصل معنا</h2>
      <p style={p}>
        يسعدنا أن نسمع منك. راسلنا على{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a> لأي سؤال أو
        ملاحظة أو اقتراح.
      </p>
    </main>
  )
}
