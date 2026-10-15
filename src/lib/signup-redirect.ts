// Where a reader goes right after signing up. Buy-intent (a pricing/buy CTA:
// `?plan=` or `next=/payment…`) always goes straight to checkout, exactly as
// before onboarding v2. Everyone else who is new answers the onboarding
// questions, carrying `next` so onboarding can send them back to that page.

export function onboardingUrlFor(source: 'register' | 'login', nextPath: string): string {
  return `/onboarding?from=${source}${nextPath !== '/toc' ? `&next=${encodeURIComponent(nextPath)}` : ''}`
}

export function getSignupRedirect(input: {
  method: 'email' | 'google'
  /** Sanitized `?plan=` value ('' when absent). */
  planParam: string
  /** Sanitized `next` ('/toc' when absent or rejected). */
  nextPath: string
  /** Google only: the server says this account was just created. */
  isNewUser?: boolean
}): { href: string; paymentIntent: boolean } {
  const { method, planParam, nextPath } = input
  const paymentIntent = !!planParam || nextPath.startsWith('/payment')
  if (method === 'email') {
    if (paymentIntent) {
      return { href: nextPath.startsWith('/payment') ? nextPath : `/payment?plan=${planParam || 'basic'}`, paymentIntent }
    }
    return { href: onboardingUrlFor('register', nextPath), paymentIntent }
  }
  if (paymentIntent) return { href: planParam ? `/payment?plan=${planParam}` : '/payment', paymentIntent }
  return { href: input.isNewUser ? onboardingUrlFor('register', nextPath) : nextPath, paymentIntent }
}
