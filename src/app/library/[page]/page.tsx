import { libraryData } from '@/data/bookData'
import { getServerAccess } from '@/lib/server/access'
import LibraryReader from '@/components/reading/LibraryReader'

// Server Component: the template library is a PAID feature. Gate it server-side —
// non-subscribers receive page shells with empty contentBlocks, so the template
// text never reaches the browser (no RSC payload, no JS bundle).
export default async function LibraryPage() {
    const { hasAccess, isAuthed } = await getServerAccess()
    const data = hasAccess ? libraryData : libraryData.map((p) => ({ ...p, contentBlocks: [] }))
    return <LibraryReader data={data} initialHasAccess={hasAccess} initialAuthed={isAuthed} />
}
