import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, ArrowDownLeft, ArrowUpRight, FileDown, User, Check, Trash2, Pencil, Grid3X3, Store, FolderKanban, Users, Tag, Settings, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/lib/types";

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
    case 'settings': return { label: 'Changed', className: 'bg-muted text-muted-foreground' };
    default: return { label: 'Action', className: 'bg-muted text-muted-foreground' };
  }
};

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'transaction', label: 'Entries' },
  { key: 'category', label: 'Categories' },
  { key: 'vendor', label: 'Vendors' },
  { key: 'project', label: 'Projects' },
  { key: 'partner', label: 'Partners' },
  { key: 'label', label: 'Labels' },
  { key: 'export', label: 'Exports' },
  { key: 'settings', label: 'Settings' },
] as const;

const getIcon = (type: string) => {
  switch (type) {
    case 'transaction': return ArrowUpRight;
    case 'export': return FileDown;
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

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean | null;
  details: any;
  entity_type: string | null;
  entity_id: string | null;
  actor_name: string | null;
  user_id: string;
  org_id: string | null;
}

const mapDbToNotification = (row: DbNotification): Notification => ({
  id: row.id,
  type: row.type as Notification['type'],
  title: row.title,
  message: row.message,
  timestamp: row.created_at,
  read: row.read ?? false,
  details: Array.isArray(row.details) ? row.details : [],
  entityType: row.entity_type || undefined,
  entityId: row.entity_id || undefined,
  actorName: row.actor_name || undefined,
});

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (!error && data) {
      setNotifications((data as unknown as DbNotification[]).map(mapDbToNotification));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = mapDbToNotification(payload.new as DbNotification);
        setNotifications(prev => [newNotif, ...prev].slice(0, 200));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        const updated = mapDbToNotification(payload.new as DbNotification);
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true } as any).eq('id', id);
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true } as any).in('id', unreadIds);
  };
  
  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => {
        if (activeFilter === 'transaction') {
          return n.type === 'transaction' || ((n.type === 'edit' || n.type === 'delete') && n.entityType === 'transaction');
        }
        if (activeFilter === 'settings') {
          return n.type === 'profile' || n.type === 'settings';
        }
        return n.type === activeFilter || n.entityType === activeFilter;
      });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const isDeleteNotification = (n: { type: string; details?: { field: string; to: string }[] }) =>
    n.type === 'delete' || (n.details && n.details.every(d => d.to === 'Deleted'));
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 safe-top flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
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
      
      {/* Filter Tabs */}
      <div className="px-4 mb-3">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {filterTabs.map((tab) => {
              const count = tab.key === 'all' 
                ? notifications.length 
                : notifications.filter(n => {
                    if (tab.key === 'transaction') return n.type === 'transaction' || ((n.type === 'edit' || n.type === 'delete') && n.entityType === 'transaction');
                    if (tab.key === 'settings') return n.type === 'profile' || n.type === 'settings';
                    return n.type === tab.key || n.entityType === tab.key;
                  }).length;
              if (tab.key !== 'all' && count === 0) return null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    activeFilter === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tab.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Team activity will appear here
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    
                    {/* Actor attribution - prominent */}
                    {notification.actorName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by <span className="font-semibold text-foreground/80">{notification.actorName}</span>
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    
                    {/* Change Details */}
                    {notification.details && notification.details.length > 0 && (
                      isDelete ? (
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
                        <div className="mt-3 rounded-lg border border-emerald-500/20 overflow-hidden">
                          <div className="bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <ArrowUpRight size={12} />
                            New entry created
                          </div>
                          <div className="p-3 space-y-1.5 bg-muted/30">
                            {notification.details.map((change, i) => (
                              <div key={i} className="flex items-baseline gap-2 text-xs">
                                <span className="text-muted-foreground font-medium min-w-[5rem]">{change.field}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{change.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-border overflow-hidden">
                          <div className="divide-y divide-border">
                            {notification.details.map((change, i) => (
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
