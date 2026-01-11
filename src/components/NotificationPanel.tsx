import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ArrowUpRight, ArrowDownLeft, User, FileText, Check } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinanceStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return ArrowUpRight;
      case 'export':
        return FileText;
      case 'profile':
        return User;
      default:
        return Bell;
    }
  };
  
  const getIconColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-primary/10 text-primary';
      case 'export':
        return 'bg-success/10 text-success';
      case 'profile':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
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
                <Bell size={20} className="text-primary" />
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
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
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
