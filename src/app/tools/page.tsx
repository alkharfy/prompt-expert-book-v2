'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authSystem } from '@/lib/auth_system';
import Navigation from '@/components/Navigation';
import PromptGenerator from '@/components/tools/PromptGenerator';
import PromptAnalyzer from '@/components/tools/PromptAnalyzer';
import ResponseComparator from '@/components/tools/ResponseComparator';
import FeatureGate from '@/components/FeatureGate';

type ToolType = 'generator' | 'analyzer' | 'comparator';

interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const tools: Tool[] = [
  {
    id: 'generator',
    name: 'مولد البرومبتات',
    icon: '🛠️',
    description: 'أنشئ برومبتات احترافية خطوة بخطوة',
    color: '#ff6b35',
  },
  {
    id: 'analyzer',
    name: 'محلل البرومبتات',
    icon: '🔍',
    description: 'حلل برومبتك واحصل على نصائح لتحسينه',
    color: '#22c55e',
  },
  {
    id: 'comparator',
    name: 'مقارن الردود',
    icon: '⚖️',
    description: 'قارن بين ردود نماذج AI المختلفة',
    color: '#8b5cf6',
  },
];

export default function ToolsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userId = authSystem.getCurrentUserId();
      if (!userId) {
        router.push('/login');
        return;
      }
      setIsLoggedIn(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Navigation />
      <FeatureGate feature="tools">
        <div className="tools-page">
        <div className="tools-container">
          {/* Header */}
          <div className="tools-header">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🧰 صندوق الأدوات
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              أدوات متقدمة لمساعدتك في إتقان فن البرومبتات
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {!activeTool ? (
              /* Tools Selection Grid */
              <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="tools-grid"
              >
                {tools.map((tool, index) => (
                  <motion.button
                    key={tool.id}
                    className="tool-card"
                    onClick={() => setActiveTool(tool.id)}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ '--tool-color': tool.color } as React.CSSProperties}
                  >
                    <div className="tool-icon">{tool.icon}</div>
                    <h3 className="tool-name">{tool.name}</h3>
                    <p className="tool-description">{tool.description}</p>
                    <span className="tool-arrow">←</span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              /* Active Tool View */
              <motion.div
                key="tool"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="active-tool-container"
              >
                {/* Back Button */}
                <button 
                  className="back-to-tools"
                  onClick={() => setActiveTool(null)}
                >
                  → العودة للأدوات
                </button>

                {/* Tool Component */}
                {activeTool === 'generator' && <PromptGenerator />}
                {activeTool === 'analyzer' && <PromptAnalyzer />}
                {activeTool === 'comparator' && <ResponseComparator />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips Section */}
          {!activeTool && (
            <motion.div 
              className="tools-tips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3>💡 نصائح للاستخدام</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <span className="tip-icon">1️⃣</span>
                  <p>ابدأ بـ<strong>مولد البرومبتات</strong> إذا كنت جديداً وتريد تعلم بناء برومبتات منظمة</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">2️⃣</span>
                  <p>استخدم <strong>المحلل</strong> لفحص برومبتاتك الحالية ومعرفة نقاط التحسين</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">3️⃣</span>
                  <p>جرب <strong>المقارن</strong> لتفهم الفروقات بين ردود النماذج المختلفة</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      </FeatureGate>
    </>
  );
}
