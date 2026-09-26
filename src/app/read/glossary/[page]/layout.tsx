import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'معجم المصطلحات',
    description: 'معجم شامل لمصطلحات الذكاء الاصطناعي وهندسة البرومبتات باللغة العربية والإنجليزية.',
}

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
