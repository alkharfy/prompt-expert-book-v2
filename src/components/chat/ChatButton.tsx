'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ChatButtonProps {
    isOpen: boolean
    onClick: () => void
}

export default function ChatButton({ isOpen, onClick }: ChatButtonProps) {
    return (
        <motion.button
            className="chat-fab"
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isOpen ? '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0645\u0633\u0627\u0639\u062f' : '\u0641\u062a\u062d \u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628'}
            title={isOpen ? '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0645\u0633\u0627\u0639\u062f' : '\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0643\u062a\u0627\u0628'}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                    <motion.svg
                        key="close"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </motion.svg>
                ) : (
                    <motion.svg
                        key="chat"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </motion.svg>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
