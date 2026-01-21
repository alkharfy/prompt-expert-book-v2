'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getVisibleTestimonials, Testimonial } from '@/lib/testimonials'

// Fallback testimonials if database is empty
const fallbackTestimonials: Testimonial[] = [
    {
        id: '1',
        name: 'أحمد محمد',
        title: 'صاحب مشروع ناشئ',
        photo_url: null,
        content: 'الكتاب غيّر طريقة تفكيري تماماً! كنت أضيع ساعات في كتابة برومبتات عشوائية، الآن أنجز في دقائق ما كان يأخذ مني يوماً كاملاً.',
        rating: 5,
        is_visible: true,
        display_order: 1,
        created_at: '',
        updated_at: ''
    },
    {
        id: '2',
        name: 'سارة أحمد',
        title: 'مصممة UX',
        photo_url: null,
        content: 'أخيراً لقيت مرجع عربي متكامل عن البرومبتات. المحتوى عملي 100% وقابل للتطبيق فوراً.',
        rating: 5,
        is_visible: true,
        display_order: 2,
        created_at: '',
        updated_at: ''
    },
    {
        id: '3',
        name: 'محمد علي',
        title: 'صانع محتوى',
        photo_url: null,
        content: 'استثمار ممتاز! خلال أسبوع واحد بنيت أول موقع لي باستخدام الذكاء الاصطناعي فقط.',
        rating: 5,
        is_visible: true,
        display_order: 3,
        created_at: '',
        updated_at: ''
    }
]

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= rating ? 'star filled' : 'star'}>
                    ★
                </span>
            ))}
            <style jsx>{`
                .star-rating {
                    display: flex;
                    gap: 2px;
                    direction: ltr;
                }
                .star {
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 1.1rem;
                }
                .star.filled {
                    color: #FFD700;
                }
            `}</style>
        </div>
    )
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2)
}

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials)

    useEffect(() => {
        async function loadTestimonials() {
            const data = await getVisibleTestimonials()
            if (data && data.length > 0) {
                setTestimonials(data)
            }
        }
        loadTestimonials()
    }, [])

    return (
        <section className="landing-section testimonials-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">💬 آراء المتعلمين</span>
                    <h2 className="section-title">ماذا يقول طلابنا؟</h2>
                    <p className="section-subtitle">
                        انضم لمئات المتعلمين الذين غيّروا طريقة عملهم
                    </p>
                </motion.div>

                <div className="testimonials-grid">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="testimonial-card"
                        >
                            <div className="quote-icon">&quot;</div>
                            <p className="testimonial-content">{testimonial.content}</p>

                            <div className="testimonial-footer">
                                <div className="testimonial-avatar">
                                    {testimonial.photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={testimonial.photo_url} alt={testimonial.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {getInitials(testimonial.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="testimonial-info">
                                    <h4 className="testimonial-name">{testimonial.name}</h4>
                                    {testimonial.title && (
                                        <p className="testimonial-title">{testimonial.title}</p>
                                    )}
                                    <StarRating rating={testimonial.rating} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="stats-row"
                >
                    <div className="stat-item">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">متعلم</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">4.9</span>
                        <span className="stat-label">تقييم</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">89</span>
                        <span className="stat-label">صفحة</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">50+</span>
                        <span className="stat-label">قالب</span>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .testimonials-section {
                    padding: 100px 0;
                    background: transparent;
                    position: relative;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .section-header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .section-badge {
                    display: inline-block;
                    background: rgba(255, 107, 53, 0.15);
                    color: #FF6B35;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                }

                .section-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .testimonials-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                }

                .testimonial-card {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 35px 30px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .testimonial-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(255, 107, 53, 0.3);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .quote-icon {
                    position: absolute;
                    top: 20px;
                    right: 25px;
                    font-size: 4rem;
                    color: rgba(255, 107, 53, 0.2);
                    font-family: Georgia, serif;
                    line-height: 1;
                }

                .testimonial-content {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.85);
                    line-height: 1.8;
                    margin-bottom: 25px;
                    position: relative;
                    z-index: 1;
                }

                .testimonial-footer {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .testimonial-avatar {
                    width: 55px;
                    height: 55px;
                    border-radius: 50%;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .testimonial-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.2rem;
                }

                .testimonial-info {
                    flex: 1;
                }

                .testimonial-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 3px;
                }

                .testimonial-title {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 5px;
                }

                .stats-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin: 80px auto 0;
                    padding: 40px;
                    background: rgba(255, 107, 53, 0.05);
                    border-radius: 24px;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    max-width: 1000px;
                }

                .stat-item {
                    text-align: center;
                    padding: 0 20px;
                }

                .stat-number {
                    display: block;
                    font-size: 2.8rem;
                    font-weight: 800;
                    color: #FF6B35;
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 5px;
                }

                .stat-divider {
                    width: 1px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                }

                @media (max-width: 992px) {
                    .testimonials-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .stats-row {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 30px;
                        padding: 30px 20px;
                    }

                    .stat-divider {
                        display: none;
                    }

                    .stat-item {
                        padding: 0;
                    }
                }

                @media (max-width: 576px) {
                    .testimonials-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .testimonials-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-row {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        padding: 25px 15px;
                    }

                    .stat-number {
                        font-size: 1.8rem;
                    }

                    .stat-label {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </section>
    )
}
