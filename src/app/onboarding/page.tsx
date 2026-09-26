'use client';

import { useState, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';
import StepGoalAndSpec from '@/components/onboarding/StepGoalAndSpec';
import StepPathAndDuration from '@/components/onboarding/StepPathAndDuration';
import QuickWin from '@/components/onboarding/QuickWin';
import { trackOnboardingStep } from '@/lib/analytics';
import type {
  LearningGoalId,
  SpecializationId,
  LearningPathId,
  LearningDurationId,
} from '@/types/learning';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<LearningGoalId | null>(null);
  const [spec, setSpec] = useState<SpecializationId | null>(null);
  const [path, setPath] = useState<LearningPathId | null>(null);
  const [duration, setDuration] = useState<LearningDurationId | null>(null);
  const [saving, setSaving] = useState(false);

  const goStep = (n: number) => {
    setStep(n);
    trackOnboardingStep(n + 1, 3);
  };

  const handleSkip = () => {
    localStorage.setItem(
      'user_learning_goal',
      JSON.stringify({ goal: 'skipped', selectedAt: new Date().toISOString() })
    );
    window.location.href = '/read/intro/1';
  };

  const handleFinish = async () => {
    if (!goal || !spec || !path || !duration) return;
    setSaving(true);

    // save to localStorage for compatibility
    localStorage.setItem(
      'user_learning_goal',
      JSON.stringify({ goal, selectedAt: new Date().toISOString() })
    );

    // persist to Supabase via API
    try {
      await fetch('/api/learning-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningGoal: goal, specialization: spec, learningPath: path, learningDuration: duration }),
      });
    } catch {
      // non-blocking — localStorage already saved
    }

    window.location.href = '/read/intro/1';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)',
        direction: 'rtl',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Navigation />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 800,
              marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #ff6b35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {step === 0 && 'حدد هدفك ومجالك'}
            {step === 1 && 'اختر مسارك ومدتك'}
            {step === 2 && 'أول نجاح سريع! 🎯'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem', margin: '0 0 8px' }}>
            يساعدنا نخصصلك أفضل تجربة تعلّم
          </p>
          {step < 2 && (
            <button onClick={handleSkip} style={skipBtn}>
              تخطي ←
            </button>
          )}
        </div>

        <ProgressIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepGoalAndSpec
              key="step0"
              selectedGoal={goal}
              selectedSpec={spec}
              onGoalChange={setGoal}
              onSpecChange={setSpec}
              onNext={() => goStep(1)}
            />
          )}
          {step === 1 && (
            <StepPathAndDuration
              key="step1"
              selectedPath={path}
              selectedDuration={duration}
              onPathChange={setPath}
              onDurationChange={setDuration}
              onNext={() => goStep(2)}
              onBack={() => goStep(0)}
            />
          )}
          {step === 2 && spec && (
            <QuickWin
              key="step2"
              specialization={spec}
              onFinish={handleFinish}
            />
          )}
        </AnimatePresence>

        {saving && (
          <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            جاري الحفظ...
          </div>
        )}
      </main>
    </div>
  );
}

const skipBtn: React.CSSProperties = {
  marginTop: 8,
  background: 'none',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.5)',
  padding: '6px 20px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            direction: 'rtl',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 107, 53, 0.2)',
              borderTopColor: '#ff6b35',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
