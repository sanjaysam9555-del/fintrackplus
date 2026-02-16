import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAppUrl } from "@/lib/domainUtils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemPop = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 150, damping: 18 } },
};

const features = [
  "Unlimited event projects",
  "Vendor management & history",
  "Partner cash/online tracking",
  "Part payment & installments",
  "GST tagging & CA export (ZIP)",
  "Receipt capture & storage",
  "AI-powered smart insights",
  "Recurring transactions",
  "Offline-first with cloud sync",
  "Global search (Cmd+K)",
  "Custom categories & icons",
  "Dark mode + OLED support",
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative py-20 md:py-24 px-4 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
      <motion.div
        className="absolute top-16 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-16 left-1/4 w-56 h-56 bg-primary/5 rounded-full blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-foreground text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Launch offer
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            One plan. Everything included.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            No tiers, no hidden fees. Full access from day one.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="border border-border/50 rounded-2xl bg-card/50 backdrop-blur-sm shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.2)] transition-shadow duration-300 overflow-hidden"
        >
          {/* Limited-time badge */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 md:px-8 py-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 text-destructive dark:text-red-400 text-xs font-bold mb-4 ring-1 ring-destructive/20 animate-pulse"
            >
              <Zap className="w-3 h-3" />
              Limited-time launch price — 38% OFF
            </motion.div>

            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-2xl md:text-3xl font-medium text-muted-foreground line-through decoration-2 decoration-destructive/60">
                ₹799
              </span>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.4 }}
                className="text-5xl md:text-6xl font-bold text-foreground tracking-tight"
              >
                ₹499
                <span className="text-lg md:text-xl font-normal text-muted-foreground">/month</span>
              </motion.div>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              That's just ~₹17/day for complete peace of mind
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-warning dark:text-yellow-400 font-medium">
              <Clock className="w-3 h-3" />
              Price increases to ₹799 after early access ends
            </div>
          </div>

          {/* Features grid */}
          <div className="px-6 md:px-8 py-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-8"
            >
              {features.map((f) => (
                <motion.div key={f} variants={itemPop} className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{f}</span>
                </motion.div>
              ))}
            </motion.div>

            <Button
              size="lg"
              className="w-full text-base rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
              onClick={() => { const url = getAppUrl(); url.startsWith('http') ? window.location.href = url : navigate(url); }}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Credit card required · Cancel anytime
            </p>

            {/* Money-back guarantee */}
            <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 dark:border-green-400/20">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                30-day money-back guarantee — no questions asked
              </span>
            </div>

            {/* Cost comparison */}
            <div className="mt-4 pt-4 border-t border-border/30 text-center">
              <p className="text-[11px] text-muted-foreground">
                Compare: Hiring an accountant costs <span className="line-through">₹15,000+/month</span>
              </p>
              <p className="text-xs font-medium mt-0.5">
                <span className="text-foreground">FinTrack⁺ = </span>
                <span className="text-primary dark:text-primary">₹499/month</span>
                <span className="text-muted-foreground"> (save ₹300/month vs regular price)</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
