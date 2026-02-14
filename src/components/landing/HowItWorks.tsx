import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { UserPlus, FolderPlus, PenLine } from "lucide-react";
import { useEffect, useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    number: 1,
    title: "Sign up in 30 seconds",
    description: "Email + password. Set up in under a minute.",
  },
  {
    icon: FolderPlus,
    number: 2,
    title: "Create your first event project",
    description: "Set the client name, your internal budget, and what you're charging. Template it for future events.",
  },
  {
    icon: PenLine,
    number: 3,
    title: "Start logging",
    description: "Every vendor payment, every cash handoff, every receipt. Your margins update in real time.",
  },
];

const CountUpNumber = ({ target }: { target: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => String(Math.round(v)).padStart(2, "0"));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.span
      ref={ref}
      onViewportEnter={() => {
        animate(count, target, { duration: 0.8, ease: "easeOut" });
      }}
      viewport={{ once: true }}
    >
      00
    </motion.span>
  );
};

export const HowItWorks = () => (
  <section className="py-20 md:py-24 px-4 bg-muted/30">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Up and running in 3 steps
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.15 }}
            className="text-center bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-[0_0_24px_rgba(25,102,205,0.1)] ring-1 ring-primary/5"
          >
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6" />
              <div className="relative w-16 h-16 bg-card border rounded-2xl flex items-center justify-center">
                <s.icon className="w-7 h-7 text-primary dark:text-foreground" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                <CountUpNumber target={s.number} />
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
