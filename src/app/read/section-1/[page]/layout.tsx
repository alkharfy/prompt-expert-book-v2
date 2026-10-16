import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 01: الـ AI بيفكر إزاي؟',
    description: 'المستوى ١: اطلب شغلك بالذكاء الاصطناعي صح، وراجع الرد قبل ما تسلّمه، واعرف إيه اللي متحطوش أبداً.',
}

export default function Section1Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
