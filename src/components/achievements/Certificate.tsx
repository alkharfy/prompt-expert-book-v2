'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getCertificateShareUrl } from '@/lib/certificates';
import { dbLogger } from '@/lib/logger';

interface CertificateProps {
  userName: string;
  completionDate: Date;
  certificateId: string;
  totalPoints?: number;
  completedExercises?: number;
  readingTime?: number; // بالدقائق
  onDownload?: () => void;
  onShare?: () => void;
}

export default function Certificate({
  userName,
  completionDate,
  certificateId,
  totalPoints = 0,
  completedExercises = 0,
  readingTime = 0,
  onDownload,
  onShare,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
    }
    return `${mins} دقيقة`;
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      // استخدام html2canvas لتحويل الشهادة لصورة
      if (typeof window !== 'undefined') {
        const html2canvas = (await import('html2canvas')).default;
        if (certificateRef.current) {
          const canvas = await html2canvas(certificateRef.current, {
            scale: 2,
            backgroundColor: '#0a0a0f',
            useCORS: true,
          });
          
          const link = document.createElement('a');
          link.download = `certificate-${certificateId}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          onDownload?.();
        }
      }
    } catch (error) {
      dbLogger.error('Error downloading certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = getCertificateShareUrl(certificateId);
      if (navigator.share) {
        await navigator.share({
          title: 'شهادة إتمام - خبير البرومبتات',
          text: `🎉 حصلت على شهادة إتمام كتاب "خبير البرومبتات"!`,
          url: shareUrl,
        });
        onShare?.();
      } else {
        // نسخ الرابط
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Silent fail for share
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getCertificateShareUrl(certificateId);
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="certificate-wrapper">
      {/* الشهادة */}
      <motion.div
        ref={certificateRef}
        className="certificate"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* الإطار الزخرفي */}
        <div className="certificate-border">
          <div className="corner corner-tl">✦</div>
          <div className="corner corner-tr">✦</div>
          <div className="corner corner-bl">✦</div>
          <div className="corner corner-br">✦</div>
        </div>

        {/* المحتوى */}
        <div className="certificate-content">
          {/* الشعار */}
          <div className="certificate-logo">
            <span className="logo-icon">🎓</span>
          </div>

          {/* العنوان */}
          <h1 className="certificate-title">شهادة إتمام</h1>
          <p className="certificate-subtitle">Certificate of Completion</p>

          {/* الخط الزخرفي */}
          <div className="decorative-line">
            <span>✦</span>
            <div className="line"></div>
            <span>✦</span>
          </div>

          {/* اسم المتلقي */}
          <p className="certificate-pretext">نشهد بأن</p>
          <h2 className="certificate-name">{userName}</h2>

          {/* النص */}
          <p className="certificate-text">
            قد أتم بنجاح دراسة كتاب
          </p>
          <h3 className="certificate-book">خبير البرومبتات</h3>
          <p className="certificate-book-subtitle">
            دليلك الشامل لإتقان فن التواصل مع الذكاء الاصطناعي
          </p>

          {/* الإحصائيات */}
          <div className="certificate-stats">
            <div className="stat-item">
              <span className="stat-icon">🏆</span>
              <span className="stat-value">{totalPoints.toLocaleString()}</span>
              <span className="stat-label">نقطة</span>
            </div>
            <div className="stat-divider">|</div>
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-value">{completedExercises}</span>
              <span className="stat-label">تمرين</span>
            </div>
            <div className="stat-divider">|</div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">{formatReadingTime(readingTime)}</span>
              <span className="stat-label">قراءة</span>
            </div>
          </div>

          {/* الخط الزخرفي */}
          <div className="decorative-line small">
            <div className="line"></div>
          </div>

          {/* التاريخ والتوقيع */}
          <div className="certificate-footer">
            <div className="footer-section">
              <p className="footer-label">تاريخ الإتمام</p>
              <p className="footer-value">{formatDate(completionDate)}</p>
            </div>
            <div className="footer-section signature">
              <div className="signature-line"></div>
              <p className="footer-label">خبير البرومبتات</p>
            </div>
          </div>

          {/* رقم الشهادة */}
          <p className="certificate-id">
            رقم الشهادة: {certificateId}
          </p>

          {/* الختم */}
          <div className="certificate-seal">
            <span>🏅</span>
          </div>
        </div>
      </motion.div>

      {/* أزرار التحكم */}
      <div className="certificate-actions">
        <motion.button
          className="action-btn download-btn"
          onClick={handleDownload}
          disabled={isDownloading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isDownloading ? (
            <>
              <span className="loading-spinner"></span>
              جاري التحميل...
            </>
          ) : (
            <>
              📥 تحميل الشهادة
            </>
          )}
        </motion.button>
        
        <motion.button
          className="action-btn share-btn"
          onClick={handleShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔗 مشاركة
        </motion.button>
        
        <motion.button
          className="action-btn copy-link-btn"
          onClick={handleCopyLink}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? '✓ تم النسخ!' : '📋 نسخ الرابط العام'}
        </motion.button>
      </div>
      
      <div className="public-link-info">
        <p>رابط الشهادة العام:</p>
        <code>{getCertificateShareUrl(certificateId)}</code>
      </div>
    </div>
  );
}

// مكون بطاقة الإنجاز
interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  progress: number; // 0-100
  isUnlocked: boolean;
  unlockedAt?: Date;
  points: number;
}

export function AchievementCard({
  icon,
  title,
  description,
  progress,
  isUnlocked,
  unlockedAt,
  points,
}: AchievementCardProps) {
  return (
    <motion.div
      className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
    >
      <div className={`achievement-icon ${!isUnlocked ? 'grayscale' : ''}`}>
        {icon}
        {!isUnlocked && <span className="lock-badge">🔒</span>}
      </div>
      
      <div className="achievement-info">
        <h4 className="achievement-title">{title}</h4>
        <p className="achievement-desc">{description}</p>
        
        {!isUnlocked && (
          <div className="achievement-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
        
        {isUnlocked && unlockedAt && (
          <p className="achievement-date">
            تم فتحه في {new Intl.DateTimeFormat('ar-SA').format(unlockedAt)}
          </p>
        )}
      </div>
      
      <div className="achievement-points">
        <span className="points-value">+{points}</span>
        <span className="points-label">نقطة</span>
      </div>
    </motion.div>
  );
}

// مكون قائمة الإنجازات
interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'reading' | 'exercises' | 'streak' | 'special';
  points: number;
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementsListProps {
  achievements: Achievement[];
  filter?: 'all' | 'unlocked' | 'locked';
}

export function AchievementsList({ achievements, filter = 'all' }: AchievementsListProps) {
  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.isUnlocked;
    if (filter === 'locked') return !a.isUnlocked;
    return true;
  });

  const categories = {
    reading: { name: 'القراءة', icon: '📖' },
    exercises: { name: 'التمارين', icon: '🎯' },
    streak: { name: 'الاستمرارية', icon: '🔥' },
    special: { name: 'خاصة', icon: '⭐' },
  };

  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="achievements-list">
      {Object.entries(groupedAchievements).map(([category, items]) => (
        <div key={category} className="achievements-category">
          <h3 className="category-title">
            <span>{categories[category as keyof typeof categories]?.icon}</span>
            {categories[category as keyof typeof categories]?.name}
          </h3>
          <div className="achievements-grid">
            {items.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                progress={Math.min((achievement.currentProgress / achievement.requirement) * 100, 100)}
                isUnlocked={achievement.isUnlocked}
                unlockedAt={achievement.unlockedAt}
                points={achievement.points}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredAchievements.length === 0 && (
        <div className="empty-achievements">
          <span className="empty-icon">🎯</span>
          <p>لا توجد إنجازات {filter === 'unlocked' ? 'مفتوحة' : filter === 'locked' ? 'مغلقة' : ''} حتى الآن</p>
        </div>
      )}
    </div>
  );
}
