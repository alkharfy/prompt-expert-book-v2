'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearning } from '@/context/LearningContext';
import { getSpecialization } from '@/data/specializations';
import type { SpecializationId } from '@/types/learning';

// أنواع المهام المتاحة
const taskTypes = [
  { id: 'writing', name: 'كتابة محتوى', icon: '✍️', description: 'مقالات، قصص، نصوص إبداعية' },
  { id: 'coding', name: 'برمجة', icon: '💻', description: 'كود، شرح تقني، حل مشاكل' },
  { id: 'analysis', name: 'تحليل', icon: '📊', description: 'تحليل بيانات، مراجعة، تقييم' },
  { id: 'translation', name: 'ترجمة', icon: '🌍', description: 'ترجمة نصوص بين اللغات' },
  { id: 'summarization', name: 'تلخيص', icon: '📝', description: 'تلخيص مقالات، كتب، فيديوهات' },
  { id: 'brainstorming', name: 'عصف ذهني', icon: '💡', description: 'توليد أفكار وحلول إبداعية' },
  { id: 'education', name: 'تعليم', icon: '📚', description: 'شرح مفاهيم، دروس، تمارين' },
  { id: 'marketing', name: 'تسويق', icon: '📣', description: 'إعلانات، حملات، محتوى تسويقي' },
];

// الأنماط المتاحة
const toneStyles = [
  { id: 'professional', name: 'احترافي', icon: '👔' },
  { id: 'casual', name: 'عفوي', icon: '😊' },
  { id: 'formal', name: 'رسمي', icon: '📋' },
  { id: 'friendly', name: 'ودود', icon: '🤝' },
  { id: 'creative', name: 'إبداعي', icon: '🎨' },
  { id: 'academic', name: 'أكاديمي', icon: '🎓' },
];

// مستويات التفصيل
const detailLevels = [
  { id: 'brief', name: 'موجز', description: 'رد قصير ومباشر' },
  { id: 'moderate', name: 'متوسط', description: 'تفاصيل معقولة' },
  { id: 'detailed', name: 'مفصل', description: 'شرح شامل ومفصل' },
];

// اللغات
const languages = [
  { id: 'ar', name: 'العربية', flag: '🇸🇦' },
  { id: 'en', name: 'الإنجليزية', flag: '🇺🇸' },
  { id: 'both', name: 'ثنائي اللغة', flag: '🌐' },
];

interface GeneratorState {
  taskType: string;
  tone: string;
  detailLevel: string;
  language: string;
  context: string;
  specificRequest: string;
  constraints: string;
  examples: string;
}

// قوالب سريعة لكل تخصص
const specTemplates: Record<SpecializationId, { label: string; taskType: string; context: string; request: string }[]> = {
  programming: [
    { label: '📝 كتابة كود', taskType: 'coding', context: 'أنا مبرمج أعمل على مشروع', request: 'اكتبلي دالة تعمل [المهمة] بلغة [اللغة]. اشرح كل خطوة واذكر edge cases.' },
    { label: '🐛 تصحيح خطأ', taskType: 'coding', context: 'عندي خطأ في الكود', request: 'عندي الخطأ ده [رسالة الخطأ] في الكود [الكود]. اشرح السبب واديني الحل.' },
    { label: '📖 توثيق مشروع', taskType: 'writing', context: 'عندي مشروع برمجي محتاج توثيق', request: 'اكتبلي README.md احترافي للمشروع: [وصف المشروع]. يشمل: التثبيت، الاستخدام، API Reference.' },
  ],
  ecommerce: [
    { label: '🏷️ وصف منتج', taskType: 'writing', context: 'صاحب متجر إلكتروني', request: 'اكتبلي وصف منتج جذاب لـ [المنتج]. يشمل: عنوان + 3 نقاط بيع + وصف 150 كلمة + CTA.' },
    { label: '📩 رد على عميل', taskType: 'writing', context: 'عميل عندي مشكلة محتاج أرد عليه', request: 'اكتبلي رد ودود ومهني على عميل يقول: [شكوى العميل]. يحل المشكلة ويحوله لعميل دائم.' },
    { label: '📊 تحليل منافس', taskType: 'analysis', context: 'عايز أفهم المنافسة في سوقي', request: 'حللي [المنافس] — نقاط القوة والضعف واستراتيجية التسعير ونصائح أتفوق عليه.' },
  ],
  design: [
    { label: '🎨 اقتراح هوية بصرية', taskType: 'brainstorming', context: 'مصمم يعمل على هوية بصرية', request: 'اقترح 3 اتجاهات تصميم لـ [المشروع] — كل واحد بـ color palette (hex) + خطوط + أسلوب.' },
    { label: '📋 بريف تصميم', taskType: 'writing', context: 'محتاج أكتب design brief', request: 'اكتبلي design brief لمشروع [نوع المشروع]. يشمل الهدف والجمهور والمنافسين والمخرجات.' },
    { label: '🖼️ وصف صورة AI', taskType: 'creative', context: 'محتاج أولّد صورة بالـ AI', request: 'اكتبلي prompt بالإنجليزي لتوليد صورة: [الوصف]. الأسلوب: [واقعي/illustration]. النسبة: 16:9.' },
  ],
  marketing: [
    { label: '📱 بوست سوشيال', taskType: 'marketing', context: 'مسؤول سوشيال ميديا', request: 'اكتبلي بوست [المنصة] عن [الموضوع]. يشمل: hook + وصف + 5 هاشتاقات + CTA. اللهجة: مصري.' },
    { label: '📣 إعلان مدفوع', taskType: 'marketing', context: 'محتاج إعلان لحملة مدفوعة', request: 'اكتبلي 3 نسخ إعلان [المنصة] لـ [المنتج]. كل نسخة بأسلوب مختلف. الجمهور: [الجمهور].' },
    { label: '📅 خطة محتوى', taskType: 'marketing', context: 'محتاج خطة محتوى أسبوعية', request: 'اعملي خطة محتوى أسبوع لحساب [النوع] على [المنصة]. كل يوم: نوع المحتوى + الموضوع + وقت النشر.' },
  ],
  general: [
    { label: '✉️ إيميل رسمي', taskType: 'writing', context: 'محتاج أكتب إيميل مهني', request: 'اكتبلي إيميل رسمي لـ [المستلم] عن [الموضوع]. النبرة: مهنية. أقل من 100 كلمة.' },
    { label: '📝 تلخيص', taskType: 'summarization', context: 'عندي نص طويل محتاج ألخصه', request: 'لخصلي النص ده في 5 نقاط رئيسية مع رأيك: هل الكاتب مقنع؟' },
    { label: '📋 خطة تعلم', taskType: 'education', context: 'عايز أتعلم مهارة جديدة', request: 'اعملي خطة تعلم [المهارة] في [المدة]. يومياً [الوقت]. مع تمارين عملية ومشروع نهائي.' },
  ],
};

export default function PromptGenerator() {
  const { preferences } = useLearning();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<GeneratorState>({
    taskType: '',
    tone: 'professional',
    detailLevel: 'moderate',
    language: 'ar',
    context: '',
    specificRequest: '',
    constraints: '',
    examples: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const totalSteps = 4;

  const updateState = (key: keyof GeneratorState, value: string) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const generatePrompt = () => {
    const taskInfo = taskTypes.find(t => t.id === state.taskType);
    const toneInfo = toneStyles.find(t => t.id === state.tone);
    const detailInfo = detailLevels.find(d => d.id === state.detailLevel);
    const langInfo = languages.find(l => l.id === state.language);

    let prompt = '';

    // بناء الـ Prompt بشكل ذكي
    prompt += `# الدور والمهمة\n`;
    prompt += `أنت خبير في ${taskInfo?.name || 'المهمة المطلوبة'}. `;
    
    if (state.context) {
      prompt += `\n\n# السياق\n${state.context}`;
    }

    prompt += `\n\n# المطلوب\n${state.specificRequest || 'أريد منك مساعدتي في هذه المهمة.'}`;

    prompt += `\n\n# أسلوب الرد\n`;
    prompt += `- النمط: ${toneInfo?.name}\n`;
    prompt += `- مستوى التفصيل: ${detailInfo?.name} (${detailInfo?.description})\n`;
    prompt += `- اللغة: ${langInfo?.name}`;

    if (state.constraints) {
      prompt += `\n\n# قيود وملاحظات\n${state.constraints}`;
    }

    if (state.examples) {
      prompt += `\n\n# أمثلة للتوضيح\n${state.examples}`;
    }

    prompt += `\n\n# تعليمات إضافية\n`;
    prompt += `- كن دقيقاً ومنظماً في ردك\n`;
    prompt += `- استخدم تنسيق واضح مع عناوين وقوائم عند الحاجة\n`;
    prompt += `- إذا احتجت توضيحاً، اسأل قبل البدء`;

    setGeneratedPrompt(prompt);
    setStep(5);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail for clipboard
    }
  };

  const resetGenerator = () => {
    setState({
      taskType: '',
      tone: 'professional',
      detailLevel: 'moderate',
      language: 'ar',
      context: '',
      specificRequest: '',
      constraints: '',
      examples: '',
    });
    setGeneratedPrompt('');
    setStep(1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return state.taskType !== '';
      case 2: return state.specificRequest.trim() !== '';
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="prompt-generator">
      <div className="generator-header">
        <h2>🛠️ مولد البرومبتات الذكي</h2>
        <p>أنشئ برومبتات احترافية خطوة بخطوة</p>
      </div>

      {/* شريط التقدم */}
      {step <= totalSteps && (
        <div className="generator-progress">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            >
              <div className="step-number">{step > s ? '✓' : s}</div>
              <span className="step-label">
                {s === 1 && 'نوع المهمة'}
                {s === 2 && 'التفاصيل'}
                {s === 3 && 'الأسلوب'}
                {s === 4 && 'إضافات'}
              </span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* الخطوة 1: اختيار نوع المهمة */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="generator-step"
          >
            <h3>ما نوع المهمة التي تريد إنجازها؟</h3>
            
            {/* Quick Templates from specialization */}
            {preferences?.specialization && specTemplates[preferences.specialization] && (
              <div className="spec-templates-section">
                <div className="spec-templates-label">
                  {getSpecialization(preferences.specialization).icon} قوالب سريعة من تخصصك:
                </div>
                <div className="spec-templates-grid">
                  {specTemplates[preferences.specialization].map((tpl, i) => (
                    <button
                      key={i}
                      className="spec-template-btn"
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          taskType: tpl.taskType,
                          context: tpl.context,
                          specificRequest: tpl.request,
                        }));
                        setStep(2);
                      }}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="task-types-grid">
              {taskTypes.map((task) => (
                <button
                  key={task.id}
                  className={`task-type-card ${state.taskType === task.id ? 'selected' : ''}`}
                  onClick={() => updateState('taskType', task.id)}
                >
                  <span className="task-icon">{task.icon}</span>
                  <span className="task-name">{task.name}</span>
                  <span className="task-desc">{task.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* الخطوة 2: تفاصيل الطلب */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="generator-step"
          >
            <h3>أخبرنا عن طلبك بالتفصيل</h3>
            
            <div className="input-group">
              <label>السياق (اختياري)</label>
              <textarea
                placeholder="أي معلومات خلفية مهمة... مثال: أنا أعمل على مشروع تخرج في مجال..."
                value={state.context}
                onChange={(e) => updateState('context', e.target.value)}
                rows={3}
              />
            </div>

            <div className="input-group">
              <label>ما الذي تريده بالتحديد؟ *</label>
              <textarea
                placeholder="اكتب طلبك الأساسي هنا... مثال: أريد كتابة مقال عن فوائد الذكاء الاصطناعي في التعليم"
                value={state.specificRequest}
                onChange={(e) => updateState('specificRequest', e.target.value)}
                rows={4}
                required
              />
            </div>
          </motion.div>
        )}

        {/* الخطوة 3: الأسلوب والتفاصيل */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="generator-step"
          >
            <h3>كيف تريد أن يكون الرد؟</h3>
            
            <div className="options-section">
              <label>النمط والأسلوب</label>
              <div className="options-row">
                {toneStyles.map((tone) => (
                  <button
                    key={tone.id}
                    className={`option-btn ${state.tone === tone.id ? 'selected' : ''}`}
                    onClick={() => updateState('tone', tone.id)}
                  >
                    <span>{tone.icon}</span>
                    <span>{tone.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="options-section">
              <label>مستوى التفصيل</label>
              <div className="detail-options">
                {detailLevels.map((level) => (
                  <button
                    key={level.id}
                    className={`detail-btn ${state.detailLevel === level.id ? 'selected' : ''}`}
                    onClick={() => updateState('detailLevel', level.id)}
                  >
                    <span className="detail-name">{level.name}</span>
                    <span className="detail-desc">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="options-section">
              <label>لغة الرد</label>
              <div className="options-row">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    className={`option-btn ${state.language === lang.id ? 'selected' : ''}`}
                    onClick={() => updateState('language', lang.id)}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* الخطوة 4: إضافات اختيارية */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="generator-step"
          >
            <h3>إضافات اختيارية لتحسين البرومبت</h3>
            
            <div className="input-group">
              <label>قيود أو ملاحظات</label>
              <textarea
                placeholder="أي شروط أو قيود... مثال: لا تستخدم مصطلحات تقنية معقدة، التزم بـ 500 كلمة كحد أقصى"
                value={state.constraints}
                onChange={(e) => updateState('constraints', e.target.value)}
                rows={3}
              />
            </div>

            <div className="input-group">
              <label>أمثلة للتوضيح</label>
              <textarea
                placeholder="أمثلة تساعد في فهم ما تريد... مثال: أريد الأسلوب مشابهاً لمقالات موقع كذا..."
                value={state.examples}
                onChange={(e) => updateState('examples', e.target.value)}
                rows={3}
              />
            </div>
          </motion.div>
        )}

        {/* الخطوة 5: النتيجة */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="generator-step result-step"
          >
            <div className="result-header">
              <h3>🎉 البرومبت جاهز!</h3>
              <button className="reset-btn" onClick={resetGenerator}>
                🔄 إنشاء برومبت جديد
              </button>
            </div>

            <div className="generated-prompt-container">
              <div className="prompt-actions">
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                >
                  {copied ? '✅ تم النسخ!' : '📋 نسخ البرومبت'}
                </button>
              </div>
              <pre className="generated-prompt-text">{generatedPrompt}</pre>
            </div>

            <div className="prompt-tips">
              <h4>💡 نصائح للاستخدام:</h4>
              <ul>
                <li>يمكنك تعديل البرومبت حسب حاجتك</li>
                <li>جرب إضافة المزيد من التفاصيل للحصول على نتائج أفضل</li>
                <li>استخدم هذا البرومبت مع أي نموذج AI تفضله</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* أزرار التنقل */}
      {step <= totalSteps && (
        <div className="generator-navigation">
          {step > 1 && (
            <button 
              className="nav-btn prev-btn"
              onClick={() => setStep(step - 1)}
            >
              → السابق
            </button>
          )}
          
          {step < totalSteps ? (
            <button 
              className="nav-btn next-btn"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              التالي ←
            </button>
          ) : (
            <button 
              className="nav-btn generate-btn"
              onClick={generatePrompt}
            >
              ✨ إنشاء البرومبت
            </button>
          )}
        </div>
      )}
    </div>
  );
}
