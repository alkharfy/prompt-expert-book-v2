import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'مكتبة البرومبتات',
    description: 'مكتبة شاملة من قوالب البرومبتات الجاهزة للاستخدام في مختلف المجالات.',
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
