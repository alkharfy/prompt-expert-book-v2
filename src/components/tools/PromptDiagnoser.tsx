'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DiagnosisResult {
    patientName: string
    vitalSigns: {
        clarity: number
        specificity: number
        context: number
        structure: number
        actionability: number
        constraints: number
    }
    overallHealth: number
    symptoms: string[]
    diagnosis: string
    diseases: string[]
    prescription: string[]
    healedPrompt: string
    doctorNotes: string
}

type Phase = 'admission' | 'diagnosing' | 'report'

// Must match MODEL_CONFIG keys in app/api/prompt-hospital/diagnose/route.ts.
const MODEL_OPTIONS = [
    { value: 'gpt-oss-120b', label: 'GPT-OSS 120B (سريع)' },
    { value: 'gpt-6-luna', label: 'GPT-6 Luna' },
    { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
]

const VITAL_SIGN_LABELS: Record<string, { name: string; icon: string }> = {
    clarity: { name: 'الوضوح', icon: '🎯' },
    specificity: { name: 'التحديد', icon: '📌' },
    context: { name: 'السياق', icon: '📖' },
    structure: { name: 'الهيكلة', icon: '🏗️' },
    actionability: { name: 'التنفيذ', icon: '✅' },
    constraints: { name: 'القيود', icon: '📏' },
}

function getHealthColor(score: number): string {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#eab308'
    if (score >= 40) return '#f97316'
    return '#ef4444'
}

export default function PromptDiagnoser() {
    const [phase, setPhase] = useState<Phase>('admission')
    const [prompt, setPrompt] = useState('')
    const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value)
    const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleDiagnose = async () => {
        if (!prompt.trim()) return
        setPhase('diagnosing')
        setError(null)

        try {
            const response = await fetch('/api/prompt-hospital/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim(), model: selectedModel }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'حدث خطأ أثناء التشخيص')
            }

            const data = await response.json()
            setDiagnosis(data)
            setPhase('report')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
            setPhase('admission')
        }
    }

    const handleCopy = async () => {
        if (!diagnosis?.healedPrompt) return
        try {
            await navigator.clipboard.writeText(diagnosis.healedPrompt)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback
        }
    }

    const handleReset = () => {
        setPhase('admission')
        setPrompt('')
        setDiagnosis(null)
        setError(null)
        setCopied(false)
    }

    return (
        <div className="diagnoser-container">
            <AnimatePresence mode="wait">
                {/* مرحلة الاستقبال */}
                {phase === 'admission' && (
                    <motion.div
                        key="admission"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="admission-form"
                    >
                        <h2>🏥 استقبال المريض</h2>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                            أدخل البرومبت المريض وسنقوم بتشخيصه وعلاجه
                        </p>

                        <textarea
                            className="admission-textarea"
                            placeholder="الصق البرومبت المريض هنا..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            maxLength={3000}
                        />

                        <div className="admission-meta">
                            <select
                                className="model-select"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                {MODEL_OPTIONS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <span className="char-count">{prompt.length}/3000</span>
                        </div>

                        {error && (
                            <div className="diagnosis-error" style={{ marginTop: 15 }}>
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            className="admit-btn"
                            onClick={handleDiagnose}
                            disabled={!prompt.trim()}
                        >
                            🩺 ادخل المريض للتشخيص
                        </button>
                    </motion.div>
                )}

                {/* مرحلة الفحص */}
                {phase === 'diagnosing' && (
                    <motion.div
                        key="diagnosing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="diagnosing-state"
                    >
                        <motion.span
                            className="diagnosing-icon"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            🔬
                        </motion.span>
                        <h3>جارٍ الفحص الطبي...</h3>
                        <p>الدكتور يحلل العلامات الحيوية للبرومبت</p>
                        <div className="pulse-bar" />
                    </motion.div>
                )}

                {/* مرحلة التقرير */}
                {phase === 'report' && diagnosis && (
                    <motion.div
                        key="report"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="medical-report"
                    >
                        {/* رأس التقرير */}
                        <div className="report-header">
                            <h2>📋 التقرير الطبي</h2>
                            <p>المريض: {diagnosis.patientName}</p>
                        </div>

                        {/* الصحة العامة */}
                        <div className="report-section" style={{ textAlign: 'center', marginBottom: 30 }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '20px 30px',
                                    borderRadius: '50%',
                                    width: 120,
                                    height: 120,
                                    justifyContent: 'center',
                                    border: `3px solid ${getHealthColor(diagnosis.overallHealth)}`,
                                }}
                            >
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: getHealthColor(diagnosis.overallHealth) }}>
                                    {diagnosis.overallHealth}%
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>الصحة العامة</span>
                            </motion.div>
                        </div>

                        {/* العلامات الحيوية */}
                        <div className="report-section">
                            <h3 className="report-section-title">💓 العلامات الحيوية</h3>
                            <div className="vital-signs-grid">
                                {Object.entries(diagnosis.vitalSigns).map(([key, value], index) => {
                                    const label = VITAL_SIGN_LABELS[key]
                                    if (!label) return null
                                    return (
                                        <motion.div
                                            key={key}
                                            className="vital-sign-card"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                        >
                                            <span className="vital-sign-value" style={{ color: getHealthColor(value) }}>
                                                {value}
                                            </span>
                                            <span className="vital-sign-name">{label.icon} {label.name}</span>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* الأعراض */}
                        {diagnosis.symptoms?.length > 0 && (
                            <div className="report-section">
                                <h3 className="report-section-title">🤒 الأعراض</h3>
                                <div className="symptoms-list">
                                    {diagnosis.symptoms.map((symptom, i) => (
                                        <motion.div
                                            key={i}
                                            className="symptom-item"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                        >
                                            <span>⚠️</span> {symptom}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* الأمراض المكتشفة */}
                        {diagnosis.diseases?.length > 0 && (
                            <div className="report-section">
                                <h3 className="report-section-title">🦠 الأمراض المكتشفة</h3>
                                <div className="diseases-tags">
                                    {diagnosis.diseases.map((disease, i) => (
                                        <motion.span
                                            key={i}
                                            className="disease-tag"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.6 + i * 0.1 }}
                                        >
                                            🔴 {disease}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* التشخيص */}
                        <div className="report-section">
                            <h3 className="report-section-title">🔍 التشخيص</h3>
                            <div className="diagnosis-card">{diagnosis.diagnosis}</div>
                        </div>

                        {/* الوصفة العلاجية */}
                        {diagnosis.prescription?.length > 0 && (
                            <div className="report-section">
                                <h3 className="report-section-title">💊 الوصفة العلاجية</h3>
                                <div className="prescription-list">
                                    {diagnosis.prescription.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="prescription-item"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + i * 0.1 }}
                                        >
                                            <span className="prescription-number">{i + 1}</span>
                                            <span>{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* البرومبت المعالج */}
                        <div className="report-section">
                            <h3 className="report-section-title">✅ البرومبت بعد العلاج</h3>
                            <div className="healed-prompt-section">
                                <span className="healed-prompt-label">البرومبت المُعالَج</span>
                                <div className="healed-prompt-text">{diagnosis.healedPrompt}</div>
                            </div>
                            <div className="healed-prompt-actions" style={{ marginTop: 15 }}>
                                <button className="copy-healed-btn" onClick={handleCopy}>
                                    {copied ? '✅ تم النسخ!' : '📋 نسخ البرومبت المعالج'}
                                </button>
                                <button className="new-patient-btn" onClick={handleReset}>
                                    🏥 مريض جديد
                                </button>
                            </div>
                        </div>

                        {/* ملاحظات الطبيب */}
                        {diagnosis.doctorNotes && (
                            <div className="report-section">
                                <h3 className="report-section-title">📝 ملاحظات الطبيب</h3>
                                <div className="doctor-notes">{diagnosis.doctorNotes}</div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
