import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const rows = [
  { label: "Track per-event profit/loss", without: false, with: true },
  { label: "GST tagging & CA-ready export", without: false, with: true },
  { label: "Partner cash/online splits", without: false, with: true },
  { label: "Receipt photos on transactions", without: false, with: true },
  { label: "Works offline (site visits)", without: false, with: true },
  { label: "Vendor spend history", without: false, with: true },
  { label: "Part payments & installments", without: false, with: true },
  { label: "AI-powered spending insights", without: false, with: true },
  { label: "Team roles & access control", without: false, with: true },
  { label: "Edit/delete approval workflow", without: false, with: true },
  { label: "Company bank account tracking", without: false, with: true },
  { label: "Automated backup & restore", without: false, with: true },
  { label: "Internal fund transfers", without: false, with: true },
];

export const ComparisonSection = () => (
  <section className="py-20 md:py-24 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-10"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Still using spreadsheets?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          Here's what you're missing out on
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="border border-border/50 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10"
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px] text-center border-b border-border/50">
          <div />
          <div className="px-3 py-3 text-xs font-semibold text-muted-foreground border-l border-border/50">
            Spreadsheets / Tally
          </div>
          <div className="px-3 py-3 text-xs font-semibold text-primary dark:text-foreground border-l border-border/50 bg-primary/5">
            FinTrack⁺
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px] items-center border-b border-border/30 last:border-b-0"
          >
            <div className="px-4 py-3 text-sm text-foreground">{row.label}</div>
            <div className="px-3 py-3 flex justify-center border-l border-border/30">
              <X className="w-4 h-4 text-destructive" />
            </div>
            <div className="px-3 py-3 flex justify-center border-l border-border/30 bg-primary/5">
              <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
            </div>
          </motion.div>
        ))}

        {/* Bottom row */}
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px] items-center bg-muted/30">
          <div className="px-4 py-3 text-sm font-semibold text-foreground">Monthly cost</div>
          <div className="px-3 py-3 text-center border-l border-border/30 text-sm text-muted-foreground">
            ₹15,000+
            <span className="block text-[10px]">(accountant)</span>
          </div>
          <div className="px-3 py-3 text-center border-l border-border/30 bg-primary/5 text-sm font-bold text-primary dark:text-foreground">
            <span className="line-through text-muted-foreground font-normal text-xs">₹799</span>{" "}₹599
            <span className="block text-[10px] font-normal text-muted-foreground">incl. GST · ~₹20/day</span>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1"
      >
        Switch in under 5 minutes <ArrowRight className="w-3 h-3" />
      </motion.p>
    </div>
  </section>
);
