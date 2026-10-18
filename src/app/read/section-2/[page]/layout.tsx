import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المستوى ٢: بتطلب زي المحترف',
    description: 'طلبات جاهزة لأكتر الشغلانات اللي بتعملها: بأمثلة، وبجداول تتلزق في الشيت، وبنبرتك، ومن الصور والفويسات والملفات.',
}

export default function Section2Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
