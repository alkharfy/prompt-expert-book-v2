'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getCertificateByPublicId, getCertificateShareUrl, Certificate } from '@/lib/certificates'

export default function CertificatePage() {
    const params = useParams()
    const certificateId = params.id as string
    
    const [certificate, setCertificate] = useState<Certificate | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

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
                setError('الشهادة غير موجودة أو تم إلغاؤها')
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
                        border: 3px solid rgba(255, 107, 53, 0.2);
                        border-top-color: #FF6B35;
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
                        max-width: 400px;
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
                        margin-bottom: 30px;
                    }
                    
                    .back-link {
                        color: #FF6B35;
                        text-decoration: none;
                        font-weight: 600;
                    }
                `}</style>
            </main>
        )
    }

    return (
        <main className="certificate-page">
            <div className="certificate-container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="verified-badge"
                >
                    <span className="check-icon">✓</span>
                    <span>شهادة موثّقة</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="certificate-card"
                >
                    <div className="certificate-border">
                        <div className="certificate-header">
                            <div className="logo-text">خبير البرومبتات</div>
                            <div className="certificate-type">شهادة إتمام</div>
                        </div>

                        <div className="certificate-body">
                            <p className="cert-intro">يُشهد بأن</p>
                            <h2 className="cert-name">{certificate.user_name}</h2>
                            <p className="cert-intro">قد أتم بنجاح دراسة</p>
                            <h3 className="course-name">{certificate.course_name}</h3>
                            <p className="cert-details">
                                بنسبة إتمام {certificate.completion_percentage}%
                            </p>
                        </div>

                        <div className="certificate-footer">
                            <div className="footer-item">
                                <span className="footer-label">تاريخ الإصدار</span>
                                <span className="footer-value">
                                    {new Date(certificate.issued_at).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            
                            <div className="footer-item signature">
                                <span className="signature-text">التوقيع الرقمي</span>
                                <span className="signer-name">خبير البرومبتات</span>
                            </div>
                            
                            <div className="footer-item">
                                <span className="footer-label">رقم الشهادة</span>
                                <span className="footer-value cert-id">{certificate.certificate_id}</span>
                            </div>
                        </div>

                        <div className="seal">✓</div>
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
                            شارك على LinkedIn
                        </a>
                        <a 
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`حصلت على شهادة إتمام دورة "${certificate.course_name}" من خبير البرومبتات! 🎓`)}&url=${encodeURIComponent(getCertificateShareUrl(certificateId))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="twitter-btn"
                        >
                            شارك على X
                        </a>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .certificate-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    padding: 40px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .certificate-container {
                    max-width: 700px;
                    width: 100%;
                }

                .verified-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: rgba(40, 167, 69, 0.15);
                    border: 1px solid rgba(40, 167, 69, 0.4);
                    color: #28a745;
                    padding: 12px 25px;
                    border-radius: 30px;
                    margin-bottom: 30px;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }

                .check-icon {
                    background: #28a745;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }

                .certificate-card {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 24px;
                    padding: 30px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
                }

                .certificate-border {
                    border: 3px solid;
                    border-image: linear-gradient(135deg, #FFD700, #FFA500, #FFD700) 1;
                    border-radius: 16px;
                    padding: 40px;
                    position: relative;
                    background: rgba(255, 255, 255, 0.02);
                }

                .certificate-header {
                    text-align: center;
                    margin-bottom: 35px;
                    padding-bottom: 25px;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                }

                .logo-text {
                    font-size: 2.2rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 8px;
                }

                .certificate-type {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 4px;
                }

                .certificate-body {
                    text-align: center;
                    margin-bottom: 35px;
                }

                .cert-intro {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1rem;
                    margin-bottom: 10px;
                }

                .cert-name {
                    font-size: 2.2rem;
                    color: white;
                    font-weight: 700;
                    margin: 0 0 20px 0;
                    padding-bottom: 15px;
                    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
                    display: inline-block;
                }

                .course-name {
                    font-size: 1.3rem;
                    color: #FFD700;
                    font-weight: 600;
                    margin: 15px 0 10px;
                }

                .cert-details {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.95rem;
                }

                .certificate-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-top: 25px;
                    border-top: 1px solid rgba(255, 215, 0, 0.2);
                }

                .footer-item {
                    text-align: center;
                }

                .footer-label {
                    display: block;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 5px;
                }

                .footer-value {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                }

                .cert-id {
                    font-family: monospace;
                    color: rgba(255, 215, 0, 0.8);
                }

                .signature {
                    text-align: center;
                }

                .signature-text {
                    display: block;
                    font-family: 'Brush Script MT', cursive;
                    font-size: 1.5rem;
                    color: rgba(255, 215, 0, 0.8);
                    margin-bottom: 5px;
                }

                .signer-name {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .seal {
                    position: absolute;
                    top: 30px;
                    left: 30px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #1a1a2e;
                    font-size: 2rem;
                    font-weight: bold;
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                }

                .share-section {
                    text-align: center;
                    margin-top: 30px;
                }

                .share-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 12px 30px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s;
                    margin-bottom: 20px;
                }

                .share-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .share-links {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }

                .linkedin-btn,
                .twitter-btn {
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }

                .linkedin-btn {
                    background: #0077b5;
                    color: white;
                }

                .twitter-btn {
                    background: #1da1f2;
                    color: white;
                }

                .linkedin-btn:hover,
                .twitter-btn:hover {
                    transform: translateY(-2px);
                    opacity: 0.9;
                }

                @media (max-width: 576px) {
                    .certificate-border {
                        padding: 25px 20px;
                    }

                    .logo-text {
                        font-size: 1.6rem;
                    }

                    .cert-name {
                        font-size: 1.6rem;
                    }

                    .certificate-footer {
                        flex-direction: column;
                        gap: 20px;
                        align-items: center;
                    }

                    .seal {
                        width: 45px;
                        height: 45px;
                        font-size: 1.5rem;
                        top: 20px;
                        left: 20px;
                    }
                }
            `}</style>
        </main>
    )
}
