import { motion } from "framer-motion";
import { Home, ArrowDownLeft, ArrowUpRight, Plus, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/components/ui/button";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';

interface GlassDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
}

const tabs = [
  { id: 'home' as TabId, icon: Home, label: 'Home' },
  { id: 'expenses' as TabId, icon: ArrowUpRight, label: 'Expense' },
  { id: 'add' as TabId, icon: Plus, label: 'Add' },
  { id: 'income' as TabId, icon: ArrowDownLeft, label: 'Income' },
  { id: 'projects' as TabId, icon: FolderKanban, label: 'Projects' },
];

export const GlassDock = ({ activeTab, onTabChange, onAddClick }: GlassDockProps) => {
  const handleTabClick = (tabId: TabId) => {
    triggerHaptic('light');
    onTabChange(tabId);
  };
  
  const handleAddClick = () => {
    triggerHaptic('medium');
    onAddClick();
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe md:hidden">
      <nav className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isAddButton = tab.id === 'add';
          
          if (isAddButton) {
            return (
              <motion.button
                key={tab.id}
                onClick={handleAddClick}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 px-4 py-2"
              >
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <Plus size={24} className="text-primary-foreground" />
                </div>
              </motion.button>
            );
          }
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors relative min-w-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium">{tab.label}</span>
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
    </div>
  );
};