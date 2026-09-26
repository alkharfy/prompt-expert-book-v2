// Tests for ResourceCard component
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResourceCard from '@/components/resources/ResourceCard'

// Mock style jsx
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return actual
})

const baseResource = {
  id: 'res-1',
  title_ar: 'ChatGPT — OpenAI',
  title_en: 'ChatGPT by OpenAI',
  description_ar: 'أداة المحادثة الأشهر في العالم.',
  url: 'https://chat.openai.com',
  category: 'tool',
  specialization: ['general'],
  level: 'beginner',
  is_free: true,
  language: 'both',
  freshness_status: 'evergreen',
  is_saved: false,
  is_model_specific: false,
}

describe('ResourceCard', () => {
  it('should render the Arabic title', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('ChatGPT — OpenAI')).toBeInTheDocument()
  })

  it('should render the description', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('أداة المحادثة الأشهر في العالم.')).toBeInTheDocument()
  })

  it('should render category icon and name', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🔧 أداة')).toBeInTheDocument()
  })

  it('should render level name', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('مبتدئ')).toBeInTheDocument()
  })

  it('should render "مجاني" badge for free resources', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('مجاني')).toBeInTheDocument()
  })

  it('should render "مدفوع" badge for paid resources', () => {
    const paidResource = { ...baseResource, is_free: false }
    render(<ResourceCard resource={paidResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('مدفوع')).toBeInTheDocument()
  })

  it('should render freshness badge', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🌿 دائم')).toBeInTheDocument()
  })

  it('should render fresh badge for fresh resources', () => {
    const freshResource = { ...baseResource, freshness_status: 'fresh' }
    render(<ResourceCard resource={freshResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🟢 حديث')).toBeInTheDocument()
  })

  it('should render aging badge', () => {
    const agingResource = { ...baseResource, freshness_status: 'aging' }
    render(<ResourceCard resource={agingResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🟡 قد يحتاج تحديث')).toBeInTheDocument()
  })

  it('should render outdated badge', () => {
    const outdatedResource = { ...baseResource, freshness_status: 'outdated' }
    render(<ResourceCard resource={outdatedResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🔴 قديم')).toBeInTheDocument()
  })

  it('should render language indicator for Arabic', () => {
    const arResource = { ...baseResource, language: 'ar' }
    render(<ResourceCard resource={arResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🇸🇦 عربي')).toBeInTheDocument()
  })

  it('should render language indicator for English', () => {
    const enResource = { ...baseResource, language: 'en' }
    render(<ResourceCard resource={enResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🇺🇸 إنجليزي')).toBeInTheDocument()
  })

  it('should render language indicator for both', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🌍 عربي + إنجليزي')).toBeInTheDocument()
  })

  it('should render "زيارة ↗" link with correct URL', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    const link = screen.getByText('زيارة ↗')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://chat.openai.com')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
    expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should show save button when logged in', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🤍 حفظ')).toBeInTheDocument()
  })

  it('should show "💛 محفوظ" when resource is saved', () => {
    const savedResource = { ...baseResource, is_saved: true }
    render(<ResourceCard resource={savedResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('💛 محفوظ')).toBeInTheDocument()
  })

  it('should NOT show save button when NOT logged in', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={false} />)
    expect(screen.queryByText('🤍 حفظ')).not.toBeInTheDocument()
  })

  it('should call onSave with (id, true) when saving', () => {
    const onSave = vi.fn()
    render(<ResourceCard resource={baseResource} onSave={onSave} isLoggedIn={true} />)
    fireEvent.click(screen.getByText('🤍 حفظ'))
    expect(onSave).toHaveBeenCalledWith('res-1', true)
  })

  it('should call onSave with (id, false) when unsaving', () => {
    const onSave = vi.fn()
    const savedResource = { ...baseResource, is_saved: true }
    render(<ResourceCard resource={savedResource} onSave={onSave} isLoggedIn={true} />)
    fireEvent.click(screen.getByText('💛 محفوظ'))
    expect(onSave).toHaveBeenCalledWith('res-1', false)
  })

  it('should show AI model version when is_model_specific', () => {
    const modelResource = {
      ...baseResource,
      is_model_specific: true,
      ai_model_version: 'GPT-4o',
    }
    render(<ResourceCard resource={modelResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('🤖 GPT-4o')).toBeInTheDocument()
  })

  it('should NOT show AI model version when not model-specific', () => {
    render(<ResourceCard resource={baseResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.queryByText(/🤖/)).not.toBeInTheDocument()
  })

  it('should render correct level colors', () => {
    // Intermediate
    const interResource = { ...baseResource, level: 'intermediate' }
    render(<ResourceCard resource={interResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('متوسط')).toBeInTheDocument()
  })

  it('should render advanced level', () => {
    const advResource = { ...baseResource, level: 'advanced' }
    render(<ResourceCard resource={advResource} onSave={vi.fn()} isLoggedIn={true} />)
    expect(screen.getByText('متقدم')).toBeInTheDocument()
  })

  it('should render all category types correctly', () => {
    const categories = [
      { category: 'course', expected: '🎓 دورة' },
      { category: 'article', expected: '📄 مقال' },
      { category: 'video', expected: '🎬 فيديو' },
      { category: 'template', expected: '📋 قالب' },
      { category: 'book', expected: '📚 كتاب' },
      { category: 'community', expected: '👥 مجتمع' },
    ]

    categories.forEach(({ category, expected }) => {
      const { unmount } = render(
        <ResourceCard resource={{ ...baseResource, category }} onSave={vi.fn()} isLoggedIn={true} />
      )
      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    })
  })
})
