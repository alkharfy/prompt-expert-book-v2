'use client'

/**
 * Funnel Admin — «الناس بتقف فين؟»
 * من التسجيل لحد الدفع، ومكان آخر صفحة لكل حد وقف عن القراية. أرقام بس، من غير أي بيانات شخصية.
 *
 * @module app/billing/admin/funnel/page
 */

import { useCallback, useEffect, useState } from 'react'
import type { FunnelReport } from '@/lib/funnel'
import { STALE_DAYS } from '@/lib/funnel'

const API = '/api/admin/funnel'
const RANGES: { value: string; label: string }[] = [
    { value: '7', label: 'آخر 7 أيام' },
    { value: '30', label: 'آخر 30 يوم' },
    { value: '90', label: 'آخر 90 يوم' },
    { value: 'all', label: 'من الأول' },
]

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

export default function FunnelAdmin() {
    const [range, setRange] = useState('30')
    const [report, setReport] = useState<FunnelReport | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    const load = useCallback(async (days: string) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API}?days=${days}`, { credentials: 'include' })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'حصل خطأ')
            setReport(json)
        } catch (e) {
            setReport(null)
            setError(e instanceof Error ? e.message : 'حصل خطأ')
        }
        setLoading(false)
    }, [])

    useEffect(() => { load(range) }, [load, range])

    const total = report?.steps[0]?.count || 0

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', color: '#eee' }} dir="rtl">
            <h1 style={{ fontSize: '1.6rem', margin: '0 0 6px' }}>📉 الناس بتقف فين؟</h1>
            <p style={{ color: '#aaa', margin: '0 0 18px', lineHeight: 1.8 }}>
                من التسجيل لحد الدفع، للحسابات اللي اتعملت في الفترة دي. الزوار اللي ماسجّلوش مش هنا (تابعهم من Google Analytics).
            </p>

            <div role="group" aria-label="الفترة" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {RANGES.map(r => (
                    <button
                        key={r.value}
                        type="button"
                        onClick={() => setRange(r.value)}
                        aria-pressed={range === r.value}
                        style={{ minHeight: 40, padding: '0 14px', borderRadius: 10, cursor: 'pointer', font: 'inherit', color: range === r.value ? '#fff' : '#ccc', background: range === r.value ? '#FF6B35' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {loading && <p>بيحمّل…</p>}
            {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}

            {report && !loading && (
                <>
                    <section style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: '1.15rem', margin: '0 0 12px' }}>🪜 من التسجيل للدفع</h2>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {report.steps.map((step, i) => {
                                const prev = i === 0 ? step.count : report.steps[i - 1].count
                                return (
                                    <div key={step.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                                            <span>{step.label}</span>
                                            <strong>{step.count} <span style={{ color: '#999', fontWeight: 400 }}>({percent(step.count, total)}٪ من الكل{i > 0 ? ` · ${percent(step.count, prev)}٪ من اللي قبلها` : ''})</span></strong>
                                        </div>
                                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${percent(step.count, total)}%`, background: '#FF6B35' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <section style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: '1.15rem', margin: '0 0 6px' }}>🛑 وقفوا فين بالظبط؟</h2>
                        <p style={{ color: '#aaa', margin: '0 0 12px' }}>آخر صفحة لكل حد مقراش حاجة من {STALE_DAYS} أيام أو أكتر.</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {report.stoppedAt.map(row => (
                                    <tr key={row.where} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <td style={{ padding: '8px 4px' }}>{row.where}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 700 }}>{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        <div>
                            <h2 style={{ fontSize: '1.05rem', margin: '0 0 8px' }}>👔 المهن (من أسئلة البداية)</h2>
                            {report.professions.map(row => (
                                <p key={row.where} style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 6px' }}><span>{row.where}</span><strong>{row.count}</strong></p>
                            ))}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.05rem', margin: '0 0 8px' }}>💳 محاولات الدفع</h2>
                            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 6px' }}><span>نجحت</span><strong>{report.payments.success}</strong></p>
                            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 6px' }}><span>معلّقة</span><strong>{report.payments.pending}</strong></p>
                            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 6px' }}><span>فشلت</span><strong>{report.payments.failed}</strong></p>
                            {report.payments.other > 0 && <p style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}><span>غير كده</span><strong>{report.payments.other}</strong></p>}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
