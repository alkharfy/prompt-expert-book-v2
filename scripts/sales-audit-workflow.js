export const meta = {
  name: 'sales-audit',
  description: 'Deep line-level audit of the PromptMaster learning platform to find why it sells zero subscriptions, then produce a prioritized development plan',
  phases: [
    { title: 'Audit', detail: 'one specialist agent per money/conversion dimension, line-level' },
    { title: 'Verify', detail: 'adversarially verify every blocker/critical/high finding' },
    { title: 'Synthesize', detail: 'merge verified findings into a prioritized sales-focused dev plan' },
  ],
}

// ─────────────────────────────────────────────────────────────
// Shared business context handed to EVERY agent (they have none of my context)
// ─────────────────────────────────────────────────────────────
const REPO = 'e:/prompt-mr/new-book/book2'
const CONTEXT = `
BUSINESS CONTEXT — read carefully, you have no other context:
- Product: "PromptMaster" — an Arabic (RTL) online learning platform / interactive book teaching prompt-engineering & AI skills. Built with Next.js 16 (App Router), React 19, Supabase (Postgres + auth data), Firebase (auth), Kashier (Egyptian payment gateway), Resend (email), Upstash (rate limit), Meta Pixel + GA4 tracking.
- Market: Egypt / Arabic speakers. Currency EGP. Plans: basic=99 EGP, pro=199 EGP, vip=399 EGP (one-time, server-authoritative prices in src/app/api/payment/create-session/route.ts).
- DEPLOYMENT STATE: The site is LIVE. NEXT_PUBLIC_KASHIER_MODE=live with real Kashier keys, a real domain in NEXT_PUBLIC_SITE_URL, and all integrations (Supabase, Firebase, Kashier, Resend, Upstash, Meta CAPI, GA) configured in .env.local.
- THE PROBLEM (the reason for this audit): Despite being fully live, the site has sold ZERO subscriptions and acquired ZERO paying accounts. The owner wants to understand WHY it does not sell, and get a strong, concrete plan to fix it.
- Repo root: ${REPO}  (use Read / Grep / Glob / Bash; on Windows use forward slashes or backslashes). Source under src/. There is also a tree of markdown audit/plan docs at the repo root (COMPREHENSIVE_SITE_AUDIT.md, SALES_OPTIMIZATION_PLAN.md, etc.) — you may skim them for history but DO NOT trust them as current truth; verify against the actual code.

YOUR JOB: Read the ACTUAL CODE in your assigned area line by line. Find concrete, evidence-backed reasons the site fails to convert visitors into paying subscribers — covering BOTH hard blockers (bugs that break signup/payment/activation/access) AND soft conversion killers (weak copy, no trust, broken funnel, no traffic, friction). Cite file:line for every finding. Be specific and skeptical; prefer fewer high-quality findings over many vague ones. Distinguish "this is broken" from "this is suboptimal".
`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    summary: { type: 'string', description: 'Your overall verdict on this dimension in 2-4 sentences' },
    filesReviewed: { type: 'array', items: { type: 'string' }, description: 'Key files you actually read' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'critical', 'high', 'medium', 'low'] },
          category: { type: 'string', enum: ['bug', 'conversion', 'trust', 'seo-traffic', 'performance', 'security', 'ux', 'content', 'config'] },
          evidence: { type: 'string', description: 'file:line references + what the code actually does. Quote the relevant code.' },
          impact: { type: 'string', description: 'Concretely how this prevents or reduces sales' },
          recommendation: { type: 'string', description: 'Specific fix' },
          effort: { type: 'string', enum: ['quick', 'medium', 'large'] },
        },
        required: ['title', 'severity', 'category', 'evidence', 'impact', 'recommendation', 'effort'],
      },
    },
  },
  required: ['dimension', 'summary', 'filesReviewed', 'findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    isReal: { type: 'boolean', description: 'Is this a genuine, accurately-described problem after re-reading the code?' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    correctedSeverity: { type: 'string', enum: ['blocker', 'critical', 'high', 'medium', 'low', 'invalid'] },
    notes: { type: 'string', description: 'What you confirmed or refuted, with file:line evidence' },
  },
  required: ['title', 'isReal', 'confidence', 'correctedSeverity', 'notes'],
}

// ─────────────────────────────────────────────────────────────
// The audit dimensions — each becomes one deep specialist agent
// ─────────────────────────────────────────────────────────────
const DIMENSIONS = [
  {
    key: 'payment-flow',
    label: 'payment-flow-money-path',
    prompt: `${CONTEXT}
DIMENSION: PAYMENT FLOW (THE MONEY PATH) — the single most important area. If this is broken, sales are literally impossible.
Read EVERY line of these end-to-end and trace the full happy path AND failure paths:
- src/lib/kashier.ts (createPaymentSession, verifyPaymentSession)
- src/app/api/payment/create-session/route.ts
- src/app/api/payment/webhook/route.ts AND src/app/api/webhooks/kashier/route.ts (note: TWO webhook routes exist — figure out which Kashier actually calls and whether the other is dead/conflicting)
- src/app/api/payment/process-callback/route.ts, verify/route.ts, verify-by-order/route.ts, verify-by-user/route.ts, activate/route.ts, intent/route.ts
- src/app/payment/callback/page.tsx and src/app/payment/page.tsx
- src/lib/subscription.ts
- supabase_payments.sql, supabase_payment_intents.sql, supabase_subscriptions.sql, supabase_subscription_functions.sql
KEY QUESTIONS: After a real successful Kashier payment, does the user RELIABLY get is_active=true and plan access? Is the webhook signature/HMAC actually verified (and with the right secret)? Could the redirect-only path fail to activate if the webhook never fires? Are there race conditions, wrong status-string comparisons ('paid' vs 'SUCCESS' vs 'success' vs 'completed'), currency/amount mismatches, or order/session ID mismatches that would leave a paid user locked out? Does the callback page poll/verify correctly? Any place an exception silently swallows activation?
Report findings via the schema. Mark anything that could leave a paying user without access as 'blocker'.`,
  },
  {
    key: 'auth-signup',
    label: 'auth-registration-onboarding',
    prompt: `${CONTEXT}
DIMENSION: REGISTRATION / LOGIN / ONBOARDING FRICTION & BUGS. If users cannot easily create an account, they cannot pay.
Read line by line:
- src/lib/auth_system.ts (large — read it fully), src/lib/auth-middleware.ts, src/lib/auth.ts, src/lib/cookie_utils.ts, src/lib/password.ts, src/lib/fingerprint.ts, src/lib/google_auth.ts, src/lib/firebase_auth_middleware.ts, src/lib/firebase_admin.ts, src/lib/firebase_client.ts
- src/app/api/auth/** (register, login, logout, verify-code, verify-session, google, devices, devices/replace, sync-password, db-operation)
- src/app/register/, src/app/login/, src/app/verify-code/, src/app/forgot-password/, src/app/reset-password/, src/app/onboarding/
- src/components/auth/**, src/components/onboarding/**
- There is a historical FIX_LOGIN_LOOP.md at repo root — check whether the login-loop class of bug still exists.
KEY QUESTIONS: How many steps to go from landing → registered account able to pay? Is email verification (verify-code) required and could it block users (e.g., Resend not sending, codes expiring, spam folder)? Is there a device-limit / fingerprint mechanism that could lock legitimate users out? Any login loop, cookie/session bug, or Firebase/Supabase mismatch? Is Google sign-in working? Is the flow mobile-friendly? Count and report every point of friction or failure that loses a would-be buyer.`,
  },
  {
    key: 'access-gating',
    label: 'middleware-access-gating',
    prompt: `${CONTEXT}
DIMENSION: ACCESS CONTROL & CONTENT GATING (the paywall). Wrong gating kills sales two ways: too locked = no free taste to hook buyers; too open = no reason to pay.
Read line by line:
- middleware.ts (full file, ~19KB) — what is protected, what is public, redirect logic, fail-open vs fail-closed, subscription checks on the Edge.
- src/lib/features.ts, src/lib/subscription.ts, src/config/** (plan/feature config)
- src/app/read/** structure and how "free pages per section" is decided (a recent commit says "open 3 free pages per section")
- supabase_plan_features.sql, supabase_users_plan_columns.sql
KEY QUESTIONS: Does a logged-out visitor get a compelling free taste of the content? Where exactly is the paywall and does it appear at a persuasive moment? Could the middleware accidentally lock out paying users (fail-closed bug) or accidentally give everything away free (gating not enforced)? Is the gating consistent between middleware and API routes? Does the value shown before the wall justify 99-399 EGP? Report gating bugs as high/critical and gating-strategy problems as conversion.`,
  },
  {
    key: 'landing-hero',
    label: 'landing-hero-funnel',
    prompt: `${CONTEXT}
DIMENSION: LANDING PAGE & CONVERSION FUNNEL (above-the-fold + flow). This is what cold ad traffic sees first.
Read line by line:
- src/app/page.tsx (order of sections), src/app/layout.tsx
- src/components/landing/HeroSection.tsx, PainPointsSection.tsx, WhatYouLearn.tsx, TargetAudience.tsx, FinalCTA.tsx, MobileStickyBuy.tsx, PromoBanner.tsx, UnifiedBackground.tsx
- src/components/Navigation (find it under src/components)
KEY QUESTIONS: Within 5 seconds, is the value proposition + who-it's-for + primary CTA crystal clear? Is there ONE dominant CTA or competing CTAs? Does the hero promise a concrete outcome or vague fluff? Is the Arabic copy persuasive, credible, and free of typos? Is the path from hero → pricing → buy short and frictionless? Is there urgency/scarcity that is honest? On mobile (most Egyptian traffic), does the above-the-fold and sticky buy bar work? Evaluate the copy quality critically as a conversion copywriter would. Report weak copy / funnel friction as 'conversion'.`,
  },
  {
    key: 'pricing-offer',
    label: 'pricing-offer-strategy',
    prompt: `${CONTEXT}
DIMENSION: PRICING PRESENTATION & OFFER STRENGTH. A weak or confusing offer is one of the top reasons a live site makes zero sales.
Read line by line:
- src/components/landing/PricingSection.tsx (large), CompetitorComparison.tsx, CertificatePreview.tsx, GamificationSection.tsx, BookContentsSection.tsx, CaseStudies.tsx
- The server-side prices and plan definitions in src/app/api/payment/create-session/route.ts and src/lib/features.ts / src/config
- supabase_plan_features.sql, supabase_promo_codes.sql, src/lib/promo.ts
KEY QUESTIONS: Is the offer compelling and the value stack obvious for 99/199/399 EGP? Is there a clear "best value" anchor? Is there a money-back / satisfaction guarantee to remove risk (critical for a no-reputation Egyptian site asking for card payment)? Is the difference between plans clear, or is choice-overload causing paralysis? Is the price justified by the value shown? Are promo codes/discounts used to create urgency? Does the pricing match what the payment API charges (mismatch = trust break)? Evaluate as a direct-response offer strategist. Report as 'conversion' / 'trust'.`,
  },
  {
    key: 'trust-credibility',
    label: 'trust-social-proof',
    prompt: `${CONTEXT}
DIMENSION: TRUST, CREDIBILITY & RISK-REVERSAL. An unknown Egyptian site asking for card payment converts ~0% without trust signals.
Investigate (read code + look for absence of things):
- src/components/landing/Testimonials.tsx, FAQSection.tsx, CertificatePreview.tsx, CompetitorComparison.tsx
- src/lib/testimonials.ts, supabase_testimonials* , the testimonials admin
- NOTE: src/app/page.tsx currently DOES NOT render <Testimonials /> (removed 2026-05 as "scammy"). So the live landing page has NO social proof at all — assess that.
- Look for: refund/guarantee policy, terms, privacy policy, about page, real contact info, WhatsApp support (NEXT_PUBLIC_WHATSAPP_NUMBER), payment-security/SSL badges, founder identity, real student results.
KEY QUESTIONS: What trust signals exist vs are missing? Is there ANY social proof on the live landing page right now? Is there a refund guarantee? Are there legal pages (terms/privacy) — their absence blocks some payment processors and scares buyers? Is there a visible human/brand behind it? Is WhatsApp support wired up and visible? Rank the trust gaps by how much they suppress conversion. Report as 'trust'.`,
  },
  {
    key: 'acquisition-tracking',
    label: 'acquisition-seo-tracking',
    prompt: `${CONTEXT}
DIMENSION: TRAFFIC ACQUISITION, SEO & CONVERSION TRACKING. Zero sales can simply mean zero (or untracked) traffic. Also, if ad-conversion tracking is broken, paid ads can't optimize and will never produce sales profitably.
Read line by line:
- src/app/sitemap.ts, src/app/robots.ts, src/app/layout.tsx (metadata, OG tags), any generateMetadata in pages
- src/lib/meta-pixel.ts, src/lib/meta-capi.ts, src/components/MetaViewContent, the Pixel/GA injection
- src/lib/analytics.ts, GA setup, src/app/api/share/og/**, src/components/sharing/**
- src/app/blog/** and src/app/api/** for any content/SEO surface
- src/app/api/lead-magnet/** and src/components/landing/LeadMagnetModal.tsx (email capture for retargeting)
KEY QUESTIONS: Is the Meta Pixel + CAPI correctly firing ViewContent / InitiateCheckout / Purchase with correct value & currency & dedup (event_id)? Is the Purchase event guaranteed to fire on real conversions (server-side)? Is GA configured? Is the site indexable (robots/sitemap correct, no accidental noindex)? Are OG/meta tags good for social sharing? Is there an SEO content strategy or is the site invisible to search? Is the lead magnet capturing emails for retargeting? Broken purchase tracking on a paid-ads business is effectively a sales blocker — mark accordingly.`,
  },
  {
    key: 'email-lifecycle',
    label: 'email-lifecycle-recovery',
    prompt: `${CONTEXT}
DIMENSION: EMAIL & LIFECYCLE / CART RECOVERY. For an info-product, follow-up email and abandoned-cart recovery often drive the majority of conversions. If transactional email is broken, signup itself breaks.
Read line by line:
- src/lib/email.ts (full), src/lib/upgrade-emails.ts, src/lib/cart-recovery.ts
- src/app/api/cron/** (cart-recovery, check-expirations, send-reminders, upgrade-drip), vercel.json (are crons even scheduled?)
- src/app/api/email/** (preferences, unsubscribe), src/app/api/lead-magnet/**
- Resend config (EMAIL_FROM, RESEND_API_KEY usage) — is the sending domain verified? Will emails land or bounce/spam?
KEY QUESTIONS: Does registration/verification email actually send (and is the from-domain verified in Resend, else it silently fails or goes to spam — which would also break verify-code signup)? Are the cron jobs actually registered in vercel.json with the right schedule and CRON_SECRET, or are cart-recovery/drip emails never running? Is there a welcome → value → offer sequence for the lead magnet list? Is abandoned-checkout recovery actually triggered when a payment stays 'pending'? Report broken transactional email as critical/blocker; missing nurture sequences as conversion.`,
  },
  {
    key: 'security-money',
    label: 'security-of-money-path',
    prompt: `${CONTEXT}
DIMENSION: SECURITY OF THE MONEY PATH (fraud / abuse / integrity). Beyond classic security: focus on issues that would let people get access WITHOUT paying (revenue leakage) or that would scare/block legitimate buyers.
Read line by line:
- src/app/api/payment/** (price tampering: is amount server-authoritative? can isUpgrade/currentPlanId be abused for a near-free upgrade?), webhook auth (is the webhook endpoint open/unauthenticated so anyone can POST a fake 'paid' and self-activate?)
- src/app/api/promo/** + src/lib/promo.ts + supabase_promo_atomic.sql (promo abuse, stacking, negative prices)
- src/lib/rate-limit.ts usage across auth/payment, src/lib/sanitize.ts, src/lib/validation.ts
- src/app/api/admin/** + the ADMIN_PASSWORD gate (is the admin/billing dashboard properly protected?)
- middleware.ts security headers / CSP (does CSP block Kashier iframe or Pixel, breaking checkout/tracking?)
KEY QUESTIONS: Can a user activate a paid plan without actually paying (forged webhook, replay, manipulating callback params, calling /api/payment/activate directly)? Can the upgrade-diff logic be exploited to pay ~1 EGP for VIP? Can promo codes drive price to 0 or negative? Is the admin dashboard exposed? Does the CSP/headers config accidentally break the Kashier checkout iframe or the Meta Pixel (which would silently kill payments/tracking)? Report exploitable revenue-leak or checkout-breaking issues as critical/blocker.`,
  },
  {
    key: 'product-content',
    label: 'product-content-value',
    prompt: `${CONTEXT}
DIMENSION: PRODUCT / CONTENT VALUE (is the thing actually worth paying for?). People don't pay for thin content. Also broken reading UX inside the product kills word-of-mouth and refunds.
Investigate:
- src/app/read/** — how many sections/pages exist, is the content substantive or placeholder/thin? Read several real pages.
- src/data/** (where book content likely lives), src/components/reading/**
- src/app/toc, src/app/library, exercises (src/app/exercises + src/components/exercises), certificate (src/app/certificate), gamification, prompt-hospital, tools, challenge, running-project
- CONTENT_IMPROVEMENT_PLAN.md and LEARNING_PATHS_PLAN.md at root (history only)
KEY QUESTIONS: Is there enough real, high-quality content to justify the price, or does a buyer hit thin/empty/placeholder material quickly (refund risk + no referrals)? Is the reading experience (navigation, progress, mobile) solid? Are the "wow" features (certificate, AI chat, exercises, gamification) actually functional or half-built? Does the free preview show off the best content or the most boring intro? Report thin content / broken product UX as 'content'/'ux' with appropriate severity.`,
  },
  {
    key: 'mobile-rtl-perf',
    label: 'mobile-rtl-performance',
    prompt: `${CONTEXT}
DIMENSION: MOBILE, RTL CORRECTNESS & PERFORMANCE. Egyptian traffic is overwhelmingly mobile; a janky/broken mobile RTL experience or slow load destroys conversion before the user reads anything.
Investigate:
- src/app/globals.css, src/app/auth.css, src/styles/**, dir="rtl" handling in layout.tsx
- Landing components for responsive breakpoints, the MobileStickyBuy bar, Navigation on mobile
- next.config.js (image optimization, etc.), use of next/image vs raw img, framer-motion/gsap weight, large client components ('use client') that bloat the bundle, heavy media (the robot video NEXT_PUBLIC_ROBOT_VIDEO_URL on the hero)
- Any layout-shift / overflow / RTL-flip bugs (left/right padding, arrows, flex direction)
KEY QUESTIONS: Does the landing page load fast on a mid-range Android over mobile data, or is it blocked by a huge hero video / unoptimized images / heavy JS? Are there RTL layout bugs (mirrored icons, broken alignment, horizontal scroll)? Is the mobile buy flow truly tappable and frictionless? Report perf/mobile/RTL issues; mark a hero that won't load on mobile as high/critical.`,
  },
  {
    key: 'build-health',
    label: 'build-runtime-health',
    prompt: `${CONTEXT}
DIMENSION: BUILD & RUNTIME HEALTH (ground truth). A site that errors in production, fails to build, or 500s on a key page will obviously not sell. Get hard evidence, do not just read.
Do this with the Bash/PowerShell tool from ${REPO}:
- Inspect package.json scripts, next.config.js, vercel.json, tsconfig.json, eslint config.
- Run a TypeScript typecheck (e.g. 'npx tsc --noEmit' — it may be slow; allow a long timeout) and report errors.
- Attempt a production build if feasible ('npx next build' with a generous timeout); if it's too slow or needs env, say so and instead statically reason about build risks. Capture any build errors.
- Run the test suite if present ('npm test' / vitest) and report pass/fail.
- Grep for obvious runtime hazards: 'TODO'/'FIXME'/'throw new Error' in money-path routes, missing env guards, 'console.error', uncaught awaits, references to env vars not present in .env.local.
- Check whether the two payment webhook routes or any duplicate/conflicting routes cause build/route conflicts.
KEY QUESTIONS: Does it typecheck? Does it build? Do tests pass? Are there pages/routes that would 500 in production? Are there missing-but-required env vars? Report concrete failures with the actual error output as evidence. Mark build-breaking or page-crashing issues as 'blocker'.`,
  },
]

// ─────────────────────────────────────────────────────────────
// PHASE 1+2 — audit each dimension, then adversarially verify its
// blocker/critical/high findings. Pipeline: a dimension starts verifying
// as soon as its audit returns (no global barrier between phases).
// ─────────────────────────────────────────────────────────────
phase('Audit')
log(`Auditing ${DIMENSIONS.length} dimensions of the money + conversion path, line by line...`)

const perDimension = await pipeline(
  DIMENSIONS,
  // Stage 1 — deep audit
  (d) => agent(d.prompt, { label: `audit:${d.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA }),
  // Stage 2 — verify the sales-blocking findings of THIS dimension
  (audit, d) => {
    if (!audit) return { dimension: d.key, audit: null, verdicts: [] }
    const toVerify = (audit.findings || []).filter(
      (f) => f.severity === 'blocker' || f.severity === 'critical' || f.severity === 'high'
    )
    if (toVerify.length === 0) return { dimension: d.key, audit, verdicts: [] }
    return parallel(
      toVerify.map((f) => () =>
        agent(
          `${CONTEXT}
You are an adversarial verifier. A prior auditor reported the following problem in the "${d.key}" area. Your job is to RE-READ THE ACTUAL CODE and decide if it is genuinely real and correctly described, or a false alarm / overstated. Default to skeptical: if the evidence does not hold up when you read the cited code, mark isReal=false.

REPORTED FINDING:
- Title: ${f.title}
- Severity claimed: ${f.severity}
- Category: ${f.category}
- Evidence claimed: ${f.evidence}
- Stated impact on sales: ${f.impact}

Open the cited files at ${REPO} and confirm or refute. Return the verdict via the schema, including the CORRECTED severity (use 'invalid' if it's not a real problem).`,
          { label: `verify:${d.key}:${f.severity}`, phase: 'Verify', schema: VERDICT_SCHEMA }
        ).then((v) => ({ finding: f, verdict: v }))
      )
    ).then((pairs) => ({ dimension: d.key, audit, verdicts: pairs.filter(Boolean) }))
  }
)

// ─────────────────────────────────────────────────────────────
// Barrier: synthesis genuinely needs ALL findings together.
// Build a consolidated, verification-adjusted finding list.
// ─────────────────────────────────────────────────────────────
const consolidated = []
for (const r of perDimension.filter(Boolean)) {
  if (!r.audit) continue
  const verdictByTitle = new Map((r.verdicts || []).map((p) => [p.finding.title, p.verdict]))
  for (const f of r.audit.findings || []) {
    const v = verdictByTitle.get(f.title)
    // Drop findings the verifier refuted outright
    if (v && (v.isReal === false || v.correctedSeverity === 'invalid')) continue
    consolidated.push({
      dimension: r.dimension,
      title: f.title,
      severity: v && v.correctedSeverity && v.correctedSeverity !== 'invalid' ? v.correctedSeverity : f.severity,
      category: f.category,
      evidence: f.evidence,
      impact: f.impact,
      recommendation: f.recommendation,
      effort: f.effort,
      verifierNotes: v ? v.notes : '(not separately verified — medium/low severity)',
      verifierConfidence: v ? v.confidence : null,
    })
  }
}

const dimensionSummaries = perDimension
  .filter(Boolean)
  .map((r) => (r.audit ? `### ${r.dimension}\n${r.audit.summary}` : `### ${r.dimension}\n(audit failed)`))
  .join('\n\n')

log(`Audit complete: ${consolidated.length} verified findings across ${DIMENSIONS.length} dimensions. Synthesizing plan...`)

// ─────────────────────────────────────────────────────────────
// PHASE 3 — synthesize the development plan, then run a completeness
// critic, then produce the final merged plan.
// ─────────────────────────────────────────────────────────────
phase('Synthesize')

const findingsJson = JSON.stringify(consolidated, null, 1)

const draftPlan = await agent(
  `${CONTEXT}

You are a senior growth-engineering lead. Below are VERIFICATION-ADJUSTED findings from a deep, line-level audit of the live PromptMaster site (which has sold ZERO subscriptions), plus each dimension's summary. Synthesize them into a single, ruthless, prioritized DEVELOPMENT PLAN whose ONE goal is: make this site actually sell subscriptions.

Write the plan in ARABIC (the owner's language), in clear Markdown. Structure it EXACTLY as:

# خطة تطوير PromptMaster — لماذا لا يبيع وكيف نجعله يبيع

## 1. الخلاصة التنفيذية (لماذا صفر مبيعات؟)
3-6 جمل: السبب الجذري الأرجح لصفر مبيعات، مبني على الأدلة.

## 2. العوائق القاتلة (Blockers) — أصلحها أولاً قبل أي إعلان
جدول/قائمة بكل عائق يجعل البيع مستحيلاً تقنياً (تسجيل/دفع/تفعيل/وصول/بناء)، مع: الدليل (file:line)، الأثر، الإصلاح المحدد، والجهد. رتّبها بحيث "لا تنفق جنيهاً على إعلانات قبل إصلاح هذه".

## 3. قاتلات التحويل (Conversion Killers)
المشاكل التي تجعل الزائر لا يشتري رغم أن كل شيء يعمل: ضعف العرض، غياب الثقة/الضمان، نسخ ضعيفة، احتكاك، تسعير محيّر. مرتبة بالأثر.

## 4. مشكلة الزيارات والتتبع (Traffic & Tracking)
هل المشكلة أصلاً عدم وجود زوّار؟ حالة Pixel/CAPI/GA/SEO، وما يلزم لإطلاق إعلانات قابلة للقياس.

## 5. خطة التنفيذ المرحلية
- **المرحلة 0 — هذا الأسبوع (إصلاح نزيف المبيعات):** أهم 5-10 مهام عالية الأثر/منخفضة الجهد. لكل مهمة: ماذا، أين (ملف)، لماذا، ومعيار الإنجاز.
- **المرحلة 1 — أول أسبوعين (الثقة + العرض + التحويل).**
- **المرحلة 2 — الشهر (الزيارات + البريد + التحسين المستمر).**

## 6. أول إجراء الآن (Single Next Action)
السطر الواحد الذي يجب أن يفعله المالك اليوم.

RULES: Be concrete and cite file paths. Prioritize by (impact on revenue) ÷ (effort). Do not invent problems not in the findings, but you MAY connect dots across findings. Call out the single most likely reason for zero sales explicitly. Keep it actionable, not academic.

DIMENSION SUMMARIES:
${dimensionSummaries}

VERIFIED FINDINGS (JSON):
${findingsJson}
`,
  { label: 'synthesize:draft-plan', phase: 'Synthesize' }
)

const critique = await agent(
  `${CONTEXT}

You are a completeness critic. Below is (a) the full list of verified audit findings and (b) a draft Arabic development plan built from them. Find what the plan MISSED or got wrong:
- Any blocker/critical finding from the JSON that the plan failed to surface in its "Blockers" or "Conversion Killers" sections.
- Any wrong prioritization (e.g. a real payment blocker buried below cosmetic copy tweaks).
- Any obvious "make it sell" lever that the findings + context imply but the plan ignored (e.g. guarantee, social proof, simplified pricing, working purchase tracking before ads).
- Any place the plan is vague where it should name a file/action.
Return concise Markdown bullets: "MISSING:", "MISPRIORITIZED:", "VAGUE:", "WRONG:". If the plan is solid, say what's already good but still push for the 3 highest-leverage additions.

VERIFIED FINDINGS (JSON):
${findingsJson}

DRAFT PLAN:
${draftPlan}
`,
  { label: 'synthesize:critic', phase: 'Synthesize' }
)

const finalPlan = await agent(
  `${CONTEXT}

You are the senior lead finalizing the development plan. Below is your draft plan and a completeness critic's feedback. Produce the FINAL, improved Arabic Markdown plan, incorporating every valid point from the critique (especially missing blockers and reprioritization). Keep the exact section structure of the draft. Make Phase 0 the tightest, highest-leverage "stop the bleeding" list. Cite files. This is the document the owner will execute from — make it sharp, ordered by revenue-impact ÷ effort, and unambiguous about the single root cause of zero sales and the single next action.

DRAFT PLAN:
${draftPlan}

CRITIC FEEDBACK:
${critique}
`,
  { label: 'synthesize:final-plan', phase: 'Synthesize' }
)

const blockers = consolidated.filter((f) => f.severity === 'blocker')
const criticals = consolidated.filter((f) => f.severity === 'critical')

return {
  finalPlan,
  stats: {
    dimensions: DIMENSIONS.length,
    totalVerifiedFindings: consolidated.length,
    blockers: blockers.length,
    criticals: criticals.length,
  },
  blockers: blockers.map((b) => ({ dimension: b.dimension, title: b.title, evidence: b.evidence })),
  criticals: criticals.map((b) => ({ dimension: b.dimension, title: b.title })),
  consolidated,
}
