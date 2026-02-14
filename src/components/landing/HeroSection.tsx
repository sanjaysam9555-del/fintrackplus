import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PhoneMockup } from "./PhoneMockup";
import { getAppUrl } from "@/lib/domainUtils";
import appIcon from "@/assets/app-icon.png";
import homeTab from "@/assets/landing/real/home-tab.png";
import projectsTab from "@/assets/landing/real/projects-tab.png";
import expenseTab from "@/assets/landing/real/expense-tab.png";
import openingScreen from "@/assets/landing/real/opening-screen.png";

const heroScreens = [
  { src: openingScreen, alt: "FinTrack⁺ opening screen with logo" },
  { src: homeTab, alt: "FinTrack⁺ home dashboard showing financial overview" },
  { src: projectsTab, alt: "Projects tab showing event tracking" },
  { src: expenseTab, alt: "Expense tab with transaction list" },
];

const springIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-16 md:pt-20 pb-8 md:pb-16">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="text-center md:text-left order-1 md:order-1"
          >
            {/* Logo + App Name — rounded square container */}
            <div className="flex items-center gap-2.5 mb-5 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-[25%] shrink-0 overflow-hidden">
                <img src={appIcon} alt="FinTrack⁺ logo" className="w-full h-full object-cover scale-[1.3]" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">FinTrack⁺</span>
            </div>

            <motion.div
              variants={springIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-foreground text-xs font-semibold mb-5"
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✦
              </motion.span>
              Built for Indian Event Planners
            </motion.div>

            <motion.h1 variants={springIn} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Stop Losing Money{" "}
              <span className="text-primary dark:text-foreground">Between Events</span>
            </motion.h1>

            <motion.p variants={springIn} className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
              Track every rupee across events, vendors, and partners. Peace of mind at a fraction of hiring a full-time accountant.
            </motion.p>

            <motion.div variants={springIn} className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button
                size="lg"
                className="relative text-base px-8 rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow overflow-hidden group"
                onClick={() => { const url = getAppUrl(); url.startsWith('http') ? window.location.href = url : navigate(url); }}
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Sparkles className="w-4 h-4" />
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 rounded-xl"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See Features
              </Button>
            </motion.div>

            {/* Trust pills */}
            <motion.div variants={springIn} className="mt-5 flex flex-wrap gap-2 justify-center md:justify-start">
              {["Offline Ready", "GST Built-in", "Partner Splits"].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.p variants={springIn} className="mt-3 text-xs text-muted-foreground">
              Join 500+ planners already using FinTrack⁺ · Starts at <span className="font-semibold text-foreground">~₹17/day</span>
            </motion.p>
          </motion.div>

          {/* Right: Phone mockup — hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:flex justify-center order-2"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-[240px] sm:w-[260px] md:w-[280px]"
            >
              <PhoneMockup screens={heroScreens} autoPlayMs={3000} className="max-w-none w-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Blended section divider */}
      <div className="md:hidden relative py-2">
        <div className="mx-auto w-2/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="mx-auto w-1/3 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mt-px blur-sm" />
      </div>

      {/* Mobile-only carousel section */}
      <section className="md:hidden py-10 px-4 text-center">
        <p className="text-sm text-muted-foreground mb-4">See it in action</p>
        <div className="w-[240px] mx-auto">
          <PhoneMockup screens={heroScreens} autoPlayMs={3000} className="max-w-none w-full" />
        </div>
      </section>
    </>
  );
};
