import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'تسجيل الدخول | PromptMaster',
    description: 'سجّل دخولك لمتابعة رحلتك في احتراف هندسة البرومبت والذكاء الاصطناعي.',
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
