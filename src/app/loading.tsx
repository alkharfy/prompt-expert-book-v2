export default function GlobalLoading() {
    return (
        // A full screen, so the footer doesn't flash in the middle and then jump away when the page arrives
        <div role="status" aria-label="بنحمّل الصفحة" style={{
            minHeight: 'calc(100vh - var(--header-h, 0px))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #333',
                borderTop: '3px solid #FF6B35',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
