export default function GlobalLoading() {
    return (
        <div style={{
            minHeight: '60vh',
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
