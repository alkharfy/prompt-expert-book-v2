import 'server-only'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { PageContent } from '@/data/bookData'
import type { SectionConfig } from '@/config/sections'
import { getRecapForSection } from '@/data/recapsData'
import { hasSpecContent } from '@/data/specializationContent'
import { userHasFeature } from '@/lib/subscription'

/**
 * Server-side entitlement resolver — the single source of truth for "can this
 * request read paid content?". Mirrors the hasPaid logic in
 * /api/auth/verify-session but read-only (no cookie renewal) so it can run
 * inside Server Components. FAIL-CLOSED: any error → no access.
 *
 * Paid access requires the canonical reading feature of an active subscription
 * with a valid future expiry. A historical payment or account flag is insufficient.
 */
export async function getServerAccess(): Promise<{
  userId: string | null
  isAuthed: boolean
  hasAccess: boolean
}> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('ebook_session_token')?.value
    const userId = cookieStore.get('ebook_user_id')?.value
    const deviceId = cookieStore.get('ebook_device_id')?.value

    if (!sessionToken || !userId) {
      return { userId: null, isAuthed: false, hasAccess: false }
    }

    const supabase = getSupabaseAdmin()

    // Validate the session row (device-scoped first, then token+user fallback)
    let session: { id: string; expires_at: string } | null = null
    if (deviceId) {
      const { data } = await (supabase.from('sessions') as any)
        .select('id, expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single()
      session = data
    }
    if (!session) {
      const { data } = await (supabase.from('sessions') as any)
        .select('id, expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', userId)
        .single()
      session = data
    }
    if (!session) return { userId: null, isAuthed: false, hasAccess: false }
    if (!(Date.parse(session.expires_at) > Date.now())) {
      return { userId: null, isAuthed: false, hasAccess: false }
    }

    const hasAccess = await userHasFeature(userId, 'reading')

    return { userId, isAuthed: true, hasAccess }
  } catch {
    // FAIL-CLOSED — never grant access on error.
    return { userId: null, isAuthed: false, hasAccess: false }
  }
}

/**
 * Strips premium content out of a unit's pages for unentitled requests so the
 * locked text NEVER reaches the browser (no RSC payload, no JS bundle). Page
 * shells (id, title, description, pageNumber) are kept so pagination, nav and
 * the LockedOverlay still work; only `contentBlocks` are emptied for locked
 * pages. Entitled users get the full data untouched.
 *
 * A page is free when the section is the intro, or its 1-based index is within
 * the section's freePageLimit.
 */
export function gateSectionPages(
  pages: PageContent[],
  config: SectionConfig,
  hasAccess: boolean
): PageContent[] {
  if (hasAccess) return pages
  const isIntro = config.id === 'intro'
  const freeLimit = config.freePageLimit
  return pages.map((page, i) => {
    const pageNum = i + 1
    const isFree = isIntro || (freeLimit > 0 && pageNum <= freeLimit)
    if (isFree) return page
    return { ...page, contentBlocks: [] }
  })
}

/**
 * Server-computed "extras" (chapter recaps + spec availability) passed into the
 * client SectionPage as props, so the recap and specialization data modules are
 * never bundled into the client. Recaps are returned only for free chapters
 * (intro / section-1) or for entitled users — paid chapters' recaps stay server-side.
 */
export function getSectionExtras(config: SectionConfig, hasAccess: boolean): {
  recap: ReturnType<typeof getRecapForSection> | null
  prevRecap: ReturnType<typeof getRecapForSection> | null
  hasSpec: boolean
} {
  const currentIsFree = config.id === 'intro' || config.freePageLimit > 0
  const recap = hasAccess || currentIsFree ? (getRecapForSection(config.id) ?? null) : null

  let prevRecap: ReturnType<typeof getRecapForSection> | null = null
  if (config.sectionNumber > 1) {
    const prevId = `section-${config.sectionNumber - 1}`
    // section-1 is the only free chapter; its recap may show to everyone.
    const prevIsFree = prevId === 'section-1'
    if (hasAccess || prevIsFree) {
      prevRecap = getRecapForSection(prevId) ?? null
    }
  }

  return { recap, prevRecap, hasSpec: hasSpecContent(config.id) }
}
