import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المقدمة',
    description: 'مقدمة PromptMaster - ابدأ رحلتك نحو احتراف هندسة البرومبت والذكاء الاصطناعي.',
}

export default function IntroLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
