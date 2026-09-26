import { glossaryData } from '@/data/bookData'
import { getServerAccess } from '@/lib/server/access'
import GlossaryReader from '@/components/reading/GlossaryReader'

// Server Component: the glossary is part of the paid book. Gate it server-side —
// non-subscribers receive page shells with empty contentBlocks, so the term
// definitions never reach the browser (no RSC payload, no JS bundle).
export default async function GlossaryPage() {
    const { hasAccess, isAuthed } = await getServerAccess()
    const data = hasAccess ? glossaryData : glossaryData.map((p) => ({ ...p, contentBlocks: [] }))
    return <GlossaryReader data={data} initialHasAccess={hasAccess} initialAuthed={isAuthed} />
}
