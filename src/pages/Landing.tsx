import { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { ChaosToClarity } from "@/components/landing/ChaosToClarity";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FeaturedInSection } from "@/components/landing/FeaturedInSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
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

const Landing = () => {
  useEffect(() => {
    const root = document.documentElement;
    const original = Array.from(root.classList);
    root.classList.remove('light', 'oled');
    root.classList.add('dark');
    return () => {
      root.classList.remove('light', 'dark', 'oled');
      original.forEach((c) => root.classList.add(c));
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      <LandingHeader />
      <ScrollProgress />
      <HeroSection />
      <SectionDivider />
      <PainPointsSection />
      <SectionDivider />
      <ChaosToClarity />
      <SectionDivider />
      <ComparisonSection />
      <SectionDivider />
      <FeaturesGrid />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <SocialProofSection />
      <SectionDivider />
      <FeaturedInSection />
      <SectionDivider />
      <TestimonialsSection />
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
};

export default Landing;
