'use client'

import { useState, useCallback, type AnchorHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
    role: 'user' | 'assistant'
    content: string
    isStreaming?: boolean
    onRetry?: () => void
    onRate?: (rating: 1 | -1) => void
    isRated?: boolean
}

/** Sanitize links - only allow http/https protocols */
function SafeLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    const isSafe = href && /^https?:\/\//i.test(href)
    if (!isSafe) {
        return <span>{children}</span>
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
}

const markdownComponents = {
    a: SafeLink,
}

export default function ChatMessage({ role, content, isStreaming, onRetry, onRate, isRated }: ChatMessageProps) {
    const isUser = role === 'user'
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea')
            textarea.value = content
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [content])

    return (
        <motion.div
            className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="chat-message__avatar" aria-hidden="true">
                {isUser ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                    </svg>
                )}
            </div>
            <div className="chat-message__bubble">
                <div className="chat-message__text" dir="rtl">
                    {isUser ? (
                        content
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {content}
                        </ReactMarkdown>
                    )}
                    {isStreaming && (
                        <span className="chat-message__cursor" aria-hidden="true" />
                    )}
                </div>

                {/* Action buttons for assistant messages */}
                {!isUser && content && !isStreaming && (
                    <div className="chat-message__actions">
                        <button
                            className="chat-message__action-btn"
                            onClick={handleCopy}
                            aria-label={copied ? '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e' : '\u0646\u0633\u062e \u0627\u0644\u0631\u062f'}
                            title={copied ? '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e' : '\u0646\u0633\u062e'}
                        >
                            {copied ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                        </button>
                        {onRetry && (
                            <button
                                className="chat-message__action-btn"
                                onClick={onRetry}
                                aria-label={'\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629'}
                                title={'\u0625\u0639\u0627\u062f\u0629'}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                            </button>
                        )}
                        {/* Rating buttons */}
                        {isRated ? (
                            <span className="chat-message__rated" aria-label="\u062a\u0645 \u0627\u0644\u062a\u0642\u064a\u064a\u0645">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                        ) : onRate ? (
                            <>
                                <button
                                    className="chat-message__action-btn chat-message__rate-btn"
                                    onClick={() => onRate(1)}
                                    aria-label={'\u0625\u0639\u062c\u0627\u0628'}
                                    title={'\u0625\u0639\u062c\u0627\u0628'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                    </svg>
                                </button>
                                <button
                                    className="chat-message__action-btn chat-message__rate-btn"
                                    onClick={() => onRate(-1)}
                                    aria-label={'\u0639\u062f\u0645 \u0625\u0639\u062c\u0627\u0628'}
                                    title={'\u0639\u062f\u0645 \u0625\u0639\u062c\u0627\u0628'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                    </svg>
                                </button>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
