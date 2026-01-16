import { motion } from "framer-motion";
import { 
  Home, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  FolderKanban, 
  Settings, 
  Sparkles,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';
type ViewMode = TabId | 'settings' | 'ai';

interface DesktopSidebarProps {
  activeTab: TabId;
  viewMode: ViewMode;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: 'home' as TabId, icon: Home, label: 'Dashboard' },
  { id: 'expenses' as TabId, icon: ArrowUpRight, label: 'Expenses' },
  { id: 'income' as TabId, icon: ArrowDownLeft, label: 'Income' },
  { id: 'projects' as TabId, icon: FolderKanban, label: 'Projects' },
];

export const DesktopSidebar = ({ 
  activeTab, 
  viewMode, 
  onTabChange, 
  onAddClick,
  onNavigate 
}: DesktopSidebarProps) => {
  const { userProfile } = useFinanceStore();
  const { signOut, user } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-card border-r border-border sticky top-0">
      {/* Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center">
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{userProfile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Add Transaction Button */}
      <div className="p-4">
        <motion.button
          onClick={onAddClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 gradient-primary rounded-xl text-primary-foreground font-medium"
        >
          <Plus size={20} />
          Add Transaction
        </motion.button>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
          Navigation
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="desktopActiveNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Tools Section */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mt-6 mb-2">
          Tools
        </p>
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('ai')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
              viewMode === 'ai' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles size={18} />
            AI Summary
            {viewMode === 'ai' && (
              <motion.div
                layoutId="desktopActiveNav"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
              viewMode === 'settings' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings size={18} />
            Settings
            {viewMode === 'settings' && (
              <motion.div
                layoutId="desktopActiveNav"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
          </button>
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          FinTrack Pro v1.0.0
        </p>
      </div>
    </aside>
  );
};
