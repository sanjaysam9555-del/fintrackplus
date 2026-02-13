import { motion } from "framer-motion";
import { UserPlus, FolderPlus, PenLine } from "lucide-react";
import howItWorksImage from "@/assets/landing/how-it-works.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Sign up in 30 seconds",
    description: "Email + password. 7-day free trial, no commitment.",
  },
  {
    icon: FolderPlus,
    number: "02",
    title: "Create your first wedding project",
    description: "Set the client name, your internal budget, and what you're charging. Template it for future events.",
  },
  {
    icon: PenLine,
    number: "03",
    title: "Start logging",
    description: "Every vendor payment, every cash handoff, every receipt. Your margins update in real time.",
  },
];

export const HowItWorks = () => (
  <section className="py-20 px-4 bg-muted/30">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Up and running in 3 steps
        </h2>
      </motion.div>

      {/* How it works illustration */}
      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mb-10"
      >
        <img
          src={howItWorksImage}
          alt="3-step onboarding flow: sign up, create project, start logging"
          className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg object-cover"
          loading="lazy"
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.number}
            initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: i * 0.15 } } }}
            className="text-center"
          >
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6" />
              <div className="relative w-16 h-16 bg-card border rounded-2xl flex items-center justify-center">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {s.number}
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
