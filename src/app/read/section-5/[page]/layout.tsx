import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المستوى ٥: نظام شغلك',
    description: 'طريقة شغل بالـ AI ليك أو لفريقك: تقيس وفّرت قد إيه، ومهمة متجدولة، ومهارة من دليلك، وكونكتر بأقل صلاحية، وقواعد للفريق، وتقرير لمديرك.',
}

export default function Section5Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
