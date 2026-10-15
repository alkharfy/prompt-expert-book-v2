import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import OnboardingPage from '@/app/onboarding/page'
import { PROFESSION_TRIES } from '@/data/professionTries'

const { router, request, currentUser, trackOnboarding, navigation } = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  request: vi.fn(),
  currentUser: vi.fn(),
  trackOnboarding: vi.fn(),
  navigation: { searchParams: new URLSearchParams() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => navigation.searchParams,
}))
vi.mock('@/lib/auth_system', () => ({ authSystem: { getCurrentUserId: currentUser } }))
vi.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => ({ hasFeature: () => false, isLoading: false }),
}))
vi.mock('@/components/Navigation', () => ({ default: () => null }))
vi.mock('@/lib/analytics', () => ({ trackOnboarding }))
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const element = (tag: string) => {
    const MotionStub = (props: Record<string, unknown>) => {
      const domProps = { ...props }
      for (const key of ['initial', 'animate', 'exit', 'transition']) delete domProps[key]
      return React.createElement(tag, domProps, props.children as ReactNode)
    }
    MotionStub.displayName = `motion.${tag}`
    return MotionStub
  }
  return {
    motion: { section: element('section'), div: element('div') },
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
  }
})

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})
const location = { href: '' }
let preferences: { profession: string } | null
let saveResponse: { body: unknown; status: number }

const onboardingPosts = () => request.mock.calls.filter(([url, options]) =>
  url === '/api/onboarding' && options?.method === 'POST',
)
const postedAnswers = () => onboardingPosts().map(([, options]) => JSON.parse(options.body))

async function renderPage() {
  await act(async () => { render(<OnboardingPage />) })
}

async function chooseOption(name: string | RegExp) {
  fireEvent.click(screen.getByRole('radio', { name }))
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
}

async function reachMinutes(level = 'أول مرة') {
  await renderPage()
  await chooseOption('محاسب أو مالية')
  expect(screen.getByRole('heading', { name: 'استخدمت الـ AI قبل كده؟' })).toBeInTheDocument()
  await chooseOption(new RegExp(level))
}

async function completeFlow(level?: string) {
  await reachMinutes(level)
  await chooseOption(/^20 دقيقة/)
  expect(screen.getByRole('heading', { name: 'خطتك جاهزة 👌' })).toBeInTheDocument()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  request.mockReset()
  currentUser.mockReturnValue('u1')
  navigation.searchParams = new URLSearchParams()
  preferences = null
  saveResponse = { body: { ok: true, plan: null }, status: 200 }
  localStorage.clear()
  location.href = ''

  // jsdom's Location is non-configurable. Keep the real browser APIs while
  // giving this page an assignable navigation destination, restored after each test.
  vi.stubGlobal('window', new Proxy(window, {
    get(target, property) {
      return property === 'location' ? location : Reflect.get(target, property, target)
    },
  }))
  request.mockImplementation(async (url: string, options?: RequestInit) => {
    if (url === '/api/learning-preferences' && !options?.method) return response({ preferences })
    if (url === '/api/onboarding' && options?.method === 'POST') {
      return response(saveResponse.body, saveResponse.status)
    }
    throw new Error(`Unexpected fetch: ${url}`)
  })
  vi.stubGlobal('fetch', request)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('OnboardingPage', () => {
  it('sends an unauthenticated reader to login before loading preferences', async () => {
    currentUser.mockReturnValue(null)
    await renderPage()
    expect(router.replace).toHaveBeenCalledWith('/login?next=/onboarding')
    expect(request).not.toHaveBeenCalled()
  })

  it('estimates the free plan, saves all answers, and starts a new reader at intro page 1', async () => {
    await reachMinutes()
    const twentyMinutes = screen.getByRole('radio', { name: /^20 دقيقة/ })
    expect(within(twentyMinutes).getByText('الجزء المجاني يخلص في 4 أيام')).toBeInTheDocument()
    await chooseOption(/^20 دقيقة/)

    expect(screen.getByRole('heading', { name: 'خطتك جاهزة 👌' })).toBeInTheDocument()
    expect(screen.getByText(PROFESSION_TRIES.accounting.claim)).toBeInTheDocument()
    expect(postedAnswers()).toEqual([{
      profession: 'accounting', aiLevel: 'new', dailyMinutes: 20,
      status: 'completed', startPath: '/read/intro/1',
    }])

    fireEvent.click(screen.getByRole('button', { name: 'يلا نبدأ ←' }))
    expect(window.location.href).toBe('/read/intro/1')
  })

  it('reveals the accounting mistake and records a correct first check', async () => {
    await completeFlow()
    fireEvent.click(screen.getByRole('button', { name: '❌ غلط' }))
    expect(screen.getByText('👏 مسكتها!')).toBeInTheDocument()
    expect(screen.getByText(PROFESSION_TRIES.accounting.feedback)).toBeInTheDocument()
    expect(trackOnboarding).toHaveBeenCalledWith('first_check', {
      profession: 'accounting', caught_mistake: true,
    })
  })

  it('shows a failed save and retries the same answers', async () => {
    saveResponse = { body: { ok: false }, status: 500 }
    await completeFlow()
    expect(screen.getByRole('alert')).toHaveTextContent('مقدرناش نحفظ اختياراتك.')
    expect(onboardingPosts()).toHaveLength(1)

    saveResponse = { body: { ok: true, plan: null }, status: 200 }
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'حاول تاني' })) })
    expect(onboardingPosts()).toHaveLength(2)
    expect(postedAnswers()[1]).toEqual(postedAnswers()[0])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('saves and follows the explicit next reading page', async () => {
    navigation.searchParams = new URLSearchParams({ next: '/read/section-2/1' })
    await completeFlow()
    expect(postedAnswers()[0]).toEqual({
      profession: 'accounting', aiLevel: 'new', dailyMinutes: 20,
      status: 'completed', startPath: '/read/section-2/1',
    })
    fireEvent.click(screen.getByRole('button', { name: 'يلا نبدأ ←' }))
    expect(window.location.href).toBe('/read/section-2/1')
  })

  it('starts a daily AI user at intro page 3', async () => {
    await completeFlow('بستخدمه كل يوم تقريباً')
    expect(postedAnswers()[0]).toEqual({
      profession: 'accounting', aiLevel: 'daily', dailyMinutes: 20,
      status: 'completed', startPath: '/read/intro/3',
    })
    fireEvent.click(screen.getByRole('button', { name: 'يلا نبدأ ←' }))
    expect(window.location.href).toBe('/read/intro/3')
  })

  it('saves a first-screen skip with unanswered fields and starts at intro page 1', async () => {
    await renderPage()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'تخطي' })) })
    expect(postedAnswers()).toEqual([{
      profession: null, aiLevel: null, dailyMinutes: null,
      status: 'skipped', startPath: '/read/intro/1',
    }])
    expect(window.location.href).toBe('/read/intro/1')
  })

  it('resumes the guest reading position when skipping and clears the saved guest position', async () => {
    localStorage.setItem('pm_guest_last_page', '/read/section-1/4')
    await renderPage()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'تخطي' })) })
    expect(postedAnswers()[0]).toEqual({
      profession: null, aiLevel: null, dailyMinutes: null,
      status: 'skipped', startPath: '/read/section-1/4',
    })
    expect(window.location.href).toBe('/read/section-1/4')
    expect(localStorage.getItem('pm_guest_last_page')).toBeNull()
  })

  it('prefills the saved profession as an accessible checked option', async () => {
    preferences = { profession: 'teacher' }
    await renderPage()
    expect(screen.getByRole('radio', { name: 'مدرس' })).toHaveAttribute('aria-checked', 'true')
  })
})
