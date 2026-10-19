'use client'

import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import CourseToc from '@/components/toc/CourseToc'
import { trackViewContent } from '@/lib/meta-pixel'
import { trackViewItem, trackFunnelStep } from '@/lib/analytics'

export default function TOCPage() {
    useEffect(() => {
        trackViewContent()
        trackViewItem()
        trackFunnelStep('table_of_contents', 2)
    }, [])

    return (
        <>
            <Navigation />
            <main>
                <CourseToc />
            </main>
        </>
    )
}
