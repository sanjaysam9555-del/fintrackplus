import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useFinanceStore } from '@/lib/store';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChangeApproval {
  id: string;
  requester_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  proposed_changes: Record<string, unknown>;
  status: string;
  created_at: string;
  resolved_at: string | null;
  requester_name?: string;
  resolver_name?: string;
}

interface ChangeApprovalPageProps {
  onBack: () => void;
}

export const ChangeApprovalPage = ({ onBack }: ChangeApprovalPageProps) => {
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const { addNotification } = useFinanceStore();
  const [approvals, setApprovals] = useState<ChangeApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<'approved' | 'rejected' | null>(null);

  const fetchCurrentUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.name) setCurrentUserName(data.name);
  };

  const fetchApprovals = async () => {
    if (!user) return;
    try {
      // Fetch ALL org approvals (RLS scopes to org), no status filter
      const { data, error } = await supabase
        .from('change_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with requester names and resolver names
      const userIds = new Set<string>();
      for (const a of data || []) {
        userIds.add(a.requester_user_id);
        if (a.target_user_id) userIds.add(a.target_user_id);
      }

      const profileMap: Record<string, string> = {};
      for (const uid of userIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', uid)
          .maybeSingle();
        profileMap[uid] = profile?.name || 'Unknown';
      }

      const enriched: ChangeApproval[] = (data || []).map((approval) => ({
        ...approval,
        proposed_changes: (approval.proposed_changes || {}) as Record<string, unknown>,
        requester_name: profileMap[approval.requester_user_id] || 'Unknown',
        resolver_name: approval.status !== 'pending' && approval.target_user_id
          ? profileMap[approval.target_user_id] || 'Unknown'
          : undefined,
      }));

      setApprovals(enriched);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchCurrentUserName();
  }, [user]);

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      const approval = approvals.find(a => a.id === approvalId);
      if (!approval) return;

      // Show resolving animation
      setResolvingId(approvalId);
      setResolvedStatus(status);

      // Update approval status
      const { error } = await supabase
        .from('change_approvals')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', approvalId);

      if (error) throw error;

      // If approved, apply the change
      if (status === 'approved') {
        if (approval.action === 'delete' && approval.entity_type === 'transaction') {
          await supabase.from('transactions').delete().eq('id', approval.entity_id);
        } else if (approval.action === 'edit' && approval.entity_type === 'transaction') {
          const keyMap: Record<string, string> = {
            categoryId: 'category_id',
            projectId: 'project_id',
            handledBy: 'handled_by',
            paymentMethod: 'payment_method',
            receiptUrl: 'receipt_url',
            isGst: 'is_gst',
          };
          const displayOnlyKeys = new Set(['name']);
          const dbChanges: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(approval.proposed_changes)) {
            if (displayOnlyKeys.has(key)) continue;
            const dbKey = keyMap[key] || key;
            dbChanges[dbKey] = value;
          }
          await supabase.from('transactions').update(dbChanges).eq('id', approval.entity_id);
        } else if (approval.action === 'delete' && approval.entity_type === 'partner') {
          const { data: partnerData } = await supabase.from('partners').select('user_id').eq('id', approval.entity_id).maybeSingle();
          if (partnerData?.user_id) {
            await supabase
              .from('transactions')
              .update({ handled_by: null } as any)
              .eq('handled_by', partnerData.user_id);
          }
          await supabase.from('partners').delete().eq('id', approval.entity_id);
        } else if (approval.action === 'delete' && approval.entity_type === 'team_member') {
          await supabase.functions.invoke('manage-team', {
            body: { action: 'remove_member', memberId: approval.entity_id },
          });
        }
      }

      const entityLabel = approval.entity_type === 'team_member' ? 'team member' : approval.entity_type;
      const actionLabel = status === 'approved' ? 'approved' : 'rejected';
      const entityName = (approval.proposed_changes?.name as string) || entityLabel;

      addNotification({
        type: 'settings',
        title: `Deletion ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `${currentUserName} ${actionLabel} deletion of ${entityName} (requested by ${approval.requester_name})`,
      });

      toast.success(status === 'approved' ? 'Change approved' : 'Change rejected');

      // Wait for exit animation, then refetch
      setTimeout(() => {
        setResolvingId(null);
        setResolvedStatus(null);
        fetchApprovals();
      }, 600);
    } catch (err: any) {
      setResolvingId(null);
      setResolvedStatus(null);
      toast.error(err.message || 'Failed to process approval');
    }
  };

  const getActionLabel = (action: string, entityType: string) => {
    const label = entityType === 'team_member' ? 'team member' : entityType;
    if (action === 'delete') return `Delete ${label}`;
    if (action === 'edit') return `Edit ${label}`;
    return `${action} ${label}`;
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const historyApprovals = approvals.filter(a => a.status !== 'pending');

  const renderApprovalCard = (approval: ChangeApproval, showActions: boolean) => {
    const isSelfRequest = approval.requester_user_id === user?.id;
    const canAct = showActions && !isSelfRequest;

    return (
      <motion.div
        key={approval.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm capitalize">
                {getActionLabel(approval.action, approval.entity_type)}
              </p>
              {approval.status !== 'pending' && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 capitalize",
                    approval.status === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20'
                  )}
                >
                  {approval.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Requested by {approval.requester_name} · {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
            </p>
            {approval.resolver_name && approval.status !== 'pending' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {approval.status === 'approved' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Approved</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Rejected</span>
                )}{' '}
                by {approval.resolver_name}
              </p>
            )}
          </div>
        </div>

        {/* Show proposed changes / entity name */}
        {approval.proposed_changes && Object.keys(approval.proposed_changes).length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
            {Object.entries(approval.proposed_changes).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions: only for pending items not requested by current user */}
        {canAct && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => handleApproval(approval.id, 'rejected')}
            >
              <X size={14} className="mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleApproval(approval.id, 'approved')}
            >
              <Check size={14} className="mr-1" /> Approve
            </Button>
          </div>
        )}

        {showActions && isSelfRequest && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Awaiting approval from another owner
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Change Approval</h1>
        </div>
      </div>

      <div className="px-4">
        <Tabs defaultValue="pending">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1">
              Pending {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={40} className="mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              pendingApprovals.map((a) => renderApprovalCard(a, true))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : historyApprovals.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={40} className="mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No history yet</p>
              </div>
            ) : (
              historyApprovals.map((a) => renderApprovalCard(a, false))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
