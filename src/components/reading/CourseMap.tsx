import type { PageContent } from '@/types/book'
import { estimateReadingTime } from '@/utils/readingTime'

type StationId = 'intro' | 'level-1' | 'level-2' | 'level-3' | 'book'

/**
 * «إنت هنا»: where the reader is in the course, how much is left of this stop and
 * what comes next. Levels 4–5 are still being written, so chapters 4–10 of the
 * current book stand in for them as one honest stop.
 */
const STATIONS: { id: StationId; label: string; note: string }[] = [
    { id: 'intro', label: 'التمهيد', note: 'مجاني' },
    { id: 'level-1', label: 'المستوى 1', note: 'بتستخدمه صح' },
    { id: 'level-2', label: 'المستوى 2', note: 'بتطلب زي المحترف' },
    { id: 'level-3', label: 'المستوى 3', note: 'بتجهّزه لشغلك' },
    { id: 'book', label: 'المستويات 4–5', note: 'بتنزل تباعاً' },
]

/** The chapter number the server marks complete for each stop (reading_progress.completed_chapters). */
const STATION_CHAPTER: Record<StationId, number | null> = { intro: 0, 'level-1': 1, 'level-2': 2, 'level-3': 3, book: null }

export function stationFor(sectionId: string): StationId {
    if (sectionId === 'intro') return 'intro'
    if (sectionId === 'section-1') return 'level-1'
    if (sectionId === 'section-2') return 'level-2'
    if (sectionId === 'section-3') return 'level-3'
    return 'book'
}

/**
 * ✓ only for a stop the reader actually finished. A stop behind the reader that they
 * skipped (a subscriber can open Level 2 first) stays a plain number.
 */
export function stationState(index: number, currentIndex: number, completedChapters: number[]): 'here' | 'done' | 'skipped' | 'ahead' {
    if (index === currentIndex) return 'here'
    if (index > currentIndex) return 'ahead'
    // The free 3-page intro is never recorded as a finished chapter, so being past it counts.
    if (STATIONS[index].id === 'intro') return 'done'
    const chapter = STATION_CHAPTER[STATIONS[index].id]
    return chapter !== null && completedChapters.includes(chapter) ? 'done' : 'skipped'
}

export function formatMinutes(minutes: number): string {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const rest = Math.round((minutes % 60) / 5) * 5
        const hoursText = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : `${hours} ساعات`
        return rest ? `${hoursText} و${rest} دقيقة` : hoursText
    }
    return `${minutes} ${minutes >= 3 && minutes <= 10 ? 'دقايق' : 'دقيقة'}`
}

/** Minutes left in this stop, counting the current page. */
export function minutesLeft(pages: PageContent[], pageNum: number): number {
    return pages.filter(page => page.pageNumber >= pageNum).reduce((total, page) => total + estimateReadingTime(page), 0)
}

interface CourseMapProps {
    sectionId: string
    chapterLabel: string
    pageNum: number
    pageCount: number
    pages: PageContent[]
    /** From /api/reading-progress; null for guests and while loading (then no ✓ and no «لسه»). */
    completedChapters?: number[] | null
}

export default function CourseMap({ sectionId, chapterLabel, pageNum, pageCount, pages, completedChapters = null }: CourseMapProps) {
    const known = Array.isArray(completedChapters)
    const current = stationFor(sectionId)
    const currentIndex = STATIONS.findIndex(station => station.id === current)
    const next = STATIONS[currentIndex + 1]
    const progress = Math.min(1, pageNum / pageCount)
    // Locked chapters arrive without their content, so only the intro and the levels get a time estimate.
    const left = current === 'book' ? null : minutesLeft(pages, pageNum)
    const where = current === 'book' ? `${chapterLabel} من الكتاب` : STATIONS[currentIndex].label

    return (
        <nav aria-label="مكانك في الكورس" style={{ maxWidth: '520px', margin: '0 auto 28px', padding: '14px 16px 12px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'flex-start' }}>
                {STATIONS.map((station, index) => {
                    const state = stationState(index, currentIndex, completedChapters ?? [])
                    const done = state === 'done'
                    const here = state === 'here'
                    return (
                        <li key={station.id} aria-current={here ? 'step' : undefined} style={{ flex: 1, minWidth: 0, padding: '0 4px', position: 'relative', textAlign: 'center' }}>
                            {index < STATIONS.length - 1 && (
                                <span aria-hidden="true" style={{ position: 'absolute', top: '15px', insetInlineStart: '50%', width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                    <span style={{ display: 'block', height: '100%', width: index < currentIndex ? '100%' : here ? `${progress * 100}%` : '0%', background: '#FF6B35' }} />
                                </span>
                            )}
                            <span aria-hidden="true" style={{
                                position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.9rem', fontWeight: 700,
                                background: here ? '#1a1a1a' : done ? '#FF6B35' : '#222',
                                border: `2px solid ${here || done ? '#FF6B35' : state === 'skipped' ? 'rgba(255,107,53,0.45)' : 'rgba(255,255,255,0.15)'}`,
                                color: done ? '#fff' : state === 'skipped' ? '#ccc' : '#888',
                                overflow: 'hidden',
                            }}>
                                {here ? <img src="/assets/robot-marker.png" alt="" width={26} height={26} style={{ transform: 'scaleX(-1)' }} /> : done ? '✓' : index + 1}
                            </span>
                            <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', lineHeight: 1.35, fontWeight: 700, color: here ? '#FF6B35' : done || state === 'skipped' ? '#ddd' : '#888' }}>
                                {station.label}
                            </span>
                            <span style={{ display: 'block', marginTop: '3px', fontSize: '0.78rem', lineHeight: 1.35, color: '#999' }}>{state === 'skipped' && known ? 'لسه مخلّصتوش' : station.note}</span>
                        </li>
                    )
                })}
            </ol>
            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: '#bbb', textAlign: 'center', lineHeight: 1.7 }}>
                <strong style={{ color: '#fff' }}>إنت هنا:</strong> {where} · صفحة {pageNum} من {pageCount}
                {left !== null && <> · فاضل حوالي {formatMinutes(left)}</>}
                {next && <> · بعده: {next.label}</>}
            </p>
        </nav>
    )
}
