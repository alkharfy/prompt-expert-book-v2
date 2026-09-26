import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'إنشاء حساب | PromptMaster',
    description: 'أنشئ حساباً جديداً وابدأ رحلتك لتصبح PromptMaster في هندسة البرومبت والذكاء الاصطناعي.',
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
