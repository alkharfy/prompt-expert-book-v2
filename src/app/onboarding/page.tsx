'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ChoiceStep, { type ChoiceOption } from '@/components/onboarding/ChoiceStep';
import ResultScreen, { type PlanOutcome } from '@/components/onboarding/ResultScreen';
import { days, duration } from '@/components/onboarding/arabicCounts';
import { useSubscription } from '@/context/SubscriptionContext';
import { PROFESSION_TRIES } from '@/data/professionTries';
import { trackOnboarding } from '@/lib/analytics';
import { authSystem } from '@/lib/auth_system';
import {
  DAILY_MINUTES_OPTIONS,
  GUEST_LAST_PAGE_KEY,
  PROFESSION_IDS,
  estimatePlan,
  getSafeDestination,
  isAiLevelId,
  isDailyMinutes,
  isProfessionId,
  resolveStartDestination,
} from '@/lib/onboarding';
import type { AiLevelId, DailyMinutes, OnboardingStatus, ProfessionId } from '@/types/learning';

const PROFESSION_OPTIONS: ChoiceOption<ProfessionId>[] = PROFESSION_IDS.map(id => ({
  id,
  icon: PROFESSION_TRIES[id].icon,
  label: PROFESSION_TRIES[id].label,
}));

const LEVEL_OPTIONS: ChoiceOption<AiLevelId>[] = [
  { id: 'new', icon: '🌱', label: 'أول مرة', hint: 'عايز أبدأ خطوة بخطوة' },
  { id: 'some', icon: '🙂', label: 'جرّبته كام مرة', hint: 'بس النتيجة مش بتعجبني' },
  { id: 'daily', icon: '⚡', label: 'بستخدمه كل يوم تقريباً', hint: 'عايز أوفّر وقت وفلوس' },
];

const MINUTES_LABEL: Record<DailyMinutes, string> = { 10: '10 دقايق', 20: '20 دقيقة', 30: 'نص ساعة' };
const MINUTES_ICON: Record<DailyMinutes, string> = { 10: '☕', 20: '⏱️', 30: '🚀' };
const ADVANCE_MS = 220;
const STEP_COUNT = 3;

function readGuestLastPage(): string | null {
  try { return localStorage.getItem(GUEST_LAST_PAGE_KEY); } catch { return null; }
}
function clearGuestLastPage() {
  try { localStorage.removeItem(GUEST_LAST_PAGE_KEY); } catch { /* storage blocked */ }
}

interface SaveBody {
  profession: ProfessionId | null;
  aiLevel: AiLevelId | null;
  dailyMinutes: DailyMinutes | null;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => getSafeDestination(searchParams.get('next')), [searchParams]);
  const source = (searchParams.get('from') || 'direct').replace(/[^a-z_-]/gi, '').slice(0, 20);
  const { hasFeature, isLoading: subscriptionLoading } = useSubscription();
  const hasFullAccess = !subscriptionLoading && hasFeature('reading');

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<ProfessionId | null>(null);
  const [level, setLevel] = useState<AiLevelId | null>(null);
  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);
  const [guestLastPath, setGuestLastPath] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving');
  const [plan, setPlan] = useState<PlanOutcome | null>(null);
  const [replanState, setReplanState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const startedAt = useRef(Date.now());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authSystem.getCurrentUserId()) {
      router.replace('/login?next=/onboarding');
      return;
    }
    setGuestLastPath(readGuestLastPage());
    setReady(true);
    trackOnboarding('view', { source, has_next: !!next });

    // Returning reader ("change my settings"): start from their saved answers.
    fetch('/api/learning-preferences')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const saved = data?.preferences;
        if (!saved) return;
        if (isProfessionId(saved.profession)) setProfession(current => current ?? saved.profession);
        if (isAiLevelId(saved.aiLevel)) setLevel(current => current ?? saved.aiLevel);
        if (isDailyMinutes(saved.dailyMinutes)) setMinutes(current => current ?? saved.dailyMinutes);
      })
      .catch(() => { /* prefill is optional */ });

    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
    // Runs once per visit; source/next come from the URL that opened the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const destination = useMemo(
    () => resolveStartDestination({ next, guestLastPath, level }),
    [next, guestLastPath, level],
  );

  const save = useCallback(async (status: OnboardingStatus, body: SaveBody) => {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, status, startPath: destination.href }),
      keepalive: true,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error('save_failed');
    return data as { ok: true; plan: { created: boolean; existing: boolean; failed: boolean; scope: string | null } | null };
  }, [destination.href]);

  const complete = useCallback(async (chosenMinutes: DailyMinutes) => {
    setSaveState('saving');
    setPlan(null);
    try {
      const data = await save('completed', { profession, aiLevel: level, dailyMinutes: chosenMinutes });
      const result = data.plan;
      setPlan({ created: !!result?.created, existing: !!result?.existing, failed: !!result?.failed });
      setSaveState('saved');
      trackOnboarding('plan', {
        outcome: result?.created ? 'created' : result?.existing ? 'existing' : result?.failed ? 'failed' : 'none',
        scope: result?.scope ?? null,
        minutes: chosenMinutes,
      });
    } catch {
      setSaveState('error');
      trackOnboarding('save_error', { at: 'complete' });
    }
  }, [save, profession, level]);

  const advance = (to: number, after?: () => void) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => { setStep(to); after?.(); }, ADVANCE_MS);
  };

  const chooseProfession = (value: ProfessionId) => {
    setProfession(value);
    trackOnboarding('answer', { step: 1, value });
    advance(1);
  };
  const chooseLevel = (value: AiLevelId) => {
    setLevel(value);
    trackOnboarding('answer', { step: 2, value });
    advance(2);
  };
  const chooseMinutes = (value: DailyMinutes) => {
    setMinutes(value);
    trackOnboarding('answer', { step: 3, value });
    trackOnboarding('complete', {
      profession,
      ai_level: level,
      minutes: value,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
    advance(3, () => { void complete(value); });
  };

  const skip = () => {
    trackOnboarding('skip', { at_step: step + 1 });
    save('skipped', { profession, aiLevel: level, dailyMinutes: null })
      .catch(() => trackOnboarding('save_error', { at: 'skip' }));
    clearGuestLastPage();
    window.location.href = destination.href;
  };

  const start = () => {
    trackOnboarding('start', { target_source: destination.source, target: destination.href });
    clearGuestLastPage();
    window.location.href = destination.href;
  };

  const replan = async () => {
    setReplanState('working');
    try {
      const res = await fetch('/api/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => null);
      setReplanState(res.ok && data?.ok ? 'done' : 'error');
    } catch {
      setReplanState('error');
    }
  };

  const minutesOptions: ChoiceOption<DailyMinutes>[] = DAILY_MINUTES_OPTIONS.map(value => {
    const estimate = estimatePlan(value, destination.planStart);
    const hint = hasFullAccess
      ? `الكتاب كله في ${duration(estimate.fullDays)}`
      : estimate.freePages > 0
        ? `الجزء المجاني يخلص في ${days(estimate.freeDays)}`
        : `الكتاب كله في ${duration(estimate.fullDays)} لو اشتركت`;
    return { id: value, icon: MINUTES_ICON[value], label: MINUTES_LABEL[value], hint };
  });

  if (!ready) return <div className="ob-page" />;

  return (
    <div className="ob-page">
      <Navigation />
      <main className="ob-main">
        {step < STEP_COUNT && (
          <div className="ob-topbar">
            {step > 0 ? (
              <button type="button" className="ob-back" onClick={() => setStep(step - 1)} aria-label="رجوع">→ رجوع</button>
            ) : <span />}
            <span className="ob-progress" aria-live="polite">{step + 1} من {STEP_COUNT}</span>
            <button type="button" className="ob-skip" onClick={skip}>تخطي</button>
          </div>
        )}
        {step < STEP_COUNT && (
          <div className="ob-bar" aria-hidden="true">
            <div className="ob-bar-fill" style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <ChoiceStep
              key="profession"
              title="بتشتغل إيه؟"
              helper="عشان الأمثلة تبقى من شغلك"
              options={PROFESSION_OPTIONS}
              selected={profession}
              columns={2}
              onSelect={chooseProfession}
            />
          )}
          {step === 1 && (
            <ChoiceStep
              key="level"
              title="استخدمت الـ AI قبل كده؟"
              helper="عشان نبدأ معاك من المكان الصح"
              options={LEVEL_OPTIONS}
              selected={level}
              columns={1}
              onSelect={chooseLevel}
            />
          )}
          {step === 2 && (
            <ChoiceStep
              key="minutes"
              title="قد إيه وقتك في اليوم للكتاب؟"
              helper="مش لازم تلتزم بالدقيقة — ده عشان نحسبلك خطتك، وتقدر تغيّره بعدين"
              options={minutesOptions}
              selected={minutes}
              columns={1}
              onSelect={chooseMinutes}
            />
          )}
          {step === STEP_COUNT && minutes && (
            <ResultScreen
              key="result"
              profession={profession}
              level={level}
              minutes={minutes}
              destination={destination}
              hasFullAccess={hasFullAccess}
              saveState={saveState}
              plan={plan}
              replanState={replanState}
              onRetrySave={() => { void complete(minutes); }}
              onReplan={() => { void replan(); }}
              onCheckAnswer={caught => trackOnboarding('first_check', { profession, caught_mistake: caught })}
              onStart={start}
              onEdit={() => { setReplanState('idle'); setStep(0); }}
            />
          )}
        </AnimatePresence>
      </main>
      <style jsx>{`
        .ob-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%);
          direction: rtl;
          color: #fff;
          font-family: inherit;
        }
        .ob-main {
          max-width: 560px;
          margin: 0 auto;
          padding: 20px 16px 24px;
        }
        .ob-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .ob-back,
        .ob-skip {
          min-height: 44px;
          padding: 0 6px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: inherit;
          font-size: 0.92rem;
          cursor: pointer;
        }
        .ob-progress {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.85rem;
        }
        .ob-bar {
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          margin-bottom: 24px;
          overflow: hidden;
        }
        .ob-bar-fill {
          height: 100%;
          background: #ff6b35;
          transition: width 0.25s ease;
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
      <OnboardingContent />
    </Suspense>
  );
}
