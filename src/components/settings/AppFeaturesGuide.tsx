import { motion } from "framer-motion";
import { 
  ArrowLeft, FolderKanban, Users, Grid3X3, Store, Tag,
  Wallet, CreditCard, Receipt, RefreshCw, FileBarChart,
  Brain, Search, Copy, Undo2, Moon, Camera, CalendarRange,
  Sparkles, BarChart3, Share2, Bell, Cloud, WifiOff,
  SlidersHorizontal, Clock, ArrowDownUp, TrendingUp,
  PiggyBank, UserCircle, PlusCircle, Download
} from "lucide-react";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

interface FeatureGroup {
  title: string;
  subtitle: string;
  accent: string;
  features: Feature[];
}

const featureGroups: FeatureGroup[] = [
  {
    title: "Organize",
    subtitle: "Structure your business data",
    accent: "from-amber-500/20 to-orange-500/20",
    features: [
      { icon: FolderKanban, title: "Projects", description: "Track income & expenses per project", color: "bg-amber-500/15 text-amber-500" },
      { icon: TrendingUp, title: "Budgets & Margins", description: "Set internal cost and client cost per project", color: "bg-orange-500/15 text-orange-500" },
      { icon: Users, title: "Partners", description: "Multiple partners with separate balances", color: "bg-blue-500/15 text-blue-500" },
      { icon: PiggyBank, title: "Partner Balances", description: "Opening + period income − expense = closing", color: "bg-sky-500/15 text-sky-500" },
      { icon: Grid3X3, title: "Categories", description: "Custom icons and colors for quick tagging", color: "bg-purple-500/15 text-purple-500" },
      { icon: Store, title: "Vendors", description: "Directory of all your vendors & suppliers", color: "bg-emerald-500/15 text-emerald-500" },
      { icon: Tag, title: "Labels", description: "Flexible tags to filter projects your way", color: "bg-pink-500/15 text-pink-500" },
    ]
  },
  {
    title: "Track Money",
    subtitle: "Powerful finance management",
    accent: "from-green-500/20 to-emerald-500/20",
    features: [
      { icon: PlusCircle, title: "Income & Expense", description: "Log every transaction with rich details", color: "bg-green-500/15 text-green-500" },
      { icon: Wallet, title: "Cash vs Online", description: "Split payments into cash and online modes", color: "bg-teal-500/15 text-teal-500" },
      { icon: CreditCard, title: "Part Payments", description: "Track installments with due date reminders", color: "bg-orange-500/15 text-orange-500" },
      { icon: Receipt, title: "GST Tagging", description: "Mark transactions for easy tax filing", color: "bg-red-500/15 text-red-500" },
      { icon: RefreshCw, title: "Recurring", description: "Auto-detect and manage recurring entries", color: "bg-cyan-500/15 text-cyan-500" },
    ]
  },
  {
    title: "Analyze",
    subtitle: "AI-powered intelligence",
    accent: "from-violet-500/20 to-indigo-500/20",
    features: [
      { icon: BarChart3, title: "Dashboard & Charts", description: "Visual cash flow trends at a glance", color: "bg-indigo-500/15 text-indigo-500" },
      { icon: Brain, title: "AI Insights", description: "Smart summaries and spending analysis", color: "bg-violet-500/15 text-violet-500" },
      { icon: FileBarChart, title: "Reports Export", description: "Download CSV or PDF reports anytime", color: "bg-blue-500/15 text-blue-500" },
      { icon: CalendarRange, title: "Financial Year", description: "Set FY start month and view by fiscal year", color: "bg-fuchsia-500/15 text-fuchsia-500" },
      { icon: Clock, title: "Time Filters", description: "Filter by week, month, year, or custom range", color: "bg-rose-500/15 text-rose-500" },
    ]
  },
  {
    title: "Find & Fix",
    subtitle: "Never lose track",
    accent: "from-sky-500/20 to-blue-500/20",
    features: [
      { icon: Search, title: "Global Search", description: "Find any transaction, vendor, or project instantly", color: "bg-sky-500/15 text-sky-500" },
      { icon: Copy, title: "Duplicate Detection", description: "Warnings when you enter similar transactions", color: "bg-yellow-500/15 text-yellow-500" },
      { icon: Undo2, title: "Undo Delete", description: "Restore accidentally deleted entries in seconds", color: "bg-rose-500/15 text-rose-500" },
      { icon: Bell, title: "Activity Log", description: "Full history of all changes and notifications", color: "bg-amber-500/15 text-amber-500" },
      { icon: ArrowDownUp, title: "Sort & Filter", description: "Sort by date, amount, or recency with filters", color: "bg-slate-500/15 text-slate-500" },
      { icon: SlidersHorizontal, title: "Advanced Filters", description: "Filter by category, vendor, project, and more", color: "bg-gray-500/15 text-gray-500" },
    ]
  },
  {
    title: "Personalize",
    subtitle: "Make it yours",
    accent: "from-pink-500/20 to-rose-500/20",
    features: [
      { icon: Moon, title: "Dark & OLED Mode", description: "Light, dark, or true black for AMOLED screens", color: "bg-slate-500/15 text-slate-500" },
      { icon: Camera, title: "Receipt Capture", description: "Attach receipt photos to any transaction", color: "bg-teal-500/15 text-teal-500" },
      { icon: UserCircle, title: "Profile", description: "Customize your name and avatar", color: "bg-blue-500/15 text-blue-500" },
      { icon: Cloud, title: "Cloud Sync", description: "Your data syncs across devices automatically", color: "bg-cyan-500/15 text-cyan-500" },
      { icon: WifiOff, title: "Offline Mode", description: "Works without internet, syncs when back online", color: "bg-orange-500/15 text-orange-500" },
      { icon: Share2, title: "Share Transactions", description: "Share transaction details via any app", color: "bg-green-500/15 text-green-500" },
      { icon: Download, title: "Install as App", description: "Add to home screen for a native app feel", color: "bg-purple-500/15 text-purple-500" },
    ]
  }
];

interface AppFeaturesGuideProps {
  onBack: () => void;
}

export const AppFeaturesGuide = ({ onBack }: AppFeaturesGuideProps) => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles size={22} className="text-primary" />
              App Features
            </h1>
            <p className="text-sm text-muted-foreground">Everything you can do</p>
          </div>
        </div>
      </div>

      {/* Feature Groups */}
      <div className="px-4 space-y-6">
        {featureGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.08 }}
          >
            {/* Group Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${group.accent}`} />
              <div>
                <h2 className="text-base font-bold">{group.title}</h2>
                <p className="text-xs text-muted-foreground">{group.subtitle}</p>
              </div>
            </div>

            {/* Feature Rows */}
            <div className="space-y-1.5 ml-1">
              {group.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.08 + featureIndex * 0.03 }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">{feature.title}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
