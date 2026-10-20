import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'فهرس الكورس',
    description: 'فهرس كورس PromptMaster: التمهيد ببلاش، والمستويات الخمسة، والورش.',
}

export default function TocLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
