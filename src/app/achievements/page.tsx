'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authSystem } from '@/lib/auth_system';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import FeatureGate from '@/components/FeatureGate';
import Certificate, { AchievementsList } from '@/components/achievements/Certificate';
import { achievementsData, AchievementDefinition } from '@/data/achievementsData';
import { dbLogger } from '@/lib/logger';
import { getOrCreateCertificate } from '@/actions/certificates';
import ShareButton from '@/components/sharing/ShareButton';
import { CERTIFICATE_CHAPTER_COUNT, getMainChapterCompletion } from '@/lib/reading-completion';

type TabType = 'achievements' | 'certificate';

interface UserStats {
  completedChapters: number;
  completedExercises: number;
  currentStreak: number;
  totalPoints: number;
  bookmarksCount: number;
  certificateIssued?: boolean;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'reading' | 'exercises' | 'streak' | 'special' | 'missions' | 'notes' | 'social';
  points: number;
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

interface UserAchievement extends AchievementDefinition {
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    completedChapters: 0,
    completedExercises: 0,
    currentStreak: 0,
    totalPoints: 0,
    bookmarksCount: 0,
  });
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    completionDate: Date;
    certificateId: string;
    userName: string;
    courseName: string;
    previousRequirements: boolean;
  } | null>(null);
  const [nameError, setNameError] = useState('');

  const calculateAchievements = useCallback((stats: UserStats, claimedRewards: string[]): UserAchievement[] => {
    return achievementsData.map(achievement => {
      let currentProgress = 0;
      let isUnlocked = false;

      switch (achievement.requirementType) {
        case 'chapters':
          currentProgress = stats.completedChapters;
          isUnlocked = stats.completedChapters >= achievement.requirement;
          break;
        case 'exercises':
          currentProgress = stats.completedExercises;
          isUnlocked = stats.completedExercises >= achievement.requirement;
          break;
        case 'streak':
          currentProgress = stats.currentStreak;
          isUnlocked = stats.currentStreak >= achievement.requirement;
          break;
        case 'points':
          currentProgress = stats.totalPoints;
          isUnlocked = stats.totalPoints >= achievement.requirement;
          break;
        case 'mission_complete':
          // المكافآت المطالب بها تُجلب من الخادم (بدلاً من localStorage)
          isUnlocked = claimedRewards.includes(achievement.id);
          currentProgress = isUnlocked ? 1 : 0;
          break;
        case 'custom':
          if (achievement.id === 'bookmarks_10') {
            currentProgress = stats.bookmarksCount;
            isUnlocked = stats.bookmarksCount >= 10;
          } else if (achievement.id === 'first_certificate') {
            currentProgress = stats.certificateIssued ? 1 : 0;
            isUnlocked = !!stats.certificateIssued;
          } else if (achievement.id === 'share_certificate') {
            // يُتحقق عبر الخادم (مُخزن كـ reward_id = 'certificate_shared')
            isUnlocked = claimedRewards.includes('certificate_shared');
            currentProgress = isUnlocked ? 1 : 0;
          } else if (achievement.id === 'use_all_tools') {
            // الأدوات المستخدمة تُتبع كـ reward_ids فردية (tool_*)
            const toolsClaimed = claimedRewards.filter(r => r.startsWith('tool_'));
            currentProgress = toolsClaimed.length;
            isUnlocked = toolsClaimed.length >= achievement.requirement;
          } else if (achievement.id === 'top_10') {
            // يُتحقق عبر الخادم (مُخزن كـ reward_id = 'is_top_10')
            isUnlocked = claimedRewards.includes('is_top_10');
            currentProgress = isUnlocked ? 1 : 0;
          }
          break;
      }

      return {
        ...achievement,
        currentProgress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date() : undefined,
      };
    });
  }, []);

  const loadUserStats = useCallback(async (loadUserId: string) => {
    try {
      // جلب المكافآت المطالب بها من الخادم
      let claimedRewards: string[] = [];
      try {
        const claimedRes = await fetch('/api/achievements/claimed');
        if (claimedRes.ok) {
          const claimedData = await claimedRes.json();
          claimedRewards = claimedData.rewards || [];
        }

      } catch {
        // Display only persisted server claims; local flags are not evidence.
        claimedRewards = [];
      }

      // جلب تقدم القراءة
      const progressData = await authSystem.getDetailedProgress();
      const completedChapters = getMainChapterCompletion(progressData?.completedChapters).completed;

      // جلب التمارين المكتملة
      const { data: exercisesData } = await supabase
        .from('exercise_progress')
        .select('id')
        .eq('user_id', loadUserId)
        .eq('is_completed', true);
      const completedExercises = exercisesData?.length || 0;

      // جلب بيانات الـ Gamification
      const { data: gamificationData } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', loadUserId)
        .maybeSingle() as {
          data: {
            current_streak?: number;
            total_points?: number;
            total_reading_time_minutes?: number
          } | null
        };

      const currentStreak = gamificationData?.current_streak || 0;
      const totalPoints = gamificationData?.total_points || 0;

      // جلب عدد الإشارات المرجعية من reading_progress.bookmarks
      const { data: bookmarksProgressData } = await supabase
        .from('reading_progress')
        .select('bookmarks')
        .eq('user_id', loadUserId)
        .maybeSingle() as { data: { bookmarks?: unknown[] } | null };
      const bookmarksList = (bookmarksProgressData?.bookmarks as unknown[]) || [];
      const bookmarksCount = bookmarksList.length;

      const stats: UserStats = {
        completedChapters,
        completedExercises,
        currentStreak,
        totalPoints,
        bookmarksCount,
      };

      setUserStats(stats);

      // حساب حالة الإنجازات (باستخدام بيانات الخادم بدلاً من localStorage)
      const userAchievements = calculateAchievements(stats, claimedRewards);
      setAchievements(userAchievements);

      // The server preserves historical certificates and decides new eligibility.
      const certResult = await getOrCreateCertificate();
      setCertificateEligible(certResult.success || completedChapters >= CERTIFICATE_CHAPTER_COUNT);

      if (certResult.success && certResult.certificateId) {
        setCertificateData({
          completionDate: new Date(certResult.issuedAt || new Date()),
          certificateId: certResult.certificateId,
          userName: certResult.userName || 'مستخدم',
          courseName: certResult.courseName || 'PromptMaster',
          previousRequirements: certResult.previousRequirements ?? true,
        });
        const issuedStats = { ...stats, certificateIssued: true };
        setUserStats(issuedStats);
        setAchievements(calculateAchievements(issuedStats, claimedRewards));
      } else if (certResult.error && completedChapters >= CERTIFICATE_CHAPTER_COUNT) {
        setNameError(certResult.error);
      }
    } catch (error) {
      dbLogger.error('Error loading user stats:', error);
    }
  }, [calculateAchievements]);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUserId = authSystem.getCurrentUserId();
      if (!currentUserId) {
        router.push('/login');
        return;
      }

      setUserId(currentUserId);

      // جلب الإحصائيات
      await loadUserStats(currentUserId);

      setIsLoading(false);
    };

    checkAuthAndLoadData();
  }, [router, loadUserStats]);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.filter(a => !a.secret || a.isUnlocked).length;
  const progressPercentage = Math.round((unlockedCount / totalCount) * 100);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <FeatureGate feature="gamification">
        <div className="achievements-page">
        <div className="achievements-container">
          {/* Header */}
          <motion.div
            className="achievements-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>🏆 الإنجازات والشهادات</h1>
            <p>تتبع تقدمك واحصل على شهادة إتمام الكتاب</p>
          </motion.div>

          {/* ملخص الإنجازات */}
          <motion.div
            className="achievements-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="summary-progress">
              <div className="progress-circle-large">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercentage * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#ffb800" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="progress-text">
                  <span className="progress-number">{unlockedCount}</span>
                  <span className="progress-total">/ {totalCount}</span>
                </div>
              </div>
              <div className="progress-info">
                <h3>الإنجازات المفتوحة</h3>
                <p>{progressPercentage}% من إجمالي الإنجازات</p>
              </div>
            </div>

            <div className="summary-stats">
              <div className="stat-box">
                <span className="stat-icon">📖</span>
                <span className="stat-value">{userStats.completedChapters}</span>
                <span className="stat-label">فصل مكتمل</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">🎯</span>
                <span className="stat-value">{userStats.completedExercises}</span>
                <span className="stat-label">تمرين</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{userStats.currentStreak}</span>
                <span className="stat-label">يوم streak</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{userStats.totalPoints.toLocaleString()}</span>
                <span className="stat-label">نقطة</span>
              </div>
            </div>

            {/* Share progress button */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <ShareButton
                type="weekly"
                data={{
                  type: 'weekly',
                  title: 'تقدمي في PromptMaster',
                  subtitle: `${unlockedCount} إنجاز من ${totalCount}`,
                  icon: '🏆',
                  stats: [
                    { label: 'فصل', value: userStats.completedChapters },
                    { label: 'تمرين', value: userStats.completedExercises },
                    { label: 'نقطة', value: userStats.totalPoints },
                  ],
                }}
                label="📤 شارك تقدمك"
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="achievements-tabs">
            <button
              className={`ach-tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🎯 الإنجازات
            </button>
            <button
              className={`ach-tab ${activeTab === 'certificate' ? 'active' : ''} ${!certificateEligible ? 'disabled' : ''}`}
              onClick={() => certificateEligible && setActiveTab('certificate')}
              disabled={!certificateEligible}
            >
              🎓 الشهادة
              {!certificateEligible && <span className="tab-lock">🔒</span>}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* فلتر الإنجازات */}
                <div className="achievements-filter">
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    الكل
                  </button>
                  <button
                    className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
                    onClick={() => setFilter('unlocked')}
                  >
                    ✅ المفتوحة ({achievements.filter(a => a.isUnlocked).length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
                    onClick={() => setFilter('locked')}
                  >
                    🔒 المغلقة ({achievements.filter(a => !a.isUnlocked && (!a.secret || a.isUnlocked)).length})
                  </button>
                </div>

                {/* قائمة الإنجازات */}
                <AchievementsList
                  achievements={achievements.filter(a => !a.secret || a.isUnlocked)}
                  filter={filter}
                />
              </motion.div>
            )}

            {activeTab === 'certificate' && certificateData && (
              <motion.div
                key="certificate"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Certificate
                  userName={certificateData.userName}
                  courseName={certificateData.courseName}
                  completionDate={certificateData.completionDate}
                  certificateId={certificateData.certificateId}
                  previousRequirements={certificateData.previousRequirements}
                />
              </motion.div>
            )}

            {activeTab === 'certificate' && nameError && !certificateData && (
              <motion.div
                key="name-error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="certificate-locked-message"
              >
                <span className="lock-icon">✏️</span>
                <h4>الاسم غير مكتمل</h4>
                <p>{nameError}</p>
                <p style={{ marginTop: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  يمكنك تعديل اسمك من صفحة الملف الشخصي
                </p>
                <button
                  className="action-btn"
                  onClick={() => router.push('/profile')}
                  style={{ marginTop: '15px', background: 'rgba(255,107,53,0.2)', border: '1px solid #FF6B35', color: '#FF6B35', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  تعديل الملف الشخصي
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* رسالة للشهادة المغلقة */}
          {!certificateEligible && activeTab === 'achievements' && (
            <motion.div
              className="certificate-locked-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="lock-icon">🔐</span>
              <h4>الشهادة غير متاحة بعد</h4>
              <p>سجّل إتمام قراءة الفصول الأساسية العشرة للحصول على شهادة إتمام من PromptMaster، مع اشتراك المتقدمة أو VIP نشط واسم ثلاثي. الشهادة تستند إلى سجل قراءة ذاتي.</p>
              <div className="book-progress">
                <div className="book-progress-bar">
                  <div
                    className="book-progress-fill"
                    style={{ width: `${(userStats.completedChapters / CERTIFICATE_CHAPTER_COUNT) * 100}%` }}
                  />
                </div>
                <span>{userStats.completedChapters} / {CERTIFICATE_CHAPTER_COUNT} فصول أساسية</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      </FeatureGate>
    </>
  );
}
