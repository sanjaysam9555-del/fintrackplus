import { motion } from "framer-motion";
import { Check, X, MessageSquareWarning, TrendingDown, Users, Receipt, ShieldCheck, Landmark } from "lucide-react";

const rows = [
  {
    icon: MessageSquareWarning,
    topic: "Cash & Payments",
    problem: "Vendor payments scattered across notebooks and WhatsApp. Thousands slip through by reconciliation time.",
    solution: "Every rupee tracked across events, vendors, and partners — even offline at the venue.",
  },
  {
    icon: TrendingDown,
    topic: "Profit Margins",
    problem: "Quote ₹18L, spend ₹20L — and only find out after the event. Margin blindness is costly.",
    solution: "Live margin, project health, and budget burn visible as you log transactions.",
  },
  {
    icon: Users,
    topic: "Partner Accounts",
    problem: '"Who owes who?" arguments every month from mixed cash and online spends.',
    solution: "Separate cash & online balances per partner, updated automatically with one-tap transfers.",
  },
  {
    icon: Receipt,
    topic: "GST & CA Fees",
    problem: "Receipts buried in gallery folders. Accountants charge extra just to untangle the books.",
    solution: 'Tag GST entries, attach receipts instantly, export a "CA-ready ZIP" in one tap.',
  },
  {
    icon: ShieldCheck,
    topic: "Team Access",
    problem: "Anyone can edit or delete entries. One wrong tap by staff and your books are a mess.",
    solution: "Role-based access with mandatory approval workflows for all edits and deletions.",
  },
  {
    icon: Landmark,
    topic: "Company Funds",
    problem: "Company bank account mixed with personal partner wallets. No clear trail of deposits or withdrawals.",
    solution: "Dedicated Company Bank Account with deposit/withdrawal tracking, separate from partner balances.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const ChaosToClarity = () => (
  <section className="py-20 md:py-24 px-4">
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-10"
      >
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
          Before vs. After
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          From Event Chaos to Financial Clarity
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          This is what shifts when you switch to FinTrack⁺
        </p>
      </motion.div>

      {/* Table */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="border border-border/50 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[160px_1fr_1fr] border-b border-border/50">
          <div className="px-4 py-3 text-xs font-semibold text-muted-foreground" />
          <div className="px-4 py-3 text-xs font-semibold text-destructive/80 border-l border-border/50 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> The Old Way
          </div>
          <div className="px-4 py-3 text-xs font-semibold text-primary border-l border-border/50 bg-primary/5 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> FinTrack⁺ Way
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <motion.div
            key={row.topic}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[160px_1fr_1fr] border-b border-border/30 last:border-b-0 items-stretch"
          >
            {/* Topic label */}
            <div className="px-4 py-4 flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground leading-snug pt-1 hidden sm:block">{row.topic}</span>
            </div>

            {/* Problem */}
            <div className="px-4 py-4 border-l border-border/30 bg-destructive/[0.03]">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{row.problem}</p>
            </div>

            {/* Solution */}
            <div className="px-4 py-4 border-l border-border/30 bg-primary/[0.04]">
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{row.solution}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
