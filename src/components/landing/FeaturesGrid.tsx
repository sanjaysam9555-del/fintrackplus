import { motion } from "framer-motion";
import {
  FolderKanban, Store, Users, CalendarClock,
  Banknote, Receipt, Camera, Brain,
  Calendar, Repeat, Copy, WifiOff,
  Search, Undo2, Palette, Moon,
  ArrowRightLeft, Download, CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ── CSS App Mockups ── */

const ProjectMockup = () => (
  <div className="bg-card border rounded-2xl p-4 shadow-lg max-w-xs mx-auto w-full">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <FolderKanban className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">Sharma-Gupta Wedding</div>
        <div className="text-[10px] text-muted-foreground">Dec 14, 2025 · Jaipur</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-muted/50 rounded-lg p-2">
        <div className="text-[10px] text-muted-foreground">Internal Cost</div>
        <div className="text-sm font-bold text-foreground">₹14,20,000</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-2">
        <div className="text-[10px] text-muted-foreground">Client Cost</div>
        <div className="text-sm font-bold text-foreground">₹18,00,000</div>
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">Margin</span>
        <span className="font-semibold text-success">22% · ₹3.8L</span>
      </div>
      <Progress value={78} className="h-2" />
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">Budget used: 78%</span>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-success/15 text-success border-0">Healthy</Badge>
      </div>
    </div>
  </div>
);

const PartnerMockup = () => (
  <div className="space-y-2 max-w-xs mx-auto w-full">
    {[
      { name: "Rahul Mehta", cash: "₹2,40,000", online: "₹5,10,000", color: "bg-primary/20" },
      { name: "Priya Sharma", cash: "₹1,80,000", online: "₹3,60,000", color: "bg-success/20" },
    ].map((p) => (
      <div key={p.name} className="bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-full ${p.color} flex items-center justify-center text-xs font-bold text-foreground`}>
            {p.name[0]}
          </div>
          <span className="text-sm font-semibold text-foreground">{p.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-muted-foreground">💵 Cash</div>
            <div className="text-xs font-bold text-foreground">{p.cash}</div>
          </div>
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-muted-foreground">🏦 Online</div>
            <div className="text-xs font-bold text-foreground">{p.online}</div>
          </div>
        </div>
      </div>
    ))}
    <button className="w-full flex items-center justify-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg py-2 font-medium">
      <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Funds
    </button>
  </div>
);

const InstallmentMockup = () => (
  <div className="bg-card border rounded-2xl p-4 shadow-lg max-w-xs mx-auto w-full">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
        <Store className="w-4 h-4 text-warning" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">Royal Caterers</div>
        <div className="text-[10px] text-muted-foreground">Total: ₹5,00,000</div>
      </div>
    </div>
    <div className="space-y-1.5 mb-3">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">Paid ₹3,00,000 of ₹5,00,000</span>
        <span className="font-semibold text-foreground">60%</span>
      </div>
      <Progress value={60} className="h-2" />
    </div>
    <div className="space-y-1.5">
      {[
        { date: "Oct 15", amount: "₹1,50,000", done: true },
        { date: "Nov 10", amount: "₹1,50,000", done: true },
        { date: "Dec 5", amount: "₹1,00,000", done: false },
        { date: "Dec 12", amount: "₹1,00,000", done: false },
      ].map((inst) => (
        <div key={inst.date} className="flex items-center gap-2 text-xs">
          <CheckCircle2 className={`w-3.5 h-3.5 ${inst.done ? "text-success" : "text-muted-foreground/40"}`} />
          <span className={`flex-1 ${inst.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{inst.date}</span>
          <span className={`font-medium ${inst.done ? "text-muted-foreground" : "text-foreground"}`}>{inst.amount}</span>
        </div>
      ))}
    </div>
  </div>
);

const ExportMockup = () => (
  <div className="bg-card border rounded-2xl p-4 shadow-lg max-w-xs mx-auto w-full">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center">
        <Receipt className="w-4 h-4 text-success" />
      </div>
      <div className="text-sm font-semibold text-foreground">CA Export Package</div>
    </div>
    <div className="space-y-1.5 mb-3">
      {["transactions_FY2025.csv", "gst_summary_FY2025.csv", "receipts/ (24 files)"].map((f) => (
        <div key={f} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5 text-[11px]">
          <Download className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-mono">{f}</span>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 text-xs font-medium text-primary">
      <Download className="w-4 h-4" />
      Download ZIP — 2.4 MB
    </div>
  </div>
);

/* ── Feature Showcase Items ── */

const showcaseFeatures = [
  {
    icon: FolderKanban,
    title: "Wedding-as-a-Project",
    badge: "Core",
    description: "Create a project per wedding. Set Internal Cost and Client Cost. See real-time margin, health status, and budget consumption.",
    detail: "Duplicate projects to reuse templates across similar events.",
    mockup: <ProjectMockup />,
  },
  {
    icon: Users,
    title: "Partner / Team Tracking",
    badge: "Multi-Partner",
    description: "Add business partners with separate Cash and Online balances. Track who handled which transaction with one-tap fund transfers.",
    mockup: <PartnerMockup />,
  },
  {
    icon: CalendarClock,
    title: "Part Payment Tracking",
    description: "Log total expected amounts, plan future installments with dates, confirm payments as they happen. Visual progress bar included.",
    mockup: <InstallmentMockup />,
  },
  {
    icon: Receipt,
    title: "GST Tagging & CA Export",
    badge: "Tax Ready",
    description: "Tag any transaction as GST. Export a CA-ready ZIP: transaction CSV, GST summary, and receipt images with professional headers.",
    mockup: <ExportMockup />,
  },
];

const remainingFeatures = [
  {
    icon: Store,
    title: "Vendor Management",
    description: "Maintain a vendor directory with custom icons and colors. See total spend per vendor across all weddings with full transaction history.",
    gradient: "from-warning/20 to-warning/5",
  },
  {
    icon: Banknote,
    title: "Cash vs Online Split",
    description: "Every transaction tagged Cash or Online. Dashboard and partner balances reflect both modes separately — essential for handling lakhs in cash.",
    gradient: "from-primary/20 to-primary/5",
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
    {/* Feature Showcase — alternating layout with mockups */}
    <section id="features" className="py-16 md:py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-12 md:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Purpose-built features for wedding finance — not a generic spreadsheet with a pretty skin.
          </p>
        </motion.div>

        <div className="space-y-12 md:space-y-16">
          {showcaseFeatures.map((f, i) => {
            const isEven = i % 2 === 1;
            return (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: 0.1 } } }}
                className={`flex flex-col ${isEven ? "md:flex-row-reverse" : "md:flex-row"} gap-6 md:gap-10 items-center`}
              >
                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <f.icon className="w-6 h-6 text-primary" />
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">{f.title}</h3>
                    {f.badge && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">{f.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  {f.detail && (
                    <p className="mt-2 text-xs text-muted-foreground/80 italic">{f.detail}</p>
                  )}
                </div>
                {/* Mockup */}
                <div className="flex-1 w-full max-w-sm md:max-w-none">
                  {f.mockup}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* Remaining primary features — card grid */}
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {remainingFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.45, delay: i * 0.06 } } }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl p-5 md:p-6 hover:shadow-lg transition-all group"
            >
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base md:text-lg font-semibold text-foreground">{f.title}</h3>
                {f.badge && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">{f.badge}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Secondary features */}
    <section className="py-12 md:py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.h3
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-xl md:text-2xl font-bold text-foreground text-center mb-8 md:mb-10"
        >
          And there's more…
        </motion.h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {secondaryFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible"
              viewport={{ once: true }}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.4, delay: i * 0.05 } } }}
              className="bg-card/60 backdrop-blur-sm border rounded-xl p-3 md:p-4 text-center hover:bg-card transition-colors"
            >
              <f.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2 text-primary" />
              <h4 className="text-xs md:text-sm font-semibold text-foreground mb-1">{f.title}</h4>
              <p className="text-[10px] md:text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);
