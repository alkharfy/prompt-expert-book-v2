import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الفصل 01: الـ AI بيفكر إزاي؟',
    description: 'خلّص أول مهمة شغل بالذكاء الاصطناعي: اطلب صح، وراجع الأرقام، واحمي بياناتك — مجاناً.',
}

export default function Section1Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
