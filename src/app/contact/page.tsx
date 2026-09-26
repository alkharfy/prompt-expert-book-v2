import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق PromptMaster عبر البريد الإلكتروني للدعم والاستفسارات والفوترة.',
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
const emailBox: React.CSSProperties = {
  display: 'block',
  background: '#111',
  border: '1px solid rgba(255,107,53,0.3)',
  borderRadius: '14px',
  padding: '24px',
  textAlign: 'center',
  margin: '24px 0',
}
const emailLink: React.CSSProperties = {
  color: '#FF6B35',
  fontSize: '22px',
  fontWeight: 700,
  textDecoration: 'none',
  wordBreak: 'break-all',
}

export default function ContactPage() {
  return (
    <main style={page}>
      <h1 style={h1}>تواصل معنا</h1>
      <p style={lead}>نحن هنا لمساعدتك</p>

      <p style={p}>
        لأي استفسار حول المحتوى أو الاشتراك أو الفوترة أو الدعم الفني، أسهل طريقة للوصول
        إلينا هي عبر البريد الإلكتروني. اكتب لنا بالتفصيل وسنردّ عليك في أقرب وقت.
      </p>

      <a href={`mailto:${SUPPORT_EMAIL}`} style={emailBox}>
        <span style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
          البريد الإلكتروني للدعم
        </span>
        <span style={emailLink}>{SUPPORT_EMAIL}</span>
      </a>

      <h2 style={h2}>وقت الرد المتوقع</h2>
      <p style={p}>
        نسعى للرد على جميع الرسائل خلال <strong>24 إلى 48 ساعة</strong> في أيام العمل.
        لتسريع المساعدة، يرجى تضمين بريدك المسجَّل ورقم الطلب إن وُجد، ووصفاً واضحاً
        لاستفسارك.
      </p>

      <h2 style={h2}>روابط قد تفيدك</h2>
      <p style={p}>
        قبل مراسلتنا، ربما تجد إجابتك في إحدى هاتين الصفحتين:
      </p>
      <ul style={{ ...p, paddingInlineStart: '22px' }}>
        <li>
          <a href="/refund-policy" style={link}>سياسة الاسترداد</a> — تفاصيل ضمان الاسترداد
          خلال 30 يوماً وكيفية تقديم الطلب.
        </li>
        <li>
          <a href="/terms" style={link}>الشروط والأحكام</a> — معلومات الاشتراك والأسعار
          والترخيص وشروط الحساب.
        </li>
      </ul>
    </main>
  )
}
