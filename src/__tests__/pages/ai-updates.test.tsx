// Tests for /ai-updates page
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/ai-updates',
}))

describe('AiUpdatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should show loading/checking state initially', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    expect(screen.getByText('جاري التحقق من صلاحيتك...')).toBeInTheDocument()
  })

  it('should show locked state for non-VIP users', async () => {
    // subscription/status returns non-VIP plan
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'pro' }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText('🔒')).toBeInTheDocument()
      expect(screen.getByText('تحديثات AI الأسبوعية')).toBeInTheDocument()
      expect(screen.getByText('هذه الميزة حصرية لمشتركي الباقة المميزة (VIP)')).toBeInTheDocument()
    })
  })

  it('should show upgrade button for non-VIP users', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'basic' }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText(/ترقية إلى VIP/)).toBeInTheDocument()
    })
  })

  it('should navigate to payment on upgrade click', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'basic' }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      const btn = screen.getByText(/ترقية إلى VIP/)
      btn.click()
      expect(mockPush).toHaveBeenCalledWith('/payment?feature=vip')
    })
  })

  it('should show updates for VIP users', async () => {
    // subscription/status returns VIP
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'vip' }),
    })
    // ai-updates returns entries
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        updates: [
          { id: '1', title_ar: 'Claude 4', content_ar: 'نموذج جديد', category: 'new_model', importance: 'high', published_at: '2026-03-20' },
          { id: '2', title_ar: 'نصيحة البرومبت', content_ar: 'استخدم system prompt', category: 'tip', importance: 'normal', published_at: '2026-03-16' },
        ],
      }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText('🔮 تحديثات AI الأسبوعية')).toBeInTheDocument()
      expect(screen.getByText('Claude 4')).toBeInTheDocument()
      expect(screen.getByText('نموذج جديد')).toBeInTheDocument()
      expect(screen.getByText('نصيحة البرومبت')).toBeInTheDocument()
    })
  })

  it('should show VIP badge for VIP users', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'vip' }),
    })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ updates: [] }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText(/VIP حصري/)).toBeInTheDocument()
    })
  })

  it('should show empty state when VIP but no updates', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'vip' }),
    })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ updates: [] }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText('لا توجد تحديثات حالياً')).toBeInTheDocument()
    })
  })

  it('should show category icons for updates', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'vip' }),
    })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        updates: [
          { id: '1', title_ar: 'Update', content_ar: 'Content', category: 'update', importance: 'normal', published_at: '2026-03-20' },
          { id: '2', title_ar: 'New Tool', content_ar: 'Content', category: 'new_tool', importance: 'normal', published_at: '2026-03-19' },
        ],
      }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      expect(screen.getByText(/🔄 تحديث/)).toBeInTheDocument()
      expect(screen.getByText(/🔧 أداة جديدة/)).toBeInTheDocument()
    })
  })

  it('should render source link when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ plan_id: 'vip' }),
    })
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        updates: [
          { id: '1', title_ar: 'Test', content_ar: 'Content', category: 'update', importance: 'normal', published_at: '2026-03-20', source_url: 'https://example.com/source' },
        ],
      }),
    })

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    await waitFor(() => {
      const sourceLink = screen.getByText('🔗 المصدر')
      expect(sourceLink).toBeInTheDocument()
      expect(sourceLink.closest('a')).toHaveAttribute('href', 'https://example.com/source')
    })
  })

  it('should handle fetch error gracefully for non-VIP', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { default: AiUpdatesPage } = await import('@/app/ai-updates/page')
    render(<AiUpdatesPage />)

    // Should show locked state since error means we can't verify VIP
    await waitFor(() => {
      expect(screen.getByText('🔒')).toBeInTheDocument()
    })
  })
})
