import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 04: سلاسل البرومبت وبناء المشاريع',
    description: 'تعلم تقنية Prompt Chaining لبناء مشاريع كاملة باستخدام الذكاء الاصطناعي.',
}

export default function Section4Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
