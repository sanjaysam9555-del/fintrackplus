import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, FolderKanban, Users, Grid3X3, Store, Tag,
  Wallet, CreditCard, Receipt, RefreshCw, FileBarChart,
  Brain, Search, Copy, Undo2, Moon, Camera, CalendarRange,
  X, Sparkles
} from "lucide-react";

// Import real screenshots
import projectsTab from "@/assets/landing/real/projects-tab.png";
import partners from "@/assets/landing/real/partners.png";
import categories from "@/assets/landing/real/categories.png";
import vendors from "@/assets/landing/real/vendors.png";
import cashOnline from "@/assets/landing/real/cash-online-cropped.png";
import partPayment from "@/assets/landing/real/part-payment-cropped.png";
import gstForm from "@/assets/landing/real/gst-form.png";
import recurringCropped from "@/assets/landing/real/recurring-cropped.png";
import reports from "@/assets/landing/real/reports.png";
import aiInsights from "@/assets/landing/real/ai-insights-cropped.png";
import globalSearch from "@/assets/landing/real/global-search-cropped.png";
import duplicateCropped from "@/assets/landing/real/duplicate-cropped.png";
import darkMode from "@/assets/landing/real/dark-mode-cropped.png";
import receiptCropped from "@/assets/landing/real/receipt-cropped.png";
import fyCropped from "@/assets/landing/real/fy-cropped.png";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  screenshot?: string;
  color: string;
}

interface FeatureGroup {
  title: string;
  subtitle: string;
  features: Feature[];
}

const featureGroups: FeatureGroup[] = [
  {
    title: "Core Features",
    subtitle: "Organize your business data",
    features: [
      { icon: FolderKanban, title: "Projects", description: "Track income & expenses per project with budgets and margins", screenshot: projectsTab, color: "bg-amber-500/10 text-amber-500" },
      { icon: Users, title: "Partners", description: "Manage multiple business partners with separate balances", screenshot: partners, color: "bg-blue-500/10 text-blue-500" },
      { icon: Grid3X3, title: "Categories", description: "Custom categories with icons and colors for quick tagging", screenshot: categories, color: "bg-purple-500/10 text-purple-500" },
      { icon: Store, title: "Vendors", description: "Keep a directory of all your vendors and suppliers", screenshot: vendors, color: "bg-emerald-500/10 text-emerald-500" },
      { icon: Tag, title: "Labels", description: "Flexible labels to tag and filter projects your way", color: "bg-pink-500/10 text-pink-500" },
    ]
  },
  {
    title: "Finance Tools",
    subtitle: "Powerful money management",
    features: [
      { icon: Wallet, title: "Cash vs Online", description: "Split every transaction into cash and online payment modes", screenshot: cashOnline, color: "bg-green-500/10 text-green-500" },
      { icon: CreditCard, title: "Part Payments", description: "Track installments and partial payments with due reminders", screenshot: partPayment, color: "bg-orange-500/10 text-orange-500" },
      { icon: Receipt, title: "GST Tagging", description: "Mark transactions as GST-applicable for easy tax filing", screenshot: gstForm, color: "bg-red-500/10 text-red-500" },
      { icon: RefreshCw, title: "Recurring", description: "Auto-detect and manage recurring transactions effortlessly", screenshot: recurringCropped, color: "bg-cyan-500/10 text-cyan-500" },
      { icon: FileBarChart, title: "Reports", description: "Export detailed reports in CSV or PDF format anytime", screenshot: reports, color: "bg-indigo-500/10 text-indigo-500" },
    ]
  },
  {
    title: "Smart Features",
    subtitle: "AI-powered intelligence",
    features: [
      { icon: Brain, title: "AI Insights", description: "Get smart summaries and spending analysis powered by AI", screenshot: aiInsights, color: "bg-violet-500/10 text-violet-500" },
      { icon: Search, title: "Global Search", description: "Find any transaction, vendor, or project instantly", screenshot: globalSearch, color: "bg-sky-500/10 text-sky-500" },
      { icon: Copy, title: "Duplicate Detection", description: "Automatic warnings when you enter similar transactions", screenshot: duplicateCropped, color: "bg-yellow-500/10 text-yellow-500" },
      { icon: Undo2, title: "Undo Delete", description: "Accidentally deleted something? Undo it within seconds", color: "bg-rose-500/10 text-rose-500" },
    ]
  },
  {
    title: "Customization",
    subtitle: "Make it yours",
    features: [
      { icon: Moon, title: "Dark & OLED Mode", description: "Choose light, dark, or true OLED black for AMOLED screens", screenshot: darkMode, color: "bg-slate-500/10 text-slate-500" },
      { icon: Camera, title: "Receipt Capture", description: "Attach receipt photos to any transaction for records", screenshot: receiptCropped, color: "bg-teal-500/10 text-teal-500" },
      { icon: CalendarRange, title: "Financial Year", description: "Set your FY start month and view data by financial year", screenshot: fyCropped, color: "bg-fuchsia-500/10 text-fuchsia-500" },
    ]
  }
];

interface AppFeaturesGuideProps {
  onBack: () => void;
}

export const AppFeaturesGuide = ({ onBack }: AppFeaturesGuideProps) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">App Features</h1>
            <p className="text-sm text-muted-foreground">Everything you can do</p>
          </div>
        </div>
      </div>

      {/* Feature Groups */}
      <div className="px-4 space-y-8">
        {featureGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <div className="mb-3">
              <h2 className="text-lg font-bold">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.subtitle}</p>
            </div>
            <div className="space-y-3">
              {group.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + featureIndex * 0.04 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-card"
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{feature.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                      </div>
                    </div>
                    {feature.screenshot && (
                      <button
                        onClick={() => setExpandedImage(feature.screenshot!)}
                        className="w-full border-t border-border"
                      >
                        <img
                          src={feature.screenshot}
                          alt={feature.title}
                          className="w-full h-40 object-cover object-top"
                          loading="lazy"
                        />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Image Overlay */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-md w-full"
            >
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              >
                <X size={24} />
              </button>
              <img
                src={expandedImage}
                alt="Feature screenshot"
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
