import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المستوى ١: بتستخدمه صح',
    description: 'المستوى ١: اطلب شغلك بالذكاء الاصطناعي صح، وراجع الرد قبل ما تسلّمه، واعرف إيه اللي متحطوش أبداً.',
}

export default function Section1Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
