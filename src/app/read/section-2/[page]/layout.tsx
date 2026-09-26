import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 02: تقنيات البرومبت المتقدمة',
    description: 'اكتشف التقنيات المتقدمة لصياغة أوامر ذكية أكثر فعالية ودقة.',
}

export default function Section2Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
