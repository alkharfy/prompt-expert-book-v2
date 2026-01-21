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
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">⚠️</div>
                        <h2>عذراً، حدث خطأ غير متوقع</h2>
                        <p>نعتذر عن هذا الإزعاج. يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="error-reload-btn"
                        >
                            تحديث الصفحة
                        </button>
                    </div>
                    <style jsx>{`
                        .error-boundary {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 400px;
                            padding: 2rem;
                        }
                        .error-boundary-content {
                            text-align: center;
                            background: var(--color-bg-card, #1a1a1a);
                            padding: 3rem;
                            border-radius: 16px;
                            border: 1px solid rgba(255, 107, 53, 0.2);
                            max-width: 500px;
                        }
                        .error-icon {
                            font-size: 4rem;
                            margin-bottom: 1rem;
                        }
                        h2 {
                            color: var(--color-orange-primary, #FF6B35);
                            margin-bottom: 1rem;
                            font-size: 1.5rem;
                        }
                        p {
                            color: var(--color-text-secondary, #b0b0b0);
                            margin-bottom: 1.5rem;
                        }
                        .error-reload-btn {
                            background: var(--color-orange-primary, #FF6B35);
                            color: white;
                            border: none;
                            padding: 0.75rem 2rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 1rem;
                            transition: all 0.3s ease;
                        }
                        .error-reload-btn:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
                        }
                    `}</style>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
