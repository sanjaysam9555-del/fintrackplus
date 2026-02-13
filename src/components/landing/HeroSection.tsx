import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PhoneMockup } from "./PhoneMockup";
import appIcon from "@/assets/app-icon.png";
import homeTab from "@/assets/landing/real/home-tab.png";
import projectsTab from "@/assets/landing/real/projects-tab.png";
import expenseTab from "@/assets/landing/real/expense-tab.png";
import openingScreen from "@/assets/landing/real/opening-screen.png";

const heroScreens = [
  { src: openingScreen, alt: "FinTrack⁺ opening screen with logo" },
  { src: homeTab, alt: "FinTrack⁺ home dashboard showing financial overview" },
  { src: projectsTab, alt: "Projects tab showing wedding event tracking" },
  { src: expenseTab, alt: "Expense tab with transaction list" },
];

const springIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-20 pb-12 md:pb-16">
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-success/8 rounded-full blur-3xl"
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
          {/* Logo + App Name — no animation delay */}
          <div className="flex items-center gap-2.5 mb-5 justify-center md:justify-start">
            <img src={appIcon} alt="FinTrack⁺ logo" className="w-9 h-9 rounded-lg" />
            <span className="text-xl font-bold text-foreground tracking-tight">FinTrack⁺</span>
          </div>

          <motion.div
            variants={springIn}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✦
            </motion.span>
            Built for Indian Wedding Planners
          </motion.div>

          <motion.h1 variants={springIn} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Stop Losing Money{" "}
            <span className="text-primary">Between Weddings</span>
          </motion.h1>

          <motion.p variants={springIn} className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
            The finance app Indian wedding planners actually need. Track every rupee across events, vendors, and partners — even offline.
          </motion.p>

          <motion.div variants={springIn} className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Button
              size="lg"
              className="text-base px-8 rounded-xl gap-2"
              onClick={() => navigate("/auth")}
            >
              Get Started <ArrowRight className="w-4 h-4" />
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

          <motion.p variants={springIn} className="mt-3 text-xs text-muted-foreground">
            ₹499/month · Credit card required
          </motion.p>
        </motion.div>

        {/* Right: Phone mockup with auto-rotating carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center order-2 md:order-2"
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
  );
};
