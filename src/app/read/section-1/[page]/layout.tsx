import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 01: أساسيات البرومبت',
    description: 'تعلم أساسيات كتابة البرومبتات الذكية وفهم كيف يعمل الذكاء الاصطناعي.',
}

export default function Section1Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
