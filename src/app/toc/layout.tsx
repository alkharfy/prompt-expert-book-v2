import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'فهرس الكتاب',
    description: 'فهرس PromptMaster - تصفح جميع الفصول والأقسام التعليمية.',
}

export default function TocLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
