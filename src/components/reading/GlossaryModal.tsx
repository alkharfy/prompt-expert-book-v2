'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { GlossaryTerm } from '@/data/glossaryData'

interface GlossaryModalProps {
    term: GlossaryTerm | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function GlossaryModal({ term, isOpen, onClose }: GlossaryModalProps) {
    const [activeTab, setActiveTab] = useState<'explanation' | 'examples'>('explanation');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) setActiveTab('explanation');
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!term || !isOpen) return null;

    const modalStyles: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: isMobile ? '16px' : '32px'
    };

    const backdropStyles: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
    };

    const contentStyles: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        maxWidth: '650px',
        maxHeight: isMobile ? '90vh' : '85vh',
        background: '#0a0a0a',
        border: '2px solid #FF6B35',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 30px 100px rgba(255, 107, 53, 0.5)',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <AnimatePresence>
            <div style={modalStyles}>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={backdropStyles}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={contentStyles}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        padding: isMobile ? '16px 20px' : '20px 24px',
                        borderBottom: '1px solid rgba(255, 107, 53, 0.3)',
                        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0.04) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 6px 20px rgba(255, 107, 53, 0.5)',
                                flexShrink: 0
                            }}>
                                {term.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h2 style={{
                                    fontSize: isMobile ? '1.4rem' : '1.6rem',
                                    fontWeight: 800,
                                    margin: 0,
                                    color: '#ffffff'
                                }}>
                                    {term.term}
                                </h2>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: '#777',
                                    margin: '4px 0 0 0',
                                    fontFamily: 'monospace'
                                }}>
                                    {term.termEn}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                border: '2px solid #FF6B35',
                                background: 'rgba(255, 107, 53, 0.15)',
                                color: '#FF6B35',
                                fontSize: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Short Definition */}
                    <div style={{
                        padding: isMobile ? '14px 20px' : '16px 24px',
                        background: 'rgba(255, 184, 0, 0.08)',
                        borderBottom: '1px solid rgba(255, 184, 0, 0.15)'
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            color: '#FFB800',
                            fontWeight: 600,
                            lineHeight: 1.6
                        }}>
                            💡 {term.shortDef}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.4)'
                    }}>
                        <button
                            onClick={() => setActiveTab('explanation')}
                            style={{
                                flex: 1,
                                padding: '14px',
                                background: activeTab === 'explanation' ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'explanation' ? '3px solid #FF6B35' : '3px solid transparent',
                                color: activeTab === 'explanation' ? '#FF6B35' : '#666',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            📖 الشرح
                        </button>
                        <button
                            onClick={() => setActiveTab('examples')}
                            style={{
                                flex: 1,
                                padding: '14px',
                                background: activeTab === 'examples' ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'examples' ? '3px solid #FF6B35' : '3px solid transparent',
                                color: activeTab === 'examples' ? '#FF6B35' : '#666',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            🎯 أمثلة ({term.examples.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{
                        padding: isMobile ? '16px 20px' : '20px 24px',
                        flex: 1,
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {activeTab === 'explanation' ? (
                            <div>
                                <div style={{
                                    fontSize: isMobile ? '0.95rem' : '1rem',
                                    lineHeight: 1.85,
                                    color: '#c8c8c8'
                                }}>
                                    {term.fullExplanation.split('\n').map((line, i) => {
                                        if (line.startsWith('**') && line.endsWith('**')) {
                                            return (
                                                <h4 key={i} style={{
                                                    color: '#FFB800',
                                                    fontWeight: 700,
                                                    fontSize: '1.05rem',
                                                    marginTop: i > 0 ? '18px' : '0',
                                                    marginBottom: '10px'
                                                }}>
                                                    {line.replace(/\*\*/g, '')}
                                                </h4>
                                            );
                                        }
                                        if (line.startsWith('•')) {
                                            return (
                                                <p key={i} style={{
                                                    margin: '6px 0',
                                                    paddingRight: '14px',
                                                    color: '#a0a0a0'
                                                }}>
                                                    {line}
                                                </p>
                                            );
                                        }
                                        return line ? <p key={i} style={{ margin: '8px 0' }}>{line}</p> : <br key={i} />;
                                    })}
                                </div>

                                {term.relatedTerms && term.relatedTerms.length > 0 && (
                                    <div style={{
                                        marginTop: '24px',
                                        padding: '14px',
                                        background: 'rgba(255, 184, 0, 0.06)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 184, 0, 0.15)'
                                    }}>
                                        <p style={{
                                            margin: '0 0 12px 0',
                                            color: '#FFB800',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}>
                                            🔗 مصطلحات ذات صلة:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {term.relatedTerms.map(relatedId => (
                                                <span
                                                    key={relatedId}
                                                    style={{
                                                        padding: '6px 14px',
                                                        background: 'rgba(255, 184, 0, 0.12)',
                                                        borderRadius: '20px',
                                                        fontSize: '0.85rem',
                                                        color: '#FFB800',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {relatedId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {term.examples.map((example, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '16px',
                                            background: 'rgba(255, 107, 53, 0.06)',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255, 107, 53, 0.15)'
                                        }}
                                    >
                                        <h4 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: '#FF6B35'
                                        }}>
                                            {example.title}
                                        </h4>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            lineHeight: 1.65,
                                            color: '#b8b8b8',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontFamily: 'inherit',
                                            background: 'rgba(0,0,0,0.5)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            direction: 'rtl'
                                        }}>
                                            {example.content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: isMobile ? '14px 20px' : '16px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{
                            padding: '6px 14px',
                            background: 'rgba(255, 107, 53, 0.12)',
                            borderRadius: '8px',
                            color: '#FF6B35',
                            fontSize: '0.8rem',
                            fontWeight: 500
                        }}>
                            {term.category === 'ai-basics' && '🤖 أساسيات'}
                            {term.category === 'prompting' && '✍️ هندسة البرومبت'}
                            {term.category === 'technical' && '⚙️ تقني'}
                            {term.category === 'platforms' && '🌐 منصات'}
                        </span>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 28px',
                                background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)'
                            }}
                        >
                            فهمت! ✓
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
