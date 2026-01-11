import { motion } from "framer-motion";
import { Home, ArrowDownLeft, ArrowUpRight, Plus, Settings, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/lib/store";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'settings' | 'notifications' | 'ai';

interface GlassDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
}

const tabs = [
  { id: 'home' as TabId, icon: Home, label: 'Home' },
  { id: 'expenses' as TabId, icon: ArrowUpRight, label: 'Expense' },
  { id: 'income' as TabId, icon: ArrowDownLeft, label: 'Income' },
  { id: 'add' as TabId, icon: Plus, label: 'Add' },
  { id: 'ai' as TabId, icon: Sparkles, label: 'AI' },
  { id: 'notifications' as TabId, icon: Bell, label: 'Alerts' },
  { id: 'settings' as TabId, icon: Settings, label: 'Settings' },
];

export const GlassDock = ({ activeTab, onTabChange, onAddClick }: GlassDockProps) => {
  const { notifications } = useFinanceStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <nav className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isAddButton = tab.id === 'add';
          const isNotifications = tab.id === 'notifications';
          
          if (isAddButton) {
            return (
              <motion.button
                key={tab.id}
                onClick={onAddClick}
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
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors relative min-w-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
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
