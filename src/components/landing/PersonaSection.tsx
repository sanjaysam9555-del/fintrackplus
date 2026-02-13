import { motion } from "framer-motion";
import personaSolo from "@/assets/landing/persona-solo-planner.jpg";
import personaAgency from "@/assets/landing/persona-agency-team.jpg";
import personaCoordinator from "@/assets/landing/persona-coordinator.jpg";

const personas = [
  {
    title: "Solo Wedding Planners",
    description: "Managing 5–15 events a year. You need one place to track every rupee without hiring an accountant.",
    gradient: "from-primary/15 to-primary/5",
    image: personaSolo,
    imageAlt: "Solo wedding planner confidently managing events on her phone",
  },
  {
    title: "Planning Agencies",
    description: "2–5 partners handling different events. Track who spent what, with separate cash and online balances per partner.",
    gradient: "from-success/15 to-success/5",
    image: personaAgency,
    imageAlt: "Small team coordinating wedding plans with tablets and phones",
  },
  {
    title: "Event Coordinators",
    description: "Need to present clean, professional financial reports to clients after every event. Export-ready books in one tap.",
    gradient: "from-warning/15 to-warning/5",
    image: personaCoordinator,
    imageAlt: "Event coordinator presenting a financial report to clients",
  },
];

export const PersonaSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
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
            initial={{ opacity: 0, y: 30, rotate: i === 0 ? -3 : i === 2 ? 3 : 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.12 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className={`bg-gradient-to-br ${p.gradient} border rounded-2xl overflow-hidden text-center`}
          >
            <img
              src={p.image}
              alt={p.imageAlt}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
