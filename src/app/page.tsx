import Navigation from '@/components/Navigation'
import HeroSection from '@/components/landing/HeroSection'
import FinalCTA from '@/components/landing/FinalCTA'
import LeadMagnetModal from '@/components/landing/LeadMagnetModal'
import MetaViewContent from '@/components/MetaViewContent'
import {
    PromoBanner,
    PainPointsSection,
    WhatYouLearn,
    TargetAudience,
    PricingSection,
    FAQSection,
    UnifiedBackground,
    MobileStickyBuy
} from '@/components/landing'

/**
 * Landing page — Server Component for SEO.
 * Testimonials section temporarily removed (2026-05): the placeholder testimonials
 * had no photos, no LinkedIn proof, and felt scammy to ad-driven traffic.
 * Re-enable <Testimonials /> once we collect real customer testimonials with
 * photos + verifiable identity (LinkedIn / handle).
 */
export default function Home() {
    return (
        <>
            <Navigation />
            <UnifiedBackground />
            <MetaViewContent />

            {/* 1. Hero — benefit headline + single CTA */}
            <HeroSection />

            {/* 2. Pain points — hook visitors with relatable problems */}
            <PainPointsSection />

            {/* 3. What you'll learn — core value proposition */}
            <WhatYouLearn />

            {/* 4. Target audience — who is this for */}
            <TargetAudience />

            {/* 5. Pricing — honest single sticker price */}
            <PricingSection />

            {/* 6. FAQ — objection handling */}
            <FAQSection />

            {/* 7. Final CTA — last push */}
            <FinalCTA />

            {/* Utility components */}
            <PromoBanner />
            <LeadMagnetModal />
            <MobileStickyBuy />
        </>
    )
}
