import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, supportWhatsAppUrl } from '@/lib/config'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'كلّم خدمة عملاء PromptMaster على واتساب أو الإيميل: الاشتراك، والدفع، والدروس.',
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
    <>
      <Navigation />
      <main style={page}>
        <h1 style={h1}>كلّمنا</h1>
        <p style={lead}>خدمة العملاء موجودة تساعدك في الاشتراك والدفع والدروس.</p>

        <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer" style={{ ...emailBox, borderColor: 'rgba(74,222,128,0.45)' }}>
          <span style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
            الأسرع: واتساب خدمة العملاء
          </span>
          <span style={{ ...emailLink, color: '#4ade80' }} dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>
          <span style={{ display: 'block', color: '#aaa', fontSize: '14px', marginTop: '8px' }}>اضغط هنا ويفتحلك الواتساب على طول</span>
        </a>

        <a href={`mailto:${SUPPORT_EMAIL}`} style={emailBox}>
          <span style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
            أو ابعت إيميل
          </span>
          <span style={emailLink}>{SUPPORT_EMAIL}</span>
        </a>

        <h2 style={h2}>عشان نساعدك أسرع</h2>
        <p style={p}>
          ابعت الإيميل اللي سجّلت بيه، ولو المشكلة في الدفع ابعت رقم العملية أو صورة من رسالة الدفع.
          ومتبعتش الباسورد بتاعك أو بيانات الكارت لأي حد، حتى لو قال إنه من عندنا.
        </p>

        <h2 style={h2}>ممكن تلاقي إجابتك هنا</h2>
        <ul style={{ ...p, paddingInlineStart: '22px' }}>
          <li>
            <a href="/refund-policy" style={link}>سياسة الاسترداد</a>: ترجّع فلوسك خلال 7 أيام في الشهري و30 يوم في السنوي، وإزاي تطلب ده.
          </li>
          <li>
            <a href="/terms" style={link}>الشروط والأحكام</a>: الاشتراك والأسعار وشروط الحساب.
          </li>
        </ul>
      </main>
    </>
  )
}
