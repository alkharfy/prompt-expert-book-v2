import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'تسجيل الدخول | خبير التوجيهات الذكية',
    description: 'سجّل دخولك لمتابعة رحلة تعلم صياغة البرومبتات الذكية.',
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
