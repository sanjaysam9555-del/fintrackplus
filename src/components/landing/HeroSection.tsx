import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, IndianRupee, FolderKanban, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/landing/hero-wedding-planner.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const mobileStats = [
  { icon: IndianRupee, label: "Track ₹18L+", sub: "per wedding" },
  { icon: FolderKanban, label: "5 Weddings", sub: "at once" },
  { icon: Wifi, label: "Cash + Online", sub: "split tracking" },
];

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-20 pb-12 md:pb-16">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-success/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: Copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="text-center md:text-left"
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
              Start 7-Day Free Trial <ArrowRight className="w-4 h-4" />
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
            ₹499/month after trial · Cancel anytime
          </motion.p>

          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground/70 italic">
            Trusted by wedding planners across India
          </motion.p>
        </motion.div>

        {/* Mobile: Hero image + stat cards */}
        <div className="flex flex-col gap-4 md:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={heroImage}
              alt="Indian wedding planner managing finances on a tablet with marigold decorations"
              className="w-full rounded-2xl shadow-xl object-cover aspect-[16/9]"
              loading="eager"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-3 justify-center"
          >
            {mobileStats.map((s) => (
              <div key={s.label} className="flex-1 max-w-[120px] bg-card/80 backdrop-blur-sm border rounded-xl p-3 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <div className="text-xs font-semibold text-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Desktop: Hero image with glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden md:flex justify-center"
        >
          <div className="relative">
            <img
              src={heroImage}
              alt="Indian wedding planner managing finances on a tablet with marigold decorations"
              className="w-full max-w-lg rounded-2xl shadow-2xl object-cover"
              loading="eager"
            />
            {/* Glow */}
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
