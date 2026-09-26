'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

/**
 * Error Boundary Component
 * يلتقط الأخطاء في المكونات الفرعية ويعرض واجهة بديلة
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // يمكن إرسال الخطأ لخدمة مراقبة (مثل Sentry)
        console.error('Error Boundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '2rem',
                }}>
                    <div style={{
                        textAlign: 'center',
                        background: '#1a1a1a',
                        padding: '3rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 107, 53, 0.2)',
                        maxWidth: '500px',
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{
                            color: '#FF6B35',
                            marginBottom: '1rem',
                            fontSize: '1.5rem',
                        }}>عذراً، حدث خطأ غير متوقع</h2>
                        <p style={{
                            color: '#b0b0b0',
                            marginBottom: '1.5rem',
                        }}>نعتذر عن هذا الإزعاج. يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#FF6B35',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            تحديث الصفحة
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
