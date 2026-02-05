'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getGlossaryTerm, GlossaryTerm as GlossaryTermType } from '@/data/glossaryData'
import GlossaryModal from './GlossaryModal'

interface GlossaryTermProps {
    termId: string;
    children?: React.ReactNode;
    displayText?: string;
}

/**
 * GlossaryTerm Component
 * 
 * يُستخدم لإنشاء رابط قابل للنقر لمصطلح تقني
 * عند النقر يفتح نافذة منبثقة مع الشرح التفصيلي
 * 
 * الاستخدام:
 * <GlossaryTerm termId="token">توكن</GlossaryTerm>
 * أو
 * <GlossaryTerm termId="token" displayText="التوكنات" />
 */
export default function GlossaryTerm({ termId, children, displayText }: GlossaryTermProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const term = getGlossaryTerm(termId);

    // Wait for client-side mount to use portal
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!term) {
        console.warn(`GlossaryTerm: Term "${termId}" not found in glossary`);
        return <span>{children || displayText || termId}</span>;
    }

    const display = children || displayText || term.term;

    return (
        <>
            <span
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                style={{
                    color: '#FFB800',
                    cursor: 'pointer',
                    borderBottom: '2px dashed rgba(255, 184, 0, 0.5)',
                    paddingBottom: '1px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    display: 'inline',
                    position: 'relative'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.color = '#FF6B35';
                    e.currentTarget.style.borderBottomColor = '#FF6B35';
                    e.currentTarget.style.borderBottomStyle = 'solid';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.color = '#FFB800';
                    e.currentTarget.style.borderBottomColor = 'rgba(255, 184, 0, 0.5)';
                    e.currentTarget.style.borderBottomStyle = 'dashed';
                }}
                title={`انقر لمعرفة المزيد عن: ${term.term}`}
            >
                {display}
                <span style={{
                    marginRight: '4px',
                    fontSize: '0.8em',
                    opacity: 0.7
                }}>
                    {term.icon}
                </span>
            </span>

            {/* Use Portal to render modal at document.body level to avoid hydration issues */}
            {isMounted && isModalOpen && createPortal(
                <GlossaryModal
                    term={term}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />,
                document.body
            )}
        </>
    );
}

/**
 * Hook للحصول على مصطلح وفتح المودال برمجياً
 */
export function useGlossary() {
    const [activeTerm, setActiveTerm] = useState<GlossaryTermType | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const openTerm = (termId: string) => {
        const term = getGlossaryTerm(termId);
        if (term) {
            setActiveTerm(term);
            setIsOpen(true);
        }
    };

    const closeTerm = () => {
        setIsOpen(false);
        setTimeout(() => setActiveTerm(null), 200);
    };

    return {
        activeTerm,
        isOpen,
        openTerm,
        closeTerm,
        GlossaryModalComponent: () => (
            <GlossaryModal
                term={activeTerm}
                isOpen={isOpen}
                onClose={closeTerm}
            />
        )
    };
}

/**
 * دالة مساعدة لتحويل النص مع مصطلحات تلقائية
 * 
 * الاستخدام:
 * renderTextWithGlossary("هذا النص يحتوي على توكن و برومبت", { onTermClick })
 */
interface GlossaryTermMatch {
    termId: string;
    patterns: string[];
}

const GLOSSARY_PATTERNS: GlossaryTermMatch[] = [
    { termId: 'token', patterns: ['توكن', 'توكنات', 'التوكن', 'التوكنات', 'tokens', 'token'] },
    { termId: 'prompt', patterns: ['برومبت', 'البرومبت', 'برومبتات', 'prompt', 'prompts'] },
    { termId: 'completion', patterns: ['إكمال', 'الإكمال', 'completion'] },
    { termId: 'context-window', patterns: ['نافذة السياق', 'سياق النموذج', 'context window'] },
    { termId: 'temperature', patterns: ['درجة الحرارة', 'Temperature', 'temperature'] },
    { termId: 'top-p', patterns: ['Top P', 'top-p', 'توب بي', 'nucleus sampling'] },
    { termId: 'api', patterns: ['API', 'واجهة برمجية', 'الـ API', 'الـAPI'] },
    { termId: 'prompt-caching', patterns: ['Prompt Caching', 'تخزين البرومبت', 'prompt caching'] },
    { termId: 'few-shot', patterns: ['Few-shot', 'few-shot', 'تعلم بالأمثلة', 'Few shot'] },
    { termId: 'chain-of-thought', patterns: ['Chain of Thought', 'سلسلة التفكير', 'CoT'] },
    { termId: 'hallucination', patterns: ['هلوسة', 'الهلوسة', 'hallucination', 'هلاوس'] },
    { termId: 'fine-tuning', patterns: ['Fine-tuning', 'الضبط الدقيق', 'fine-tuning', 'fine tuning'] },
    { termId: 'rag', patterns: ['RAG', 'التوليد المعزز'] },
    { termId: 'embedding', patterns: ['Embedding', 'تضمين', 'embeddings', 'التضمين'] },
    { termId: 'llm', patterns: ['LLM', 'نموذج لغوي', 'النماذج اللغوية'] },
    { termId: 'system-prompt', patterns: ['System Prompt', 'البرومبت النظامي', 'system prompt'] },
    { termId: 'grounding', patterns: ['Grounding', 'التأريض', 'grounding'] },
];

export { GLOSSARY_PATTERNS };
