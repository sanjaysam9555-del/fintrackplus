import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ArrowUpRight, ArrowDownLeft, User, FileText, Check, Trash2, Pencil, Grid3X3, Store, FolderKanban, Users, Tag, Settings } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getActionBadge = (notification: { type: string; details?: { from: string }[] }) => {
  const isNew = notification.details && notification.details.length > 0 && notification.details[0].from === 'New';
  if (isNew) return { label: 'Added', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
  switch (notification.type) {
    case 'transaction': return { label: 'Added', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
    case 'edit': return { label: 'Edited', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
    case 'delete': return { label: 'Deleted', className: 'bg-destructive/15 text-destructive' };
    case 'export': return { label: 'Exported', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' };
    case 'profile': return { label: 'Updated', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' };
    case 'settings': return { label: 'Changed', className: 'bg-muted text-muted-foreground' };
    default: return { label: 'Action', className: 'bg-muted text-muted-foreground' };
  }
};

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinanceStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction': return ArrowUpRight;
      case 'export': return FileText;
      case 'profile': return User;
      case 'category': return Grid3X3;
      case 'vendor': return Store;
      case 'project': return FolderKanban;
      case 'partner': return Users;
      case 'label': return Tag;
      case 'delete': return Trash2;
      case 'edit': return Pencil;
      case 'settings': return Settings;
      default: return Bell;
    }
  };
  
  const getIconColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-accent text-accent-foreground';
      case 'export': return 'bg-success/10 text-success';
      case 'profile': return 'bg-purple-500/10 text-purple-500 dark:text-purple-400';
      case 'category': return 'bg-blue-500/10 text-blue-500 dark:text-blue-400';
      case 'vendor': return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400';
      case 'project': return 'bg-amber-500/10 text-amber-500 dark:text-amber-400';
      case 'partner': return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400';
      case 'label': return 'bg-violet-500/10 text-violet-500 dark:text-violet-400';
      case 'delete': return 'bg-destructive/10 text-destructive';
      case 'edit': return 'bg-orange-500/10 text-orange-500 dark:text-orange-400';
      case 'settings': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isDeleteNotification = (n: { type: string; details?: { field: string; to: string }[] }) =>
    n.type === 'delete' || (n.details && n.details.every(d => d.to === 'Deleted'));
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 bg-card shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-accent-foreground" />
                <h2 className="text-lg font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllNotificationsRead}
                  className="text-xs text-primary"
                >
                  <Check size={12} className="mr-1" />
                  Mark all as read
                </Button>
              </div>
            )}
            
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No notifications yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Your activity will appear here
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = getIcon(notification.type);
                    const badge = getActionBadge(notification);
                    const isDelete = isDeleteNotification(notification);
                    const isNewEntry = notification.details && notification.details.length > 0 && notification.details[0].from === 'New';

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => markNotificationRead(notification.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-colors",
                          notification.read
                            ? "bg-card border-border"
                            : "bg-primary/5 border-primary/20"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", getIconColor(notification.type))}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                            
                            {/* Compact detail rendering */}
                            {notification.details && notification.details.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {(isDelete ? notification.details.slice(0, 3) : isNewEntry ? notification.details.slice(0, 3) : notification.details.slice(0, 3)).map((change, i) => (
                                  <div key={i} className="text-[11px] flex items-baseline gap-1.5">
                                    <span className="text-muted-foreground font-medium">{change.field}:</span>
                                    {isDelete ? (
                                      <span className="text-destructive/70 line-through">{change.from}</span>
                                    ) : isNewEntry ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">{change.to}</span>
                                    ) : (
                                      <span>
                                        <span className="text-destructive/70 line-through">{change.from}</span>
                                        <span className="text-muted-foreground mx-1">→</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{change.to}</span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {notification.details.length > 3 && (
                                  <p className="text-[10px] text-muted-foreground">+{notification.details.length - 3} more</p>
                                )}
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {format(new Date(notification.timestamp), 'MMM dd, h:mm a')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
