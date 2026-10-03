import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AiUpdatesPage from '@/app/ai-updates/page'

beforeEach(() => { vi.mocked(fetch).mockReset() })

const entry = { id: '1', title_ar: 'خبر تعليمي', content_ar: 'تفاصيل الخبر', category: 'new_model', importance: 'high', published_at: '2026-09-24', source_url: 'https://example.com/source' }

describe('public AI news', () => {
  it('shows loading while the public feed is requested', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    render(<AiUpdatesPage />)
    expect(screen.getByText('جاري تحميل أخبار AI...')).toBeInTheDocument()
  })
  it('shows news to a visitor without requesting subscription status or an upgrade', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ updates: [entry] }) } as Response)
    render(<AiUpdatesPage />)
    expect(await screen.findByText('خبر تعليمي')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/ai-updates')
    expect(screen.getByText(/متاحة مجانًا للجميع/)).toBeInTheDocument()
    expect(screen.queryByText(/VIP|ترقية/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /المصدر/ })).toHaveAttribute('href', entry.source_url)
  })
  it('distinguishes an unavailable feed from an empty feed', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    render(<AiUpdatesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر تحميل أخبار AI')
    expect(screen.queryByText('لا توجد تحديثات حالياً')).not.toBeInTheDocument()
  })
  it('shows a real empty response without an exclusivity claim', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ updates: [] }) } as Response)
    render(<AiUpdatesPage />)
    await waitFor(() => expect(screen.getByText('لا توجد تحديثات حالياً')).toBeInTheDocument())
  })
})