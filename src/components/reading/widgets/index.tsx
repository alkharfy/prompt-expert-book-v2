'use client'

/**
 * سجل الـ widgets التفاعلية — يربط معرّف الـ widget (في بيانات الكتاب)
 * بالـ component اللي يرسمه. عشان نضيف أنيميشن مفهوم جديد:
 *   1. اعمل component جديد في نفس الفولدر.
 *   2. سجّله هنا بمعرّف فريد.
 *   3. استخدمه في بيانات الوحدة:
 *      { type: 'interactive', widget: 'المعرّف', content: '' }
 */

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// dynamic + ssr:false: الـ widgets تفاعلية وبتعتمد على IntersectionObserver،
// فمفيش داعي نرسمها على السيرفر — وكمان ده بيخفّف الـ bundle الأولي.
const NextTokenPrediction = dynamic(() => import('./NextTokenPrediction'), { ssr: false })

export const WIDGETS: Record<string, ComponentType> = {
    'next-token-prediction': NextTokenPrediction,
}

export function InteractiveWidget({ widget }: { widget?: string }) {
    if (!widget) return null
    const Comp = WIDGETS[widget]
    if (!Comp) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[InteractiveWidget] widget غير معروف: "${widget}"`)
        }
        return null
    }
    return <Comp />
}
