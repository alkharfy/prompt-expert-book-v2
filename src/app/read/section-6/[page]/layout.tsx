import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 06: تطبيقات عملية',
    description: 'تطبيقات عملية ومشاريع حقيقية لهندسة البرومبتات في مجالات متنوعة.',
}

export default function Section6Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
