import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 05: ضمان الجودة وتنقيح البرومبت',
    description: 'تعلم أساليب ضمان جودة البرومبتات وتنقيحها للحصول على أفضل النتائج.',
}

export default function Section5Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
