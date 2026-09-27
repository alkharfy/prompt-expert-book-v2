// Tests for seed data integrity — learningResources.ts
import { describe, it, expect } from 'vitest'
import { LEARNING_RESOURCES, AI_CHANGELOG_SEEDS } from '@/data/learningResources'
import type { ResourceSeed, ChangelogSeed } from '@/data/learningResources'

describe('LEARNING_RESOURCES seed data', () => {
  it('should have exactly 30 resources', () => {
    expect(LEARNING_RESOURCES).toHaveLength(30)
  })

  it('should have all required fields in every resource', () => {
    const requiredFields: (keyof ResourceSeed)[] = [
      'title_ar', 'description_ar', 'url', 'category',
      'specialization', 'level', 'is_free', 'language',
      'freshness_status', 'is_model_specific',
    ]

    LEARNING_RESOURCES.forEach((resource, index) => {
      requiredFields.forEach((field) => {
        expect(resource[field], `Resource #${index} (${resource.title_ar}) missing field: ${field}`).toBeDefined()
      })
    })
  })

  it('should only use valid category values', () => {
    const validCategories = ['tool', 'course', 'article', 'video', 'template', 'book', 'community']
    LEARNING_RESOURCES.forEach((resource) => {
      expect(validCategories).toContain(resource.category)
    })
  })

  it('should only use valid level values', () => {
    const validLevels = ['beginner', 'intermediate', 'advanced']
    LEARNING_RESOURCES.forEach((resource) => {
      expect(validLevels).toContain(resource.level)
    })
  })

  it('should only use valid language values', () => {
    const validLanguages = ['ar', 'en', 'both']
    LEARNING_RESOURCES.forEach((resource) => {
      expect(validLanguages).toContain(resource.language)
    })
  })

  it('should only use valid freshness_status values', () => {
    const validStatuses = ['fresh', 'aging', 'outdated', 'evergreen']
    LEARNING_RESOURCES.forEach((resource) => {
      expect(validStatuses).toContain(resource.freshness_status)
    })
  })

  it('should have valid URLs for all resources', () => {
    LEARNING_RESOURCES.forEach((resource) => {
      expect(resource.url).toMatch(/^https?:\/\//)
    })
  })

  it('should have non-empty specialization arrays', () => {
    LEARNING_RESOURCES.forEach((resource) => {
      expect(resource.specialization.length).toBeGreaterThan(0)
    })
  })

  it('should only use valid specialization values', () => {
    const validSpecs = ['general', 'programming', 'ecommerce', 'design', 'marketing']
    LEARNING_RESOURCES.forEach((resource) => {
      resource.specialization.forEach((spec) => {
        expect(validSpecs, `Invalid specialization "${spec}" in ${resource.title_ar}`).toContain(spec)
      })
    })
  })

  it('should have ai_model_version when is_model_specific is true', () => {
    LEARNING_RESOURCES.filter(r => r.is_model_specific).forEach((resource) => {
      expect(resource.ai_model_version, `Model-specific resource "${resource.title_ar}" missing ai_model_version`).toBeTruthy()
    })
  })

  it('should not have ai_model_version when is_model_specific is false', () => {
    LEARNING_RESOURCES.filter(r => !r.is_model_specific).forEach((resource) => {
      expect(resource.ai_model_version, `Non-model-specific resource "${resource.title_ar}" should not have ai_model_version`).toBeFalsy()
    })
  })

  it('should have the correct category distribution', () => {
    const counts: Record<string, number> = {}
    LEARNING_RESOURCES.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1
    })
    expect(counts.tool).toBe(8)
    expect(counts.course).toBe(5)
    expect(counts.article).toBe(5)
    expect(counts.video).toBe(5)
    expect(counts.template).toBe(4)
    expect(counts.community).toBe(2)
    expect(counts.book).toBe(1)
  })

  it('should have no duplicate URLs', () => {
    const urls = LEARNING_RESOURCES.map(r => r.url)
    const uniqueUrls = new Set(urls)
    expect(uniqueUrls.size).toBe(urls.length)
  })

  it('should have no duplicate Arabic titles', () => {
    const titles = LEARNING_RESOURCES.map(r => r.title_ar)
    const uniqueTitles = new Set(titles)
    expect(uniqueTitles.size).toBe(titles.length)
  })
})

describe('AI_CHANGELOG_SEEDS seed data', () => {
  it('should have exactly 7 changelog entries', () => {
    expect(AI_CHANGELOG_SEEDS).toHaveLength(7)
  })

  it('should have all required fields in every entry', () => {
    const requiredFields: (keyof ChangelogSeed)[] = [
      'title_ar', 'content_ar', 'category', 'importance', 'published_at',
    ]

    AI_CHANGELOG_SEEDS.forEach((entry, index) => {
      requiredFields.forEach((field) => {
        expect(entry[field], `Changelog #${index} (${entry.title_ar}) missing field: ${field}`).toBeDefined()
      })
    })
  })

  it('should only use valid category values', () => {
    const validCategories = ['update', 'new_model', 'new_tool', 'tip', 'breaking']
    AI_CHANGELOG_SEEDS.forEach((entry) => {
      expect(validCategories).toContain(entry.category)
    })
  })

  it('should only use valid importance values', () => {
    const validImportance = ['low', 'normal', 'high', 'critical']
    AI_CHANGELOG_SEEDS.forEach((entry) => {
      expect(validImportance).toContain(entry.importance)
    })
  })

  it('should have valid date format for published_at', () => {
    AI_CHANGELOG_SEEDS.forEach((entry) => {
      expect(entry.published_at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const date = new Date(entry.published_at)
      expect(date.toString()).not.toBe('Invalid Date')
    })
  })

  it('should be sorted by published_at descending', () => {
    for (let i = 0; i < AI_CHANGELOG_SEEDS.length - 1; i++) {
      const current = new Date(AI_CHANGELOG_SEEDS[i].published_at).getTime()
      const next = new Date(AI_CHANGELOG_SEEDS[i + 1].published_at).getTime()
      expect(current).toBeGreaterThanOrEqual(next)
    }
  })

  it('should have non-empty title and content', () => {
    AI_CHANGELOG_SEEDS.forEach((entry) => {
      expect(entry.title_ar.length).toBeGreaterThan(5)
      expect(entry.content_ar.length).toBeGreaterThan(20)
    })
  })
})
