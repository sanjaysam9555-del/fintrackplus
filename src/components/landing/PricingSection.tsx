import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const features = [
  "Unlimited wedding projects",
  "Vendor management & history",
  "Partner cash/online tracking",
  "Part payment & installments",
  "GST tagging & CA export (ZIP)",
  "Receipt capture & storage",
  "AI-powered smart insights",
  "Recurring transactions",
  "Offline-first with cloud sync",
  "Global search (Cmd+K)",
  "Custom categories & icons",
  "Dark mode + OLED support",
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            One plan. Everything included. No hidden fees.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 md:p-8 shadow-lg"
        >
          <div className="text-center mb-6">
            <div className="text-4xl md:text-5xl font-bold text-foreground">
              ₹499<span className="text-lg md:text-xl font-normal text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Full access to every feature
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mb-6">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full text-base rounded-xl gap-2"
            onClick={() => navigate("/auth")}
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Credit card required · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};
