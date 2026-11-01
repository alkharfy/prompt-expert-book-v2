'use client'

import { useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { DELETE_CONFIRM_WORD } from '@/lib/account-delete'

/** «احذف حسابي» on /profile (owner 2026-11-01): deleted at once, after the reader types the confirm word. */
export default function DeleteAccount() {
    const [open, setOpen] = useState(false)
    const [word, setWord] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const confirmed = word.trim() === DELETE_CONFIRM_WORD

    const deleteAccount = async () => {
        if (!confirmed || busy) return
        setBusy(true)
        setError('')
        try {
            const res = await fetch('/api/user/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: word.trim() }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data.ok) {
                setError(data.error || 'حصلت مشكلة. جرّب تاني.')
                setBusy(false)
                return
            }
            await authSystem.logout()
            try { localStorage.clear() } catch { /* storage blocked */ }
            window.location.href = '/'
        } catch {
            setError('مفيش اتصال. جرّب تاني.')
            setBusy(false)
        }
    }

    return (
        <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: '#ff6b6b', fontSize: '18px', marginBottom: '4px' }}>🗑️ حذف الحساب</h3>
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    style={{ minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(255,107,107,0.4)', background: 'transparent', color: '#ff8a8a', font: 'inherit', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
                >
                    احذف حسابي
                </button>
            ) : (
                <div style={{ marginTop: '10px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,107,107,0.35)', background: 'rgba(255,107,107,0.06)' }}>
                    <p style={{ color: '#ddd', fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px' }}>
                        لو حذفت حسابك، تقدّمك وملاحظاتك وشهاداتك ومحادثاتك مع المستر هتتمسح، ومش هتقدر تدخل بيه تاني.
                        ولو مشترك، اشتراكك هيقف ومفيش استرجاع تلقائي للفلوس. لو عايز تسترد فلوسك، كلّمنا الأول قبل ما تحذف.
                    </p>
                    <label htmlFor="delete-confirm" style={{ color: '#bbb', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                        اكتب «{DELETE_CONFIRM_WORD}» عشان تأكد:
                    </label>
                    <input
                        id="delete-confirm"
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        autoComplete="off"
                        style={{ width: '100%', minHeight: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#141414', color: '#eee', font: 'inherit', marginBottom: '12px' }}
                    />
                    {error && <p role="alert" style={{ color: '#ff8a8a', fontSize: '13px', margin: '0 0 10px' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={deleteAccount}
                            disabled={!confirmed || busy}
                            style={{ minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: 'none', background: confirmed ? '#d64545' : '#4a2a2a', color: '#fff', font: 'inherit', fontWeight: 700, cursor: confirmed && !busy ? 'pointer' : 'not-allowed' }}
                        >
                            {busy ? 'بنحذف...' : 'احذف الحساب نهائياً'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setOpen(false); setWord(''); setError('') }}
                            disabled={busy}
                            style={{ minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#ccc', font: 'inherit', cursor: 'pointer' }}
                        >
                            رجوع
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
