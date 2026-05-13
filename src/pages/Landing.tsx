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
import { SEO } from "@/components/SEO";

const landingFaqs = [
  { q: "Can I use this for non-wedding events?", a: "Absolutely. Projects work for any event — corporate functions, exhibitions, private parties. The finance tracking is universal." },
  { q: "Is my data safe?", a: "Yes. All data is cloud-synced with secure authentication. Your financial data is encrypted and only accessible to you." },
  { q: "Does it work offline?", a: "Yes, fully offline-first. Changes are queued locally and synced automatically when you're back online. You'll see a pending count on the dashboard." },
  { q: "Can my business partner access the same data?", a: "Yes! Anyone who logs in with the same credentials will see the same data. You can share your login with a trusted partner to collaborate on the same set of projects, transactions, and reports." },
  { q: "How much does it cost?", a: "Launch price is ₹599/month including GST (regular ₹799). That's roughly ₹20/day. Credit card required at signup. Cancel anytime, no hidden fees." },
  { q: "What payment methods do you accept?", a: "Credit card, debit card, and UPI. All payments are processed securely." },
];

const landingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FinTrack+",
    url: "https://fintrackplus.com/",
    logo: "https://fintrackplus.com/app-icon-512.png",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FinTrack+",
    url: "https://fintrackplus.com/",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landingFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

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
