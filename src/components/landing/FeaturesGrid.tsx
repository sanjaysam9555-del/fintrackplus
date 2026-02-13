import { motion } from "framer-motion";
import {
  FolderKanban, Store, Users, CalendarClock,
  Banknote, Receipt, Camera, Brain,
  Calendar, Repeat, Copy, WifiOff,
  Search, Undo2, Palette, Moon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "./PhoneMockup";

// Real screenshot imports
import projectsTab from "@/assets/landing/real/projects-tab.png";
import projectEntries from "@/assets/landing/real/project-entries.png";
import partners from "@/assets/landing/real/partners.png";
import projectSubTab from "@/assets/landing/real/project-sub-tab.png";
import gstForm from "@/assets/landing/real/gst-form.png";
import reports from "@/assets/landing/real/reports.png";
import vendors from "@/assets/landing/real/vendors.png";
import homeTab from "@/assets/landing/real/home-tab.png";
import expenseForm from "@/assets/landing/real/expense-form.png";
import aiSummary from "@/assets/landing/real/ai-summary.png";
import incomeTab from "@/assets/landing/real/income-tab.png";
import expenseTab from "@/assets/landing/real/expense-tab.png";
import activityLog from "@/assets/landing/real/activity-log.png";
import categories from "@/assets/landing/real/categories.png";
import aiSummary2 from "@/assets/landing/real/ai-summary-2.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const showcaseFeatures = [
  {
    icon: FolderKanban,
    title: "Wedding-as-a-Project",
    badge: "Core",
    description: "Create a project per wedding. Set Internal Cost and Client Cost. See real-time margin, health status, and budget consumption.",
    detail: "Duplicate projects to reuse templates across similar events.",
    screens: [
      { src: projectsTab, alt: "Projects tab showing wedding event tracking" },
      { src: projectEntries, alt: "Detailed project entries view" },
    ],
  },
  {
    icon: Users,
    title: "Partner / Team Tracking",
    badge: "Multi-Partner",
    description: "Add business partners with separate Cash and Online balances. Track who handled which transaction with one-tap fund transfers.",
    screens: [{ src: partners, alt: "Partner balance view showing cash and online splits" }],
  },
  {
    icon: CalendarClock,
    title: "Part Payment Tracking",
    description: "Log total expected amounts, plan future installments with dates, confirm payments as they happen. Visual progress bar included.",
    screens: [{ src: projectSubTab, alt: "Part payment tracker with installment timeline" }],
  },
  {
    icon: Receipt,
    title: "GST Tagging & CA Export",
    badge: "Tax Ready",
    description: "Tag any transaction as GST. Export a CA-ready ZIP: transaction CSV, GST summary, and receipt images with professional headers.",
    screens: [
      { src: gstForm, alt: "GST split transaction form" },
      { src: reports, alt: "Reports page with export options" },
    ],
  },
];

const remainingFeatures = [
  {
    icon: Store,
    title: "Vendor Management",
    description: "Maintain a vendor directory with custom icons and colors. See total spend per vendor across all weddings.",
    gradient: "from-warning/20 to-warning/5",
    screenshot: vendors,
    screenshotAlt: "Vendor directory with spend totals",
    objectPosition: "center 25%",
  },
  {
    icon: Banknote,
    title: "Cash vs Online Split",
    description: "Every transaction tagged Cash or Online. Dashboard and partner balances reflect both modes separately.",
    gradient: "from-primary/20 to-primary/5",
    screenshot: homeTab,
    screenshotAlt: "Home tab showing cash and online balance split",
    objectPosition: "center 15%",
  },
  {
    icon: Camera,
    title: "Receipt Capture",
    description: "Attach photos of bills directly to transactions. Camera + gallery support on mobile. Included in exports.",
    gradient: "from-warning/20 to-warning/5",
    screenshot: expenseForm,
    screenshotAlt: "Expense add form with receipt capture",
    objectPosition: "center 40%",
  },
  {
    icon: Brain,
    title: "Smart Insights (AI)",
    badge: "AI Powered",
    description: "FY-level summaries, 6-month trend charts, category breakdowns, project health dashboard, and spending insights.",
    gradient: "from-primary/20 to-primary/5",
    screenshot: aiSummary,
    screenshotAlt: "AI insights dashboard with charts and analysis",
    objectPosition: "center 20%",
  },
];

const secondaryFeatures = [
  { icon: Calendar, title: "Indian Financial Year", desc: "Apr–Mar FY by default, not calendar year", screenshot: incomeTab, objectPosition: "center 10%" },
  { icon: Repeat, title: "Recurring Transactions", desc: "Monthly rent, EMIs, retainer fees — daily/weekly/monthly/yearly", screenshot: expenseTab, objectPosition: "center 20%" },
  { icon: Copy, title: "Duplicate Detection", desc: "Smart warnings for same vendor + amount + date", screenshot: homeTab, objectPosition: "center 15%" },
  { icon: WifiOff, title: "Offline-First Sync", desc: "Works without internet, syncs when back online", screenshot: homeTab, objectPosition: "center 15%" },
  { icon: Search, title: "Global Search", desc: "Cmd+K to search transactions, vendors, projects instantly", screenshot: homeTab, objectPosition: "center 15%" },
  { icon: Undo2, title: "Undo Delete", desc: "5-second undo toast — no accidental data loss", screenshot: activityLog, objectPosition: "center 20%" },
  { icon: Palette, title: "Custom Categories", desc: "Icons & colors for Décor, Catering, Venue, Photography…", screenshot: categories, objectPosition: "center 20%" },
  { icon: Moon, title: "Dark Mode + OLED", desc: "Easy on the eyes during late-night event planning", screenshot: aiSummary2, objectPosition: "center 20%" },
];

export const FeaturesGrid = () => (
  <>
    {/* Feature Showcase — alternating layout with phone mockups */}
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
                {/* Phone mockup with mini carousel */}
                <div className="flex-1 w-full max-w-sm md:max-w-none flex justify-center">
                  <PhoneMockup screens={f.screens} autoPlayMs={2500} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* Remaining primary features — card grid with screenshot thumbnails */}
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {remainingFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.45, delay: i * 0.06 } } }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="h-36 overflow-hidden bg-muted/30">
                <img
                  src={f.screenshot}
                  alt={f.screenshotAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: f.objectPosition || "center top" }}
                  loading="lazy"
                />
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                    <f.icon className="w-4.5 h-4.5 text-foreground" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground">{f.title}</h3>
                  {f.badge && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">{f.badge}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Secondary features — cards with screenshot thumbnails */}
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
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-card/60 backdrop-blur-sm border rounded-xl overflow-hidden hover:bg-card transition-colors group"
            >
              <div className="h-28 md:h-32 overflow-hidden bg-muted/20">
                <img
                  src={f.screenshot}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: f.objectPosition || "center top" }}
                  loading="lazy"
                />
              </div>
              <div className="p-3 md:p-4 text-center">
                <f.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2 text-primary" />
                <h4 className="text-xs md:text-sm font-semibold text-foreground mb-1">{f.title}</h4>
                <p className="text-[10px] md:text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);
