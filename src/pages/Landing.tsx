import { LandingHeader } from "@/components/landing/LandingHeader";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA, LandingFooter } from "@/components/landing/LandingFooter";
import { FloatingMobileCTA } from "@/components/landing/FloatingMobileCTA";

const SectionDivider = () => (
  <div className="relative py-1">
    <div className="mx-auto w-2/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    <div className="mx-auto w-1/3 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mt-px blur-sm" />
  </div>
);

const Landing = () => (
  <main className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
    <LandingHeader />
    <ScrollProgress />
    <HeroSection />
    <SectionDivider />
    <PainPointsSection />
    <SectionDivider />
    <ComparisonSection />
    <SectionDivider />
    <FeaturesGrid />
    <SectionDivider />
    <HowItWorks />
    <SectionDivider />
    <SocialProofSection />
    <SectionDivider />
    <PersonaSection />
    <SectionDivider />
    <PricingSection />
    <SectionDivider />
    <FAQSection />
    <FinalCTA />
    <LandingFooter />
    <FloatingMobileCTA />
  </main>
);

export default Landing;
