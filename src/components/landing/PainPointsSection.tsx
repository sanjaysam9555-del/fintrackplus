import { motion } from "framer-motion";
import { Banknote, TrendingDown, FileWarning } from "lucide-react";
import painCashLeaks from "@/assets/landing/pain-cash-leaks.jpg";
import painNoMargins from "@/assets/landing/pain-no-margins.jpg";
import painGstHeadaches from "@/assets/landing/pain-gst-headaches.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const painPoints = [
  {
    icon: Banknote,
    title: "Cash leaks between events",
    description: "Vendors get paid in cash, amounts get lost in WhatsApp messages and notebooks. By the time you reconcile, thousands have slipped through.",
    color: "bg-destructive/10 text-destructive",
    image: painCashLeaks,
    imageAlt: "Scattered cash and WhatsApp messages on a messy desk",
  },
  {
    icon: TrendingDown,
    title: "No visibility into margins",
    description: "You quoted the client ₹18L but spent ₹14L or ₹20L? You only find out after the wedding is over and the damage is done.",
    color: "bg-warning/10 text-warning",
    image: painNoMargins,
    imageAlt: "Worried planner looking at stacks of bills with a calculator",
  },
  {
    icon: FileWarning,
    title: "GST and CA headaches",
    description: "Receipts scattered across phones, no clean books when tax season arrives. Your CA charges extra just to make sense of the mess.",
    color: "bg-primary/10 text-primary",
    image: painGstHeadaches,
    imageAlt: "Stressed person surrounded by flying receipts and tax documents",
  },
];

export const PainPointsSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Sound familiar?
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Every wedding planner in India fights these battles. We built FinTrack⁺ to end them.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {painPoints.map((p, i) => (
          <motion.div
            key={p.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: i * 0.12 } } }}
            className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={p.image}
              alt={p.imageAlt}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">"{p.title}"</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
