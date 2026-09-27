// Tests for /billing/admin/free-accounts and the dashboard's stats (UI only — APIs mocked)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const mockFetch = vi.fn()
global.fetch = mockFetch
const json = (body: unknown) => Promise.resolve({ json: async () => body })

const future = new Date(Date.now() + 60 * 86400000).toISOString()
const past = new Date(Date.now() - 5 * 86400000).toISOString()
const accounts = [
  { id: 's-live', plan_id: 'vip', status: 'active', starts_at: past, expires_at: future, created_at: past, users: { email: 'live@client.com', full_name: 'موظف نشط' } },
  { id: 's-old', plan_id: 'basic', status: 'cancelled', starts_at: past, expires_at: past, created_at: past, users: { email: 'old@client.com', full_name: 'موظف قديم' } },
]

describe('AdminFreeAccountsPage', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } })
  })

  it('lists free accounts with live/cancelled status', async () => {
    mockFetch.mockImplementation(() => json({ ok: true, accounts }))
    const { default: Page } = await import('@/app/billing/admin/free-accounts/page')
    render(<Page />)
    expect(await screen.findByText('live@client.com')).toBeInTheDocument()
    expect(screen.getByText('الحسابات المجانية (1 نشط من 2)')).toBeInTheDocument()
    expect(screen.getByText('ملغي')).toBeInTheDocument()
  })

  it('creates an account and shows the one-time password with a copy button', async () => {
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return json({ ok: true, existingAccount: false, account: { fullName: 'سارة', email: 'sara@client.com', planId: 'pro', expiresAt: future, password: 'Ab3xYz9KmN2p' } })
      }
      return json({ ok: true, accounts: [] })
    })
    const { default: Page } = await import('@/app/billing/admin/free-accounts/page')
    render(<Page />)
    fireEvent.change(screen.getByLabelText('الاسم الكامل'), { target: { value: 'سارة' } })
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'sara@client.com' } })
    fireEvent.change(screen.getByLabelText('الباقة'), { target: { value: 'pro' } })
    fireEvent.change(screen.getByLabelText('المدة'), { target: { value: '90' } })
    fireEvent.click(screen.getByRole('button', { name: /إنشاء الحساب المجاني/ }))

    const card = await screen.findByRole('status')
    expect(within(card).getByText(/كلمة المرور: Ab3xYz9KmN2p/)).toBeInTheDocument()
    const post = mockFetch.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(post[1].body)).toEqual({ fullName: 'سارة', email: 'sara@client.com', planId: 'pro', durationDays: 90 })

    fireEvent.click(within(card).getByRole('button', { name: /نسخ بيانات الدخول/ }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Ab3xYz9KmN2p')))
  })

  it('shows the API error instead of credentials when creation is refused', async () => {
    mockFetch.mockImplementation((url: string, init?: RequestInit) =>
      init?.method === 'POST' ? json({ ok: false, error: 'هذا الحساب لديه اشتراك نشط' }) : json({ ok: true, accounts: [] }))
    const { default: Page } = await import('@/app/billing/admin/free-accounts/page')
    render(<Page />)
    fireEvent.change(screen.getByLabelText('الاسم الكامل'), { target: { value: 'سارة' } })
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'sara@client.com' } })
    fireEvent.click(screen.getByRole('button', { name: /إنشاء الحساب المجاني/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('هذا الحساب لديه اشتراك نشط')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('extends and (after confirmation) cancels through the existing admin endpoints', async () => {
    mockFetch.mockImplementation((url: string) =>
      url.includes('/subscriptions/') ? json({ success: true }) : json({ ok: true, accounts }))
    const { default: Page } = await import('@/app/billing/admin/free-accounts/page')
    render(<Page />)
    await screen.findByText('live@client.com')

    fireEvent.click(screen.getAllByRole('button', { name: 'تمديد' })[0])
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/admin/subscriptions/extend', expect.objectContaining({ body: JSON.stringify({ subscriptionId: 's-live', days: 30 }) })))

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
    expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/subscriptions/cancel', expect.anything())
    fireEvent.click(screen.getByRole('button', { name: 'تأكيد الإلغاء' }))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/admin/subscriptions/cancel', expect.anything()))
  })
})

describe('BillingAdminDashboard stats', () => {
  it('counts free accounts separately and builds revenue from real payments only', async () => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(() => json({ ok: true, subscriptions: [
      { status: 'active', plan_id: 'vip', payment_id: 'p1', expires_at: future, created_at: past, payments: { amount: 999 } },
      { status: 'active', plan_id: 'basic', payment_id: 'p2', expires_at: future, created_at: past, payments: { amount: 299 } },
      { status: 'active', plan_id: 'pro', payment_id: null, expires_at: future, created_at: past, payments: null },
      { status: 'active', plan_id: 'pro', payment_id: 'p3', expires_at: past, created_at: past, payments: { amount: 499 } },
      { status: 'cancelled', plan_id: 'basic', payment_id: 'p4', expires_at: past, created_at: past, payments: { amount: 299 } },
    ] }))
    const { default: Dashboard } = await import('@/app/billing/admin/dashboard/page')
    render(<Dashboard />)
    expect(await screen.findByText('منها 1 حساب مجاني')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/subscriptions', expect.anything())
    // (999 + 299) / 12 = 108 — free and expired subscriptions excluded
    expect(screen.getByText(`${(108).toLocaleString('ar-EG')} EGP`)).toBeInTheDocument()
  })
})
