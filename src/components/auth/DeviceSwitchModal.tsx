'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface DeviceSwitchModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading?: boolean
}

export default function DeviceSwitchModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: DeviceSwitchModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <h2 className="modal-title">تنبيه اختلاف الجهاز</h2>
                        <p className="modal-text">
                            هذا الحساب مسجل على جهاز آخر. هل تريد إلغاء ربط الحساب بالجهاز القديم وتسجيل الدخول من هذا الجهاز؟
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={onConfirm}
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? <div className="auth-loader"></div> : "نعم، إلغاء الجهاز القديم"}
                            </button>
                            <button
                                onClick={onClose}
                                className="btn btn-secondary"
                                disabled={isLoading}
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
