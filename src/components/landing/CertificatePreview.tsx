'use client'

import { motion } from 'framer-motion'

export default function CertificatePreview() {
    return (
        <section className="certificate-section">
            <div className="container">
                <div className="certificate-grid">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="certificate-content"
                    >
                        <span className="section-badge">🎓 شهادة معتمدة</span>
                        <h2 className="section-title">احصل على شهادة إتمام</h2>
                        <p className="section-description">
                            عند إتمامك للكتاب بنسبة 100%، تحصل على شهادة معتمدة من &quot;خبير البرومبتات&quot; 
                            برقم فريد قابل للتحقق ورابط عام للمشاركة على LinkedIn ومنصات التواصل.
                        </p>
                        
                        <ul className="certificate-features">
                            <li>
                                <span className="feature-icon">✅</span>
                                رقم شهادة فريد قابل للتحقق
                            </li>
                            <li>
                                <span className="feature-icon">🔗</span>
                                رابط عام للمشاركة
                            </li>
                            <li>
                                <span className="feature-icon">📄</span>
                                قابلة للتحميل PDF
                            </li>
                            <li>
                                <span className="feature-icon">📱</span>
                                QR Code للتحقق السريع
                            </li>
                        </ul>

                        <p className="plan-note">
                            * متوفرة في الخطة المتقدمة و VIP
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="certificate-preview"
                    >
                        <div className="certificate-card">
                            <div className="certificate-inner">
                                <div className="certificate-border">
                                    <div className="certificate-header">
                                        <div className="logo-text">خبير البرومبتات</div>
                                        <div className="certificate-type">شهادة إتمام</div>
                                    </div>

                                    <div className="certificate-body">
                                        <p className="cert-text">يُشهد بأن</p>
                                        <h3 className="cert-name">[ اسمك هنا ]</h3>
                                        <p className="cert-text">قد أتم بنجاح</p>
                                        <p className="course-name">بناء المواقع والتطبيقات بالذكاء الاصطناعي</p>
                                    </div>

                                    <div className="certificate-footer">
                                        <div className="cert-date">التاريخ: يناير 2026</div>
                                        <div className="cert-signature">
                                            <span className="signature">التوقيع الرقمي</span>
                                            <span className="signer">خبير البرومبتات</span>
                                        </div>
                                        <div className="cert-id">CERT-2026-XXXXXX</div>
                                    </div>

                                    <div className="qr-placeholder">
                                        <span>QR</span>
                                    </div>

                                    <div className="seal">✓</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
                .certificate-section {
                    padding: 100px 0;
                    background: linear-gradient(180deg, rgba(22, 33, 62, 0.98) 0%, rgba(26, 26, 46, 0.95) 100%);
                    overflow: hidden;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .certificate-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }

                .certificate-content {
                    order: 2;
                }

                .certificate-preview {
                    order: 1;
                }

                .section-badge {
                    display: inline-block;
                    background: rgba(255, 215, 0, 0.15);
                    color: #FFD700;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }

                .section-title {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 20px;
                }

                .section-description {
                    font-size: 1.05rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.8;
                    margin-bottom: 30px;
                }

                .certificate-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 25px 0;
                }

                .certificate-features li {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .feature-icon {
                    font-size: 1.1rem;
                }

                .plan-note {
                    font-size: 0.85rem;
                    color: #FF6B35;
                    font-style: italic;
                }

                .certificate-card {
                    perspective: 1000px;
                }

                .certificate-inner {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
                    transform: rotateY(-5deg) rotateX(5deg);
                    transition: transform 0.5s;
                }

                .certificate-inner:hover {
                    transform: rotateY(0) rotateX(0);
                }

                .certificate-border {
                    border: 3px solid;
                    border-image: linear-gradient(135deg, #FFD700, #FFA500, #FFD700) 1;
                    border-radius: 12px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.02);
                    position: relative;
                }

                .certificate-header {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                }

                .logo-text {
                    font-size: 1.8rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 5px;
                }

                .certificate-type {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .certificate-body {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .cert-text {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.9rem;
                    margin-bottom: 8px;
                }

                .cert-name {
                    font-size: 1.6rem;
                    color: white;
                    font-weight: 700;
                    margin: 15px 0;
                    padding: 10px;
                    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
                    display: inline-block;
                }

                .course-name {
                    font-size: 1rem;
                    color: #FFD700;
                    font-weight: 600;
                    margin-top: 10px;
                }

                .certificate-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 215, 0, 0.2);
                }

                .cert-date {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .cert-signature {
                    text-align: center;
                }

                .signature {
                    display: block;
                    font-family: 'Brush Script MT', cursive;
                    font-size: 1.3rem;
                    color: rgba(255, 215, 0, 0.8);
                    margin-bottom: 3px;
                }

                .signer {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .cert-id {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-family: monospace;
                }

                .qr-placeholder {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    width: 50px;
                    height: 50px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 0.7rem;
                }

                .seal {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    width: 45px;
                    height: 45px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #1a1a2e;
                    font-size: 1.5rem;
                    font-weight: bold;
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
                }

                @media (max-width: 992px) {
                    .certificate-grid {
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }

                    .certificate-content {
                        order: 1;
                        text-align: center;
                    }

                    .certificate-preview {
                        order: 2;
                    }

                    .certificate-features li {
                        justify-content: center;
                    }
                }

                @media (max-width: 576px) {
                    .certificate-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .certificate-border {
                        padding: 20px;
                    }

                    .logo-text {
                        font-size: 1.4rem;
                    }

                    .cert-name {
                        font-size: 1.2rem;
                    }
                }
            `}</style>
        </section>
    )
}
