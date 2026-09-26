'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getCertificateByPublicId, getCertificateShareUrl, Certificate } from '@/lib/certificates'

export default function CertificatePage() {
    const params = useParams()
    const router = useRouter()
    const certificateId = params.id as string

    const [certificate, setCertificate] = useState<Certificate | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [searchId, setSearchId] = useState('')

    useEffect(() => {
        async function fetchCertificate() {
            if (!certificateId) {
                setError('معرف الشهادة غير موجود')
                setIsLoading(false)
                return
            }

            const data = await getCertificateByPublicId(certificateId)
            if (data) {
                setCertificate(data)
            } else {
                setError('الشهادة غير موجودة أو غير متاحة للعرض العام')
            }
            setIsLoading(false)
        }

        fetchCertificate()
    }, [certificateId])

    const handleCopyLink = () => {
        const url = getCertificateShareUrl(certificateId)
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = searchId.trim()
        if (trimmed) {
            router.push(`/certificate/${trimmed}`)
        }
    }

    if (isLoading) {
        return (
            <main className="certificate-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>جاري التحقق من الشهادة...</p>
                </div>
                
                <style jsx>{`
                    .certificate-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    }
                    
                    .loading-container {
                        text-align: center;
                        color: white;
                    }
                    
                    .loader {
                        width: 50px;
                        height: 50px;
                        border: 3px solid rgba(255, 215, 0, 0.15);
                        border-top-color: #FFD700;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </main>
        )
    }

    if (error || !certificate) {
        return (
            <main className="certificate-page">
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <h1>شهادة غير موجودة</h1>
                    <p>{error || 'لم نتمكن من العثور على هذه الشهادة'}</p>

                    <div className="verify-section">
                        <h3 className="verify-title">التحقق من شهادة</h3>
                        <p className="verify-desc">أدخل رقم الشهادة للتحقق من صحتها</p>
                        <form onSubmit={handleSearch} className="verify-form">
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="مثال: CERT-XXXXX-XXXX"
                                className="verify-input"
                                dir="ltr"
                            />
                            <button type="submit" className="verify-btn" disabled={!searchId.trim()}>
                                تحقق
                            </button>
                        </form>
                    </div>

                    <Link href="/" className="back-link">
                        العودة للصفحة الرئيسية
                    </Link>
                </div>

                <style jsx>{`
                    .certificate-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                        padding: 20px;
                    }

                    .error-container {
                        text-align: center;
                        color: white;
                        max-width: 450px;
                    }

                    .error-icon {
                        font-size: 4rem;
                        margin-bottom: 20px;
                    }

                    .error-container h1 {
                        font-size: 1.8rem;
                        margin-bottom: 10px;
                    }

                    .error-container p {
                        color: rgba(255, 255, 255, 0.7);
                        margin-bottom: 20px;
                    }

                    .verify-section {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 25px;
                        margin: 25px 0;
                    }

                    .verify-title {
                        font-size: 1.1rem;
                        color: #FFD700;
                        margin-bottom: 8px;
                    }

                    .verify-desc {
                        font-size: 0.85rem;
                        color: rgba(255, 255, 255, 0.5) !important;
                        margin-bottom: 15px !important;
                    }

                    .verify-form {
                        display: flex;
                        gap: 10px;
                    }

                    .verify-input {
                        flex: 1;
                        padding: 12px 16px;
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        border-radius: 10px;
                        color: white;
                        font-size: 0.95rem;
                        font-family: monospace;
                        outline: none;
                        transition: border-color 0.3s;
                    }

                    .verify-input:focus {
                        border-color: #FFD700;
                    }

                    .verify-input::placeholder {
                        color: rgba(255, 255, 255, 0.3);
                    }

                    .verify-btn {
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #FFD700, #FFA500);
                        border: none;
                        border-radius: 10px;
                        color: #1a1a2e;
                        font-weight: 700;
                        font-family: inherit;
                        cursor: pointer;
                        transition: all 0.3s;
                    }

                    .verify-btn:hover {
                        opacity: 0.9;
                    }

                    .verify-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .back-link {
                        color: #FFD700;
                        text-decoration: none;
                        font-weight: 600;
                        transition: opacity 0.3s;
                    }

                    .back-link:hover {
                        opacity: 0.8;
                    }
                `}</style>
            </main>
        )
    }

    return (
        <main className="certificate-page">
            <div className="certificate-container">
                {/* Background decorations */}
                <div className="bg-pattern" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="verified-badge"
                >
                    <span className="check-icon">✓</span>
                    <span>شهادة موثّقة ومعتمدة</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="certificate-card"
                >
                    {/* Animated border */}
                    <div className="cert-border-glow" />
                    
                    <div className="certificate-inner">
                        {/* Corner ornaments */}
                        <div className="corner corner-tl" />
                        <div className="corner corner-tr" />
                        <div className="corner corner-bl" />
                        <div className="corner corner-br" />

                        {/* Gold seal */}
                        <div className="seal-container">
                            <div className="seal-ring" />
                            <div className="seal">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        <div className="certificate-header">
                            <div className="logo-wrapper">
                                <div className="logo-text">PromptMaster</div>
                                <div className="logo-line" />
                            </div>
                            <div className="certificate-type">شهادة إتمام</div>
                            <div className="cert-subtitle">CERTIFICATE OF COMPLETION</div>
                        </div>

                        <div className="certificate-body">
                            <p className="cert-intro">يُشهد بأن</p>
                            <div className="name-wrapper">
                                <div className="name-line" />
                                <h2 className="cert-name">{certificate.user_name}</h2>
                                <div className="name-line" />
                            </div>
                            <p className="cert-intro">قد أتم بنجاح دراسة</p>
                            <h3 className="course-name">{certificate.course_name}</h3>
                            <div className="completion-badge">
                                <span className="completion-icon">🏆</span>
                                <span>نسبة الإتمام {certificate.completion_percentage}%</span>
                            </div>
                        </div>

                        <div className="certificate-footer">
                            <div className="footer-item">
                                <div className="footer-icon">📅</div>
                                <span className="footer-label">التاريخ</span>
                                <span className="footer-value">
                                    {new Date(certificate.issued_at).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                    })}
                                </span>
                            </div>
                            
                            <div className="footer-item signature">
                                <div className="signature-line" />
                                <span className="signature-text">PromptMaster</span>
                                <span className="signer-label">التوقيع الرقمي</span>
                            </div>
                            
                            <div className="footer-item">
                                <div className="footer-icon">🔐</div>
                                <span className="footer-label">رقم التحقق</span>
                                <span className="footer-value cert-id">{certificate.certificate_id}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="share-section"
                >
                    <button onClick={handleCopyLink} className="share-btn">
                        {copied ? '✓ تم النسخ!' : '🔗 نسخ رابط الشهادة'}
                    </button>
                    
                    <div className="share-links">
                        <a 
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getCertificateShareUrl(certificateId))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="linkedin-btn"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            شارك على LinkedIn
                        </a>
                        <a 
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`حصلت على شهادة إتمام PromptMaster! 🎓`)}&url=${encodeURIComponent(getCertificateShareUrl(certificateId))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="twitter-btn"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            شارك على X
                        </a>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .certificate-page {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #0a0a0a 0%, #0f0a2e 40%, #1a1a2e 70%, #0a0f1a 100%);
                    padding: 40px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .bg-pattern {
                    position: fixed;
                    inset: 0;
                    background-image: radial-gradient(rgba(255, 215, 0, 0.03) 1px, transparent 1px);
                    background-size: 30px 30px;
                    pointer-events: none;
                }

                .certificate-container {
                    max-width: 720px;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                }

                .verified-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: rgba(40, 167, 69, 0.1);
                    border: 1px solid rgba(40, 167, 69, 0.3);
                    color: #4ade80;
                    padding: 12px 28px;
                    border-radius: 30px;
                    margin-bottom: 30px;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                    font-weight: 600;
                    font-size: 0.95rem;
                    backdrop-filter: blur(10px);
                }

                .check-icon {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 700;
                    box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
                }

                /* ===== CARD ===== */
                .certificate-card {
                    position: relative;
                    border-radius: 24px;
                    padding: 3px;
                }

                .cert-border-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 24px;
                    padding: 3px;
                    background: conic-gradient(
                        from var(--border-angle, 0deg),
                        transparent 0%,
                        #FFD700 15%,
                        #FFA500 30%,
                        #FFD700 45%,
                        transparent 55%,
                        transparent 100%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: rotateBorder 4s linear infinite;
                    opacity: 0.7;
                }

                @property --border-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                @keyframes rotateBorder {
                    to { --border-angle: 360deg; }
                }

                .certificate-inner {
                    position: relative;
                    background: linear-gradient(165deg, rgba(20, 15, 40, 0.98) 0%, rgba(15, 12, 30, 0.99) 50%, rgba(20, 15, 40, 0.98) 100%);
                    border-radius: 22px;
                    padding: 50px 45px;
                    overflow: hidden;
                }

                /* Corner ornaments */
                .corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border-color: rgba(255, 215, 0, 0.25);
                    border-style: solid;
                }
                .corner-tl { top: 18px; left: 18px; border-width: 2px 0 0 2px; border-top-left-radius: 8px; }
                .corner-tr { top: 18px; right: 18px; border-width: 2px 2px 0 0; border-top-right-radius: 8px; }
                .corner-bl { bottom: 18px; left: 18px; border-width: 0 0 2px 2px; border-bottom-left-radius: 8px; }
                .corner-br { bottom: 18px; right: 18px; border-width: 0 2px 2px 0; border-bottom-right-radius: 8px; }

                /* Seal */
                .seal-container {
                    position: absolute;
                    top: 25px;
                    left: 25px;
                    width: 65px;
                    height: 65px;
                }

                .seal-ring {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    border: 2px dashed rgba(255, 215, 0, 0.3);
                    animation: spinSeal 12s linear infinite;
                }

                @keyframes spinSeal {
                    to { transform: rotate(360deg); }
                }

                .seal {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(145deg, #FFD700, #FFA500, #FFD700);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.25), inset 0 -2px 4px rgba(0,0,0,0.15);
                    position: relative;
                }

                /* Header */
                .certificate-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 30px;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.12);
                }

                .logo-wrapper {
                    margin-bottom: 12px;
                }

                .logo-text {
                    font-size: 2.4rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 1px;
                    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.15));
                }

                .logo-line {
                    width: 60px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #FFD700, transparent);
                    margin: 8px auto 0;
                }

                .certificate-type {
                    font-size: 1.15rem;
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing: 6px;
                    margin-bottom: 4px;
                }

                .cert-subtitle {
                    font-size: 0.7rem;
                    color: rgba(255, 215, 0, 0.3);
                    letter-spacing: 8px;
                    text-transform: uppercase;
                }

                /* Body */
                .certificate-body {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .cert-intro {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1rem;
                    margin-bottom: 12px;
                }

                .name-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .name-line {
                    flex: 1;
                    max-width: 80px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
                }

                .cert-name {
                    font-size: 2.4rem;
                    color: white;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 0 30px rgba(255, 215, 0, 0.1);
                }

                .course-name {
                    font-size: 1.2rem;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: 700;
                    margin: 15px 0 18px;
                }

                .completion-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 215, 0, 0.08);
                    border: 1px solid rgba(255, 215, 0, 0.15);
                    padding: 8px 22px;
                    border-radius: 25px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                }

                .completion-icon {
                    font-size: 1.1rem;
                }

                /* Footer */
                .certificate-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-top: 28px;
                    border-top: 1px solid rgba(255, 215, 0, 0.12);
                }

                .footer-item {
                    text-align: center;
                    flex: 1;
                }

                .footer-icon {
                    font-size: 1.2rem;
                    margin-bottom: 6px;
                }

                .footer-label {
                    display: block;
                    font-size: 0.72rem;
                    color: rgba(255, 255, 255, 0.35);
                    margin-bottom: 4px;
                    letter-spacing: 1px;
                }

                .footer-value {
                    color: rgba(255, 255, 255, 0.75);
                    font-size: 0.88rem;
                }

                .cert-id {
                    font-family: 'Courier New', monospace;
                    color: rgba(255, 215, 0, 0.7);
                    font-size: 0.78rem;
                    letter-spacing: 0.5px;
                }

                .signature {
                    text-align: center;
                    padding: 0 20px;
                }

                .signature-line {
                    width: 100px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
                    margin: 0 auto 8px;
                }

                .signature-text {
                    display: block;
                    font-size: 1.3rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 4px;
                }

                .signer-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.35);
                    letter-spacing: 2px;
                }

                /* ===== SHARE ===== */
                .share-section {
                    text-align: center;
                    margin-top: 32px;
                }

                .share-btn {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: white;
                    padding: 13px 32px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-family: inherit;
                    transition: all 0.3s;
                    margin-bottom: 20px;
                    backdrop-filter: blur(10px);
                }

                .share-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 215, 0, 0.3);
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
                }

                .share-links {
                    display: flex;
                    justify-content: center;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .linkedin-btn,
                .twitter-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 11px 22px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s;
                }

                .linkedin-btn {
                    background: linear-gradient(135deg, #0077b5, #005a8c);
                    color: white;
                }

                .twitter-btn {
                    background: linear-gradient(135deg, #1a1a2e, #2d2d44);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .linkedin-btn:hover,
                .twitter-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }

                @media (max-width: 576px) {
                    .certificate-inner {
                        padding: 35px 22px;
                    }

                    .logo-text {
                        font-size: 1.8rem;
                    }

                    .cert-name {
                        font-size: 1.7rem;
                    }

                    .certificate-type {
                        letter-spacing: 3px;
                        font-size: 1rem;
                    }

                    .cert-subtitle {
                        letter-spacing: 4px;
                        font-size: 0.6rem;
                    }

                    .certificate-footer {
                        flex-direction: column;
                        gap: 22px;
                        align-items: center;
                    }

                    .seal-container {
                        width: 50px;
                        height: 50px;
                        top: 18px;
                        left: 18px;
                    }

                    .corner {
                        width: 28px;
                        height: 28px;
                    }

                    .name-wrapper {
                        gap: 12px;
                    }

                    .name-line {
                        max-width: 40px;
                    }
                }
            `}</style>
        </main>
    )
}
