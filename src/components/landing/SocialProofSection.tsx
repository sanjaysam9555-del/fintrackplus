import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, IndianRupee, MapPin, Star } from "lucide-react";

const stats = [
  { icon: Users, value: 500, suffix: "+", label: "Events Tracked", prefix: "" },
  { icon: IndianRupee, value: 10, suffix: "Cr+", label: "Managed", prefix: "₹" },
  { icon: MapPin, value: 50, suffix: "+", label: "Cities", prefix: "" },
  { icon: Star, value: 4.8, suffix: "", label: "Avg Rating", prefix: "", decimal: true },
];

const useCountUp = (target: number, inView: boolean, decimal?: boolean) => {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(decimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target, decimal]);

  return value;
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const SocialProofSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Trusted by event planners across India
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            From solo wedding planners to full-scale event agencies
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} inView={inView} />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {["🔒 Bank-grade Security", "📱 Offline-First", "🇮🇳 Made in India", "⚡ 99.9% Uptime"].map(badge => (
            <span key={badge} className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const StatCard = ({ stat, index, inView }: { stat: typeof stats[0]; index: number; inView: boolean }) => {
  const count = useCountUp(stat.value, inView, stat.decimal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.1 }}
      className="text-center p-5 md:p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-[0_0_32px_rgba(25,102,205,0.1)] ring-1 ring-primary/10"
    >
      <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
        <stat.icon className="w-5 h-5 text-primary dark:text-foreground" />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
        {stat.prefix}{stat.decimal ? count.toFixed(1) : count}{stat.suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
    </motion.div>
  );
};
