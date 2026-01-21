import BackgroundParticles from '@/components/BackgroundParticles'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'

import './globals.css'

export const metadata = {
  title: 'خبير البرومبتات | كتابك نحو الاحتراف',
  description: 'تعلم فن صياغة الأوامر الذكية وبناء تطبيقاتك الخاصة',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <BackgroundParticles />

        <ClientErrorBoundary>
          <div style={{ paddingTop: 'var(--header-h, 0px)' }}>
            {children}
          </div>
        </ClientErrorBoundary>
      </body>
    </html>
  )
}
