import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المقدمة',
    description: 'جرّب في دقيقة: نفس أداة الذكاء الاصطناعي ونتيجتين مختلفتين — ابدأ مجاناً ومن غير تسجيل.',
}

export default function IntroLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
