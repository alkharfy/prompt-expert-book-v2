/**
 * «ادعي صاحبك» is hidden until the reward exists (owner 2026-11-01): the 50 EGP was promised but nothing
 * applies it at checkout, and users.referral_code is missing in production, so the code never loaded.
 * Read by /profile, the nav and /register.
 */
export const REFERRALS_LIVE = false
