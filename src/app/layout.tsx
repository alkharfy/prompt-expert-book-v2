import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Cairo, Tajawal } from 'next/font/google'
import BackgroundParticles from '@/components/BackgroundParticles'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'
import ChatWindow from '@/components/chat/ChatWindow'
import StreakNotification from '@/components/gamification/StreakNotification'
import DailyMissionsWidget from '@/components/missions/DailyMissionsWidget'
import MetaPixel from '@/components/MetaPixel'
import GATracker from '@/components/GATracker'
import WebVitals from '@/components/WebVitals'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import { LearningProvider } from '@/context/LearningContext'
import Footer from '@/components/Footer'
import { SITE_URL, BOOK_PAGES_DISPLAY } from '@/lib/config'
import { META_PIXEL_ID } from '@/lib/tracking-config'

import './globals.css'

const BASE_URL = SITE_URL

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo',
})

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-tajawal',
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PromptMaster | اتعلم الذكاء الاصطناعي بالعربي وابني مشاريعك واكسب منه',
    template: '%s | PromptMaster',
  },
  description: 'اتعلم تستخدم الذكاء الاصطناعي صح بالعربي • 10 فصول + 48 تمرين تفاعلي + تحدي 7 أيام • من الصفر للاحتراف في استخدام AI وبناء المشاريع وكسب دخل منه. ابدأ بـ 5 جنيه بس.',
  keywords: ['PromptMaster', 'تعلم الذكاء الاصطناعي', 'استخدام ChatGPT', 'كسب فلوس بال AI', 'ذكاء اصطناعي', 'ChatGPT', 'AI', 'تعلم AI', 'فريلانس AI', 'بناء مشاريع بال AI'],
  authors: [{ name: 'PromptMaster' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: SITE_URL,
    siteName: 'PromptMaster',
    title: 'PromptMaster | اتعلم الذكاء الاصطناعي بالعربي وابني مشاريعك واكسب منه',
    description: 'اتعلم تستخدم الذكاء الاصطناعي صح بالعربي • 10 فصول + 48 تمرين تفاعلي + تحدي 7 أيام • ابدأ بـ 5 جنيه بس.',
    images: [{ url: '/assets/card.png', width: 1200, height: 630, alt: 'PromptMaster' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptMaster | اتعلم الذكاء الاصطناعي بالعربي وابني مشاريعك واكسب منه',
    description: 'اتعلم تستخدم الذكاء الاصطناعي صح بالعربي • 10 فصول + 48 تمرين تفاعلي + تحدي 7 أيام • ابدأ بـ 5 جنيه بس.',
    images: ['/assets/card.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: 'PromptMaster',
    description: 'منصة تعليمية تفاعلية لاحتراف الذكاء الاصطناعي بالعربي — بناء مشاريع وكسب دخل من AI',
    inLanguage: 'ar',
    genre: 'تعليمي',
    bookFormat: 'https://schema.org/EBook',
    numberOfPages: BOOK_PAGES_DISPLAY,
  }

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID.trim()}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID.trim()}');
                `,
              }}
            />
          </>
        )}
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <Suspense fallback={null}>
          <GATracker />
        </Suspense>
        <Suspense fallback={null}>
          <WebVitals />
        </Suspense>
        <a
          href="#main-content"
          className="skip-nav"
        >
          تخطي إلى المحتوى
        </a>
        <BackgroundParticles />

        <SubscriptionProvider>
          <LearningProvider>
            <ClientErrorBoundary>
              <div style={{ paddingTop: 'var(--header-h, 0px)' }}>
                {children}
              </div>
              <Footer />
            </ClientErrorBoundary>
          </LearningProvider>
        </SubscriptionProvider>

        <ClientErrorBoundary>
          <ChatWindow />
          <StreakNotification />
          <DailyMissionsWidget />
        </ClientErrorBoundary>
      </body>
    </html>
  )
}
