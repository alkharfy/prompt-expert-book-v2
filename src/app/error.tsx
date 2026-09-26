'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            direction: 'rtl',
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                حدث خطأ غير متوقع
            </h2>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
            </p>
            <button
                onClick={() => reset()}
                style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#FF6B35',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                }}
            >
                إعادة المحاولة
            </button>
        </div>
    )
}
