'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authSystem } from '@/lib/auth_system';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Certificate, { AchievementsList } from '@/components/achievements/Certificate';
import { achievementsData, AchievementDefinition } from '@/data/achievementsData';
import { dbLogger } from '@/lib/logger';

type TabType = 'achievements' | 'certificate';

interface UserStats {
  completedChapters: number;
  completedExercises: number;
  currentStreak: number;
  totalPoints: number;
  readingTime: number;
  bookmarksCount: number;
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
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    completedChapters: 0,
    completedExercises: 0,
    currentStreak: 0,
    totalPoints: 0,
    readingTime: 0,
    bookmarksCount: 0,
  });
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    completionDate: Date;
    certificateId: string;
  } | null>(null);

  const loadUserStats = useCallback(async (loadUserId: string) => {
    try {
      // جلب تقدم القراءة
      const progressData = await authSystem.getDetailedProgress();
      const completedChapters = progressData?.completedChapters?.length || 0;

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
        readingTime: gamificationData?.total_reading_time_minutes || 0,
        bookmarksCount,
      };

      setUserStats(stats);

      // حساب حالة الإنجازات
      const userAchievements = calculateAchievements(stats);
      setAchievements(userAchievements);

      // التحقق من أهلية الشهادة (إتمام الكتاب)
      if (completedChapters >= 9) {
        setCertificateEligible(true);

        // جلب أو إنشاء شهادة
        const { data: certData } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', loadUserId)
          .single() as { data: { issued_at?: string; id?: string } | null };

        if (certData) {
          setCertificateData({
            completionDate: new Date(certData.issued_at || new Date()),
            certificateId: certData.id || '',
          });
        } else {
          // إنشاء شهادة جديدة
          const newCertId = `CERT-${Date.now().toString(36).toUpperCase()}-${loadUserId.substring(0, 4).toUpperCase()}`;

          // الحصول على اسم المستخدم بأمان
          let userName = 'مستخدم';
          try {
            userName = localStorage?.getItem('user_name') || 'مستخدم';
          } catch {
            // localStorage غير متوفر
          }

          const { data: newCert } = await (supabase.from('certificates') as any).insert({
            user_id: loadUserId,
            user_name: userName,
            course_name: 'خبير البرومبتات',
            issued_at: new Date().toISOString(),
            is_visible: true,
          }).select().single() as { data: { id?: string } | null };

          if (newCert) {
            setCertificateData({
              completionDate: new Date(),
              certificateId: newCert.id || '',
            });
          }
        }
      }
    } catch (error) {
      dbLogger.error('Error loading user stats:', error);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUserId = authSystem.getCurrentUserId();
      if (!currentUserId) {
        router.push('/login');
        return;
      }

      setUserId(currentUserId);

      // جلب بيانات المستخدم
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', currentUserId)
        .single() as { data: { full_name?: string; email?: string } | null };

      if (userData) {
        setUserName(userData.full_name || userData.email?.split('@')[0] || 'مستخدم');
      }

      // جلب الإحصائيات
      await loadUserStats(currentUserId);

      setIsLoading(false);
    };

    checkAuthAndLoadData();
  }, [router, loadUserStats]);

  const calculateAchievements = (stats: UserStats): UserAchievement[] => {
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
        case 'custom':
          // الإنجازات الخاصة تحتاج تتبع مخصص
          if (achievement.id === 'bookmarks_10') {
            currentProgress = stats.bookmarksCount;
            isUnlocked = stats.bookmarksCount >= 10;
          } else if (achievement.id === 'first_certificate') {
            currentProgress = stats.completedChapters >= 9 ? 1 : 0;
            isUnlocked = stats.completedChapters >= 9;
          } else if (achievement.id === 'share_certificate') {
            // يمكن تفعيلها يدوياً أو عبر تتبع المشاركة
            currentProgress = localStorage.getItem('certificate_shared') === 'true' ? 1 : 0;
            isUnlocked = currentProgress === 1;
          } else if (achievement.id === 'use_all_tools') {
            // تتبع استخدام الأدوات (يحتاج نظام تتبع أعمق)
            const toolsUsed = JSON.parse(localStorage.getItem('tools_used') || '[]');
            currentProgress = toolsUsed.length;
            isUnlocked = toolsUsed.length >= achievement.requirement;
          } else if (achievement.id === 'top_10') {
            // سيتم تفعيلها عبر نظام الليدربورد
            const isTop10 = localStorage.getItem('is_top_10') === 'true';
            currentProgress = isTop10 ? 1 : 0;
            isUnlocked = isTop10;
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
  };

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
                  userName={userName}
                  completionDate={certificateData.completionDate}
                  certificateId={certificateData.certificateId}
                  totalPoints={userStats.totalPoints}
                  completedExercises={userStats.completedExercises}
                  readingTime={userStats.readingTime}
                />
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
              <p>أكمل قراءة جميع فصول الكتاب للحصول على شهادة الإتمام</p>
              <div className="book-progress">
                <div className="book-progress-bar">
                  <div
                    className="book-progress-fill"
                    style={{ width: `${(userStats.completedChapters / 9) * 100}%` }}
                  />
                </div>
                <span>{userStats.completedChapters} / 9 فصول</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
