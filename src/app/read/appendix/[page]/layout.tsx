import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الملاحق',
    description: 'ملاحق ومراجع إضافية لمنصة PromptMaster.',
}

export default function AppendixLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
