import { motion } from "framer-motion";
import { Home, ArrowDownLeft, ArrowUpRight, Plus, FolderKanban, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/components/ui/button";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';
export type DockItemId = TabId | 'search' | 'settings';

interface GlassDockProps {
  activeTab: DockItemId;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
}

const tabs = [
  { id: 'home' as DockItemId, icon: Home, label: 'Home' },
  { id: 'expenses' as DockItemId, icon: ArrowUpRight, label: 'Expense' },
  { id: 'income' as DockItemId, icon: ArrowDownLeft, label: 'Income' },
  { id: 'add' as DockItemId, icon: Plus, label: 'Add' },
  { id: 'projects' as DockItemId, icon: FolderKanban, label: 'Projects' },
  { id: 'search' as DockItemId, icon: Search, label: 'Search' },
  { id: 'settings' as DockItemId, icon: Settings, label: 'Settings' },
];

export const GlassDock = ({ activeTab, onTabChange, onAddClick, onSearchClick, onSettingsClick }: GlassDockProps) => {
  const handleTabClick = (tabId: TabId) => {
    triggerHaptic('light');
    onTabChange(tabId);
  };

  const handleAddClick = () => {
    triggerHaptic('medium');
    onAddClick();
  };

  const handleSearchClick = () => {
    triggerHaptic('light');
    onSearchClick();
  };

  const handleSettingsClick = () => {
    triggerHaptic('light');
    onSettingsClick();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe md:hidden">
      <nav className="flex items-center justify-around py-1 px-1.5 max-w-md mx-auto">
        {tabs.map((tab) => {
          if (tab.id === 'add') {
            return (
              <motion.button
                key={tab.id}
                onClick={handleAddClick}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-0.5 px-1.5 py-0.5 relative"
              >
                <motion.div
                  className="absolute w-10 h-10 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center relative">
                  <Plus size={20} className="text-primary-foreground" />
                </div>
              </motion.button>
            );
          }

          const isActive = activeTab === tab.id;
          const handleClick =
            tab.id === 'search' ? handleSearchClick :
            tab.id === 'settings' ? handleSettingsClick :
            () => handleTabClick(tab.id as TabId);

          return (
            <motion.button
              key={tab.id}
              onClick={handleClick}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-colors relative min-w-[38px]",
                isActive ? "text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent rounded-lg -z-10"
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