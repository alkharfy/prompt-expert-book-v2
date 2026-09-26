import SectionPage from '@/components/reading/SectionPage'
import { unit6Data } from '@/data/bookData'
import { SECTION_REGISTRY } from '@/config/sections'
import { getServerAccess, gateSectionPages, getSectionExtras } from '@/lib/server/access'

// Server Component: resolves entitlement server-side and ships only the pages
// the visitor is allowed to read. Locked pages arrive with empty contentBlocks,
// and recap/spec extras are gated too (no premium data in the client bundle).
export default async function Section6Page() {
    const config = SECTION_REGISTRY.find(s => s.id === 'section-6')!
    const { hasAccess, isAuthed } = await getServerAccess()
    const data = gateSectionPages(unit6Data, config, hasAccess)
    const extras = getSectionExtras(config, hasAccess)
    return <SectionPage config={config} data={data} initialHasAccess={hasAccess} initialAuthed={isAuthed} extras={extras} />
}
