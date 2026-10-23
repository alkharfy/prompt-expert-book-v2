import SectionPage from '@/components/reading/SectionPage'
import type { PageContent } from '@/data/bookData'
import { SECTION_REGISTRY } from '@/config/sections'
import { getServerAccess, gateSectionPages, getSectionExtras } from '@/lib/server/access'

// Server Component: resolves entitlement server-side and ships only the pages
// the visitor is allowed to read. Locked pages arrive with empty contentBlocks,
// and recap/spec extras are gated too (no premium data in the client bundle).
// Each /read/<section>/[page] route passes its own data import, so a section's
// content is only loaded by its own route.
export default async function GatedSectionPage({ sectionId, pages }: { sectionId: string; pages: PageContent[] }) {
    const config = SECTION_REGISTRY.find(s => s.id === sectionId)!
    const { hasAccess, isAuthed } = await getServerAccess()
    const data = gateSectionPages(pages, config, hasAccess)
    const extras = getSectionExtras(config, hasAccess)
    return <SectionPage config={config} data={data} initialHasAccess={hasAccess} initialAuthed={isAuthed} extras={extras} />
}
