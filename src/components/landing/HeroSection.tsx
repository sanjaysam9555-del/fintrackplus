import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import screenDashboard from "@/assets/landing/screen-dashboard.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-20 pb-12 md:pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-success/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: Copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="text-center md:text-left order-2 md:order-1"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5">
            Built for Indian Wedding Planners
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Stop Losing Money{" "}
            <span className="text-primary">Between Weddings</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
            The finance app Indian wedding planners actually need. Track every rupee across events, vendors, and partners — even offline.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
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

          <motion.p variants={fadeUp} className="mt-3 text-xs text-muted-foreground">
            ₹499/month · Credit card required
          </motion.p>
        </motion.div>

        {/* Right: Phone mockup with dashboard screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -5 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center order-1 md:order-2"
        >
          <div className="relative w-[240px] sm:w-[260px] md:w-[280px]">
            {/* Phone frame */}
            <div className="relative bg-foreground/10 rounded-[2.5rem] p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/10 rounded-b-2xl z-10" />
              {/* Screen */}
              <div className="rounded-[2rem] overflow-hidden bg-background">
                <img
                  src={screenDashboard}
                  alt="FinTrack⁺ dashboard showing wedding project margins and financial summary"
                  className="w-full aspect-[9/19] object-cover object-top"
                  loading="eager"
                />
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-6 bg-primary/15 rounded-[3rem] blur-3xl -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
