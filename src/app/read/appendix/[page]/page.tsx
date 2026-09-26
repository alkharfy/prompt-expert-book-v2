import { appendixData } from '@/data/bookData'
import { getServerAccess } from '@/lib/server/access'
import AppendixReader from '@/components/reading/AppendixReader'

// Server Component: the appendix is part of the paid book. Gate it server-side —
// non-subscribers receive page shells with empty contentBlocks, so the extra
// exercises never reach the browser (no RSC payload, no JS bundle).
export default async function AppendixPage() {
    const { hasAccess, isAuthed } = await getServerAccess()
    const data = hasAccess ? appendixData : appendixData.map((p) => ({ ...p, contentBlocks: [] }))
    return <AppendixReader data={data} initialHasAccess={hasAccess} initialAuthed={isAuthed} />
}
