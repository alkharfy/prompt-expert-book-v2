import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المستوى ٣: بتجهّزه لشغلك',
    description: 'مساعد لشغلانة بتتكرر: دليل تشغيل، وملفات مرجعية، ومساحة في أداتك، وورقة اختبار قبل ما تعتمد عليه.',
}

export default function Section3Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
