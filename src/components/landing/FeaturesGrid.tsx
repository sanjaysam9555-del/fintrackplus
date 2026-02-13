import { motion } from "framer-motion";
import {
  FolderKanban, Store, Users, CalendarClock,
  Banknote, Receipt, Camera, Brain,
  Calendar, Repeat, Copy, WifiOff,
  Search, Undo2, Palette, Moon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const primaryFeatures = [
  {
    icon: FolderKanban,
    title: "Wedding-as-a-Project",
    badge: "Core",
    description: "Create a project per wedding. Set Internal Cost and Client Cost. See real-time margin, health status, and budget consumption.",
    detail: "Duplicate projects to reuse templates across similar events.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Store,
    title: "Vendor Management",
    description: "Maintain a vendor directory with custom icons and colors. See total spend per vendor across all weddings with full transaction history.",
    gradient: "from-warning/20 to-warning/5",
  },
  {
    icon: Users,
    title: "Partner / Team Tracking",
    badge: "Multi-Partner",
    description: "Add business partners with separate Cash and Online balances. Track who handled which transaction with one-tap fund transfers.",
    gradient: "from-success/20 to-success/5",
  },
  {
    icon: CalendarClock,
    title: "Part Payment Tracking",
    description: "Log total expected amounts, plan future installments with dates, confirm payments as they happen. Visual progress bar included.",
    gradient: "from-destructive/20 to-destructive/5",
  },
  {
    icon: Banknote,
    title: "Cash vs Online Split",
    description: "Every transaction tagged Cash or Online. Dashboard and partner balances reflect both modes separately — essential for handling lakhs in cash.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Receipt,
    title: "GST Tagging & CA Export",
    badge: "Tax Ready",
    description: "Tag any transaction as GST. Export a CA-ready ZIP: transaction CSV, GST summary, and receipt images with professional headers.",
    gradient: "from-success/20 to-success/5",
  },
  {
    icon: Camera,
    title: "Receipt Capture",
    description: "Attach photos of bills directly to transactions. Camera + gallery support on mobile. Compressed, stored securely, included in exports.",
    gradient: "from-warning/20 to-warning/5",
  },
  {
    icon: Brain,
    title: "Smart Insights (AI)",
    badge: "AI Powered",
    description: "FY-level summaries, 6-month trend charts, category breakdowns, project health dashboard, and auto-generated spending insights.",
    gradient: "from-primary/20 to-primary/5",
  },
];

const secondaryFeatures = [
  { icon: Calendar, title: "Indian Financial Year", desc: "Apr–Mar FY by default, not calendar year" },
  { icon: Repeat, title: "Recurring Transactions", desc: "Monthly rent, EMIs, retainer fees — daily/weekly/monthly/yearly" },
  { icon: Copy, title: "Duplicate Detection", desc: "Smart warnings for same vendor + amount + date" },
  { icon: WifiOff, title: "Offline-First Sync", desc: "Works without internet, syncs when back online" },
  { icon: Search, title: "Global Search", desc: "Cmd+K to search transactions, vendors, projects instantly" },
  { icon: Undo2, title: "Undo Delete", desc: "5-second undo toast — no accidental data loss" },
  { icon: Palette, title: "Custom Categories", desc: "Icons & colors for Décor, Catering, Venue, Photography…" },
  { icon: Moon, title: "Dark Mode + OLED", desc: "Easy on the eyes during late-night event planning" },
];

export const FeaturesGrid = () => (
  <>
    {/* Primary features */}
    <section id="features" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Purpose-built features for wedding finance — not a generic spreadsheet with a pretty skin.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {primaryFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.45, delay: i * 0.06 } } }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-lg transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                {f.badge && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">{f.badge}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              {f.detail && (
                <p className="mt-2 text-xs text-muted-foreground/80 italic">{f.detail}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Secondary features */}
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h3
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl font-bold text-foreground text-center mb-10"
        >
          And there's more…
        </motion.h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {secondaryFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible"
              viewport={{ once: true }}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.4, delay: i * 0.05 } } }}
              className="bg-card/60 backdrop-blur-sm border rounded-xl p-4 text-center hover:bg-card transition-colors"
            >
              <f.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="text-sm font-semibold text-foreground mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);
