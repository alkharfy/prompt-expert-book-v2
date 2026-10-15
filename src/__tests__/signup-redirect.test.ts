import { describe, expect, it } from 'vitest'
import { getSignupRedirect, onboardingUrlFor } from '@/lib/signup-redirect'

describe('signup redirects preserve checkout intent', () => {
  it('sends an email signup buying pro directly to its payment page', () => {
    expect(getSignupRedirect({ method: 'email', planParam: 'pro', nextPath: '/toc' })).toEqual({ href: '/payment?plan=pro', paymentIntent: true })
  })

  it('keeps the full payment destination for an email signup', () => {
    expect(getSignupRedirect({ method: 'email', planParam: '', nextPath: '/payment?plan=pro&renew=true' })).toEqual({
      href: '/payment?plan=pro&renew=true', paymentIntent: true,
    })
  })

  it('keeps a bare payment destination for an email signup with no plan', () => {
    expect(getSignupRedirect({ method: 'email', planParam: '', nextPath: '/payment' })).toEqual({ href: '/payment', paymentIntent: true })
  })

  it.each([
    ['/toc', '/onboarding?from=register'],
    ['/read/section-2/1', '/onboarding?from=register&next=%2Fread%2Fsection-2%2F1'],
  ])('sends an email signup returning to %s through onboarding', (nextPath, href) => {
    expect(getSignupRedirect({ method: 'email', planParam: '', nextPath })).toEqual({ href, paymentIntent: false })
  })

  it('sends a Google signup buying basic directly to checkout', () => {
    expect(getSignupRedirect({ method: 'google', planParam: 'basic', nextPath: '/toc' })).toEqual({ href: '/payment?plan=basic', paymentIntent: true })
  })

  it('keeps the legacy bare Google checkout destination when only next carries a plan', () => {
    expect(getSignupRedirect({ method: 'google', planParam: '', nextPath: '/payment?plan=pro' })).toEqual({ href: '/payment', paymentIntent: true })
  })

  it('sends a new Google user through onboarding with their next page', () => {
    expect(getSignupRedirect({ method: 'google', planParam: '', nextPath: '/read/section-2/1', isNewUser: true })).toEqual({
      href: '/onboarding?from=register&next=%2Fread%2Fsection-2%2F1', paymentIntent: false,
    })
  })

  it('returns an existing Google user to the requested page', () => {
    expect(getSignupRedirect({ method: 'google', planParam: '', nextPath: '/read/section-2/1', isNewUser: false })).toEqual({
      href: '/read/section-2/1', paymentIntent: false,
    })
  })

  it('builds a login onboarding URL carrying its reading destination', () => {
    expect(onboardingUrlFor('login', '/read/intro/2')).toBe('/onboarding?from=login&next=%2Fread%2Fintro%2F2')
  })
})
