'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getAuthCookies } from '@/lib/cookie_utils'
import ChatButton from './ChatButton'
import ChatMessage from './ChatMessage'

// ===== Types =====

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    model?: string
}

// ===== Constants =====

const MODEL_OPTIONS = [
    { value: 'llama-3.3-70b', label: 'Llama 3.3 70B (Free)' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini' },
] as const

const STORAGE_KEY = 'book-chat-messages'
const RATED_KEY = 'book-chat-rated'
const SESSION_KEY = 'book-chat-session-id'
const MAX_MESSAGE_LENGTH = 2000

const SUGGESTED_QUESTIONS = [
    'ما هو إطار GOLDS؟',
    'كيف أكتب برومبت فعال؟',
    'ما الفرق بين Zero-shot و Few-shot؟',
    'ما هي تقنية Chain of Thought؟',
]

// ===== Helpers =====

let messageCounter = 0
function generateId(): string {
    return `msg-${Date.now()}-${++messageCounter}`
}

function generateSessionId(): string {
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('')
    return `session-${Date.now()}-${randomPart}`
}

function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return generateSessionId()
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const newId = generateSessionId()
    localStorage.setItem(SESSION_KEY, newId)
    return newId
}

function loadMessages(): Message[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return []
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
    } catch {
        // Corrupted data
    }
    return []
}

function saveMessages(messages: Message[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
        // Storage full or unavailable
    }
}

function getModelLabel(value: string): string {
    return MODEL_OPTIONS.find(o => o.value === value)?.label || value
}

// ===== Component =====

export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [model, setModel] = useState<string>('llama-3.3-70b')
    const [remaining, setRemaining] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string>('')
    const [ratedMessages, setRatedMessages] = useState<Set<string>>(new Set())

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const pendingRetryRef = useRef<string | null>(null)
    const sendingRef = useRef(false)

    // Load messages, sessionId, and rated messages from localStorage on mount
    useEffect(() => {
        setMessages(loadMessages())
        setSessionId(getOrCreateSessionId())
        // Restore rated messages
        try {
            const stored = localStorage.getItem(RATED_KEY)
            if (stored) {
                const arr = JSON.parse(stored)
                if (Array.isArray(arr)) setRatedMessages(new Set(arr))
            }
        } catch { /* corrupted data */ }
    }, [])

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            saveMessages(messages)
        }
    }, [messages])

    // Check auth status
    useEffect(() => {
        const { userId } = getAuthCookies()
        setIsLoggedIn(!!userId)
    }, [isOpen])

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && isLoggedIn && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen, isLoggedIn])

    // Keyboard shortcut: Ctrl+Shift+K to toggle chat
    useEffect(() => {
        function handleGlobalKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [])

    // Abort ongoing request when closing
    useEffect(() => {
        if (!isOpen && abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setIsLoading(false)
        }
    }, [isOpen])

    const handleSend = async (messageText?: string) => {
        const trimmed = (messageText || input).trim()
        if (!trimmed || isLoading || sendingRef.current) return

        sendingRef.current = true
        setError(null)
        const userMessage: Message = { id: generateId(), role: 'user', content: trimmed }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // Create AbortController for this request
        const controller = new AbortController()
        abortControllerRef.current = controller

        // Build history (last 10 messages for context)
        const history = messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
        }))

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmed,
                    model,
                    history,
                    sessionId,
                }),
                signal: controller.signal,
            })

            // Update remaining from headers
            const remainingHeader = res.headers.get('X-RateLimit-Remaining')
            if (remainingHeader !== null) {
                setRemaining(parseInt(remainingHeader, 10))
            }

            if (!res.ok) {
                let errorMsg = '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639'
                try {
                    const data = await res.json()
                    errorMsg = data.error || errorMsg
                } catch {
                    // Response is not JSON (e.g. HTML from a proxy 502)
                }
                setError(errorMsg)
                setIsLoading(false)
                return
            }

            // Stream the response
            const reader = res.body?.getReader()
            if (!reader) {
                setError('\u0644\u0627 \u064a\u0645\u0643\u0646 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0631\u062f')
                setIsLoading(false)
                return
            }

            const decoder = new TextDecoder()
            let assistantContent = ''
            const assistantId = generateId()

            // Add empty assistant message that we'll stream into
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', model }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                assistantContent += chunk

                // Update the last message with accumulated content
                setMessages(prev => {
                    const updated = [...prev]
                    const lastIdx = updated.length - 1
                    if (updated[lastIdx]?.id === assistantId) {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: assistantContent,
                        }
                    }
                    return updated
                })
            }

            // Flush any remaining bytes in the decoder (important for multi-byte Arabic chars)
            const remaining = decoder.decode()
            if (remaining) {
                assistantContent += remaining
                setMessages(prev => {
                    const updated = [...prev]
                    const lastIdx = updated.length - 1
                    if (updated[lastIdx]?.id === assistantId) {
                        updated[lastIdx] = { ...updated[lastIdx], content: assistantContent }
                    }
                    return updated
                })
            }

            if (!assistantContent.trim()) {
                setError('\u0644\u0645 \u064a\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0631\u062f \u0645\u0646 \u0627\u0644\u0646\u0645\u0648\u0630\u062c')
                // Remove the empty assistant message
                setMessages(prev => prev.filter(m => m.id !== assistantId))
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                // Request was cancelled by user - not an error
                return
            }
            setError('\u062d\u062f\u062b \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644. \u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u062a\u0635\u0627\u0644\u0643 \u0628\u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a.')
        } finally {
            abortControllerRef.current = null
            sendingRef.current = false
            setIsLoading(false)
        }
    }

    // Handle pending retry after state update (avoids stale closure in handleRetryLast)
     
    useEffect(() => {
        if (pendingRetryRef.current && !isLoading) {
            const msg = pendingRetryRef.current
            pendingRetryRef.current = null
            handleSend(msg)
        }
    })

    const handleRetryLast = useCallback(() => {
        // Find the last user message and retry
        const lastUserIdx = messages.findLastIndex(m => m.role === 'user')
        if (lastUserIdx === -1) return

        const lastUserMessage = messages[lastUserIdx].content
        // Remove the assistant response AND the user message
        // (handleSend will re-add the user message with correct history)
        setMessages(prev => prev.slice(0, lastUserIdx))
        // Set pending retry - useEffect will call handleSend after re-render
        pendingRetryRef.current = lastUserMessage
    }, [messages])

    const handleClearChat = useCallback(() => {
        if (isLoading && abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setIsLoading(false)
        }
        setMessages([])
        setError(null)
        setRatedMessages(new Set())
        localStorage.removeItem(STORAGE_KEY)
        // Generate new session ID for next conversation
        const newSessionId = generateSessionId()
        setSessionId(newSessionId)
        localStorage.setItem(SESSION_KEY, newSessionId)
    }, [isLoading])

    const handleExport = useCallback(() => {
        if (messages.length === 0) return

        const modelLabel = getModelLabel(model)
        const date = new Date().toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        let text = `\u0645\u062d\u0627\u062f\u062b\u0629 \u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628 - \u062e\u0628\u064a\u0631 \u0627\u0644\u0628\u0631\u0648\u0645\u0628\u062a\u0627\u062a\n`
        text += `\u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${date}\n`
        text += `\u0627\u0644\u0646\u0645\u0648\u0630\u062c: ${modelLabel}\n`
        text += `================================\n\n`

        for (const msg of messages) {
            if (msg.role === 'user') {
                text += `[\u0623\u0646\u062a]: ${msg.content}\n\n`
            } else {
                text += `[\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628]: ${msg.content}\n\n`
            }
            text += `================================\n\n`
        }

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [messages, model])

    const handleRate = useCallback(async (messageId: string, rating: 1 | -1) => {
        // Find the message and its preceding user query
        const msgIdx = messages.findIndex(m => m.id === messageId)
        if (msgIdx === -1) return

        const assistantMessage = messages[msgIdx]
        // Find the user message before this assistant message
        let queryContent = ''
        for (let i = msgIdx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                queryContent = messages[i].content
                break
            }
        }

        // Skip rating if no user query found (corrupted state)
        if (!queryContent) return

        // Mark as rated immediately (optimistic)
        setRatedMessages(prev => {
            const next = new Set(prev).add(messageId)
            // Persist rated messages to localStorage
            try {
                localStorage.setItem(RATED_KEY, JSON.stringify([...next]))
            } catch { /* storage full */ }
            return next
        })

        try {
            await fetch('/api/chat/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageContent: assistantMessage.content,
                    queryContent,
                    model: assistantMessage.model || model,
                    rating,
                }),
            })
        } catch {
            // Silently fail - rating is a nice-to-have
        }
    }, [messages, model])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSuggestionClick = (question: string) => {
        handleSend(question)
    }

    const handleStopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setIsLoading(false)
        }
    }, [])

    return (
        <>
            <ChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chat-window"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628"
                    >
                        {/* Header */}
                        <div className="chat-window__header">
                            <div className="chat-window__title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <circle cx="12" cy="5" r="2" />
                                    <path d="M12 7v4" />
                                    <line x1="8" y1="16" x2="8" y2="16" />
                                    <line x1="16" y1="16" x2="16" y2="16" />
                                </svg>
                                <span>{'\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628'}</span>
                            </div>
                            <div className="chat-window__controls">
                                {isLoggedIn && messages.length > 0 && (
                                    <>
                                        <button
                                            className="chat-window__export-btn"
                                            onClick={handleExport}
                                            aria-label="\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629"
                                            title="\u062a\u0635\u062f\u064a\u0631 \u0643\u0645\u0644\u0641 \u0646\u0635\u064a"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        </button>
                                        <button
                                            className="chat-window__clear-btn"
                                            onClick={handleClearChat}
                                            aria-label="\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629"
                                            title="\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                {isLoggedIn && (
                                    <select
                                        className="chat-window__model-select"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        aria-label="\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0646\u0645\u0648\u0630\u062c"
                                    >
                                        {MODEL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    className="chat-window__close-btn"
                                    onClick={() => setIsOpen(false)}
                                    aria-label="\u0625\u063a\u0644\u0627\u0642"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Rate limit info */}
                        {isLoggedIn && remaining !== null && (
                            <div className="chat-window__rate-info">
                                {'\u0631\u0633\u0627\u0626\u0644 \u0645\u062a\u0628\u0642\u064a\u0629: '}{remaining}/30
                            </div>
                        )}

                        {/* Auth Gate or Messages */}
                        {!isLoggedIn ? (
                            <div className="chat-window__auth-gate">
                                <div className="chat-window__auth-gate-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <h3>{'\u0633\u062c\u0644 \u062f\u062e\u0648\u0644\u0643 \u0623\u0648\u0644\u0627\u064b'}</h3>
                                <p>{'\u064a\u062c\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628 \u0627\u0644\u0630\u0643\u064a.'}</p>
                                <Link href="/login" className="chat-window__auth-gate-btn">
                                    {'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644'}
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="chat-window__messages" aria-live="polite" aria-relevant="additions">
                                    {messages.length === 0 && (
                                        <div className="chat-window__welcome">
                                            <div className="chat-window__welcome-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </div>
                                            <h3>{'\u0645\u0631\u062d\u0628\u0627\u064b! \u0623\u0646\u0627 \u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628'}</h3>
                                            <p>{'\u0627\u0633\u0623\u0644\u0646\u064a \u0623\u064a \u0633\u0624\u0627\u0644 \u0639\u0646 \u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0643\u062a\u0627\u0628 \u0648\u0633\u0623\u062c\u064a\u0628\u0643 \u0645\u0646 \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.'}</p>

                                            {/* Suggested questions */}
                                            <div className="chat-window__suggestions">
                                                {SUGGESTED_QUESTIONS.map((q) => (
                                                    <button
                                                        key={q}
                                                        className="chat-window__suggestion-btn"
                                                        onClick={() => handleSuggestionClick(q)}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <ChatMessage
                                            key={msg.id}
                                            role={msg.role}
                                            content={msg.content}
                                            isStreaming={
                                                isLoading &&
                                                idx === messages.length - 1 &&
                                                msg.role === 'assistant'
                                            }
                                            onRetry={
                                                !isLoading &&
                                                msg.role === 'assistant' &&
                                                idx === messages.length - 1
                                                    ? handleRetryLast
                                                    : undefined
                                            }
                                            onRate={
                                                !isLoading &&
                                                msg.role === 'assistant' &&
                                                msg.content &&
                                                !ratedMessages.has(msg.id)
                                                    ? (rating) => handleRate(msg.id, rating)
                                                    : undefined
                                            }
                                            isRated={ratedMessages.has(msg.id)}
                                        />
                                    ))}

                                    {/* Loading indicator when waiting for first token */}
                                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                        <div className="chat-message chat-message--assistant">
                                            <div className="chat-message__avatar" aria-hidden="true">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                                    <circle cx="12" cy="5" r="2" />
                                                    <path d="M12 7v4" />
                                                    <line x1="8" y1="16" x2="8" y2="16" />
                                                    <line x1="16" y1="16" x2="16" y2="16" />
                                                </svg>
                                            </div>
                                            <div className="chat-message__bubble">
                                                <div className="chat-window__loading" role="status" aria-label="\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644">
                                                    <span className="chat-window__loading-dot" />
                                                    <span className="chat-window__loading-dot" />
                                                    <span className="chat-window__loading-dot" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="chat-window__error" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* Input */}
                                <div className="chat-window__input-area">
                                    <div className="chat-window__input-wrapper">
                                        <input
                                            ref={inputRef}
                                            className="chat-window__input"
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={'\u0627\u0643\u062a\u0628 \u0633\u0624\u0627\u0644\u0643 \u0647\u0646\u0627...'}
                                            disabled={isLoading}
                                            maxLength={MAX_MESSAGE_LENGTH}
                                            aria-label={'\u0627\u0643\u062a\u0628 \u0633\u0624\u0627\u0644\u0643'}
                                            autoComplete="off"
                                        />
                                        {input.length > 0 && (
                                            <span className="chat-window__char-count" aria-hidden="true">
                                                {input.length}/{MAX_MESSAGE_LENGTH}
                                            </span>
                                        )}
                                    </div>
                                    {isLoading ? (
                                        <button
                                            className="chat-window__stop-btn"
                                            onClick={handleStopStreaming}
                                            aria-label="\u0625\u064a\u0642\u0627\u0641"
                                            title="\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u062a\u0648\u0644\u064a\u062f"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="6" width="12" height="12" rx="2" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            className="chat-window__send-btn"
                                            onClick={() => handleSend()}
                                            disabled={!input.trim()}
                                            aria-label={'\u0625\u0631\u0633\u0627\u0644'}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13" />
                                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
