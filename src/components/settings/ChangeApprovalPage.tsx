import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ChangeApproval {
  id: string;
  requester_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  proposed_changes: Record<string, unknown>;
  status: string;
  created_at: string;
  requester_name?: string;
}

interface ChangeApprovalPageProps {
  onBack: () => void;
}

export const ChangeApprovalPage = ({ onBack }: ChangeApprovalPageProps) => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ChangeApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('change_approvals')
        .select('*')
        .eq('target_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with requester names
      const enriched: ChangeApproval[] = [];
      for (const approval of data || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', approval.requester_user_id)
          .maybeSingle();

        enriched.push({
          ...approval,
          proposed_changes: (approval.proposed_changes || {}) as Record<string, unknown>,
          requester_name: profile?.name || 'Unknown',
        });
      }

      setApprovals(enriched);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [user]);

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      const approval = approvals.find(a => a.id === approvalId);
      if (!approval) return;

      // Update approval status
      const { error } = await supabase
        .from('change_approvals')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', approvalId);

      if (error) throw error;

      // If approved, apply the change
      if (status === 'approved') {
        if (approval.action === 'edit' && approval.entity_type === 'transaction') {
          await supabase
            .from('transactions')
            .update(approval.proposed_changes)
            .eq('id', approval.entity_id);
        } else if (approval.action === 'delete' && approval.entity_type === 'transaction') {
          await supabase
            .from('transactions')
            .delete()
            .eq('id', approval.entity_id);
        } else if (approval.action === 'delete' && approval.entity_type === 'partner') {
          await supabase
            .from('partners')
            .delete()
            .eq('id', approval.entity_id);
        }
      }

      toast.success(status === 'approved' ? 'Change approved' : 'Change rejected');
      fetchApprovals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process approval');
    }
  };

  const getActionLabel = (action: string, entityType: string) => {
    if (action === 'delete') return `Delete ${entityType}`;
    if (action === 'edit') return `Edit ${entityType}`;
    return `${action} ${entityType}`;
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

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className="h-4 w-32 bg-muted rounded skeleton mb-2" />
                <div className="h-3 w-48 bg-muted rounded skeleton" />
              </div>
            ))}
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm capitalize">
                    {getActionLabel(approval.action, approval.entity_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested by {approval.requester_name} · {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Show proposed changes for edits */}
              {approval.action === 'edit' && approval.proposed_changes && (
                <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
                  {Object.entries(approval.proposed_changes).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}

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
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
