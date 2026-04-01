import React from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, Store, Users, CalendarClock,
  Banknote, Receipt, Camera, Brain,
  Calendar, Repeat,
  Search, Undo2, Palette, Moon,
  Tag, TrendingUp, Wallet, BarChart3, FileBarChart,
  Clock, Copy, Bell, ArrowDownUp, SlidersHorizontal,
  UserCircle, Cloud, WifiOff, Share2, Download, PlusCircle,
  ShieldCheck, Landmark, ArrowLeftRight, BellRing, PanelLeft, Timer,
  Building2, DatabaseBackup, Sparkles, LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "./PhoneMockup";

// Real screenshot imports
import projectsTab from "@/assets/landing/real/projects-tab.png";
import projectEntries from "@/assets/landing/real/project-entries.png";
import partners from "@/assets/landing/real/partners.png";
import gstForm from "@/assets/landing/real/gst-form.png";
import reports from "@/assets/landing/real/reports.png";
import activityLog from "@/assets/landing/real/activity-log.png";
import categories from "@/assets/landing/real/categories.png";

// Cropped feature images
import aiInsightsCropped from "@/assets/landing/real/ai-insights-cropped.png";
import receiptCropped from "@/assets/landing/real/receipt-cropped.png";
import cashOnlineCropped from "@/assets/landing/real/cash-online-cropped.png";
import darkModeCropped from "@/assets/landing/real/dark-mode-cropped.png";
import globalSearchCropped from "@/assets/landing/real/global-search-cropped.png";
import fyCropped from "@/assets/landing/real/fy-cropped.png";
import partPaymentCropped from "@/assets/landing/real/part-payment-form.png";
import recurringCropped from "@/assets/landing/real/recurring-cropped.png";
import duplicateCropped from "@/assets/landing/real/duplicate-cropped.png";
import vendorsCropped from "@/assets/landing/real/vendors.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const showcaseFeatures = [
  {
    icon: FolderKanban,
    title: "Event-as-a-Project",
    badge: "Core",
    description: "Create a project per event. Set Internal Cost and Client Cost. See real-time margin, health status, and budget consumption.",
    detail: "Duplicate projects to reuse templates across similar events.",
    screens: [
      { src: projectsTab, alt: "Projects tab showing event tracking" },
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
    screens: [{ src: partPaymentCropped, alt: "Part payment tracker with installment timeline" }],
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
    description: "Maintain a vendor directory with custom icons and colors. See total spend per vendor across all events.",
    screenshot: vendorsCropped,
    screenshotAlt: "Vendor directory with spend totals",
    iconBg: "bg-warning/10 text-warning",
    gradient: "from-warning/15 via-warning/5 to-transparent",
  },
  {
    icon: Banknote,
    title: "Cash vs Online Split",
    description: "Every transaction tagged Cash or Online. Dashboard and partner balances reflect both modes separately.",
    screenshot: cashOnlineCropped,
    screenshotAlt: "Cash and online balance split",
    iconBg: "bg-primary/10 text-primary",
    gradient: "from-primary/15 via-primary/5 to-transparent",
  },
  {
    icon: Camera,
    title: "Receipt Capture",
    description: "Attach photos of bills directly to transactions. Camera + gallery support on mobile. Included in exports.",
    screenshot: receiptCropped,
    screenshotAlt: "Receipt capture feature",
    iconBg: "bg-success/10 text-success",
    gradient: "from-success/15 via-success/5 to-transparent",
  },
  {
    icon: Brain,
    title: "Smart Insights (AI)",
    badge: "AI Powered",
    description: "FY-level summaries, 6-month trend charts, category breakdowns, project health dashboard, and spending insights.",
    screenshot: aiInsightsCropped,
    screenshotAlt: "AI insights dashboard with charts and analysis",
    iconBg: "bg-primary/10 text-primary",
    gradient: "from-primary/15 via-primary/5 to-transparent",
  },
];

const secondaryFeatures = [
  { icon: Calendar, title: "Indian Financial Year", desc: "Apr–Mar FY by default, not calendar year", screenshot: fyCropped, iconBg: "bg-warning/10 text-warning" },
  { icon: Repeat, title: "Recurring Transactions", desc: "Monthly rent, EMIs, retainer fees — daily/weekly/monthly/yearly", screenshot: recurringCropped, iconBg: "bg-primary/10 text-primary" },
  { icon: Search, title: "Global Search", desc: "Cmd+K to search transactions, vendors, projects instantly", screenshot: globalSearchCropped, iconBg: "bg-success/10 text-success" },
  { icon: Undo2, title: "Undo Delete", desc: "5-second undo toast — no accidental data loss", screenshot: activityLog, iconBg: "bg-destructive/10 text-destructive" },
  { icon: Palette, title: "Custom Categories", desc: "Icons & colors for Décor, Catering, Venue, Photography…", screenshot: categories, iconBg: "bg-warning/10 text-warning" },
  { icon: Moon, title: "Dark Mode + OLED", desc: "Easy on the eyes during late-night event planning", screenshot: darkModeCropped, iconBg: "bg-primary/10 text-primary" },
];

const extraFeatures = [
  { icon: Tag, title: "Labels", desc: "Color-coded labels to organize projects and transactions your way", iconBg: "bg-warning/10 text-warning" },
  { icon: SlidersHorizontal, title: "Sort, Filter & Search", desc: "Sort by date or amount, filter by category, vendor, project, and payment mode", iconBg: "bg-primary/10 text-primary" },
  { icon: Clock, title: "Time Filters", desc: "Filter by week, month, year, or custom date range instantly", iconBg: "bg-primary/10 text-primary" },
  { icon: Copy, title: "Duplicate Detection", desc: "Smart alerts when a transaction looks like a duplicate entry", iconBg: "bg-destructive/10 text-destructive" },
  { icon: Bell, title: "Activity Log", desc: "Full history of changes — never lose track of what happened", iconBg: "bg-warning/10 text-warning" },
  { icon: UserCircle, title: "Profile", desc: "Customize your name, avatar, and app preferences", iconBg: "bg-warning/10 text-warning" },
  { icon: Cloud, title: "Cloud Sync", desc: "Your data syncs securely across devices in real time", iconBg: "bg-primary/10 text-primary" },
  { icon: WifiOff, title: "Offline Mode", desc: "Works without internet — syncs automatically when back online", iconBg: "bg-success/10 text-success" },
  { icon: Share2, title: "Share Transactions", desc: "Share transaction details with partners or clients via any app", iconBg: "bg-warning/10 text-warning" },
  { icon: Download, title: "Install as App", desc: "Add to home screen for a native app experience — no app store needed", iconBg: "bg-destructive/10 text-destructive" },
  { icon: FileBarChart, title: "Project Documents", desc: "Attach contracts, invoices, and files directly to any project", iconBg: "bg-success/10 text-success" },
  { icon: ArrowDownUp, title: "Track from Anywhere", desc: "View transactions by project, vendor, partner, or category — all linked", iconBg: "bg-primary/10 text-primary" },
  { icon: PlusCircle, title: "Quick Add", desc: "One-tap logging with vendor, category, payment mode, and notes", iconBg: "bg-success/10 text-success" },
];

export const FeaturesGrid = () => (
  <>
    {/* Feature Showcase — alternating layout with phone mockups */}
    <section id="features" className="py-20 md:py-24 px-4 bg-muted/30">
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
            Purpose-built features for event finance — not a generic spreadsheet with a pretty skin.
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
                    <f.icon className="w-6 h-6 text-primary dark:text-foreground" />
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

    {/* Remaining primary features — card grid matching PainPoints style */}
    <section className="py-20 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            More powerful tools
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Every feature designed to save you time and protect your margins.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {remainingFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.2)] transition-shadow group"
            >
              {/* Screenshot with gradient overlay */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={f.screenshot}
                  alt={f.screenshotAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${f.gradient} opacity-60`} />
              </div>
              {/* Content */}
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-9 h-9 rounded-xl ${f.iconBg} flex items-center justify-center`}>
                    <f.icon className="w-4.5 h-4.5" />
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

    {/* Secondary features — clean card grid */}
    <section className="py-20 md:py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-foreground text-xs font-semibold mb-4">
            <Palette className="w-3.5 h-3.5" />
            More features
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            And there's more…
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Every detail considered, so you can focus on creating unforgettable events
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
        >
          {secondaryFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.2)] transition-shadow duration-300 group"
            >
              {/* Screenshot thumbnail */}
              <div className="h-36 md:h-40 overflow-hidden">
                <img
                  src={f.screenshot}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              {/* Content */}
              <div className="p-4 md:p-5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${f.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Extra features — compact icon cards, no screenshots */}
    <section className="py-20 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-foreground text-xs font-semibold mb-4">
            <Wallet className="w-3.5 h-3.5" />
            Full toolkit
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Plus all the essentials
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            The finishing touches that make FinTrack+ feel complete
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {extraFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.97 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
              }}
              whileHover={{ y: -3, scale: 1.03 }}
              className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 shadow-[0_0_32px_rgba(25,102,205,0.15)] ring-1 ring-primary/10 hover:shadow-[0_0_40px_rgba(25,102,205,0.2)] transition-shadow duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-3`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  </>
);
