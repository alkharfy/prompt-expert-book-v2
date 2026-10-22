import type { ReaderTrack } from '@/lib/personalizeBlocks'

const OPTIONS: { id: ReaderTrack; label: string }[] = [
    { id: 'accounting', label: '🧾 أحمد · محاسب' },
    { id: 'service', label: '💬 منى · خدمة عملاء' },
]

/** On pages written twice (Ahmed's and Mona's version): the reader picks whose example the lesson follows. */
export default function TrackSwitch({ track, onChange }: { track: ReaderTrack; onChange: (track: ReaderTrack) => void }) {
    return (
        <div role="group" aria-label="أمثلة الدرس على مين" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto 24px', maxWidth: '520px' }}>
            <span style={{ color: '#bbb', fontSize: '0.9rem' }}>أمثلة الدرس على:</span>
            {OPTIONS.map(option => {
                const on = option.id === track
                return (
                    <button
                        key={option.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(option.id)}
                        style={{
                            minHeight: '40px', padding: '0 14px', borderRadius: '999px', cursor: 'pointer', font: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                            color: on ? '#fff' : '#bbb',
                            background: on ? 'rgba(255,107,53,0.2)' : 'transparent',
                            border: `1px solid ${on ? '#FF6B35' : 'rgba(255,255,255,0.2)'}`,
                        }}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
