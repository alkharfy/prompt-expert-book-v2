'use client'

import { motion } from 'framer-motion'

const missions = [
    { icon: '📖', text: 'اقرأ 3 صفحات اليوم', points: '+20 نقطة', done: true },
    { icon: '✏️', text: 'أكمل تمريناً تفاعلياً', points: '+25 نقطة', done: true },
    { icon: '🛠️', text: 'استخدم مولد الأوامر', points: '+25 نقطة', done: false },
]

const achievements = [
    { icon: '🔥', label: 'سلسلة 7 أيام', locked: false },
    { icon: '📚', label: 'قرأ 50 صفحة', locked: false },
    { icon: '🏆', label: 'متصدر الأسبوع', locked: false },
    { icon: '⭐', label: 'درجة مثالية', locked: false },
    { icon: '🎯', label: 'أكمل 10 تمارين', locked: true },
    { icon: '💎', label: 'PromptMaster', locked: true },
]

export default function GamificationSection() {
    return (
        <section className="landing-section landing-section-dark gamification-section">
            <div className="landing-glow" style={{ top: '20%', left: '5%' }} />
            <div className="container">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">🎮 تعلم كأنك تلعب</span>
                    <h2 className="section-title">مش هتقدر توقف!</h2>
                    <p className="section-subtitle">
                        نظام مهام ونقاط وإنجازات يومية يخليك ترجع كل يوم — تماماً زي Duolingo بس لتعلم AI
                    </p>
                </motion.div>

                <div className="gamification-grid">

                    {/* Card 1: Daily Missions */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="game-card glass-card"
                    >
                        <div className="card-header">
                            <span className="card-icon">🧭</span>
                            <div>
                                <h3>مهامك اليومية</h3>
                                <p className="card-subtitle">3 مهام جديدة كل يوم</p>
                            </div>
                            <div className="streak-badge">🔥 12</div>
                        </div>

                        <div className="missions-list">
                            {missions.map((m, i) => (
                                <div key={i} className={`mission-item ${m.done ? 'done' : ''}`}>
                                    <div className="mission-check">
                                        {m.done ? '✓' : '○'}
                                    </div>
                                    <span className="mission-icon">{m.icon}</span>
                                    <span className="mission-text">{m.text}</span>
                                    <span className="mission-points">{m.points}</span>
                                </div>
                            ))}
                        </div>

                        <div className="progress-bar-wrap">
                            <div className="progress-bar-label">
                                <span>التقدم اليومي</span>
                                <span>2/3</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '66%' }} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2: Achievements */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="game-card glass-card"
                    >
                        <div className="card-header">
                            <span className="card-icon">🏅</span>
                            <div>
                                <h3>إنجازاتك</h3>
                                <p className="card-subtitle">إنجازات وبادجات لفتحها</p>
                            </div>
                            <div className="points-badge">1,240 نقطة</div>
                        </div>

                        <div className="achievements-grid-mini">
                            {achievements.map((a, i) => (
                                <div key={i} className={`achievement-mini ${a.locked ? 'locked' : 'unlocked'}`}>
                                    <span className="ach-icon">{a.icon}</span>
                                    <span className="ach-label">{a.label}</span>
                                    {a.locked && <span className="lock-icon">🔒</span>}
                                </div>
                            ))}
                        </div>

                        <div className="level-bar">
                            <div className="level-info">
                                <span>المستوى 4 — مبدع</span>
                                <span>760 / 1000 نقطة للمستوى التالي</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '76%', background: 'linear-gradient(90deg, #FFD700, #FFAA33)' }} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 3: Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="game-card glass-card"
                    >
                        <div className="card-header">
                            <span className="card-icon">🏆</span>
                            <div>
                                <h3>لوحة المتصدرين</h3>
                                <p className="card-subtitle">يتجدد كل إثنين</p>
                            </div>
                        </div>

                        {/* Illustrative placeholder — the live leaderboard is populated
                            from real learner activity once you start. No fabricated
                            names or point totals are shown here. */}
                        <div className="leaderboard-list">
                            {[1, 2, 3, 4, 5].map((rank) => (
                                <div key={rank} className={`leader-item rank-${rank} leader-item--placeholder`}>
                                    <span className="leader-rank">
                                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </span>
                                    <div className="leader-avatar leader-avatar--placeholder" aria-hidden="true" />
                                    <span className="leader-name leader-name--placeholder">
                                        <span className="leader-skeleton" />
                                    </span>
                                    <div className="leader-stats">
                                        <span className="leader-skeleton leader-skeleton--sm" />
                                    </div>
                                </div>
                            ))}
                            <p className="leaderboard-note">ابدأ التعلم لتظهر هنا ضمن المتصدرين</p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="game-stats-row"
                >
                    <div className="game-stat">
                        <span className="game-stat-num">🏅</span>
                        <span className="game-stat-label">إنجازات وبادجات</span>
                    </div>
                    <div className="game-stat-divider" />
                    <div className="game-stat">
                        <span className="game-stat-num">3/يوم</span>
                        <span className="game-stat-label">مهام يومية</span>
                    </div>
                    <div className="game-stat-divider" />
                    <div className="game-stat">
                        <span className="game-stat-num">∞</span>
                        <span className="game-stat-label">نقاط ومستويات</span>
                    </div>
                    <div className="game-stat-divider" />
                    <div className="game-stat">
                        <span className="game-stat-num">🔥</span>
                        <span className="game-stat-label">Streak يومي</span>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .gamification-section {
                    padding: 100px 0;
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
                    background: rgba(139, 92, 246, 0.15);
                    color: #a78bfa;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }

                .section-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                    background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                    max-width: 550px;
                    margin: 0 auto;
                    line-height: 1.7;
                }

                .gamification-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                    margin-bottom: 50px;
                }

                .game-card {
                    padding: 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    border-color: rgba(139, 92, 246, 0.2) !important;
                }

                .game-card:hover {
                    border-color: rgba(139, 92, 246, 0.5) !important;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .card-icon {
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }

                .card-header h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 2px;
                }

                .card-subtitle {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                }

                .streak-badge {
                    margin-right: auto;
                    background: rgba(255, 107, 53, 0.2);
                    color: #FF6B35;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                    border-radius: 20px;
                    padding: 4px 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .points-badge {
                    margin-right: auto;
                    background: rgba(255, 215, 0, 0.15);
                    color: #FFD700;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 20px;
                    padding: 4px 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                /* Missions */
                .missions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .mission-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s;
                }

                .mission-item.done {
                    background: rgba(76, 175, 80, 0.08);
                    border-color: rgba(76, 175, 80, 0.2);
                }

                .mission-check {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                    border: 1px solid rgba(76, 175, 80, 0.3);
                }

                .mission-item:not(.done) .mission-check {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .mission-icon { font-size: 1rem; }

                .mission-text {
                    flex: 1;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.8);
                }

                .mission-item.done .mission-text {
                    text-decoration: line-through;
                    color: rgba(255, 255, 255, 0.4);
                }

                .mission-points {
                    font-size: 0.75rem;
                    color: #FF6B35;
                    font-weight: 600;
                    white-space: nowrap;
                }

                /* Progress bar */
                .progress-bar-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .progress-bar-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .progress-bar {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #FF6B35, #FF8C42);
                    border-radius: 10px;
                    transition: width 0.6s ease;
                }

                /* Achievements mini */
                .achievements-grid-mini {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .achievement-mini {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 8px;
                    border-radius: 12px;
                    background: rgba(255, 215, 0, 0.08);
                    border: 1px solid rgba(255, 215, 0, 0.2);
                    position: relative;
                    text-align: center;
                }

                .achievement-mini.locked {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.05);
                    filter: grayscale(0.8);
                    opacity: 0.5;
                }

                .ach-icon { font-size: 1.5rem; }

                .ach-label {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.2;
                }

                .lock-icon {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    font-size: 0.65rem;
                }

                .level-bar {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .level-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.78rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                /* Leaderboard */
                .leaderboard-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .leader-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .leader-item.rank-1 {
                    background: rgba(255, 215, 0, 0.06);
                    border-color: rgba(255, 215, 0, 0.2);
                }

                /* Illustrative placeholder leaderboard (no real data) */
                .leader-item--placeholder { opacity: 0.55; }
                .leader-avatar--placeholder {
                    background: rgba(255, 255, 255, 0.08);
                }
                .leader-name--placeholder { display: flex; align-items: center; }
                .leader-skeleton {
                    display: block;
                    height: 10px;
                    width: 100px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.1);
                }
                .leader-skeleton--sm { width: 56px; }
                .leaderboard-note {
                    margin: 4px 0 0;
                    text-align: center;
                    font-size: 0.78rem;
                    color: rgba(255, 255, 255, 0.45);
                }

                .leader-rank { font-size: 1.2rem; flex-shrink: 0; }

                .leader-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .leader-name {
                    flex: 1;
                    font-size: 0.9rem;
                    color: white;
                    font-weight: 600;
                }

                .leader-stats {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }

                .leader-points {
                    font-size: 0.8rem;
                    color: #FFD700;
                    font-weight: 700;
                }

                .leader-streak {
                    font-size: 0.72rem;
                    color: #FF6B35;
                }

                .leader-item.is-you {
                    background: rgba(139, 92, 246, 0.12) !important;
                    border-color: rgba(139, 92, 246, 0.4) !important;
                }

                .you-avatar {
                    background: linear-gradient(135deg, #8b5cf6, #a78bfa) !important;
                }

                .you-tag {
                    font-size: 0.7rem;
                    color: #a78bfa;
                    font-weight: 600;
                }

                .up-arrow {
                    color: #4CAF50;
                    font-size: 0.8rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                /* Bottom stats */
                .game-stats-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 35px 40px;
                    background: rgba(139, 92, 246, 0.05);
                    border-radius: 24px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    max-width: 800px;
                    margin: 0 auto;
                }

                .game-stat {
                    text-align: center;
                    padding: 0 30px;
                }

                .game-stat-num {
                    display: block;
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #a78bfa;
                    line-height: 1;
                    margin-bottom: 4px;
                }

                .game-stat-label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .game-stat-divider {
                    width: 1px;
                    height: 40px;
                    background: rgba(139, 92, 246, 0.2);
                }

                @media (max-width: 992px) {
                    .gamification-grid {
                        grid-template-columns: 1fr;
                        max-width: 480px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .game-stats-row {
                        flex-wrap: wrap;
                        gap: 20px;
                    }
                    .game-stat-divider { display: none; }
                    .game-stat { padding: 0 15px; }
                }

                @media (max-width: 576px) {
                    .gamification-section { padding: 60px 0; }
                    .section-title { font-size: 1.8rem; }
                    .game-stats-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        padding: 25px 20px;
                    }
                }
            `}</style>
        </section>
    )
}
