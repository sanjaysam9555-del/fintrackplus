import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

const faqs = [
  {
    q: "Can I use this for non-wedding events?",
    a: "Absolutely. Projects work for any event — corporate functions, exhibitions, private parties. The finance tracking is universal.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All data is cloud-synced with secure authentication. Your financial data is encrypted and only accessible to you.",
  },
  {
    q: "Does it work offline?",
    a: "Yes, fully offline-first. Changes are queued locally and synced automatically when you're back online. You'll see a pending count on the dashboard.",
  },
  {
    q: "Can my business partner access the same data?",
    a: "Yes! Anyone who logs in with the same credentials will see the same data. You can share your login with a trusted partner to collaborate on the same set of projects, transactions, and reports.",
  },
  {
    q: "How much does it cost?",
    a: "₹499/month — that's roughly ₹17/day. Credit card required at signup. Cancel anytime, no hidden fees.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit card, debit card, and UPI. All payments are processed securely.",
  },
];

export const FAQSection = () => (
  <section id="faqs" className="relative py-20 md:py-24 px-4 overflow-hidden">
    {/* Decorative background */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
    <motion.div
      className="absolute top-10 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
      animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-10 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl"
      animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />

    <div className="relative z-10 max-w-2xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          Got questions?
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Everything you need to know before getting started
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((f, i) => (
            <motion.div key={i} variants={itemFade}>
              <AccordionItem
                value={`faq-${i}`}
                className="border border-border/50 rounded-xl px-5 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 data-[state=open]:shadow-md data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className="text-sm md:text-base font-medium text-foreground text-left hover:no-underline py-5 gap-3">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
