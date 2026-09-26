import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام الخاصة باستخدام منصة PromptMaster — الاشتراكات والأسعار والترخيص وشروط الحساب.',
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

export default function TermsPage() {
  return (
    <main style={page}>
      <h1 style={h1}>الشروط والأحكام</h1>
      <p style={lead}>آخر تحديث: 2026</p>

      <p style={p}>
        باستخدامك منصة PromptMaster والاشتراك فيها، فإنك توافق على الشروط والأحكام التالية.
        نرجو قراءتها بعناية قبل إتمام عملية الشراء أو استخدام أي من خدماتنا.
      </p>

      <h2 style={h2}>الخدمة</h2>
      <p style={p}>
        تقدّم PromptMaster محتوى تعليمياً تفاعلياً لاحتراف استخدام الذكاء الاصطناعي باللغة
        العربية، يشمل فصولاً وتمارين وأدوات وموارد إضافية. يتم الوصول إلى المحتوى عبر حساب
        شخصي بعد الاشتراك في إحدى الخطط المتاحة.
      </p>

      <h2 style={h2}>الخطط والأسعار</h2>
      <p style={p}>
        نوفّر ثلاث خطط اشتراك بالجنيه المصري:
      </p>
      <ul style={{ ...p, paddingInlineStart: '22px' }}>
        <li>الخطة الأساسية: 99 ج.م.</li>
        <li>الخطة المتقدمة: 199 ج.م.</li>
        <li>خطة VIP: 399 ج.م سنوياً.</li>
      </ul>
      <p style={p}>
        الأسعار قابلة للتغيير، وتُعرض الأسعار النهائية وأي ضرائب أو رسوم سارية وقت الشراء،
        وهي التي تُعتمد عند إتمام الدفع. أي تعديل في الأسعار لا يؤثر على اشتراك قائم بالفعل
        حتى نهاية مدته.
      </p>

      <h2 style={h2}>الدفع والتجديد</h2>
      <p style={p}>
        تتم معالجة المدفوعات عبر مزوّد دفع خارجي آمن. تسري سياسة الاسترداد الموضّحة في{' '}
        <a href="/refund-policy" style={link}>صفحة سياسة الاسترداد</a>، والتي تتيح ضمان
        استرداد خلال 30 يوماً من تاريخ الشراء.
      </p>

      <h2 style={h2}>الترخيص والاستخدام</h2>
      <p style={p}>
        يمنحك اشتراكك ترخيصاً شخصياً غير حصري وغير قابل للتحويل لاستخدام المحتوى لأغراض
        التعلّم الذاتي فقط. لا يجوز نسخ المحتوى أو إعادة بيعه أو توزيعه أو نشره أو مشاركته
        مع أطراف أخرى دون إذن كتابي مسبق منّا. جميع حقوق الملكية الفكرية للمحتوى تبقى مملوكة
        لـ PromptMaster.
      </p>

      <h2 style={h2}>الحساب</h2>
      <p style={p}>
        أنت مسؤول عن الحفاظ على سرّية بيانات الدخول إلى حسابك، وعن جميع الأنشطة التي تتم من
        خلاله. الحساب مخصّص لاستخدام شخص واحد، ويُمنع مشاركته. يحق لنا تعليق أو إنهاء أي
        حساب يخالف هذه الشروط أو يُستخدم بطريقة احتيالية.
      </p>

      <h2 style={h2}>تعديل الشروط</h2>
      <p style={p}>
        قد نقوم بتحديث هذه الشروط من وقت لآخر. يسري أي تعديل فور نشره على هذه الصفحة،
        واستمرارك في استخدام المنصة بعد التحديث يُعدّ موافقة على الشروط المعدّلة.
      </p>

      <h2 style={h2}>التواصل</h2>
      <p style={p}>
        لأي استفسار حول هذه الشروط، تواصل معنا على{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a>.
      </p>
    </main>
  )
}
