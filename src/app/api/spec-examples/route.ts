import { NextRequest, NextResponse } from 'next/server'
import { getSpecExamples, getSpecExercise } from '@/data/specializationContent'
import { getServerAccess } from '@/lib/server/access'

/**
 * Entitlement-gated specialization examples. The example prompts + expected
 * outputs are paid content; only subscribers receive them. Unentitled requests
 * get an empty payload. (Replaces the client-side specializationContent import
 * that bundled all track examples into the browser.)
 */
export async function GET(req: NextRequest) {
  try {
    const { hasAccess } = await getServerAccess()
    if (!hasAccess) {
      return NextResponse.json({ examples: [], exercise: null })
    }

    const specId = req.nextUrl.searchParams.get('spec') || ''
    const sectionId = req.nextUrl.searchParams.get('section') || ''
    const safe = (s: string) => /^[a-z0-9_-]+$/i.test(s)
    if (!safe(specId) || !safe(sectionId)) {
      return NextResponse.json({ examples: [], exercise: null })
    }

    // specId is regex-validated above; cast to the branded id type.
    const safeSpecId = specId as Parameters<typeof getSpecExamples>[0]
    const examples = getSpecExamples(safeSpecId, sectionId)
    const exercise = getSpecExercise(safeSpecId, sectionId) ?? null
    return NextResponse.json(
      { examples, exercise },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch {
    return NextResponse.json({ examples: [], exercise: null })
  }
}
