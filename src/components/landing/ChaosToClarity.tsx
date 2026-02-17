import { motion } from "framer-motion";
import { ArrowRight, Check, MessageSquareWarning, TrendingDown, Users, Receipt } from "lucide-react";

import homeTab from "@/assets/landing/real/home-tab.png";
import projectEntries from "@/assets/landing/real/project-entries.png";
import partners from "@/assets/landing/real/partners.png";
import gstForm from "@/assets/landing/real/gst-form.png";

const rows = [
  {
    problemIcon: MessageSquareWarning,
    problemTitle: "Cash Leaks & WhatsApp Trails",
    problemDesc: "Vendor payments are scattered across notebooks and chat messages. By reconciliation time, thousands of rupees often disappear unnoticed.",
    solutionTitle: "Every Rupee Accounted For",
    solutionDesc: "Track every single rupee across events, vendors, and partners in one centralized app. It even works offline for site visits with spotty internet.",
    screenshot: homeTab,
  },
  {
    problemIcon: TrendingDown,
    problemTitle: "Margin Blindness",
    problemDesc: "You might quote a client ₹18 lakh only to realize you spent ₹20 lakh once the event is finally over. You learn your actual margin too late to fix it.",
    solutionTitle: "Real-Time Profitability",
    solutionDesc: "View your real-time margin, project health status, and budget consumption as transactions are logged. Know exactly where you stand while the event is still live.",
    screenshot: projectEntries,
  },
  {
    problemIcon: Users,
    problemTitle: "Partner Friction",
    problemDesc: 'Managing who spent what from which pocket leads to "who owes who" arguments at the end of the month.',
    solutionTitle: "Automated Partner Splits",
    solutionDesc: "Maintain separate cash and online balances for each partner. Balances update automatically with one-tap fund transfers.",
    screenshot: partners,
  },
  {
    problemIcon: Receipt,
    problemTitle: 'The CA "Clean-Up" Tax',
    problemDesc: "GST receipts are buried in gallery folders. Accountants charge extra just to untangle the mess of messy books during tax season.",
    solutionTitle: "CA-Ready in One Tap",
    solutionDesc: 'Tag any entry as GST-applicable and attach receipt photos instantly. Export a "CA-ready ZIP" with organized CSVs and receipt images to slash your accounting fees.',
    screenshot: gstForm,
  },
];

export const ChaosToClarity = () => (
  <section className="py-20 md:py-24 px-4">
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
          Before vs. After
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          From Event Chaos to Financial Clarity
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          This is what shifts when you switch to FinTrack⁺
        </p>
      </motion.div>

      {/* Rows */}
      <div className="flex flex-col gap-6">
        {rows.map((row, i) => (
          <div
            key={row.problemTitle}
            className="grid grid-cols-1 md:grid-cols-[1fr_40px_1fr] gap-3 md:gap-0 items-stretch"
          >
            {/* Problem card */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: i * 0.12 }}
              className="bg-destructive/5 border border-destructive/20 ring-1 ring-destructive/10 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <row.problemIcon className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-xs font-semibold text-destructive/70 uppercase tracking-wider">
                  The Old Way
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1.5">{row.problemTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{row.problemDesc}</p>
            </motion.div>

            {/* Arrow connector (desktop only) */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary/50" />
            </div>

            {/* Solution card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: i * 0.12 + 0.06 }}
              whileHover={{ scale: 1.02, y: -3 }}
              className="bg-primary/5 border border-primary/20 ring-1 ring-primary/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_0_24px_rgba(25,102,205,0.12)] flex flex-col"
            >
              {/* Screenshot */}
              <div className="h-36 overflow-hidden bg-muted/40">
                <img
                  src={row.screenshot}
                  alt={row.solutionTitle}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              {/* Content */}
              <div className="p-5 flex flex-col justify-center flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-green-500/80 uppercase tracking-wider">
                    FinTrack⁺ Way
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">{row.solutionTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{row.solutionDesc}</p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
