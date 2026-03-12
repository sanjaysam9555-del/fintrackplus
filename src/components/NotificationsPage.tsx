import { motion } from "framer-motion";
import { Bell, ArrowDownLeft, ArrowUpRight, FileDown, User, Check, Trash2, Pencil, Grid3X3, Store, FolderKanban, Users, Tag } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export const NotificationsPage = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinanceStore();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return ArrowUpRight;
      case 'export':
        return FileDown;
      case 'profile':
        return User;
      case 'category':
        return Grid3X3;
      case 'vendor':
        return Store;
      case 'project':
        return FolderKanban;
      case 'partner':
        return Users;
      case 'label':
        return Tag;
      case 'delete':
        return Trash2;
      case 'edit':
        return Pencil;
      default:
        return Bell;
    }
  };
  
  const getIconColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-accent text-accent-foreground';
      case 'export':
        return 'bg-success/10 text-success';
      case 'profile':
        return 'bg-purple-500/10 text-purple-500 dark:text-purple-400';
      case 'category':
        return 'bg-blue-500/10 text-blue-500 dark:text-blue-400';
      case 'vendor':
        return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400';
      case 'project':
        return 'bg-amber-500/10 text-amber-500 dark:text-amber-400';
      case 'partner':
        return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400';
      case 'label':
        return 'bg-violet-500/10 text-violet-500 dark:text-violet-400';
      case 'delete':
        return 'bg-destructive/10 text-destructive';
      case 'edit':
        return 'bg-orange-500/10 text-orange-500 dark:text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 safe-top flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
            <Check size={14} className="mr-1" />
            Mark all read
          </Button>
        )}
      </div>
      
      <div className="px-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your activity will appear here
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const Icon = getIcon(notification.type);
            const iconColor = getIconColor(notification.type);
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => !notification.read && markNotificationRead(notification.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  notification.read 
                    ? 'bg-card border-border' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
