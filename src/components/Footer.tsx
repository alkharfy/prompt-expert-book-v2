import Link from 'next/link'
import { SUPPORT_EMAIL, SITE_DOMAIN } from '@/lib/config'

type FooterProps = {
  variant?: 'full' | 'minimal'
}

const legalLinks = [
  { href: '/about', label: 'من نحن' },
  { href: '/terms', label: 'الشروط والأحكام' },
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/refund-policy', label: 'سياسة الاسترداد' },
  { href: '/contact', label: 'تواصل معنا' },
]

const linkStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.9rem',
  textDecoration: 'none',
}

function LegalLinksRow() {
  return (
    <nav
      aria-label="روابط قانونية"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px 20px',
      }}
    >
      {legalLinks.map(link => (
        <Link key={link.href} href={link.href} style={linkStyle}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'minimal') {
    return (
      <footer
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <LegalLinksRow />
      </footer>
    )
  }

  return (
    <footer
      style={{
        padding: '48px 16px 40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '1rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          {`PromptMaster — ${SITE_DOMAIN}`}
        </p>

        <LegalLinksRow />

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '0.9rem',
            margin: 0,
          }}
        >
          الدفع عبر بوابة Kashier المؤمّنة
        </p>

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '0.9rem',
            margin: 0,
          }}
        >
          <a href={`mailto:${SUPPORT_EMAIL}`} style={linkStyle}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  )
}
