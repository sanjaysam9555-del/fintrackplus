import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronRight, 
  Moon,
  Sun,
  Pencil,
  Sparkles,
  Grid3X3,
  Store,
  FolderKanban,
  Tag,
  FileBarChart,
  ArrowLeft,
  LogOut,
  ScrollText,
  Monitor,
  Smartphone,
  Users,
  Download,
  RefreshCw,
  Cloud,
  CloudOff,
  Loader2,
  WifiOff,
  Shield,
  ClipboardCheck
} from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { CategoriesSection } from "./settings/CategoriesSection";
import { VendorsSection } from "./settings/VendorsSection";

import { ReportsSection } from "./settings/ReportsSection";
import { PartnersSection } from "./settings/PartnersSection";
import { LabelsSection } from "./settings/LabelsSection";
import { AppFeaturesGuide } from "./settings/AppFeaturesGuide";
import { TeamSection } from "./settings/TeamSection";
import { ChangeApprovalPage } from "./settings/ChangeApprovalPage";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { Check, ArrowUpRight, FileDown, User, Trash2 } from "lucide-react";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { appPath } from "@/lib/domainUtils";
import saffronLogo from "@/assets/saffron-logo.png";

// Action badge helper
const getActionBadge = (notification: { type: string; details?: { from: string }[] }) => {
  const isNew = notification.details && notification.details.length > 0 && notification.details[0].from === 'New';
  if (isNew) return { label: 'Added', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
  switch (notification.type) {
    case 'transaction': return { label: 'Added', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
    case 'edit': return { label: 'Edited', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
    case 'delete': return { label: 'Deleted', className: 'bg-destructive/15 text-destructive' };
    case 'export': return { label: 'Exported', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' };
    case 'profile': return { label: 'Updated', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' };
    case 'partner': return { label: 'Updated', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
    default: return { label: 'Action', className: 'bg-muted text-muted-foreground' };
  }
};

// Inline notification content for settings page
const NotificationsContent = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinanceStore();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction': return ArrowUpRight;
      case 'export': return FileDown;
      case 'profile': return User;
      case 'category': return Grid3X3;
      case 'vendor': return Store;
      case 'project': return FolderKanban;
      case 'delete': return Trash2;
      case 'edit': return Pencil;
      default: return ScrollText;
    }
  };
  
  const getIconColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-accent text-accent-foreground';
      case 'export': return 'bg-blue-500/10 text-blue-500 dark:text-blue-400';
      case 'profile': return 'bg-purple-500/10 text-purple-500 dark:text-purple-400';
      case 'category': return 'bg-blue-500/10 text-blue-500 dark:text-blue-400';
      case 'vendor': return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400';
      case 'project': return 'bg-amber-500/10 text-amber-500 dark:text-amber-400';
      case 'delete': return 'bg-destructive/10 text-destructive';
      case 'edit': return 'bg-orange-500/10 text-orange-500 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const isDeleteNotification = (n: { type: string; details?: { field: string; to: string }[] }) =>
    n.type === 'delete' || (n.details && n.details.every(d => d.to === 'Deleted'));
  
  return (
    <div className="px-4">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
            <Check size={14} className="mr-1" />
            Mark all read
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ScrollText size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No activity logs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your actions will be logged here</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const Icon = getIcon(notification.type);
            const iconColor = getIconColor(notification.type);
            const badge = getActionBadge(notification);
            const isDelete = isDeleteNotification(notification);
            const isNewEntry = notification.details && notification.details.length > 0 && notification.details[0].from === 'New';
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => !notification.read && markNotificationRead(notification.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  notification.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title row with action badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                      {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    
                    {/* Change Details - Redesigned */}
                    {notification.details && notification.details.length > 0 && (
                      isDelete ? (
                        /* Delete: show original values summary */
                        <div className="mt-3 rounded-lg border border-destructive/20 overflow-hidden">
                          <div className="bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive flex items-center gap-1.5">
                            <Trash2 size={12} />
                            Item was deleted
                          </div>
                          <div className="p-3 space-y-1.5 bg-muted/30">
                            {notification.details.map((change, i) => (
                              <div key={i} className="flex items-baseline gap-2 text-xs">
                                <span className="text-muted-foreground font-medium min-w-[4rem]">{change.field}</span>
                                <span className="text-destructive/70">{change.from}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : isNewEntry ? (
                        /* Added: show new values */
                        <div className="mt-3 rounded-lg border border-emerald-500/20 overflow-hidden">
                          <div className="bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <ArrowUpRight size={12} />
                            New entry created
                          </div>
                          <div className="p-3 space-y-1.5 bg-muted/30">
                            {notification.details!.map((change, i) => (
                              <div key={i} className="flex items-baseline gap-2 text-xs">
                                <span className="text-muted-foreground font-medium min-w-[5rem]">{change.field}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{change.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Edit: structured before/after layout */
                        <div className="mt-3 rounded-lg border border-border overflow-hidden">
                          <div className="divide-y divide-border">
                            {notification.details!.map((change, i) => (
                              <div key={i} className="px-3 py-2">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                  {change.field}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-[10px] text-muted-foreground/60 block mb-0.5">Before</span>
                                    <span className="text-xs text-destructive/80 line-through">{change.from}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground/60 block mb-0.5">After</span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{change.to}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

type SettingsSection = 'categories' | 'vendors' | 'labels' | 'reports' | 'logs' | 'partners' | 'features' | 'team' | 'approvals' | null;

interface SettingsPageProps {
  initialSection?: SettingsSection;
  onSectionChange?: (section: SettingsSection) => void;
  onBack?: () => void;
  onBackToHome?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOnline?: boolean;
  pendingCount?: number;
}

export const SettingsPage = ({ initialSection = null, onSectionChange, onBack, onBackToHome, onRefresh, isRefreshing, isOnline = true, pendingCount = 0 }: SettingsPageProps) => {
  const { categories, projects, userProfile, partners, projectLabels, defaultTimeFilter, setDefaultTimeFilter, syncStatus, lastSyncedAt } = useFinanceStore();
  const { signOut, user } = useAuth();
  const { isOwner, isAdmin, isEmployee, canViewPartners, canViewReports, canViewLogs, canManageTeam } = useUserRole();
  const { mode, setTheme, isDark, isOled } = useTheme();
  const navigate = useNavigate();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const isInstalled = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  
  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };
  
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };
  
  const handleBack = () => {
    // If we arrived via a direct section from Home, go back to Home
    if (initialSection && onBackToHome) {
      onBackToHome();
      return;
    }
    handleSectionChange(null);
  };

  // themeOptions moved below menuItems

  // Get unique vendors count from transactions
  const { transactions, vendors } = useFinanceStore();
  const vendorCount = vendors.length || new Set(transactions.map(t => t.vendor)).size;
  
  const { notifications } = useFinanceStore();
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // Build menu items based on role
  const dataItems: { icon: React.ElementType; label: string; sublabel: string; onClick: () => void }[] = [];
  
  if (canViewPartners) {
    dataItems.push({ 
      icon: Users, 
      label: "Financial Holdings", 
      sublabel: `${partners?.length || 0} member${(partners?.length || 0) !== 1 ? 's' : ''}`,
      onClick: () => handleSectionChange('partners')
    });
  }
  
  if (!isEmployee) {
    dataItems.push(
      { 
        icon: Grid3X3, 
        label: "Categories", 
        sublabel: `${categories.length} categories`,
        onClick: () => handleSectionChange('categories')
      },
      { 
        icon: Store, 
        label: "Vendors", 
        sublabel: `${vendorCount} vendors`,
        onClick: () => handleSectionChange('vendors')
      },
      { 
        icon: Tag, 
        label: "Labels", 
        sublabel: `${projectLabels.length} label${projectLabels.length !== 1 ? 's' : ''}`,
        onClick: () => handleSectionChange('labels')
      }
    );
  }
  
  if (canViewReports) {
    dataItems.push({ 
      icon: FileBarChart, 
      label: "Reports", 
      sublabel: "View & export",
      onClick: () => handleSectionChange('reports')
    });
  }
  
  if (canViewLogs) {
    dataItems.push({ 
      icon: ScrollText, 
      label: "Logs", 
      sublabel: "Activity history",
      onClick: () => handleSectionChange('logs')
    });
  }

  // Team management section (owner only)
  const teamItems: { icon: React.ElementType; label: string; sublabel: string; onClick: () => void }[] = [];
  
  if (canManageTeam) {
    teamItems.push({ 
      icon: Shield, 
      label: "Team", 
      sublabel: "Manage members",
      onClick: () => handleSectionChange('team')
    });
  }
  
  // Change approval (owners only)
  if (isOwner) {
    teamItems.push({ 
      icon: ClipboardCheck, 
      label: "Change Approval", 
      sublabel: "Pending requests",
      onClick: () => handleSectionChange('approvals')
    });
  }
  
  const menuItems = [
    ...(dataItems.length > 0 ? [{ section: "Data Management", items: dataItems }] : []),
    ...(teamItems.length > 0 ? [{ section: "Team & Approvals", items: teamItems }] : []),
  ];
  
  const themeOptions: { value: ThemeMode; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light theme' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
    { value: 'oled', label: 'OLED', icon: Smartphone, description: 'Pure black' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system' },
  ];
  
  // Render section sub-pages using dedicated components
  if (activeSection === 'team') {
    return <TeamSection onBack={handleBack} />;
  }
  if (activeSection === 'approvals') {
    return <ChangeApprovalPage onBack={handleBack} />;
  }
  if (activeSection === 'partners') {
    return <PartnersSection onBack={handleBack} userId={user?.id} />;
  }
  if (activeSection === 'categories') {
    return <CategoriesSection onBack={handleBack} userId={user?.id} isEmployee={isEmployee} />;
  }
  if (activeSection === 'vendors') {
    return <VendorsSection onBack={handleBack} userId={user?.id} isEmployee={isEmployee} />;
  }
  if (activeSection === 'labels') {
    return <LabelsSection onBack={handleBack} userId={user?.id} />;
  }
  if (activeSection === 'reports') {
    return <ReportsSection onBack={handleBack} />;
  }
  if (activeSection === 'features') {
    return <AppFeaturesGuide onBack={handleBack} />;
  }
  if (activeSection === 'logs') {
    return (
      <div className="min-h-screen pb-24">
        <div className="p-4 safe-top">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Activity Logs</h1>
          </div>
        </div>
        <NotificationsContent />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 md:pb-8 md:px-6 md:max-w-4xl">
      {/* Header */}
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowProfileEdit(true)}
          className="bg-card rounded-2xl p-3 shadow-card border border-border cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center">
              {userProfile.avatar ? (
                <img 
                  src={userProfile.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{userProfile.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-success mt-1">Cloud Sync Enabled</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </motion.div>
      </div>

      {/* Learn App Features */}
      <div className="px-4 mb-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => handleSectionChange('features')}
          className="w-full bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Learn App Features</p>
            <p className="text-sm text-muted-foreground">Discover what you can do</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </motion.button>
      </div>
      
      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <div key={section.section} className="px-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {section.section}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
          >
            {section.items.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                  index !== section.items.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
                  <item.icon size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        </div>
      ))}
      
      {/* Default Time Frame */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Default Time Frame
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <p className="text-xs text-muted-foreground mb-3">Applied across all tabs when you open the app</p>
          <div className="grid grid-cols-5 gap-2">
            {([
              { value: 'week' as const, label: 'Week' },
              { value: 'month' as const, label: 'Month' },
              { value: 'year' as const, label: 'Year' },
              { value: 'fy' as const, label: 'FY' },
              { value: 'all' as const, label: 'All' },
            ]).map((option) => {
              const isActive = defaultTimeFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setDefaultTimeFilter(option.value)}
                  className={cn(
                    "py-2 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent border-2 border-primary text-accent-foreground"
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sync */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Sync
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                !isOnline ? "bg-amber-500/10" : syncStatus === 'error' ? "bg-destructive/10" : "bg-success/10"
              )}>
                {!isOnline ? (
                  <WifiOff size={20} className="text-amber-500" />
                ) : syncStatus === 'syncing' || isRefreshing ? (
                  <Loader2 size={20} className="text-primary animate-spin" />
                ) : syncStatus === 'error' ? (
                  <CloudOff size={20} className="text-destructive" />
                ) : (
                  <Cloud size={20} className="text-success" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {!isOnline ? 'Offline' : syncStatus === 'syncing' || isRefreshing ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Synced'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingCount > 0 ? `${pendingCount} pending changes` : 
                   lastSyncedAt ? `Last synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}` : 
                   'Up to date'}
                </p>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing || !isOnline}
                className="gap-1.5"
              >
                <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
                Sync
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Theme Selector */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Appearance
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="grid grid-cols-4 gap-2">
            {themeOptions.map((option) => {
              const isActive = mode === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const oldMode = mode;
                    setTheme(option.value);
                    if (oldMode !== option.value) {
                      useFinanceStore.getState().addNotification({
                        type: 'settings',
                        title: 'Theme Changed',
                        message: `Appearance changed to ${option.label}`,
                        details: [{ field: 'Theme', from: oldMode.charAt(0).toUpperCase() + oldMode.slice(1), to: option.label }],
                      });
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                    isActive 
                      ? "bg-accent border-2 border-primary" 
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                  )}
                >
                  <option.icon 
                    size={20} 
                    className={isActive ? "text-accent-foreground" : "text-muted-foreground"} 
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-accent-foreground" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            {isOled ? 'OLED mode saves battery on AMOLED screens' : 
             mode === 'system' ? 'Following your system preference' :
             isDark ? 'Dark mode is easier on the eyes at night' : 
             'Light mode is best for bright environments'}
          </p>
        </motion.div>
      </div>
      
      {/* Install App */}
      <div className="px-4 mb-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate(appPath('/install'))}
          className="w-full bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
            <Download size={20} className="text-blue-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Install App</p>
            <p className="text-sm text-muted-foreground">
              {isInstalled ? '✓ Already installed' : 'Add to home screen'}
            </p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* Logout Button */}
      <div className="px-4 mb-6">
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Saffron Events Branding */}
      <div className="px-4 mb-4 flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">An App By</span>
        <img 
          src={saffronLogo} 
          alt="Saffron Events" 
          className="h-4 dark:brightness-0 dark:invert"
        />
        <span className="text-xs font-semibold text-muted-foreground">Saffron Events</span>
      </div>
      
      {/* App Info */}
      <div className="px-4 text-center">
        <p className="text-xs text-muted-foreground">
          FinTrack<sup className="text-[0.5em]">+</sup> v1.0.0
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {user?.email}
        </p>
      </div>
      
      {/* Profile Edit Sheet */}
      <ProfileEditSheet
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
      />
    </div>
  );
};
