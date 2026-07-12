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
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import saffronLogo from '@/assets/saffron-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useFinanceStore } from '@/lib/store';
import { isLandingDomain } from '@/lib/domainUtils';
import { toast } from 'sonner';

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';
type ViewMode = TabId | 'settings' | 'ai';

interface DesktopSidebarProps {
  activeTab: TabId;
  viewMode: ViewMode;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
  onNavigate: (section: string) => void;
  isEmployee?: boolean;
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
  onNavigate,
  isEmployee = false
}: DesktopSidebarProps) => {
  const { signOut } = useAuth();
  const { orgName, orgLogoUrl } = useFinanceStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleLogout = async () => {
    toast.success('Logged out successfully');
    await signOut();
    const target = isLandingDomain() ? '/application/auth' : '/auth';
    window.location.href = target;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="hidden md:flex flex-col h-dvh bg-card border-r border-border sticky top-0 overflow-hidden"
    >
        {/* Org Branding */}
        {(orgName || orgLogoUrl) && (
          <div className={cn("px-4 pt-4 pb-2 safe-top", isCollapsed && "px-2 pt-4 pb-2")}>
          <div className={cn(
              "flex flex-col items-center gap-1.5 text-center",
              isCollapsed && "gap-1"
            )}>
              {orgLogoUrl ? (
                <img src={orgLogoUrl} alt={orgName} className="w-10 h-10 rounded-xl object-contain shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-primary" />
                </div>
              )}
              {!isCollapsed && (
                <span className="text-xs font-bold tracking-wide uppercase text-foreground/80 font-[Inter]">{orgName}</span>
              )}
            </div>
          </div>
        )}

        {/* Add Transaction Button */}
        <div className={cn("p-4", !orgName && !orgLogoUrl ? "safe-top" : "", isCollapsed && "p-2")}>
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
              { id: 'search', icon: Search, label: 'Search' },
              ...(!isEmployee ? [{ id: 'ai', icon: Sparkles, label: 'AI Summary' }] : []),
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
            <>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-[10px] text-muted-foreground">An App By</span>
                <img src={saffronLogo} alt="Saffron Events" className="h-3.5 dark:brightness-0 dark:invert" />
                <span className="text-[10px] font-semibold text-muted-foreground">Saffron Events</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                FinTrack<sup className="text-[0.5em]">+</sup> v1.0.0
              </p>
            </>
          )}
        </div>
      </motion.aside>
  );
};
