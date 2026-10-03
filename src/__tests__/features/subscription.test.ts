// Tests for features and subscription type updates
import { describe, it, expect } from 'vitest'
import { PLAN_FEATURES, FEATURE_NAMES } from '@/lib/features'
import type { FeatureKey, PlanId } from '@/types/subscription'
import { FEATURE_KEYS } from '@/types/subscription'

describe('FeatureKey type — new keys', () => {
  it('should include "resources" in FEATURE_KEYS', () => {
    expect(FEATURE_KEYS).toContain('resources')
  })

  it('should include "ai_updates" in FEATURE_KEYS', () => {
    expect(FEATURE_KEYS).toContain('ai_updates')
  })

  it('should have exactly 12 feature keys', () => {
    expect(FEATURE_KEYS).toHaveLength(12)
  })

  it('should contain all original feature keys plus new ones', () => {
    const expected = [
      'reading', 'bookmarks', 'library', 'progress_tracking',
      'exercises', 'gamification', 'leaderboard', 'certificate',
      'tools', 'chat', 'resources', 'ai_updates',
    ]
    expected.forEach((key) => {
      expect(FEATURE_KEYS).toContain(key)
    })
  })
})

describe('PLAN_FEATURES — public pages are not paid entitlements', () => {
  it('basic plan should NOT have "resources"', () => {
    expect(PLAN_FEATURES.basic).not.toContain('resources')
  })

  it('basic plan should NOT have "ai_updates"', () => {
    expect(PLAN_FEATURES.basic).not.toContain('ai_updates')
  })

  it('pro plan should NOT sell "resources" as exclusive', () => {
    expect(PLAN_FEATURES.pro).not.toContain('resources')
  })

  it('pro plan should NOT have "ai_updates"', () => {
    expect(PLAN_FEATURES.pro).not.toContain('ai_updates')
  })

  it('vip plan should NOT sell "resources" as exclusive', () => {
    expect(PLAN_FEATURES.vip).not.toContain('resources')
  })

  it('vip plan should NOT sell "ai_updates" as exclusive', () => {
    expect(PLAN_FEATURES.vip).not.toContain('ai_updates')
  })

  it('vip should be a superset of pro features', () => {
    PLAN_FEATURES.pro.forEach((feature) => {
      expect(PLAN_FEATURES.vip, `VIP missing pro feature: ${feature}`).toContain(feature)
    })
  })

  it('pro should be a superset of basic features', () => {
    PLAN_FEATURES.basic.forEach((feature) => {
      expect(PLAN_FEATURES.pro, `Pro missing basic feature: ${feature}`).toContain(feature)
    })
  })
})

describe('FEATURE_NAMES — Arabic labels', () => {
  it('should have Arabic name for "resources"', () => {
    expect(FEATURE_NAMES.resources).toBe('مكتبة المصادر')
  })

  it('should have Arabic name for "ai_updates"', () => {
    expect(FEATURE_NAMES.ai_updates).toBe('تحديثات AI')
  })

  it('should have a name for every FEATURE_KEY', () => {
    FEATURE_KEYS.forEach((key) => {
      expect(FEATURE_NAMES[key as FeatureKey], `Missing name for feature: ${key}`).toBeTruthy()
    })
  })
})

describe('planHasFeature helper', () => {
  // Import dynamically to avoid module state issues
  it('should correctly identify resources access per plan', async () => {
    const { planHasFeature } = await import('@/lib/features')
    
    expect(planHasFeature('basic', 'resources')).toBe(false)
    expect(planHasFeature('pro', 'resources')).toBe(false)
    expect(planHasFeature('vip', 'resources')).toBe(false)
  })

  it('should correctly identify ai_updates access per plan', async () => {
    const { planHasFeature } = await import('@/lib/features')
    
    expect(planHasFeature('basic', 'ai_updates')).toBe(false)
    expect(planHasFeature('pro', 'ai_updates')).toBe(false)
    expect(planHasFeature('vip', 'ai_updates')).toBe(false)
  })
})
