import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'إنشاء حساب | خبير التوجيهات الذكية',
    description: 'أنشئ حساباً جديداً لتبدأ رحلتك في احتراف الأوامر الذكية للذكاء الاصطناعي.',
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
