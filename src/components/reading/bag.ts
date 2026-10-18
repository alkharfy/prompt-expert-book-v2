/**
 * «شنطتك» saved in the account. Bag items are rows in user_notes (no new table):
 * highlighted_text = «🎒 <label>», note_text = what the learner wrote, no offsets (so they never render as highlights).
 * They show up on /notes too, linked back to the lesson.
 */

export const BAG_MARK = '🎒 '

export interface BagItem {
    id: string
    label: string
    text: string
    section_id: string
    page_number: number
    created_at: string
}

export async function saveToBag(input: { label: string; text: string; sectionId: string; pageNumber: number }): Promise<{ ok: boolean; message: string }> {
    try {
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                section_id: input.sectionId,
                page_number: input.pageNumber,
                highlighted_text: (BAG_MARK + input.label).slice(0, 200),
                note_text: input.text.slice(0, 2000),
                highlight_color: 'purple',
            }),
        })
        if (res.status === 401) return { ok: false, message: 'سجّل دخولك الأول عشان نحفظلك.' }
        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            return { ok: false, message: json.error || 'محفظناش. جرّب تاني.' }
        }
        return { ok: true, message: '🎒 اتحفظ في شنطتك. هتلاقيه في آخر المستوى، وفي «ملاحظاتي».' }
    } catch {
        return { ok: false, message: 'النت فصل؟ جرّب تاني.' }
    }
}

export async function loadBag(sectionId: string): Promise<BagItem[] | null> {
    try {
        const res = await fetch(`/api/notes?section_id=${encodeURIComponent(sectionId)}`, { credentials: 'include' })
        if (!res.ok) return null
        const json = await res.json()
        return (json.data || [])
            .filter((n: { highlighted_text?: string | null; note_text?: string | null }) => n.highlighted_text?.startsWith(BAG_MARK) && n.note_text)
            .map((n: { id: string; highlighted_text: string; note_text: string; section_id: string; page_number: number; created_at: string }) => ({
                id: n.id,
                label: n.highlighted_text.slice(BAG_MARK.length),
                text: n.note_text,
                section_id: n.section_id,
                page_number: n.page_number,
                created_at: n.created_at,
            }))
            .sort((a: BagItem, b: BagItem) => a.page_number - b.page_number || a.created_at.localeCompare(b.created_at))
    } catch {
        return null
    }
}
