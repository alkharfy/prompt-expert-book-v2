import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: string
    status: number
    headers: Map<string, string>

    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return JSON.parse(this.body)
    }

    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }
  }

  class MockNextRequest {
    url: string
    method: string
    _cookies: Map<string, { value: string }>
    _body: unknown

    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this.url = url
      this.method = init?.method || 'GET'
      this._cookies = new Map()
      if (init?.body) {
        try { this._body = JSON.parse(init.body) } catch { this._body = init.body }
      }
    }

    get cookies() {
      const cookies = this._cookies
      return {
        get: (name: string) => cookies.get(name),
      }
    }

    async json() {
      return this._body
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  }
})

// Global fetch mock (reset in each test)
global.fetch = vi.fn()
