import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'فهرس الكورس',
    description: 'فهرس كورس PromptMaster: التمهيد ببلاش، والمستويات 1 و2 و3، والمستويات الجاية.',
}

export default function TocLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
