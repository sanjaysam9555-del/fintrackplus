import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Copy, Check, Trash2, Link, Shield, UserCheck, User, AlertTriangle, HelpCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AppRole } from '@/hooks/useUserRole';

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  status: string;
  created_at: string;
  profile?: { name: string; email?: string | null; avatar_url?: string | null };
  linkedPartner?: { id: string; name: string } | null;
}

interface TeamSectionProps {
  onBack: () => void;
}

const roleColors: Record<AppRole, string> = {
  owner: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  admin: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  employee: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const avatarColors: Record<AppRole, string> = {
  owner: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  admin: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  employee: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const TeamSection = ({ onBack }: TeamSectionProps) => {
  const { user } = useAuth();
  const { isOwner, orgId } = useUserRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [existingPartnerId, setExistingPartnerId] = useState<string | null>(null);
  const [partners, setPartners] = useState<{ id: string; name: string; user_id: string }[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [otherOwners, setOtherOwners] = useState<{ user_id: string }[]>([]);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<{ id: string; name: string; role: AppRole } | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');

  const fetchMembers = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('manage-team', {
        body: { action: 'list_members' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMembers((data.members || []).map((m: any) => ({ ...m, role: m.role as AppRole })));
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('id, name, user_id');
    if (data) setPartners(data);
  };

  useEffect(() => {
    fetchMembers();
    fetchPartners();
    const fetchOwnerData = async () => {
      if (!user || !orgId) return;
      const { data } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('role', 'owner')
        .eq('status', 'active')
        .neq('user_id', user.id);
      if (data) setOtherOwners(data);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.name) setCurrentUserName(profile.name);
    };
    fetchOwnerData();
  }, [user, orgId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !role) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-team', {
        body: { action: 'create_member', email, name, role, existingPartnerId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTempPassword(data.tempPassword);
      toast.success(`${name} added as ${role}`);
      setEmail('');
      setName('');
      setRole('employee');
      setExistingPartnerId(null);
      fetchMembers();
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string, memberRole: AppRole) => {
    setDeleteConfirmMember({ id: memberId, name: memberName, role: memberRole });
  };

  const confirmRemoveMember = async () => {
    if (!deleteConfirmMember) return;
    const { id: memberId, name: memberName } = deleteConfirmMember;
    setDeleteConfirmMember(null);

    // If other owners exist, require approval instead of direct removal
    if (otherOwners.length > 0 && user && orgId) {
      try {
        const { error } = await supabase.from('change_approvals').insert({
          org_id: orgId,
          requester_user_id: user.id,
          target_user_id: otherOwners[0].user_id,
          entity_type: 'team_member',
          entity_id: memberId,
          action: 'delete',
          proposed_changes: { name: memberName },
          status: 'pending',
        });
        if (error) throw error;

        await supabase.from('notifications').insert({
          user_id: user.id,
          org_id: orgId,
          type: 'settings',
          title: 'Removal Requested',
          message: `${currentUserName} requested removal of team member "${memberName}"`,
        });

        toast('Sent for Approval', {
          description: 'This member is an owner. Your removal request will apply once they approve.',
          icon: <Clock size={18} className="text-amber-500" />,
          duration: 4000,
          className: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/30',
        });
      } catch (err: any) {
        toast.error(err.message || 'Failed to create approval request');
      }
      return;
    }

    // No other owners — remove directly
    try {
      const { data, error } = await supabase.functions.invoke('manage-team', {
        body: { action: 'remove_member', memberId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${memberName} removed`);
      fetchMembers();
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleLinkPartner = async (memberId: string) => {
    if (!selectedPartnerId) return;
    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-team', {
        body: { action: 'link_partner', memberId, partnerId: selectedPartnerId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Partner linked successfully');
      setEditingMemberId(null);
      setSelectedPartnerId('');
      fetchMembers();
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to link partner');
    } finally {
      setIsLinking(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maxMembers = 3;
  const canAddMore = members.length < maxMembers;

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Team</h1>

          <Dialog>
            <DialogTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle size={18} />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">Role Permissions Guide</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <div className="grid grid-cols-[1fr_60px_60px_60px] gap-1 mb-2 px-2">
                  <span className="text-xs text-muted-foreground font-medium">Permission</span>
                  <span className="text-[10px] font-semibold text-center px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">Owner</span>
                  <span className="text-[10px] font-semibold text-center px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">Admin</span>
                  <span className="text-[10px] font-semibold text-center px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Employee</span>
                </div>
                {[
                  { label: 'View Dashboard & Summaries', owner: true, admin: true, employee: false },
                  { label: 'Add Income / Expense', owner: true, admin: true, employee: true, note: 'own only' },
                  { label: 'Edit / Delete Transactions', owner: true, admin: true, employee: false },
                  { label: 'Manage Categories & Vendors', owner: true, admin: true, employee: false },
                  { label: 'Manage Projects', owner: true, admin: true, employee: false },
                  { label: 'View Reports', owner: true, admin: true, employee: false },
                  { label: 'View Partner Balances', owner: true, admin: false, employee: false },
                  { label: 'Manage Team Members', owner: true, admin: false, employee: false },
                  { label: 'View Activity Logs', owner: true, admin: false, employee: false },
                  { label: 'Backup & Restore', owner: true, admin: false, employee: false },
                  { label: 'Cashflow & AI Insights', owner: true, admin: true, employee: false },
                  { label: 'View Only Own Transactions', owner: false, admin: false, employee: true },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "grid grid-cols-[1fr_60px_60px_60px] gap-1 px-2 py-2 rounded-lg items-center",
                      i % 2 === 0 ? 'bg-muted/40' : ''
                    )}
                  >
                    <span className="text-xs">
                      {row.label}
                      {row.note && <span className="text-[10px] text-muted-foreground ml-1">({row.note})</span>}
                    </span>
                    {[row.owner, row.admin, row.employee].map((allowed, j) => (
                      <span key={j} className="flex justify-center">
                        {allowed ? (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        ) : (
                          <XCircle size={15} className="text-muted-foreground/40" />
                        )}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <span className="ml-auto text-sm text-muted-foreground">
            {members.length}/{maxMembers} seats
          </span>
        </div>
      </div>

      {/* Temp Password Modal */}
      {tempPassword && (
        <div className="px-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-4"
          >
            <p className="text-sm font-medium mb-2">Temporary Password</p>
            <p className="text-xs text-muted-foreground mb-3">
              Share this with the new member. They'll be asked to change it on first login.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono select-all">
                {tempPassword}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopyPassword} className="shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setTempPassword(null)}>
              Dismiss
            </Button>
          </motion.div>
        </div>
      )}

      {/* Members List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          members.map((member) => {
            const isCurrentUser = member.user_id === user?.id;
            const isEditing = editingMemberId === member.id;
            const memberName = member.profile?.name || 'Unknown';
            const initials = getInitials(memberName);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {member.profile?.avatar_url ? (
                      <AvatarImage src={member.profile.avatar_url} alt={memberName} />
                    ) : null}
                    <AvatarFallback className={cn("text-xs font-semibold", avatarColors[member.role])}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {memberName}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-1">(You)</span>
                        )}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0 capitalize shrink-0", roleColors[member.role])}
                      >
                        {member.role}
                      </Badge>
                    </div>
                    {member.profile?.email && (
                      <p className="text-xs text-muted-foreground truncate">{member.profile.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && member.role === 'owner' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => {
                          if (isEditing) {
                            setEditingMemberId(null);
                            setSelectedPartnerId('');
                          } else {
                            setEditingMemberId(member.id);
                            setSelectedPartnerId(member.linkedPartner?.id || '');
                          }
                        }}
                      >
                        <Link size={14} />
                      </Button>
                    )}
                    {!isCurrentUser && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.id, memberName, member.role)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline partner selector */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-border space-y-2"
                  >
                    <p className="text-xs text-muted-foreground">Link to partner</p>
                    <div className="flex gap-2">
                      <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedPartnerId || isLinking}
                        onClick={() => handleLinkPartner(member.id)}
                      >
                        {isLinking ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Member */}
      <div className="px-4 mt-6">
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={!canAddMore}
            className="w-full"
            variant="outline"
          >
            <Plus size={16} className="mr-2" />
            {canAddMore ? 'Add Member' : 'Max members reached'}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 border border-border space-y-4"
          >
            <h3 className="font-medium">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              {role === 'owner' && (
                <Select
                  value={existingPartnerId || '__new__'}
                  onValueChange={(v) => setExistingPartnerId(v === '__new__' ? null : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Link to existing partner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">Create new partner</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowAddForm(false); setEmail(''); setName(''); setRole('employee'); setExistingPartnerId(null); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !email || !name} className="flex-1">
                  {isSubmitting ? 'Adding…' : 'Save'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Critical Delete Warning Dialog */}
      <AlertDialog open={!!deleteConfirmMember} onOpenChange={(open) => !open && setDeleteConfirmMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Remove {deleteConfirmMember?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {deleteConfirmMember?.role === 'owner' ? (
                <>This will <strong>permanently remove</strong> this member across the entire app — their <strong>profile, partner record, team membership, transaction assignments, and login</strong> will all be deleted. This action cannot be undone.</>
              ) : (
                <>This will <strong>permanently remove</strong> this member — their <strong>profile, team membership, and login</strong> will all be deleted. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {otherOwners.length > 0 ? 'Request Removal' : 'Remove Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
