import { motion } from "framer-motion";
import { User, Users, Presentation } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardPop = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

const personas = [
  {
    icon: User,
    title: "Solo Wedding Planners",
    subtitle: "5–15 events/year",
    description: "One place to track every rupee across events, vendors, and payments — without hiring an accountant.",
    highlights: ["Full financial visibility", "Receipt capture on the go", "CA-ready exports"],
  },
  {
    icon: Users,
    title: "Planning Agencies",
    subtitle: "2–5 partners",
    description: "Track who spent what with separate cash and online balances per partner. No more spreadsheet chaos.",
    highlights: ["Partner-wise balances", "Project-level P&L", "Shared credential access"],
  },
  {
    icon: Presentation,
    title: "Event Coordinators",
    subtitle: "Client-facing reports",
    description: "Present clean, professional financial reports to clients after every event. Export-ready books in one tap.",
    highlights: ["One-tap ZIP exports", "GST-tagged entries", "Per-project breakdowns"],
  },
];

export const PersonaSection = () => (
  <section className="relative py-24 px-4 overflow-hidden">
    {/* Decorative background */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
    <motion.div
      className="absolute top-20 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
      animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-10 right-1/3 w-52 h-52 bg-primary/5 rounded-full blur-3xl"
      animate={{ x: [0, -12, 0], y: [0, 8, 0] }}
      transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
    />

    <div className="relative z-10 max-w-5xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Users className="w-3.5 h-3.5" />
          Built for you
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Who is this for?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Whether you're a solo planner or a full agency, FinTrack⁺ fits your workflow
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {personas.map((p) => (
          <motion.div
            key={p.title}
            variants={cardPop}
            whileHover={{ y: -4 }}
            className="border border-border/50 rounded-2xl bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col"
          >
            {/* Icon header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">{p.title}</h3>
                <span className="text-xs text-muted-foreground">{p.subtitle}</span>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>

            {/* Highlights */}
            <div className="px-6 pb-6 mt-auto">
              <div className="flex flex-wrap gap-1.5">
                {p.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
