import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 03: استراتيجيات البرومبت',
    description: 'تعلم استراتيجيات متقدمة في هندسة البرومبتات وأنماط الكتابة الاحترافية.',
}

export default function Section3Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
