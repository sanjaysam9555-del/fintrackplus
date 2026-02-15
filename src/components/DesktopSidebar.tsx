import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  FolderKanban, 
  Settings, 
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="hidden md:flex flex-col h-screen bg-card border-r border-border sticky top-0 overflow-hidden"
    >
        {/* Profile Section */}
        <div className={cn(
          "p-4 border-b border-border",
          isCollapsed && "px-3"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center shrink-0">
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
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="font-semibold text-sm truncate">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Add Transaction Button */}
        <div className={cn("p-4", isCollapsed && "p-2")}>
          <motion.button
            onClick={onAddClick}
            whileHover={{ scale: isCollapsed ? 1.05 : 1.02 }}
            whileTap={{ scale: isCollapsed ? 0.95 : 0.98 }}
            className={cn(
              "gradient-primary rounded-xl text-primary-foreground font-medium",
              isCollapsed 
                ? "w-12 h-12 flex items-center justify-center mx-auto"
                : "w-full flex items-center justify-center gap-2 py-3 px-4"
            )}
          >
            <Plus size={20} />
            {!isCollapsed && "Add Transaction"}
          </motion.button>
        </div>
        
        {/* Main Navigation */}
        <nav className={cn("flex-1 px-3 py-2", isCollapsed && "px-2")}>
          {!isCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
              Navigation
            </p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                    isCollapsed && "justify-center px-0",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {!isCollapsed && item.label}
                </button>
              );
            })}
          </div>
          
          {/* Tools Section */}
          {!isCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mt-6 mb-2">
              Tools
            </p>
          )}
          <div className={cn("space-y-1", isCollapsed && "mt-4")}>
            {[
              { id: 'ai', icon: Sparkles, label: 'AI Summary' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => {
              const isActive = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                    isCollapsed && "justify-center px-0",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {!isCollapsed && item.label}
                </button>
              );
            })}
          </div>
        </nav>
        
        {/* Collapse Toggle */}
        <div className="px-3 py-2 border-t border-border">
          <button
            onClick={toggleCollapse}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              isCollapsed && "justify-center px-0"
            )}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && 'Collapse'}
          </button>
        </div>
        
        {/* Footer */}
        <div className={cn("p-4 border-t border-border", isCollapsed && "p-2")}>
          <button
            onClick={handleLogout}
            className={cn(
              "rounded-xl text-destructive hover:bg-destructive/10 transition-colors",
              isCollapsed 
                ? "w-12 h-12 flex items-center justify-center mx-auto"
                : "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium"
            )}
          >
            <LogOut size={18} />
            {!isCollapsed && "Sign Out"}
          </button>
          {!isCollapsed && (
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              FinTrack<sup className="text-[0.5em]">+</sup> v1.0.0
            </p>
          )}
        </div>
      </motion.aside>
  );
};
