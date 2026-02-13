import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA, LandingFooter } from "@/components/landing/LandingFooter";
import { FloatingMobileCTA } from "@/components/landing/FloatingMobileCTA";

const Landing = () => (
  <main className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
    <HeroSection />
    <PainPointsSection />
    <FeaturesGrid />
    <HowItWorks />
    <PersonaSection />
    <PricingSection />
    <FAQSection />
    <FinalCTA />
    <LandingFooter />
    <FloatingMobileCTA />
  </main>
);

export default Landing;
