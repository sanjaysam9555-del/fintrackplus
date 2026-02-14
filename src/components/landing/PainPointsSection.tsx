import { motion } from "framer-motion";
import { Banknote, TrendingDown, FileWarning } from "lucide-react";

import painCashLeak from "@/assets/landing/pain-cash-leak.png";
import painNoVisibility from "@/assets/landing/pain-no-visibility.png";
import painGst from "@/assets/landing/pain-gst.png";

const painPoints = [
  {
    icon: Banknote,
    title: "Cash leaks between events",
    description: "Vendors get paid in cash, amounts get lost in WhatsApp messages and notebooks. By the time you reconcile, thousands have slipped through.",
    iconBg: "bg-destructive/10 text-destructive",
    image: painCashLeak,
    imageAlt: "Event planner reviewing budget overrun on tablet at venue",
  },
  {
    icon: TrendingDown,
    title: "No visibility into margins",
    description: "You quoted the client ₹18L but spent ₹14L or ₹20L? You only find out after the event is over and the damage is done.",
    iconBg: "bg-warning/10 text-warning",
    image: painNoVisibility,
    imageAlt: "Cash exchange with WhatsApp and notebook at event backstage",
  },
  {
    icon: FileWarning,
    title: "GST and CA headaches",
    description: "Receipts scattered across phones, no clean books when tax season arrives. Your CA charges extra just to make sense of the mess.",
    iconBg: "bg-primary/10 text-primary",
    image: painGst,
    imageAlt: "Scattered GST receipts piled on phone with pen",
  },
];

export const PainPointsSection = () => (
  <section className="py-20 md:py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Sound familiar?
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Every event planner in India fights these battles. We built FinTrack⁺ to end them.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {painPoints.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: i === 1 ? 30 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.12 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-[0_0_24px_rgba(25,102,205,0.12)] ring-1 ring-primary/10 hover:shadow-lg transition-shadow group"
          >
            {/* Image */}
            <div className="h-44 md:h-40 overflow-hidden">
              <img
                src={p.image}
                alt={p.imageAlt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            {/* Content */}
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-9 h-9 rounded-xl ${p.iconBg} flex items-center justify-center`}>
                  <p.icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground">"{p.title}"</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
