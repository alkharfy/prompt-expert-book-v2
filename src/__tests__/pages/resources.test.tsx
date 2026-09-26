// Tests for /resources page
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Must mock fetch before importing page
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ResourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: not logged in (no cookie)
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  it('should render page title', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ resources: [], total: 0 }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    expect(screen.getByText('📚 مكتبة المصادر')).toBeInTheDocument()
  })

  it('should render page subtitle', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ resources: [], total: 0 }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    expect(screen.getByText('أفضل المصادر لتعلم الذكاء الاصطناعي وهندسة البرومبتات')).toBeInTheDocument()
  })

  it('should show loading state initially', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})) // never resolves

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    expect(screen.getByText('جاري تحميل المصادر...')).toBeInTheDocument()
  })

  it('should show empty state when no resources', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ resources: [], total: 0 }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    await waitFor(() => {
      expect(screen.getByText('لا توجد مصادر')).toBeInTheDocument()
    })
  })

  it('should show seed button in empty state', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ resources: [], total: 0 }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    await waitFor(() => {
      expect(screen.getByText(/إضافة المصادر الأولية/)).toBeInTheDocument()
    })
  })

  it('should show resource count when resources exist', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        resources: [
          { id: '1', title_ar: 'ChatGPT', description_ar: 'Tool', url: 'https://x.com', category: 'tool', specialization: ['general'], level: 'beginner', is_free: true, language: 'both', freshness_status: 'fresh' },
          { id: '2', title_ar: 'Claude', description_ar: 'Tool', url: 'https://y.com', category: 'tool', specialization: ['general'], level: 'beginner', is_free: true, language: 'both', freshness_status: 'fresh' },
        ],
        total: 2,
      }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    await waitFor(() => {
      expect(screen.getByText(/2 مصدر/)).toBeInTheDocument()
    })
  })

  it('should render resource cards when resources exist', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        resources: [
          { id: '1', title_ar: 'ChatGPT — OpenAI', description_ar: 'أداة رائعة', url: 'https://chat.openai.com', category: 'tool', specialization: ['general'], level: 'beginner', is_free: true, language: 'both', freshness_status: 'evergreen' },
        ],
        total: 1,
      }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    await waitFor(() => {
      expect(screen.getByText('ChatGPT — OpenAI')).toBeInTheDocument()
    })
  })

  it('should detect login state from cookie', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'ebook_user_id=user-123',
    })

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        resources: [
          { id: '1', title_ar: 'Test', description_ar: 'Desc', url: 'https://x.com', category: 'tool', specialization: ['general'], level: 'beginner', is_free: true, language: 'both', freshness_status: 'fresh', is_saved: false },
        ],
        total: 1,
      }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    render(<ResourcesPage />)

    await waitFor(() => {
      // Save button is shown only for logged-in users
      expect(screen.getByText('🤍 حفظ')).toBeInTheDocument()
    })
  })

  it('should show "لم تحفظ أي مصادر بعد" when saved filter is active and empty', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'ebook_user_id=user-123',
    })
    
    // First load
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ resources: [], total: 0 }),
    })

    const { default: ResourcesPage } = await import('@/app/resources/page')
    const { rerender } = render(<ResourcesPage />)

    await waitFor(() => {
      expect(screen.getByText('لا توجد مصادر')).toBeInTheDocument()
    })
  })
})
