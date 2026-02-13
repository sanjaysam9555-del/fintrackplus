import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 pt-20 pb-16">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-success/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: Copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="text-center md:text-left"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            Built for Indian Wedding Planners
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Stop Losing Money{" "}
            <span className="text-primary">Between Weddings</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg">
            The finance app Indian wedding planners actually need. Track every rupee across events, vendors, and partners — even offline.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Button
              size="lg"
              className="text-base px-8 rounded-xl gap-2"
              onClick={() => navigate("/auth")}
            >
              Start Free <ArrowRight className="w-4 h-4" />
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

          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">
            No credit card required · Works on any device
          </motion.p>
        </motion.div>

        {/* Right: Phone mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="relative w-64 md:w-72">
            {/* Phone frame */}
            <div className="bg-card rounded-[2.5rem] border-4 border-muted shadow-2xl p-3 aspect-[9/19]">
              <div className="bg-background rounded-[2rem] h-full w-full overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="h-6 bg-primary/5 flex items-center justify-center">
                  <div className="w-16 h-1.5 bg-muted rounded-full" />
                </div>
                {/* Mock dashboard */}
                <div className="flex-1 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                    <div>
                      <div className="h-2 w-16 bg-muted rounded" />
                      <div className="h-2.5 w-12 bg-foreground/20 rounded mt-1" />
                    </div>
                  </div>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Income", color: "bg-success/20", amount: "₹18L" },
                      { label: "Expense", color: "bg-destructive/20", amount: "₹14L" },
                      { label: "Balance", color: "bg-primary/20", amount: "₹4L" },
                    ].map((c) => (
                      <div key={c.label} className={`${c.color} rounded-lg p-1.5`}>
                        <div className="text-[6px] text-muted-foreground">{c.label}</div>
                        <div className="text-[9px] font-bold text-foreground">{c.amount}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="bg-card border rounded-lg p-2 space-y-1">
                    <div className="h-1.5 w-12 bg-muted rounded" />
                    <div className="flex items-end gap-1 h-10">
                      {[40, 65, 50, 80, 55, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/30 rounded-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  {/* Transaction rows */}
                  {["Caterer - ₹2.5L", "Florist - ₹45K", "Venue - ₹5L"].map((t) => (
                    <div key={t} className="flex items-center gap-2 bg-card border rounded-lg p-1.5">
                      <div className="w-5 h-5 rounded-full bg-muted" />
                      <div className="text-[7px] text-foreground flex-1">{t}</div>
                      <div className="text-[6px] text-muted-foreground">Cash</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
