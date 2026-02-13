import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
    a: "Currently it's single-user with built-in partner tracking — you log transactions on behalf of partners and track their balances. Multi-user collaborative access is coming soon.",
  },
  {
    q: "How much does it cost?",
    a: "₹499/month. Credit card required at signup. Cancel anytime.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit card, debit card, and UPI. All payments are processed securely.",
  },
];

export const FAQSection = () => (
  <section className="py-20 px-4 bg-muted/30">
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Frequently asked questions
        </h2>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-border px-0"
            >
              <AccordionTrigger className="text-sm md:text-base font-medium text-foreground text-left hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
