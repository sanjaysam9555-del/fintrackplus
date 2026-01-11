import { motion } from "framer-motion";
import { Home, ArrowDownLeft, ArrowUpRight, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'settings';

interface GlassDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
}

const tabs = [
  { id: 'home' as TabId, icon: Home, label: 'Home' },
  { id: 'expenses' as TabId, icon: ArrowUpRight, label: 'Expenses' },
  { id: 'add' as TabId, icon: Plus, label: 'Add' },
  { id: 'income' as TabId, icon: ArrowDownLeft, label: 'Income' },
  { id: 'settings' as TabId, icon: Settings, label: 'Settings' },
];

export const GlassDock = ({ activeTab, onTabChange, onAddClick }: GlassDockProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-bottom">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-dock rounded-2xl mx-auto max-w-md"
      >
        <nav className="flex items-center justify-around py-2 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isAddButton = tab.id === 'add';
            
            if (isAddButton) {
              return (
                <motion.button
                  key={tab.id}
                  onClick={onAddClick}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center">
                    <Plus size={28} className="text-primary-foreground" />
                  </div>
                </motion.button>
              );
            }
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>
    </div>
  );
};
