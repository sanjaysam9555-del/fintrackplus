import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Gaurav Bhatia",
    role: "Founder",
    company: "SparkFX Entertainment",
    quote:
      "We run 8–10 event setups a month with different vendors each time. FinTrack⁺ finally gave us one place to see exactly where every rupee goes — no more digging through WhatsApp and Excel.",
    initials: "GB",
    color: "bg-primary/20 text-primary",
  },
  {
    name: "Abhinav Sharma",
    role: "Lead Planner",
    company: "Shaadi Simplified",
    quote:
      "Managing vendor payments and splitting costs with my partner used to be a nightmare. Now I just log it, tag the partner, and the balances update automatically. Game changer.",
    initials: "AS",
    color: "bg-success/20 text-success",
  },
  {
    name: "Gauri Arora",
    role: "Co-founder",
    company: "Reel Productions",
    quote:
      "GST tagging and one-tap exports saved us hours every month-end. Our CA was genuinely impressed with how clean the books were — first time that's ever happened.",
    initials: "GA",
    color: "bg-warning/20 text-warning",
  },
];

const cardPop = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 18, delay: i * 0.12 },
  }),
};

export const TestimonialsSection = () => (
  <section className="py-20 md:py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Loved by event professionals
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Hear from planners, producers, and founders who switched to FinTrack⁺
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardPop}
            className="relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-[0_0_32px_rgba(25,102,205,0.1)] ring-1 ring-primary/10 p-6 flex flex-col"
          >
            {/* Quote icon */}
            <Quote className="w-8 h-8 text-primary/15 absolute top-5 right-5" />

            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-sm leading-relaxed text-muted-foreground italic flex-1 mb-6">
              "{t.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={`${t.color} text-xs font-bold`}>
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
