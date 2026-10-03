'use client'

import { useLearning } from '@/context/LearningContext'
import { LEARNING_PATHS, getPathCompletion } from '@/data/learningPaths'
import { authSystem } from '@/lib/auth_system'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function PathProgressBar() {
    const { preferences, isLoading } = useLearning()
    const [currentPage, setCurrentPage] = useState(0)
    const [isLoadingProgress, setIsLoadingProgress] = useState(true)

    useEffect(() => {
        const fetchProgress = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                setIsLoadingProgress(false)
                return
            }
            try {
                const data = await authSystem.getDetailedProgress()
                if (data) setCurrentPage(data.currentPage)
            } catch {
                // ignore
            }
            setIsLoadingProgress(false)
        }
        fetchProgress()
    }, [])

    if (isLoading || isLoadingProgress) return null
    if (!preferences?.learningPath) return null

    const path = LEARNING_PATHS[preferences.learningPath]
    if (!path) return null

    const completion = getPathCompletion(currentPage, preferences.learningPath)

    return (
        <div className="path-progress-bar">
            <div className="path-progress-info">
                <span className="path-progress-icon">{path.icon}</span>
                <span className="path-progress-label">
                    مسارك: <strong>{path.nameAr}</strong>
                </span>
                <Link href="/onboarding" className="path-change-link">
                    تغيير المسار
                </Link>
            </div>
            <div className="path-progress-track">
                <div
                    className="path-progress-fill"
                    style={{ width: `${completion}%` }}
                />
            </div>
            <div className="path-progress-stats">
                <span>موضع الاستئناف: {completion}% من صفحات المسار</span>
                <span>
                    {path.totalPages} صفحة · نحو {path.estimatedHours} ساعة للقراءة والتجارب القصيرة
                </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>موضع الصفحة لا يثبت إتمام كل ما سبقها. وقت المشاريع والمراجعة يُضاف حسب تطبيقك.</p>

            <style jsx>{`
                .path-progress-bar {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    border-radius: 16px;
                    padding: 16px 20px;
                    margin-bottom: 24px;
                    max-width: 700px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .path-progress-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                .path-progress-icon {
                    font-size: 1.3rem;
                }
                .path-progress-label {
                    font-size: 0.95rem;
                    color: var(--color-text-secondary, #b0b0b0);
                }
                .path-progress-label strong {
                    color: #fff;
                }
                .path-change-link {
                    margin-right: auto;
                    font-size: 0.8rem;
                    color: var(--color-orange-primary, #FF6B35);
                    text-decoration: none;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .path-change-link:hover {
                    opacity: 1;
                    text-decoration: underline;
                }
                .path-progress-track {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                .path-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #FF6B35, #FFB800);
                    border-radius: 4px;
                    transition: width 0.6s ease;
                    min-width: ${completion > 0 ? '8px' : '0'};
                }
                .path-progress-stats {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.78rem;
                    color: var(--color-text-secondary, #b0b0b0);
                }
            `}</style>
        </div>
    )
}
