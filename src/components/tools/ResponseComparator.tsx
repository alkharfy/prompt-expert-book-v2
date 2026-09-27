'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComparisonItem {
  id: string;
  prompt: string;
  response: string;
  model?: string;
  timestamp: Date;
}

interface ComparisonMetrics {
  length: number;
  wordCount: number;
  hasStructure: boolean;
  hasExamples: boolean;
  hasCode: boolean;
  tone: 'formal' | 'casual' | 'technical';
}

const modelOptions = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🟢' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🔵' },
  { id: 'claude', name: 'Claude', icon: '🟣' },
  { id: 'gemini', name: 'Gemini', icon: '🔴' },
  { id: 'other', name: 'آخر', icon: '⚪' },
];

export default function ResponseComparator() {
  const [items, setItems] = useState<ComparisonItem[]>([
    { id: '1', prompt: '', response: '', model: 'chatgpt', timestamp: new Date() },
    { id: '2', prompt: '', response: '', model: 'claude', timestamp: new Date() },
  ]);
  const [activeTab, setActiveTab] = useState<'input' | 'compare'>('input');
  const [useSamePrompt, setUseSamePrompt] = useState(true);
  const [sharedPrompt, setSharedPrompt] = useState('');

  const addComparison = () => {
    if (items.length >= 4) return;
    const newId = (parseInt(items[items.length - 1]?.id || '0') + 1).toString();
    setItems([...items, { 
      id: newId, 
      prompt: useSamePrompt ? sharedPrompt : '', 
      response: '', 
      model: 'other',
      timestamp: new Date() 
    }]);
  };

  const removeComparison = (id: string) => {
    if (items.length <= 2) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ComparisonItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const canCompare = () => {
    if (useSamePrompt && !sharedPrompt.trim()) return false;
    return items.every(item => 
      (useSamePrompt || item.prompt.trim()) && item.response.trim()
    );
  };

  const analyzeResponse = (text: string): ComparisonMetrics => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return {
      length: text.length,
      wordCount: words.length,
      hasStructure: /[\n-•#\d\.]/i.test(text),
      hasExamples: /مثال|example|مثلاً|for instance/i.test(text),
      hasCode: /```|`[^`]+`|<code>|function\s|const\s|let\s/i.test(text),
      tone: detectTone(text),
    };
  };

  const detectTone = (text: string): 'formal' | 'casual' | 'technical' => {
    const technicalPatterns = /API|function|code|algorithm|data|system|framework/i;
    const formalPatterns = /نود|يسعدنا|نأمل|بناءً على|وفقاً/i;
    
    if (technicalPatterns.test(text)) return 'technical';
    if (formalPatterns.test(text)) return 'formal';
    return 'casual';
  };

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'formal': return 'رسمي';
      case 'casual': return 'عفوي';
      case 'technical': return 'تقني';
      default: return tone;
    }
  };

  const getModelIcon = (modelId?: string) => {
    return modelOptions.find(m => m.id === modelId)?.icon || '⚪';
  };

  const getModelName = (modelId?: string) => {
    return modelOptions.find(m => m.id === modelId)?.name || 'غير محدد';
  };

  const getComparisonSummary = () => {
    const metrics = items.map(item => ({
      ...item,
      metrics: analyzeResponse(item.response)
    }));

    // العثور على الأطول والأقصر
    const byLength = [...metrics].sort((a, b) => b.metrics.wordCount - a.metrics.wordCount);
    const longest = byLength[0];
    const shortest = byLength[byLength.length - 1];

    // العثور على الأكثر تنظيماً
    const structured = metrics.filter(m => m.metrics.hasStructure);

    return {
      metrics,
      longest,
      shortest,
      structuredCount: structured.length,
      withExamples: metrics.filter(m => m.metrics.hasExamples).length,
      withCode: metrics.filter(m => m.metrics.hasCode).length,
    };
  };

  const resetComparator = () => {
    setItems([
      { id: '1', prompt: '', response: '', model: 'chatgpt', timestamp: new Date() },
      { id: '2', prompt: '', response: '', model: 'claude', timestamp: new Date() },
    ]);
    setSharedPrompt('');
    setActiveTab('input');
  };

  return (
    <div className="response-comparator">
      <div className="comparator-header">
        <h2>⚖️ مقارن الردود</h2>
        <p>قارن بين ردود نماذج AI المختلفة</p>
      </div>

      {/* Tabs */}
      <div className="comparator-tabs">
        <button 
          className={`comp-tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          📝 إدخال الردود
        </button>
        <button 
          className={`comp-tab ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
          disabled={!canCompare()}
        >
          📊 المقارنة
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="input-section"
          >
            {/* خيار البرومبت المشترك */}
            <div className="shared-prompt-toggle">
              <label className="toggle-container">
                <input 
                  type="checkbox" 
                  checked={useSamePrompt}
                  onChange={(e) => setUseSamePrompt(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">استخدام نفس البرومبت لجميع الردود</span>
              </label>
            </div>

            {useSamePrompt && (
              <div className="shared-prompt-input">
                <label>البرومبت المشترك</label>
                <textarea
                  placeholder="اكتب البرومبت الذي استخدمته مع جميع النماذج..."
                  value={sharedPrompt}
                  onChange={(e) => setSharedPrompt(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* قائمة الردود */}
            <div className="responses-list">
              {items.map((item, index) => (
                <div key={item.id} className="response-input-card">
                  <div className="response-card-header">
                    <span className="response-number">الرد {index + 1}</span>
                    <div className="model-selector">
                      <label>النموذج:</label>
                      <select 
                        value={item.model}
                        onChange={(e) => updateItem(item.id, 'model', e.target.value)}
                      >
                        {modelOptions.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.icon} {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {items.length > 2 && (
                      <button 
                        className="remove-response-btn"
                        onClick={() => removeComparison(item.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {!useSamePrompt && (
                    <div className="input-group">
                      <label>البرومبت</label>
                      <textarea
                        placeholder="البرومبت المستخدم..."
                        value={item.prompt}
                        onChange={(e) => updateItem(item.id, 'prompt', e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="input-group">
                    <label>الرد</label>
                    <textarea
                      placeholder="الصق رد النموذج هنا..."
                      value={item.response}
                      onChange={(e) => updateItem(item.id, 'response', e.target.value)}
                      rows={6}
                    />
                    <div className="char-count">
                      {item.response.length} حرف • {item.response.split(/\s+/).filter(w => w).length} كلمة
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* إضافة رد جديد */}
            {items.length < 4 && (
              <button className="add-response-btn" onClick={addComparison}>
                ➕ إضافة رد للمقارنة
              </button>
            )}

            {/* زر المقارنة */}
            <button 
              className="compare-btn"
              onClick={() => setActiveTab('compare')}
              disabled={!canCompare()}
            >
              📊 مقارنة الردود
            </button>
          </motion.div>
        )}

        {activeTab === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="comparison-section"
          >
            {(() => {
              const summary = getComparisonSummary();
              return (
                <>
                  {/* ملخص المقارنة */}
                  <div className="comparison-summary">
                    <h3>📈 ملخص المقارنة</h3>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-icon">📏</span>
                        <span className="summary-label">الأطول</span>
                        <span className="summary-value">
                          {getModelIcon(summary.longest.model)} {getModelName(summary.longest.model)}
                          <small>({summary.longest.metrics.wordCount} كلمة)</small>
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-icon">⚡</span>
                        <span className="summary-label">الأقصر</span>
                        <span className="summary-value">
                          {getModelIcon(summary.shortest.model)} {getModelName(summary.shortest.model)}
                          <small>({summary.shortest.metrics.wordCount} كلمة)</small>
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-icon">🏗️</span>
                        <span className="summary-label">ردود منظمة</span>
                        <span className="summary-value">{summary.structuredCount} من {items.length}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-icon">📚</span>
                        <span className="summary-label">تحتوي أمثلة</span>
                        <span className="summary-value">{summary.withExamples} من {items.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* جدول المقارنة التفصيلي */}
                  <div className="comparison-table-container">
                    <h3>📊 مقارنة تفصيلية</h3>
                    <div className="comparison-table">
                      <div className="table-header">
                        <div className="table-cell header-cell">المعيار</div>
                        {summary.metrics.map((item, idx) => (
                          <div key={item.id} className="table-cell header-cell model-header">
                            <span className="model-icon-large">{getModelIcon(item.model)}</span>
                            <span>{getModelName(item.model)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">عدد الكلمات</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {item.metrics.wordCount}
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">عدد الأحرف</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {item.metrics.length}
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">منظم</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {item.metrics.hasStructure ? '✅' : '❌'}
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">يحتوي أمثلة</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {item.metrics.hasExamples ? '✅' : '❌'}
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">يحتوي كود</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {item.metrics.hasCode ? '✅' : '❌'}
                          </div>
                        ))}
                      </div>

                      <div className="table-row">
                        <div className="table-cell label-cell">النمط</div>
                        {summary.metrics.map((item) => (
                          <div key={item.id} className="table-cell">
                            {getToneLabel(item.metrics.tone)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* عرض الردود جنباً لجنب */}
                  <div className="side-by-side">
                    <h3>👁️ عرض الردود</h3>
                    <div className="responses-grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                      {summary.metrics.map((item) => (
                        <div key={item.id} className="response-preview">
                          <div className="preview-header">
                            {getModelIcon(item.model)} {getModelName(item.model)}
                          </div>
                          <div className="preview-content">
                            {item.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* زر العودة */}
            <div className="comparison-actions">
              <button 
                className="back-btn"
                onClick={() => setActiveTab('input')}
              >
                ← تعديل الردود
              </button>
              <button className="reset-btn" onClick={resetComparator}>
                🔄 مقارنة جديدة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
