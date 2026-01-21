'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// معايير تقييم البرومبت
interface AnalysisCriteria {
  id: string;
  name: string;
  icon: string;
  weight: number;
  description: string;
}

const analysisCriteria: AnalysisCriteria[] = [
  { id: 'clarity', name: 'الوضوح', icon: '🎯', weight: 20, description: 'هل الطلب واضح ومفهوم؟' },
  { id: 'specificity', name: 'التحديد', icon: '📌', weight: 20, description: 'هل يحتوي على تفاصيل محددة؟' },
  { id: 'context', name: 'السياق', icon: '📖', weight: 15, description: 'هل يوفر معلومات خلفية كافية؟' },
  { id: 'structure', name: 'الهيكلة', icon: '🏗️', weight: 15, description: 'هل البرومبت منظم بشكل جيد؟' },
  { id: 'actionable', name: 'قابلية التنفيذ', icon: '✅', weight: 15, description: 'هل المطلوب واضح وقابل للتنفيذ؟' },
  { id: 'constraints', name: 'القيود', icon: '📏', weight: 15, description: 'هل يحدد قيود أو شروط؟' },
];

// أنماط شائعة في البرومبتات
const promptPatterns = {
  hasRole: /أنت|تصرف|كـ|بصفتك|you are|act as|as a/i,
  hasContext: /السياق|الخلفية|context|background/i,
  hasExamples: /مثال|أمثلة|example|for instance/i,
  hasConstraints: /لا تـ|تجنب|يجب|حد أقصى|كحد|don't|avoid|must|maximum/i,
  hasFormat: /تنسيق|شكل|قائمة|نقاط|format|list|bullet/i,
  hasOutput: /أريد|النتيجة|الناتج|المخرج|output|result|i want/i,
  hasSteps: /خطوة|خطوات|step|steps|أولاً|ثانياً/i,
  hasQuestion: /\?|؟/,
  isShort: (text: string) => text.length < 50,
  isMedium: (text: string) => text.length >= 50 && text.length < 200,
  isLong: (text: string) => text.length >= 200,
};

interface AnalysisResult {
  overallScore: number;
  scores: { [key: string]: number };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedPrompt: string;
}

export default function PromptAnalyzer() {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const [copied, setCopied] = useState(false);

  const analyzePrompt = () => {
    if (!prompt.trim()) return;

    setIsAnalyzing(true);

    // محاكاة تأخير التحليل
    setTimeout(() => {
      const analysis = performAnalysis(prompt);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  const performAnalysis = (text: string): AnalysisResult => {
    const scores: { [key: string]: number } = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // تحليل الوضوح
    let clarityScore = 50;
    if (text.length > 30) clarityScore += 15;
    if (!promptPatterns.isShort(text)) clarityScore += 10;
    if (promptPatterns.hasOutput.test(text)) clarityScore += 15;
    if (promptPatterns.hasQuestion.test(text)) clarityScore += 10;
    scores.clarity = Math.min(clarityScore, 100);

    if (scores.clarity >= 70) {
      strengths.push('الطلب واضح ومفهوم');
    } else {
      weaknesses.push('الطلب يحتاج لمزيد من الوضوح');
      suggestions.push('حدد بوضوح ما تريد الحصول عليه');
    }

    // تحليل التحديد
    let specificityScore = 40;
    if (promptPatterns.hasRole.test(text)) specificityScore += 20;
    if (promptPatterns.hasExamples.test(text)) specificityScore += 20;
    if (promptPatterns.hasSteps.test(text)) specificityScore += 10;
    if (text.match(/\d+/)) specificityScore += 10; // أرقام تدل على تحديد
    scores.specificity = Math.min(specificityScore, 100);

    if (scores.specificity >= 70) {
      strengths.push('يحتوي على تفاصيل محددة');
    } else {
      weaknesses.push('يفتقر لتفاصيل محددة');
      suggestions.push('أضف أمثلة أو أرقام محددة لتوضيح المطلوب');
    }

    // تحليل السياق
    let contextScore = 30;
    if (promptPatterns.hasContext.test(text)) contextScore += 40;
    if (promptPatterns.hasRole.test(text)) contextScore += 20;
    if (promptPatterns.isLong(text)) contextScore += 10;
    scores.context = Math.min(contextScore, 100);

    if (scores.context >= 60) {
      strengths.push('يوفر سياقاً مناسباً');
    } else {
      weaknesses.push('السياق غير كافٍ');
      suggestions.push('أضف معلومات خلفية عن المهمة أو الهدف');
    }

    // تحليل الهيكلة
    let structureScore = 40;
    if (text.includes('\n')) structureScore += 20;
    if (text.includes('#') || text.includes('-') || text.includes('•')) structureScore += 20;
    if (promptPatterns.hasSteps.test(text)) structureScore += 20;
    scores.structure = Math.min(structureScore, 100);

    if (scores.structure >= 60) {
      strengths.push('منظم بشكل جيد');
    } else {
      weaknesses.push('يحتاج لتنظيم أفضل');
      suggestions.push('قسّم البرومبت لأقسام واضحة (الدور، المهمة، القيود)');
    }

    // تحليل قابلية التنفيذ
    let actionableScore = 50;
    if (promptPatterns.hasOutput.test(text)) actionableScore += 25;
    if (promptPatterns.hasFormat.test(text)) actionableScore += 15;
    if (!promptPatterns.isShort(text)) actionableScore += 10;
    scores.actionable = Math.min(actionableScore, 100);

    if (scores.actionable >= 70) {
      strengths.push('المطلوب واضح وقابل للتنفيذ');
    } else {
      weaknesses.push('المطلوب غير واضح تماماً');
      suggestions.push('حدد الشكل أو التنسيق المطلوب للناتج');
    }

    // تحليل القيود
    let constraintsScore = 30;
    if (promptPatterns.hasConstraints.test(text)) constraintsScore += 40;
    if (promptPatterns.hasFormat.test(text)) constraintsScore += 15;
    if (text.match(/\d+\s*(كلمة|word|حرف|char)/i)) constraintsScore += 15;
    scores.constraints = Math.min(constraintsScore, 100);

    if (scores.constraints >= 50) {
      strengths.push('يحدد قيوداً واضحة');
    } else {
      suggestions.push('أضف قيوداً مثل: طول الرد، ما يجب تجنبه');
    }

    // حساب النتيجة الإجمالية
    let totalWeight = 0;
    let weightedSum = 0;
    analysisCriteria.forEach(criteria => {
      weightedSum += (scores[criteria.id] || 0) * criteria.weight;
      totalWeight += criteria.weight;
    });
    const overallScore = Math.round(weightedSum / totalWeight);

    // إنشاء البرومبت المحسن
    const improvedPrompt = generateImprovedPrompt(text, scores);

    return {
      overallScore,
      scores,
      strengths,
      weaknesses,
      suggestions,
      improvedPrompt,
    };
  };

  const generateImprovedPrompt = (originalPrompt: string, scores: { [key: string]: number }): string => {
    let improved = '';

    // إضافة دور إذا لم يكن موجوداً
    if (scores.context < 50 && !promptPatterns.hasRole.test(originalPrompt)) {
      improved += '# الدور\nأنت مساعد خبير ومتخصص.\n\n';
    }

    // إضافة السياق
    if (scores.context < 50) {
      improved += '# السياق\n[أضف هنا معلومات خلفية عن المهمة]\n\n';
    }

    // المهمة الأساسية
    improved += '# المهمة\n';
    improved += originalPrompt.trim();
    improved += '\n\n';

    // إضافة قسم التنسيق إذا لم يكن موجوداً
    if (scores.actionable < 60) {
      improved += '# التنسيق المطلوب\n- استخدم تنسيقاً واضحاً ومنظماً\n- قسّم الرد لأقسام عند الحاجة\n\n';
    }

    // إضافة القيود
    if (scores.constraints < 50) {
      improved += '# القيود\n- [حدد طول الرد المطلوب]\n- [حدد ما يجب تجنبه]\n';
    }

    return improved;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'مقبول';
    return 'يحتاج تحسين';
  };

  const copyImproved = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.improvedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail for clipboard
      }
    }
  };

  const resetAnalyzer = () => {
    setPrompt('');
    setResult(null);
    setShowImproved(false);
  };

  return (
    <div className="prompt-analyzer">
      <div className="analyzer-header">
        <h2>🔍 محلل البرومبتات</h2>
        <p>حلل برومبتك واحصل على نصائح لتحسينه</p>
      </div>

      {!result ? (
        <div className="analyzer-input-section">
          <div className="input-group">
            <label>الصق البرومبت هنا للتحليل</label>
            <textarea
              placeholder="اكتب أو الصق البرومبت الذي تريد تحليله..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
            />
            <div className="char-count">
              {prompt.length} حرف
            </div>
          </div>

          <button 
            className="analyze-btn"
            onClick={analyzePrompt}
            disabled={!prompt.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading-spinner"></span>
                جاري التحليل...
              </>
            ) : (
              <>🔍 تحليل البرومبت</>
            )}
          </button>
        </div>
      ) : (
        <motion.div 
          className="analysis-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* النتيجة الإجمالية */}
          <div className="overall-score-card">
            <div 
              className="score-circle"
              style={{ 
                background: `conic-gradient(${getScoreColor(result.overallScore)} ${result.overallScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)` 
              }}
            >
              <div className="score-inner">
                <span className="score-number">{result.overallScore}</span>
                <span className="score-label">{getScoreLabel(result.overallScore)}</span>
              </div>
            </div>
            <div className="score-description">
              <h3>النتيجة الإجمالية</h3>
              <p>
                {result.overallScore >= 80 && 'برومبت ممتاز! جاهز للاستخدام.'}
                {result.overallScore >= 60 && result.overallScore < 80 && 'برومبت جيد مع فرص للتحسين.'}
                {result.overallScore >= 40 && result.overallScore < 60 && 'يحتاج بعض التحسينات.'}
                {result.overallScore < 40 && 'يحتاج تحسينات كبيرة.'}
              </p>
            </div>
          </div>

          {/* تفاصيل المعايير */}
          <div className="criteria-breakdown">
            <h4>تحليل مفصل</h4>
            <div className="criteria-list">
              {analysisCriteria.map((criteria) => (
                <div key={criteria.id} className="criteria-item">
                  <div className="criteria-header">
                    <span className="criteria-icon">{criteria.icon}</span>
                    <span className="criteria-name">{criteria.name}</span>
                    <span 
                      className="criteria-score"
                      style={{ color: getScoreColor(result.scores[criteria.id] || 0) }}
                    >
                      {result.scores[criteria.id] || 0}%
                    </span>
                  </div>
                  <div className="criteria-bar">
                    <div 
                      className="criteria-fill"
                      style={{ 
                        width: `${result.scores[criteria.id] || 0}%`,
                        backgroundColor: getScoreColor(result.scores[criteria.id] || 0)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* نقاط القوة والضعف */}
          <div className="feedback-sections">
            {result.strengths.length > 0 && (
              <div className="feedback-section strengths">
                <h4>✅ نقاط القوة</h4>
                <ul>
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.weaknesses.length > 0 && (
              <div className="feedback-section weaknesses">
                <h4>⚠️ نقاط تحتاج تحسين</h4>
                <ul>
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.suggestions.length > 0 && (
              <div className="feedback-section suggestions">
                <h4>💡 اقتراحات</h4>
                <ul>
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* البرومبت المحسن */}
          <div className="improved-section">
            <button 
              className="toggle-improved-btn"
              onClick={() => setShowImproved(!showImproved)}
            >
              {showImproved ? '🔼 إخفاء النسخة المحسنة' : '🔽 عرض النسخة المحسنة'}
            </button>

            <AnimatePresence>
              {showImproved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="improved-prompt-container"
                >
                  <div className="improved-header">
                    <span>✨ النسخة المحسنة</span>
                    <button 
                      className={`copy-btn ${copied ? 'copied' : ''}`}
                      onClick={copyImproved}
                    >
                      {copied ? '✅ تم النسخ!' : '📋 نسخ'}
                    </button>
                  </div>
                  <pre className="improved-prompt-text">{result.improvedPrompt}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* زر إعادة المحاولة */}
          <button className="reset-btn" onClick={resetAnalyzer}>
            🔄 تحليل برومبت جديد
          </button>
        </motion.div>
      )}
    </div>
  );
}
