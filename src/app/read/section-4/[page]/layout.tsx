import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'المستوى ٤: بيشتغل معاك',
    description: 'تسلّمه مهمة فيها كذا خطوة: ورقة تكليف، وخطة توافق عليها، ونقط وقوف، وسجل، وتوقّفه لو غلط.',
}

export default function Section4Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
