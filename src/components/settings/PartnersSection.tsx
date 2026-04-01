import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Users, Edit2, Trash2, Banknote, CreditCard, CalendarIcon, ChevronRight, Info, Camera, ArrowLeftRight, AlertTriangle, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/lib/store";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
"@/components/ui/dialog";
import { PartnerDetailSheet } from "./PartnerDetailSheet";
import { PartnerTransferSheet } from "@/components/PartnerTransferSheet";
import { UnassignedTransactionsSheet } from "./UnassignedTransactionsSheet";
import { Partner } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface PartnersSectionProps {
  onBack: () => void;
  userId?: string;
}

const PARTNER_COLORS = [
'#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
'#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];


import { TimeFrameSelector, computeDateRange, getTimeFilterLabel } from "@/components/TimeFrameSelector";
import type { TimeFilter } from "@/components/TimeFrameSelector";

// ── Extracted stable components ──────────────────────────────────────

interface AvatarUploadButtonProps {
  avatarUrl: string | undefined;
  isUploading: boolean;
  onTriggerUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUploadButton = ({ avatarUrl, isUploading, onTriggerUpload, fileInputRef, onFileChange }: AvatarUploadButtonProps) =>
<div className="flex items-center gap-3">
    <button
    type="button"
    onClick={onTriggerUpload}
    className="relative w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors overflow-hidden"
    disabled={isUploading}>
    
      {avatarUrl ?
    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" /> :

    <Camera size={20} className="text-muted-foreground" />
    }
      {isUploading &&
    <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-full">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    }
    </button>
    <div className="text-xs text-muted-foreground">
      {avatarUrl ? 'Tap to change' : 'Add photo'}
    </div>
    <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={onFileChange} />
  
  </div>;


interface PartnerFormProps {
  isEdit?: boolean;
  name: string;
  setName: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  initialCash: string;
  setInitialCash: (v: string) => void;
  initialOnline: string;
  setInitialOnline: (v: string) => void;
  avatarUrl: string | undefined;
  isUploading: boolean;
  onTriggerUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

const PartnerForm = ({
  isEdit = false,
  name, setName,
  color, setColor,
  initialCash, setInitialCash,
  initialOnline, setInitialOnline,
  avatarUrl, isUploading,
  onTriggerUpload, fileInputRef, onFileChange,
  onSubmit
}: PartnerFormProps) =>
<div className="space-y-4">
    <AvatarUploadButton
    avatarUrl={avatarUrl}
    isUploading={isUploading}
    onTriggerUpload={onTriggerUpload}
    fileInputRef={fileInputRef}
    onFileChange={onFileChange} />
  

    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
      <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="e.g., Partner 1"
      className="mt-1"
      autoCapitalize="words" />
    
    </div>
    
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Color</Label>
      <div className="grid grid-cols-5 gap-2 mt-2">
        {PARTNER_COLORS.map((c) =>
      <button
        key={c}
        onClick={() => setColor(c)}
        className={cn(
          "w-10 h-10 rounded-full transition-all",
          color === c && "ring-2 ring-offset-2 ring-primary"
        )}
        style={{ backgroundColor: c }} />

      )}
      </div>
    </div>
    
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Starting Cash Balance
      </Label>
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
        Amount before any recorded transactions
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{CURRENCY_SYMBOL}</span>
        <Input
        type="number"
        value={initialCash}
        onChange={(e) => setInitialCash(e.target.value)}
        placeholder="0" />
      
      </div>
    </div>
    
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Starting Online Balance
      </Label>
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
        Amount before any recorded transactions
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{CURRENCY_SYMBOL}</span>
        <Input
        type="number"
        value={initialOnline}
        onChange={(e) => setInitialOnline(e.target.value)}
        placeholder="0" />
      
      </div>
    </div>
    
    <Button
    onClick={onSubmit}
    disabled={!name.trim()}
    className="w-full">
    
      {isEdit ? 'Update Partner' : 'Add Partner'}
    </Button>
  </div>;


// ── Total Holdings Card (static, all-time) ──────────────────────────

interface TotalHoldingsCardProps {
  partners: Partner[];
  getPartnerBalancesForPeriod: (start: string, end: string) => any[];
}

const TotalHoldingsCard = ({ partners, getPartnerBalancesForPeriod }: TotalHoldingsCardProps) => {
  const allTimeBalances = useMemo(() => {
    return getPartnerBalancesForPeriod('2000-01-01', '2099-12-31');
  }, [getPartnerBalancesForPeriod, partners]);

  const totalCash = allTimeBalances.reduce((sum: number, pb: any) => sum + pb.closingCashBalance, 0);
  const totalOnline = allTimeBalances.reduce((sum: number, pb: any) => sum + pb.closingOnlineBalance, 0);
  const totalHoldings = totalCash + totalOnline;

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Banknote size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Total Holdings</h3>
            <p className="text-xs text-muted-foreground">All-time • All team member</p>
          </div>
          <div className="ml-auto text-right">
            <p className={cn(
              "text-lg font-bold",
              totalHoldings >= 0 ? "text-success" : "text-destructive"
            )}>
              {totalHoldings < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(totalHoldings).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Banknote size={12} />
              <span className="text-[10px] uppercase tracking-wide">Cash</span>
            </div>
            <p className={cn(
              "text-base font-bold",
              totalCash >= 0 ? "text-foreground" : "text-destructive"
            )}>
              {totalCash < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(totalCash).toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CreditCard size={12} />
              <span className="text-[10px] uppercase tracking-wide">Online</span>
            </div>
            <p className={cn(
              "text-base font-bold",
              totalOnline >= 0 ? "text-foreground" : "text-destructive"
            )}>
              {totalOnline < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(totalOnline).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>);

};

// ── Main component ───────────────────────────────────────────────────

export const PartnersSection = ({ onBack, userId }: PartnersSectionProps) => {
  const { partners, transactions, addPartner, updatePartner, deletePartner, getPartnerBalancesForPeriod, defaultTimeFilter, addNotification } = useFinanceStore();
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const [otherOwners, setOtherOwners] = useState<{user_id: string;}[]>([]);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const fetchOwners = async () => {
      if (!user || !orgId) return;
      const { data } = await supabase.
      from('org_members').
      select('user_id').
      eq('org_id', orgId).
      eq('role', 'owner').
      eq('status', 'active').
      neq('user_id', user.id);
      if (data) setOtherOwners(data);

      const { data: profile } = await supabase.
      from('profiles').
      select('name').
      eq('user_id', user.id).
      maybeSingle();
      if (profile?.name) setCurrentUserName(profile.name);
    };
    fetchOwners();
  }, [user, orgId]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(defaultTimeFilter);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setTimeFilter(defaultTimeFilter);
  }, [defaultTimeFilter]);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [showUnassignedSheet, setShowUnassignedSheet] = useState(false);
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState<Partner | null>(null);
  const [isOwnerLinkedDelete, setIsOwnerLinkedDelete] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(PARTNER_COLORS[0]);
  const [initialCash, setInitialCash] = useState("");
  const [initialOnline, setInitialOnline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dateRange = useMemo(() => {
    return computeDateRange(timeFilter, customStartDate, customEndDate);
  }, [timeFilter, customStartDate, customEndDate]);

  const partnerBalances = useMemo(() => {
    return getPartnerBalancesForPeriod(dateRange.start, dateRange.end);
  }, [getPartnerBalancesForPeriod, dateRange, partners, transactions]);

  // Compute unassigned/orphaned transactions
  const unassignedStats = useMemo(() => {
    const partnerUserIds = new Set(partners.map((p) => p.userId).filter(Boolean));
    const unassigned = transactions.
    filter((t) => t.date >= dateRange.start && t.date <= dateRange.end).
    filter((t) => !t.handledBy || !partnerUserIds.has(t.handledBy));

    let cashNet = 0;
    let onlineNet = 0;
    unassigned.forEach((t) => {
      const sign = t.type === 'income' ? 1 : -1;
      if (t.paymentMethod === 'cash') cashNet += sign * t.amount;else
      onlineNet += sign * t.amount;
    });

    return { count: unassigned.length, cashNet, onlineNet };
  }, [transactions, partners, dateRange]);

  const resetForm = () => {
    setName("");
    setColor(PARTNER_COLORS[0]);
    setInitialCash("");
    setInitialOnline("");
    setAvatarUrl(undefined);
    setEditingPartner(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    e.target.value = '';
    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const attemptUpload = async (attempt: number): Promise<void> => {
      const { error: uploadError } = await supabase.storage.
      from('partner-avatars').
      upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

      if (uploadError) {
        if (attempt < 2) {
          await attemptUpload(attempt + 1);
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.
      from('partner-avatars').
      getPublicUrl(filePath);

      const newUrl = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      toast.success('Photo uploaded');

      // Log partner photo change if editing an existing partner
      if (editingPartner) {
        const partnerObj = partners.find((p) => p.userId === editingPartner);
        if (partnerObj) {
          addNotification({
            type: 'partner',
            title: 'Partner Photo Updated',
            message: `${useFinanceStore.getState().userProfile.name || 'Unknown'} updated profile photo for ${partnerObj.name}`
          });
        }
      }
    };

    try {
      await attemptUpload(1);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    addPartner({
      name: name.trim(),
      color,
      initialCashBalance: parseFloat(initialCash) || 0,
      initialOnlineBalance: parseFloat(initialOnline) || 0,
      avatarUrl
    }, userId);

    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = (handledBy: string) => {
    const partner = partners.find((p) => p.userId === handledBy);
    if (!partner) return;

    setName(partner.name);
    setColor(partner.color);
    setInitialCash(partner.initialCashBalance.toString());
    setInitialOnline(partner.initialOnlineBalance.toString());
    setAvatarUrl(partner.avatarUrl);
    setEditingPartner(handledBy);
  };

  const handleUpdate = async () => {
    if (!editingPartner || !name.trim()) return;

    updatePartner(editingPartner, {
      name: name.trim(),
      color,
      initialCashBalance: parseFloat(initialCash) || 0,
      initialOnlineBalance: parseFloat(initialOnline) || 0,
      avatarUrl
    }, userId);

    // If this partner is linked to a user (owner), sync name/avatar to their profile
    const partnerRecord = partners.find((p) => p.userId === editingPartner);
    if (partnerRecord) {
      const { data: dbPartner } = await supabase.
      from('partners').
      select('user_id').
      eq('id', editingPartner).
      maybeSingle();

      if (dbPartner?.user_id) {
        const profileUpdates: Record<string, unknown> = { name: name.trim() };
        if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl || null;
        await supabase.from('profiles').update(profileUpdates).eq('user_id', dbPartner.user_id);
      }
    }

    resetForm();
  };




  const handleDelete = async (handledBy: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const partner = partners.find((p) => p.userId === handledBy);
    if (!partner) return;

    // Check if this partner is linked to a user (owner-linked)
    const { data: dbPartner } = await supabase.
    from('partners').
    select('user_id').
    eq('id', handledBy).
    maybeSingle();

    const { data: orgMember } = dbPartner?.user_id ?
    await supabase.
    from('org_members').
    select('id').
    eq('user_id', dbPartner.user_id).
    eq('status', 'active').
    maybeSingle() :
    { data: null };

    setIsOwnerLinkedDelete(!!orgMember);
    setDeleteConfirmPartner(partner);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmPartner) return;
    const partner = deleteConfirmPartner;
    setDeleteConfirmPartner(null);

    if (isOwnerLinkedDelete) {
      // Owner-linked: route through manage-team for cascading delete
      if (otherOwners.length > 0 && user && orgId) {
        try {
          const { error } = await supabase.from('change_approvals').insert({
            org_id: orgId,
            requester_user_id: user.id,
            target_user_id: otherOwners[0].user_id,
            entity_type: 'partner',
            entity_id: partner.id,
            action: 'delete',
            proposed_changes: { name: partner.name },
            status: 'pending'
          });
          if (error) throw error;
          addNotification({
            type: 'partner',
            title: 'Deletion Requested',
            message: `${currentUserName} requested deletion of partner '${partner.name}'`
          });
          toast('Sent for Approval', {
            description: 'This partner is an owner. Your deletion request will apply once they approve.',
            icon: <Clock size={18} className="text-amber-500" />,
            duration: 4000,
            className: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/30',
          });
        } catch (err: any) {
          toast.error(err.message || 'Failed to create approval request');
        }
      } else {
        // Find the org_member id for this partner's user_id
        const { data: dbPartner } = await supabase.
        from('partners').
        select('user_id').
        eq('id', partner.id).
        maybeSingle();

        if (dbPartner?.user_id) {
          const { data: member } = await supabase.
          from('org_members').
          select('id').
          eq('user_id', dbPartner.user_id).
          eq('status', 'active').
          maybeSingle();

          if (member) {
            try {
              const { data, error } = await supabase.functions.invoke('manage-team', {
                body: { action: 'remove_member', memberId: member.id }
              });
              if (error) throw error;
              if (data?.error) throw new Error(data.error);
              toast.success(`${partner.name} removed from app`);
              // Refresh local state
              window.location.reload();
            } catch (err: any) {
              toast.error(err.message || 'Failed to remove member');
            }
          }
        }
      }
    } else {
      // Non-owner partner: simple delete
      if (otherOwners.length > 0 && user && orgId) {
        try {
          const { error } = await supabase.from('change_approvals').insert({
            org_id: orgId,
            requester_user_id: user.id,
            target_user_id: otherOwners[0].user_id,
            entity_type: 'partner',
            entity_id: partner.id,
            action: 'delete',
            proposed_changes: { name: partner.name },
            status: 'pending'
          });
          if (error) throw error;
          addNotification({
            type: 'partner',
            title: 'Deletion Requested',
            message: `${currentUserName} requested deletion of partner '${partner.name}'`
          });
          toast('Sent for Approval', {
            description: 'This partner is an owner. Your deletion request will apply once they approve.',
            icon: <Clock size={18} className="text-amber-500" />,
            duration: 4000,
            className: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/30',
          });
        } catch (err: any) {
          toast.error(err.message || 'Failed to create approval request');
        }
      } else {
        deletePartner(partner.id, userId);
      }
    }
  };

  const handleEditClick = (handledBy: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit(handledBy);
  };

  const openPartnerDetail = (balanceData: typeof partnerBalances[0]) => {
    setSelectedPartner(balanceData.partner);
    setIsDetailOpen(true);
  };

  const filterLabel = useMemo(() => {
    return getTimeFilterLabel(timeFilter, customStartDate, customEndDate);
  }, [timeFilter, customStartDate, customEndDate]);

  const selectedBalanceData = selectedPartner ?
  partnerBalances.find((b) => b.partner.id === selectedPartner.id) || null :
  null;

  const triggerUpload = () => fileInputRef.current?.click();

  const formProps = {
    name, setName,
    color, setColor,
    initialCash, setInitialCash,
    initialOnline, setInitialOnline,
    avatarUrl, isUploading,
    onTriggerUpload: triggerUpload,
    fileInputRef,
    onFileChange: handleAvatarUpload
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Financial Holdings - Team</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-8">Track money held by each team member

        </p>
      </div>
      
      {/* All-time Total Holdings Summary */}
      {partners.length > 0 &&
      <TotalHoldingsCard partners={partners} getPartnerBalancesForPeriod={getPartnerBalancesForPeriod} />
      }

      {/* Explanatory Info Box */}
      <div className="px-4 mb-4">
        <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
               <p className="font-medium text-foreground">How balances work:</p>
               <p>• Balances are based on <span className="text-foreground font-medium">assigned entries only</span></p>
              <p>• <span className="text-success">+ Income</span> received during period</p>
              <p>• <span className="text-destructive">− Expenses</span> made during period</p>
              <p>• <span className="text-foreground">Closing</span> = Current holdings</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Unassigned Entries Warning Card */}
      {unassignedStats.count > 0 &&
      <div className="px-4 mb-4">
          <button
          onClick={() => setShowUnassignedSheet(true)}
          className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-left hover:bg-amber-500/15 transition-colors">
          
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {unassignedStats.count} unassigned entr{unassignedStats.count === 1 ? 'y' : 'ies'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Excluded from partner balances until assigned.
                </p>
                <div className="flex items-center gap-4 mt-1.5 text-xs">
                  <span className="flex items-center gap-1">
                    <Banknote size={12} className="text-muted-foreground" />
                    <span className={unassignedStats.cashNet >= 0 ? "text-success" : "text-destructive"}>
                      {unassignedStats.cashNet >= 0 ? '+' : ''}{CURRENCY_SYMBOL}{Math.abs(unassignedStats.cashNet).toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} className="text-muted-foreground" />
                    <span className={unassignedStats.onlineNet >= 0 ? "text-success" : "text-destructive"}>
                      {unassignedStats.onlineNet >= 0 ? '+' : ''}{CURRENCY_SYMBOL}{Math.abs(unassignedStats.onlineNet).toLocaleString()}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-primary mt-1.5 font-medium">Tap to review & assign →</p>
              </div>
            </div>
          </button>
        </div>
      }
      
      <div className="px-4 mb-4">
        <TimeFrameSelector
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate} />
        
      </div>
      
      {/* Period Label */}
      <div className="px-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Showing balances for: <span className="font-medium text-foreground">{filterLabel}</span>
        </p>
      </div>
      
      {/* Partner List */}
      <div className="px-4 space-y-3">
        {partnerBalances.length === 0 ?
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No partners added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add partners to track who holds the money</p>
          </div> :

        partnerBalances.map((balanceData) => {
          const {
            partner,
            closingCashBalance,
            closingOnlineBalance,
            periodCashTxnCount,
            periodOnlineTxnCount
          } = balanceData;

          const totalTxnCount = periodCashTxnCount + periodOnlineTxnCount;
          const totalClosing = closingCashBalance + closingOnlineBalance;

          return (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => editingPartner !== partner.id && openPartnerDetail(balanceData)}
              className={cn(
                "bg-card rounded-2xl p-4 border border-border transition-colors",
                editingPartner !== partner.id && "cursor-pointer hover:border-primary/50 active:bg-muted/30"
              )}>
              
                {editingPartner === partner.id ?
              <div className="space-y-3">
                    <PartnerForm {...formProps} isEdit onSubmit={handleUpdate} />
                    <Button variant="outline" onClick={resetForm} className="w-full">
                      Cancel
                    </Button>
                  </div> :

              <>
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {partner.avatarUrl ?
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      className="w-10 h-10 rounded-full object-cover" /> :


                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: partner.color }}>
                      
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                    }
                        <div>
                          <span className="font-semibold">{partner.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {totalTxnCount} transaction{totalTxnCount !== 1 ? 's' : ''} this period
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                      onClick={(e) => handleEditClick(partner.id, e)}
                      className="p-2 rounded-full hover:bg-muted">
                      
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                        <button
                      onClick={(e) => handleDelete(partner.id, e)}
                      className="p-2 rounded-full hover:bg-destructive/10">
                      
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                        <ChevronRight size={18} className="text-muted-foreground ml-1" />
                      </div>
                    </div>
                    
                    {/* Balance Summary Row */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Banknote size={14} className="text-muted-foreground" />
                        <span className={cn(
                      "font-semibold",
                      closingCashBalance >= 0 ? "text-success" : "text-destructive"
                    )}>
                          {closingCashBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingCashBalance).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({periodCashTxnCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-muted-foreground" />
                        <span className={cn(
                      "font-semibold",
                      closingOnlineBalance >= 0 ? "text-success" : "text-destructive"
                    )}>
                          {closingOnlineBalance < 0 && '-'}{CURRENCY_SYMBOL}{Math.abs(closingOnlineBalance).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({periodOnlineTxnCount})
                        </span>
                      </div>
                    </div>
                  </>
              }
              </motion.div>);

        })
        }
      </div>
      
      {/* Transfer Between Team Button */}
      {partners.length >= 2 &&
      <div className="px-4 mt-4">
          <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => setShowTransferSheet(true)}>
          
            <ArrowLeftRight size={18} className="mr-2" />
            Transfer Between Team
          </Button>
        </div>
      }
      
      {/* Add Partner Button */}
      <div className="px-4 mt-4">
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus size={18} className="mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Add Partner</DialogTitle>
            </DialogHeader>
            <PartnerForm {...formProps} onSubmit={handleAdd} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Partner Transfer Sheet */}
      <PartnerTransferSheet
        isOpen={showTransferSheet}
        onClose={() => setShowTransferSheet(false)}
        userId={userId} />
      
      
      {/* Partner Detail Sheet */}
      {selectedPartner && selectedBalanceData &&
      <PartnerDetailSheet
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPartner(null);
        }}
        partner={selectedPartner}
        balanceData={selectedBalanceData}
        dateRange={dateRange}
        periodLabel={filterLabel}
        userId={userId} />

      }
      
      {/* Unassigned Transactions Sheet */}
      <UnassignedTransactionsSheet
        isOpen={showUnassignedSheet}
        onClose={() => setShowUnassignedSheet(false)}
        startDate={dateRange.start}
        endDate={dateRange.end}
        userId={userId} />
      

      {/* Critical Delete Warning Dialog */}
      <AlertDialog open={!!deleteConfirmPartner} onOpenChange={(open) => !open && setDeleteConfirmPartner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Delete {deleteConfirmPartner?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {isOwnerLinkedDelete ?
              <>This will <strong>permanently remove</strong> this member across the entire app — their <strong>profile, partner record, team membership, transaction assignments, and login</strong> will all be deleted. This action cannot be undone.</> :

              <>Delete this partner? Their transactions will be unassigned.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              
              {isOwnerLinkedDelete ?
              otherOwners.length > 0 ? 'Request Removal' : 'Remove Permanently' :
              otherOwners.length > 0 ? 'Request Deletion' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};