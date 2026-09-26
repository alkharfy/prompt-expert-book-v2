import { NextResponse } from 'next/server'
import { buildSearchIndex } from '@/utils/searchIndex'
import { getServerAccess } from '@/lib/server/access'
import { SECTION_REGISTRY } from '@/config/sections'

/**
 * Server-side search index. The full book text is built and searched on the
 * server; the client only receives searchable `body` for pages it is entitled
 * to read. Locked pages keep title/description (teasers) but ship NO body, so
 * the premium content never reaches the browser via the search feature.
 *
 * (Replaces the old client-side `buildSearchIndex()` import that bundled the
 * entire book into a client chunk.)
 */
export async function GET() {
  try {
    const { hasAccess } = await getServerAccess()
    const items = await buildSearchIndex()

    if (hasAccess) {
      return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } })
    }

    const gated = items.map((it) => {
      const [sectionId, pageStr] = it.id.split('/')
      const pageNum = parseInt(pageStr, 10) || 0
      const cfg = SECTION_REGISTRY.find((s) => s.id === sectionId)
      const isFree = sectionId === 'intro' || (!!cfg && cfg.freePageLimit > 0 && pageNum <= cfg.freePageLimit)
      // Free pages keep their body; everything else (locked chapters, library,
      // glossary, appendix) is searchable by title/description only.
      return isFree ? it : { ...it, body: '' }
    })

    return NextResponse.json({ items: gated }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
