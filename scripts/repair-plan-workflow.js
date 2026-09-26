export const meta = {
  name: 'repair-plan',
  description: 'Design a complete fix for every PromptMaster sales-blocking workstream, each adversarially pressure-tested against the live code to prove the fix is complete and unbypassable',
  phases: [
    { title: 'Design', detail: 'one agent designs the complete, concrete fix per workstream (reads live code)' },
    { title: 'Adversarial', detail: 'a skeptic reads the code and tries to prove each fix is incomplete or bypassable' },
    { title: 'Synthesize', detail: 'merge into a hardened, verification-backed master repair plan' },
  ],
}

const REPO = 'e:/prompt-mr/new-book/book2'

const CONTEXT = `
BUSINESS CONTEXT — you have no other context, read carefully:
- Product: "PromptMaster" — Arabic (RTL) online learning platform / interactive book teaching prompt-engineering & AI. Next.js 16 App Router, React 19, Supabase (Postgres), Firebase (auth, client-side), Kashier (Egyptian payment gateway), Resend (email), Upstash (rate limit), Meta Pixel + CAPI + GA4.
- Market: Egypt, EGP. Plans basic=99 / pro=199 / vip=399 EGP (server-authoritative in src/app/api/payment/create-session/route.ts:61-65), one-time.
- Repo root: ${REPO} (use Read / Grep / Glob / Bash). Source under src/.
- GROUND TRUTH FROM THE OWNER (important — do NOT contradict): The end-to-end payment happy path WORKS. When the owner pays, money IS deducted by Kashier AND a real account is activated (users.is_active becomes true). So: Firebase signup works, Kashier session creation works, the charge works, and activation works on at least the desktop happy path. Therefore DO NOT treat "payment is broken" as the problem. Money-path findings (webhook payload shape, verify routes not setting is_active, no reconciliation cron) are RELIABILITY HARDENING for edge cases (mobile tab-close, webhook never firing, alternate code paths) — important for not losing paying customers at scale, but NOT the reason for zero sales.
- THE REAL PROBLEM (from a prior deep audit, 81 findings): (1) the paid book is shipped in full to every browser and only CSS-blurred, so there is no reason to pay; (2) every primary CTA pushes free reading and registration never routes to payment, so the funnel never asks for money; (3) prices are inconsistent across 4 places (shown != charged) and there is zero credible trust (no social proof, fake stats, no legal pages, no founder identity, a throwaway *.vercel.app domain); (4) ad conversion tracking is broken (wrong domain in CAPI, mismatched event_id) and all lifecycle/cart emails send to nobody (a users.plan_id column-name bug). The site is live but sells zero subscriptions.
`

const FIX_DESIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    workstream: { type: 'string' },
    goal: { type: 'string', description: 'One sentence: what "fully fixed" means for this workstream — the observable end state.' },
    currentStateNotes: { type: 'string', description: 'What the live code actually does today, confirmed by reading it (file:line). Correct any stale assumptions.' },
    steps: {
      type: 'array',
      description: 'Ordered, concrete implementation steps. Each must name the exact file(s) and what to change.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string' },
          files: { type: 'string', description: 'file:line references touched' },
          detail: { type: 'string', description: 'Concrete change / code approach, specific enough to implement directly.' },
        },
        required: ['action', 'files', 'detail'],
      },
    },
    acceptanceCriteria: { type: 'array', items: { type: 'string' }, description: 'Observable, testable conditions that must ALL hold for this to count as fixed.' },
    verification: { type: 'string', description: 'How to verify: concrete manual steps AND any automated test/assert to add.' },
    risks: { type: 'array', items: { type: 'string' }, description: 'What this change could break, and regressions to watch for.' },
    effort: { type: 'string', enum: ['quick', 'medium', 'large'] },
  },
  required: ['workstream', 'goal', 'currentStateNotes', 'steps', 'acceptanceCriteria', 'verification', 'risks', 'effort'],
}

const ADVERSARIAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    workstream: { type: 'string' },
    verdict: { type: 'string', enum: ['complete', 'needs-hardening', 'insufficient'] },
    fullyFixesRootProblem: { type: 'boolean' },
    bypassAttempts: {
      type: 'array',
      description: 'Concrete ways a user/attacker could STILL hit the original problem after this fix, or ways the fix fails to actually solve it. Be specific and read the code.',
      items: { type: 'string' },
    },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          gap: { type: 'string' },
          evidence: { type: 'string', description: 'file:line or reasoning showing why the proposed fix leaves this open' },
          additionalFixNeeded: { type: 'string' },
        },
        required: ['gap', 'evidence', 'additionalFixNeeded'],
      },
    },
    hardenedAcceptanceCriteria: { type: 'array', items: { type: 'string' }, description: 'The acceptance criteria rewritten/extended so they would actually catch the bypasses above.' },
    adversarialTests: { type: 'array', items: { type: 'string' }, description: 'Specific tests an attacker/QA would run to PROVE the fix holds (e.g. "open DevTools, delete the blur node, confirm no premium text in DOM or JS chunk").' },
  },
  required: ['workstream', 'verdict', 'fullyFixesRootProblem', 'bypassAttempts', 'gaps', 'hardenedAcceptanceCriteria', 'adversarialTests'],
}

// ─────────────────────────────────────────────────────────────
// Repair workstreams — grouped from the 81 audit findings. Each carries
// its grounding findings so the designer/adversary start precise, then
// verify & extend against the LIVE code.
// ─────────────────────────────────────────────────────────────
const WORKSTREAMS = [
  {
    key: 'ws1-server-paywall',
    title: 'Real server-side paywall (give people a reason to pay)',
    priority: 'P0 — core reason to pay',
    findings: `
- The paid book ships in FULL to every browser; the lock is only CSS. Section routes are 'use client' and statically import whole units: e.g. src/app/read/section-2/[page]/page.tsx imports unit2Data from src/data/bookData.ts (194KB, all 10 units). SectionPage.tsx:879-892 only applies filter:blur(8px)/pointerEvents:none/opacity:0.3; the real contentBlocks are still rendered into the DOM (SectionPage.tsx:926-1255). middleware.ts:137 isPublicPath returns true for any /read/*. verifySession() (src/lib/auth.ts:9-21) is a client-only cookie check. (CONFIRMED high confidence.)
- src/utils/searchIndex.ts:50-66 imports introData..unit10Data into the client bundle too.
- SectionPage.tsx:75 optimistic hasPaid=true and fails OPEN on verify error (lines 187-189).
- /library: src/app/library/[page]/page.tsx:33 isCurrentPageLocked=!isAuthed (checks login, NOT payment); /library is in middleware PUBLIC_PATHS; library is a PAID feature in features.ts. Any free account reads all templates. (CONFIRMED.)
- Free preview is far larger than advertised (~51 of ~192 pages free): src/config/sections.ts section-1 freePageLimit:17, sections 3-10 freePageLimit:3.`,
  },
  {
    key: 'ws2-pricing-truth',
    title: 'Single source of truth for price & product stats (shown == charged)',
    priority: 'P0 — trust at checkout',
    findings: `
- Four conflicting price ladders: server charges 99/199/399 (create-session/route.ts:61-65); plans DB table & payment UI hardcode 299/499/999 (payment/page.tsx:50 PLAN_PRICES; create_plans_table.sql); landing site_settings seeded 299/699/1499 (supabase_landing_page.sql); LockedOverlay.tsx:176 says 'من 299 ج.م'.
- AI56 promo: fixed 294 discount assuming basic=299, but basic=99, and the clamp at create-session/route.ts:164 forces final = basePrice-1 = 1 EGP. Ad promises '5 جنيه'.
- Upgrade math uses PLAN_PRICES (299/499/999) → payment/page.tsx:384,493,514 can show negative/garbage diffs while server charges the 99/199/399 diff.
- Inconsistent product stats across funnel: exercises 45 vs 55 (real 48); pages 89/143/180/188; free pages 27 vs 51.`,
  },
  {
    key: 'ws3-funnel-asks-for-money',
    title: 'A funnel that actually asks for the sale',
    priority: 'P0 — the funnel never asks to buy',
    findings: `
- Registration never routes to payment: register/page.tsx:142-150 unconditionally window.location.href='/onboarding' (ignores needsPayment:true and the next param); onboarding ends at /read/intro/1.
- Every primary CTA pushes free reading: HeroSection.tsx:112, MobileStickyBuy.tsx:47, FinalCTA.tsx:24 all → /read/intro/1. The only real buy CTA is PricingSection.tsx:116, deep in the page.
- MobileStickyBuy hides itself when pricing is visible (MobileStickyBuy.tsx:14-19) so the persistent mobile CTA is ALWAYS the free one — never a buy.
- GuestBanner.tsx:19-25 only offers a free account, no price, no purchase path.
- payment/page.tsx:119-131 forces /register before the visitor can see checkout or enter the AI56 promo; onboarding is an extra 3-step gate before any value or payment.`,
  },
  {
    key: 'ws4-trust-credibility',
    title: 'Trust, credibility & risk-reversal (for a stranger entering a card)',
    priority: 'P1 — conversion of arriving traffic',
    findings: `
- Fabricated stats are LIVE: FAQSection.tsx:113-127 shows '+500 متعلم سعيد' and '4.9/5' on a site with zero customers. (CONFIRMED.)
- Zero social proof rendered on the live landing page; Testimonials/CaseStudies/CompetitorComparison/CertificatePreview exist in src/components/landing but are NOT imported in src/app/page.tsx. (CONFIRMED.)
- No legal pages and no footer: no /terms, /privacy, /refund-policy, /about, /contact anywhere; layout.tsx renders no footer; the 30-day guarantee links to nothing. (CONFIRMED — also a payment-gateway compliance risk.)
- No founder/human identity anywhere (CONFIRMED). Certificate signed generically 'PromptMaster'.
- Fabricated proof assets: CertificatePreview.tsx sample cert 'محمد أحمد' with a mismatched course title; CaseStudies.tsx invented income claims.
- Payment-security cues are emoji-only (🔒), no real Visa/Mastercard/Meeza/Kashier logos; guarantee asserted but no refund policy/flow.`,
  },
  {
    key: 'ws5-domain-unification',
    title: 'One branded production domain everywhere',
    priority: 'P1 — trust + SEO + correct redirects',
    findings: `
- Live site runs on NEXT_PUBLIC_SITE_URL=https://prompt-expert-book-ten.vercel.app (a throwaway Vercel subdomain). (CONFIRMED.)
- Four domains referenced: meta-capi.ts hardcodes www.prompt-mr.com (118/152/181/212); sitemap.ts:4 & robots.ts:3 fall back to prompt-mr.com; OG footer & share/email say promptexpert.com; challenge/page.tsx:160 & lead-magnet fallback say promptexpertbook.com; support email support@prompt-mr.com.
- No canonical/alternates tags anywhere (grep returns 0). openGraph.locale is 'ar_SA' on an Egypt product (should be ar_EG).
- Kashier redirect/callback/webhook URLs and Resend links are all built from the site URL, so the domain choice propagates everywhere.`,
  },
  {
    key: 'ws6-ad-tracking',
    title: 'Ad conversion tracking integrity (so paid ads can optimize)',
    priority: 'P1 — required before ad spend',
    findings: `
- CAPI event_source_url hardcoded to prompt-mr.com (meta-capi.ts:118/152/181/212) while the live domain differs → poor Meta event match quality / dropped events.
- Purchase event_id mismatch: browser pixel uses raw orderId (meta-pixel.ts:95) while CAPI defaults to purchase_<orderId> (meta-capi.ts:117) → Meta cannot dedupe → unreliable Purchase signal.
- InitiateCheckout & Lead fire with NO shared event_id (meta-pixel.ts:73,56 use trackMetaEvent without id; sendCAPIInitiateCheckout/sendCAPILead set none) → double counting.
- Inconsistent values: ViewContent 50 (pixel) vs 5 (CAPI) vs GA 5; leftover 5.00 defaults vs real 99/199/399.
- Lead magnet fires no Meta Lead and builds no retargeting audience (api/lead-magnet/route.ts; LeadMagnetModal.tsx).
- META_PIXEL_ID & NEXT_PUBLIC_GADS_CONVERSION_ID not set; pixel id hardcoded in two places; Google Ads conversion call is a silent no-op.`,
  },
  {
    key: 'ws7-email-lifecycle',
    title: 'Lifecycle & recovery email that actually sends and lands',
    priority: 'P0/P1 — recovers warm leads & carts',
    findings: `
- BLOCKER: upgrade-emails.ts:192 queries users.plan_id (non-existent; real column is current_plan per database.types.ts:32) → the whole 6-email/14-day upgrade drip sends to nobody.
- BLOCKER: cart-recovery.ts:165-170 also reads users.plan_id → skips every abandoned cart; and no payment-success path sets payment_intents.completed=true.
- No welcome email and no email_preferences row are created on signup (sendWelcomeEmail & ensureEmailPreferences are never called from register/route.ts) → also breaks unsubscribe tokens (cart/upgrade emails fall back to user.id which matches no row).
- Sending domain mismatch: EMAIL_FROM=prompt-mr.com, email.ts:104 footer says promptexpert.com, code defaults promptexpertbook.com; if prompt-mr.com isn't SPF/DKIM/DMARC-verified in Resend, ALL emails silently fail or spam.
- Lead-magnet list (lead_magnet_subscribers) has no nurture sequence — one PDF email then silence.
- vercel.json runs crons daily but code assumes hourly; send-reminders ±1h window misses default 18:00 users.`,
  },
  {
    key: 'ws8-moneypath-hardening',
    title: 'Money-path reliability hardening (keep every payer, no silent loss)',
    priority: 'P1 — reliability at scale (payment already works on happy path)',
    findings: `
NOTE: The owner confirms the happy path works (charge + activation). These are edge-case reliability fixes, not blockers.
- Webhook payload shape vs Kashier v3 is unverified: webhook/route.ts requires event:'pay' + signatureKeys + status SUCCESS and HMACs a querystring with the API key; every failure path returns 200 silently. If Kashier's real payload differs, server-to-server activation silently no-ops and activation depends on the user staying on /payment/callback.
- No reconciliation cron for payments stuck at status='pending' with a kashier_session_id (mobile users who close the tab after paying are charged but not activated).
- verify/route.ts:66-72 and verify-by-order createSubscription set current_plan & plan_expires_at but NOT is_active=true (process-callback & activate do it correctly) — latent lockout if activation routes through them.
- No check that amount paid == amount owed before activation (status-only gate) — revenue-leak invariant unmet.
- Dead second webhook src/app/api/webhooks/kashier/route.ts uses the wrong secret + snake_case fields; delete it (stale docs point to it — a misconfig there would zero out all activations).
- Payment/promo routes call synchronous in-memory checkRateLimit (rate-limit.ts) instead of checkRateLimitAsync (Upstash) → limits don't hold on serverless.
- No alerting when the money path rejects/fails.`,
  },
  {
    key: 'ws9-mobile-perf-seo',
    title: 'Mobile speed, SSR & organic discoverability',
    priority: 'P1/P2 — most Egyptian traffic is mobile; no organic channel today',
    findings: `
- Firebase Web SDK + bcryptjs are bundled into the landing page client JS: HeroSection.tsx:7 & Navigation.tsx:7 import authSystem → auth_system.ts statically imports ./password (bcryptjs) and ./firebase_client (firebase/app+auth, eagerly initialized at module load). Hundreds of KB shipped to every anonymous visitor.
- Hero is SSR-disabled: HeroSection.tsx:11-22 builds Motion components via dynamic(..., {ssr:false}) with initial opacity:0 → the H1/description/CTA are absent from server HTML and start invisible → bad mobile LCP + weak SEO.
- Three concurrent always-on animation layers on the hero (BackgroundParticles canvas rAF + ~10 framer-motion SVGs in UnifiedBackground + Robot float/glow/13 particles) → scroll jank on mid-range Android.
- Robot <Image fill> with no sizes + a 499KB priority PNG poster → oversized mobile download.
- /read pages are client-gated → crawlers get a lock overlay, not text → ~170 sitemap URLs are invisible to search; section-8/9/10 lack metadata. Blog has only 7 posts. No organic acquisition channel.
- PromoBanner (fixed, z-index 1000) overlaps the fixed nav (no --promo-h offset).`,
  },
]

// ─────────────────────────────────────────────────────────────
// PHASE 1+2 — design each fix, then adversarially pressure-test it.
// Pipeline: a workstream's adversary runs as soon as its design returns.
// ─────────────────────────────────────────────────────────────
phase('Design')
log(`Designing + adversarially verifying ${WORKSTREAMS.length} repair workstreams...`)

const perWorkstream = await pipeline(
  WORKSTREAMS,
  // Stage 1 — design the complete fix (reads live code)
  (ws) =>
    agent(
      `${CONTEXT}

WORKSTREAM: ${ws.title}  [${ws.priority}]

Grounding findings from the prior audit (verify these against the LIVE code and correct anything stale — line numbers may have drifted):
${ws.findings}

YOUR TASK: Read the actual current code at the cited paths in ${REPO}, then design a COMPLETE, CONCRETE fix for this entire workstream. Not a sketch — detail it enough that an engineer could implement it directly: exact files, what to change, the approach (and code shape where useful). Define acceptance criteria that are OBSERVABLE and TESTABLE, a concrete verification method (manual steps + an automated test/assert to add), and the regression risks. Assume the payment happy path already works — do not redesign it; only harden edges where this workstream calls for it. Return via the schema.`,
      { label: `design:${ws.key}`, phase: 'Design', schema: FIX_DESIGN_SCHEMA }
    ),
  // Stage 2 — adversarial verification of THIS workstream's fix
  (design, ws) => {
    if (!design) return { key: ws.key, ws, design: null, adversarial: null }
    return agent(
      `${CONTEXT}

You are a hostile, skeptical verifier (red team). Below is a proposed fix for the workstream "${ws.title}". Your ONLY job is to PROVE the fix is incomplete, bypassable, or does not actually solve the root problem. Read the ACTUAL code in ${REPO} — do not take the design's word for the current state. Default to suspicion: assume the fix is insufficient until the code proves otherwise.

Specifically:
- Try to find concrete ways a real user (or attacker) could STILL hit the original problem after this exact fix is applied (e.g. for a server paywall: can premium text still be reached via the JS bundle, an API route, prefetch, search index, RSC payload, or an unauthenticated fetch?).
- Find edge cases, code paths, files, or surfaces the design forgot (other components with the same bug, other routes, mobile/tab-close, race conditions, fail-open defaults).
- Check that the acceptance criteria would actually CATCH a botched implementation; if not, harden them.
- Give a verdict: 'complete' (no material gaps found), 'needs-hardening' (real but closeable gaps), or 'insufficient' (the fix misses the root problem).

PROPOSED FIX (JSON):
${JSON.stringify(design, null, 1)}

Return via the schema. Be concrete and cite file:line. List real bypass attempts you actually traced, not hypotheticals.`,
      { label: `adversarial:${ws.key}`, phase: 'Adversarial', schema: ADVERSARIAL_SCHEMA }
    ).then((adv) => ({ key: ws.key, ws, design, adversarial: adv }))
  }
)

// ─────────────────────────────────────────────────────────────
// Barrier → synthesize the hardened master repair plan.
// ─────────────────────────────────────────────────────────────
phase('Synthesize')

const valid = perWorkstream.filter(Boolean).filter((r) => r.design)
const bundle = valid.map((r) => ({
  workstream: r.ws.title,
  key: r.key,
  priority: r.ws.priority,
  design: r.design,
  adversarial: r.adversarial,
}))

log(`Designed ${valid.length}/${WORKSTREAMS.length} workstreams; synthesizing hardened plan...`)

const finalPlan = await agent(
  `${CONTEXT}

You are the senior engineering lead writing the FINAL, COMPLETE repair plan for PromptMaster. Below is, for each workstream: a concrete fix design AND a hostile adversarial review that tried to prove the fix incomplete/bypassable. Merge them into ONE master repair plan in ARABIC Markdown that the owner and an engineer can execute from directly.

For EACH workstream, fold the adversarial findings INTO the fix (do not leave the fix and its critique separate) — i.e. present the HARDENED fix that already closes the bypasses the red team found, and present the HARDENED acceptance criteria + the adversarial tests as the "كيف نتأكد أن الإصلاح كامل" (proof-of-fix) checklist. This adversarial proof-of-fix is the core of what the owner asked for — make it prominent for every workstream.

Structure (Arabic):

# خطة الإصلاح الكاملة لـ PromptMaster — مع تحقق عدائي لكل إصلاح

## ملخص تنفيذي
- السبب الجذري لصفر المبيعات (سطران)، وتأكيد أن مسار الدفع نفسه يعمل (الخصم + التفعيل) فالمشكلة ليست في الدفع.
- ترتيب التنفيذ الموصى به (P0 ثم P1 ثم P2) في قائمة قصيرة.

## ثم قسم لكل ورشة إصلاح، بهذا القالب:
### [اسم الورشة]  —  [الأولوية]
- **الهدف (ماذا يعني "تم الإصلاح بالكامل"):**
- **الوضع الحالي (الكود الآن):**
- **خطوات الإصلاح:** قائمة مرقّمة، كل خطوة بالملف:السطر والتغيير المحدد. ادمج الإضافات التي طلبها الفريق العدائي.
- **🔴 التحقق العدائي (إثبات اكتمال الإصلاح):** محاولات الالتفاف التي يجب أن تفشل بعد الإصلاح + الاختبارات العدائية المحددة (خطوة بخطوة) + معايير القبول المحصّنة. هذا القسم إلزامي وواضح.
- **مخاطر/انحدارات يجب مراقبتها:**
- **الجهد:**

## خطة التنفيذ المرحلية
رتّب الورش في موجات (P0 هذا الأسبوع / P1 الأسبوعان / P2 الشهر) مع تبعيات بينها (مثلاً: لا تشغّل إعلانات قبل اكتمال تتبّع التحويل + توحيد السعر + الـ paywall).

## بوابة الجاهزية للإطلاق الإعلاني (Go-Live Checklist)
قائمة تحقق نهائية واحدة: كل البنود العدائية التي يجب أن تكون خضراء قبل صرف أول جنيه على الإعلانات.

RULES: Arabic, concrete, cite files. Keep the adversarial proof-of-fix for every workstream. Be ruthless about ordering by revenue-impact. Do not soften the red-team gaps — they are what guarantees the fix is real.

WORKSTREAMS (design + adversarial JSON):
${JSON.stringify(bundle, null, 1)}
`,
  { label: 'synthesize:final-repair-plan', phase: 'Synthesize' }
)

const summary = valid.map((r) => ({
  key: r.key,
  workstream: r.ws.title,
  priority: r.ws.priority,
  effort: r.design.effort,
  verdict: r.adversarial ? r.adversarial.verdict : 'no-adversarial',
  bypassCount: r.adversarial ? (r.adversarial.bypassAttempts || []).length : 0,
  gapCount: r.adversarial ? (r.adversarial.gaps || []).length : 0,
}))

return {
  finalPlan,
  workstreamsDesigned: valid.length,
  totalWorkstreams: WORKSTREAMS.length,
  summary,
  bundle,
}
