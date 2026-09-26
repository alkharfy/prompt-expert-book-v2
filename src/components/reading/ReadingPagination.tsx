'use client'

import { motion } from 'framer-motion'

interface ReadingPaginationProps {
    currentIndex: number
    total: number
    onPrev: () => void
    onNext: () => void
    isFirst: boolean
    isLast: boolean
    isNextLocked: boolean
    onLockedClick: () => void
    isBookEnd?: boolean // True only on last page of Appendix
}

export default function ReadingPagination({
    currentIndex,
    total,
    onPrev,
    onNext,
    isFirst,
    isLast,
    isNextLocked,
    onLockedClick,
    isBookEnd = false
}: ReadingPaginationProps) {

    const handleNextClick = () => {
        if (isNextLocked) {
            onLockedClick()
        } else {
            onNext()
        }
    }

    const nextLabel = isBookEnd ? 'عودة للفهرس' : (isLast ? 'الفصل التالي' : 'التالي')

    return (
        <nav className="reading-nav-container" aria-label="التنقل بين الصفحات">
            <div className="nav-buttons-row">
                {/* Previous Button (Right in RTL start) */}
                <button
                    onClick={onPrev}
                    className="reading-nav-btn prev"
                    disabled={isFirst}
                    aria-label={`الصفحة السابقة (${currentIndex} من ${total})`}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M7 15l5-5-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>السابق</span>
                </button>

                {/* Progress Dots (Center) */}
                <div className="pagination-dots" role="status" aria-label={`الصفحة ${currentIndex + 1} من ${total}`}>
                    {Array.from({ length: total }).map((_, index) => (
                        <motion.div
                            key={index}
                            className={`reading-dot ${index === currentIndex ? 'reading-dot-active' : 'reading-dot-inactive'}`}
                            layout
                            aria-hidden="true"
                        />
                    ))}
                </div>

                {/* Next Button (Left in RTL end) */}
                <button
                    onClick={handleNextClick}
                    className="reading-nav-btn next"
                    aria-label={isNextLocked ? 'الصفحة التالية (مقفلة)' : nextLabel}
                >
                    <span>{nextLabel}</span>
                    <motion.svg
                        animate={isLast ? { x: [0, -5, 0] } : {}}
                        transition={isLast ? { duration: 1.5, repeat: Infinity } : {}}
                        style={{ transform: isBookEnd ? 'rotate(0deg)' : 'rotate(180deg)' }}
                        width="20" height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path d="M7 15l5-5-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                </button>
            </div>
        </nav>
    )
}
