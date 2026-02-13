import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA, LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => (
  <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
    <HeroSection />
    <PainPointsSection />
    <FeaturesGrid />
    <HowItWorks />
    <PersonaSection />
    <FAQSection />
    <FinalCTA />
    <LandingFooter />
  </main>
);

export default Landing;
