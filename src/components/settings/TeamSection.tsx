import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Copy, Check, Trash2, Link, Shield, UserCheck, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  profile?: { name: string; email?: string };
  linkedPartner?: { id: string; name: string } | null;
}

interface TeamSectionProps {
  onBack: () => void;
}

const roleIcons: Record<AppRole, React.ElementType> = {
  owner: Shield,
  admin: UserCheck,
  employee: User,
};

const roleColors: Record<AppRole, string> = {
  owner: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  admin: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  employee: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
};

export const TeamSection = ({ onBack }: TeamSectionProps) => {
  const { user } = useAuth();
  const { isOwner } = useUserRole();
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

  const fetchMembers = async () => {
    if (!user) return;
    try {
      const { data: orgMembers, error } = await supabase
        .from('org_members')
        .select('id, user_id, role, status, created_at');

      if (error) throw error;

      // Fetch partners for the org
      const { data: orgPartners } = await supabase.from('partners').select('id, name, user_id');

      const membersWithProfiles: TeamMember[] = [];
      for (const m of orgMembers || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', m.user_id)
          .maybeSingle();

        const linkedPartner = (orgPartners || []).find(p => p.user_id === m.user_id);

        membersWithProfiles.push({
          ...m,
          role: m.role as AppRole,
          profile: profile ? { name: profile.name } : undefined,
          linkedPartner: linkedPartner ? { id: linkedPartner.id, name: linkedPartner.name } : null,
        });
      }

      setMembers(membersWithProfiles);
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
  }, [user]);

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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
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
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPassword}
                className="shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setTempPassword(null)}
            >
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
                  <div className="w-10 h-10 rounded-full bg-muted skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded skeleton" />
                    <div className="h-3 w-32 bg-muted rounded skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          members.map((member) => {
            const RoleIcon = roleIcons[member.role];
            const isCurrentUser = member.user_id === user?.id;
            const isEditing = editingMemberId === member.id;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    roleColors[member.role]
                  )}>
                    <RoleIcon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.profile?.name || 'Unknown'}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    {member.role === 'owner' && member.linkedPartner && (
                      <p className="text-xs text-primary mt-0.5">
                        Partner: {member.linkedPartner.name}
                      </p>
                    )}
                    {member.role === 'owner' && !member.linkedPartner && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        No partner linked
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
                        onClick={() => handleRemoveMember(member.id, member.profile?.name || 'Member')}
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
                      <Select
                        value={selectedPartnerId}
                        onValueChange={setSelectedPartnerId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
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
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Link to existing partner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">Create new partner</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setEmail('');
                    setName('');
                    setRole('employee');
                    setExistingPartnerId(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !email || !name}
                  className="flex-1"
                >
                  {isSubmitting ? 'Adding…' : 'Save'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
