import { motion } from "framer-motion";
import { User, Users, Presentation, Check } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardPop = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

const personas = [
  {
    icon: User,
    title: "Solo Event Planners",
    subtitle: "5–15 events/year",
    description: "One place to track every rupee across events, vendors, and payments — without hiring an accountant.",
    highlights: ["Full financial visibility", "Receipt capture on the go", "CA-ready exports"],
    accent: "from-primary/20 to-primary/5",
    accentBorder: "border-l-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Planning Agencies",
    subtitle: "2–5 partners",
    description: "Track who spent what with separate cash and online balances per partner. No more spreadsheet chaos.",
    highlights: ["Partner-wise balances", "Project-level P&L", "Shared credential access"],
    accent: "from-success/20 to-success/5",
    accentBorder: "border-l-success",
    iconBg: "bg-success/10 text-success",
  },
  {
    icon: Presentation,
    title: "Event Coordinators",
    subtitle: "Client-facing reports",
    description: "Present clean, professional financial reports to clients after every event. Export-ready books in one tap.",
    highlights: ["One-tap ZIP exports", "GST-tagged entries", "Per-project breakdowns"],
    accent: "from-warning/20 to-warning/5",
    accentBorder: "border-l-warning",
    iconBg: "bg-warning/10 text-warning",
  },
];

export const PersonaSection = () => (
  <section className="relative py-20 md:py-24 px-4 overflow-hidden">
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

    <div className="relative z-10 max-w-6xl mx-auto">
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

      {/* Featured layout: first card spans full width on md+, rest side by side */}
      <div className="space-y-5">
        {/* Hero persona card — full width */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={cardPop}
          whileHover={{ y: -4 }}
          className={`border-l-4 ${personas[0].accentBorder} rounded-2xl bg-card/60 backdrop-blur-sm shadow-[0_0_32px_rgba(25,102,205,0.12)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.18)] transition-shadow duration-300 overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Gradient icon area */}
            <div className={`bg-gradient-to-br ${personas[0].accent} p-8 md:p-10 flex items-center justify-center md:w-48 shrink-0`}>
              <div className={`w-16 h-16 rounded-2xl ${personas[0].iconBg} flex items-center justify-center`}>
                <User className="w-8 h-8" />
              </div>
            </div>
            {/* Content */}
            <div className="p-6 md:p-8 flex-1">
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="text-lg md:text-xl font-bold text-foreground">{personas[0].title}</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full inline-flex items-center">{personas[0].subtitle}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-lg">{personas[0].description}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {personas[0].highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {personas.slice(1).map((p) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardPop}
              whileHover={{ y: -4 }}
              className={`border-l-4 ${p.accentBorder} rounded-2xl bg-card/60 backdrop-blur-sm shadow-[0_0_32px_rgba(25,102,205,0.12)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.18)] transition-shadow duration-300 overflow-hidden flex flex-col`}
            >
              {/* Gradient icon header */}
              <div className={`bg-gradient-to-br ${p.accent} p-6 flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl ${p.iconBg} flex items-center justify-center shrink-0`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">{p.title}</h3>
                  <span className="text-xs text-muted-foreground">{p.subtitle}</span>
                </div>
              </div>

              {/* Description + highlights */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.description}</p>
                <div className="mt-auto space-y-2">
                  {p.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full ${p.iconBg} flex items-center justify-center shrink-0`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-foreground">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
