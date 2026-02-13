import { motion } from "framer-motion";
import { User, Users, ClipboardList } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const personas = [
  {
    icon: User,
    title: "Solo Wedding Planners",
    description: "Managing 5–15 events a year. You need one place to track every rupee without hiring an accountant.",
    gradient: "from-primary/15 to-primary/5",
  },
  {
    icon: Users,
    title: "Planning Agencies",
    description: "2–5 partners handling different events. Track who spent what, with separate cash and online balances per partner.",
    gradient: "from-success/15 to-success/5",
  },
  {
    icon: ClipboardList,
    title: "Event Coordinators",
    description: "Need to present clean, professional financial reports to clients after every event. Export-ready books in one tap.",
    gradient: "from-warning/15 to-warning/5",
  },
];

export const PersonaSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Who is this for?
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {personas.map((p, i) => (
          <motion.div
            key={p.title}
            initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: i * 0.12 } } }}
            className={`bg-gradient-to-br ${p.gradient} border rounded-2xl p-6 text-center`}
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-card rounded-2xl border flex items-center justify-center">
              <p.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
