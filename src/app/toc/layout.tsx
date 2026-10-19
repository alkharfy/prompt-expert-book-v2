import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'فهرس الكورس',
    description: 'فهرس كورس PromptMaster: التمهيد ببلاش، والمستوى 1 والمستوى 2، والمستويات الجاية.',
}

export default function TocLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
