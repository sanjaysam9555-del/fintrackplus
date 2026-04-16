import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Search, Shield, Copy, Check } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const SUPER_ADMIN_USER_IDS = ['0f2f00e4-47c0-4c4d-8263-77b7f9a2f336'];

interface OrgRow {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_avatar_url: string | null;
  created_at: string;
  subscription: {
    status: string;
    is_comped: boolean;
    comped_reason: string | null;
    comped_until: string | null;
    current_period_end: string | null;
    trial_end: string | null;
  } | null;
}

interface DraftState {
  is_comped: boolean;
  comped_reason: string;
  comped_until: string;
}

const initials = (name: string | null, email: string | null) => {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

const planSummary = (sub: OrgRow['subscription']): string => {
  if (!sub) return 'No subscription';
  if (sub.is_comped) {
    if (!sub.comped_until) return 'Complimentary — permanent';
    return `Complimentary until ${format(new Date(sub.comped_until), 'd MMM yyyy')}`;
  }
  if (sub.status === 'active' && sub.current_period_end) {
    return `Active until ${format(new Date(sub.current_period_end), 'd MMM yyyy')}`;
  }
  if (sub.status === 'trialing' && sub.trial_end) {
    return `Trial ends ${format(new Date(sub.trial_end), 'd MMM yyyy')}`;
  }
  if (sub.status === 'cancelled') return 'Cancelled';
  return sub.status.charAt(0).toUpperCase() + sub.status.slice(1);
};

export default function AdminComp() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAuthorized = user && SUPER_ADMIN_USER_IDS.includes(user.id);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-comp', {
        body: { action: 'list' },
      });
      if (error) throw error;
      const list: OrgRow[] = data.orgs || [];
      setOrgs(list);
      const d: Record<string, DraftState> = {};
      list.forEach((o) => {
        d[o.id] = {
          is_comped: o.subscription?.is_comped ?? false,
          comped_reason: o.subscription?.comped_reason ?? '',
          comped_until: o.subscription?.comped_until ? o.subscription.comped_until.slice(0, 10) : '',
        };
      });
      setDrafts(d);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchOrgs();
  }, [isAuthorized]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.owner_email?.toLowerCase().includes(q) ?? false) ||
        (o.owner_name?.toLowerCase().includes(q) ?? false),
    );
  }, [orgs, search]);

  const handleSave = async (orgId: string) => {
    const draft = drafts[orgId];
    setSavingId(orgId);
    try {
      const { error } = await supabase.functions.invoke('admin-comp', {
        body: {
          action: 'update',
          org_id: orgId,
          is_comped: draft.is_comped,
          comped_reason: draft.comped_reason || null,
          comped_until: draft.comped_until ? new Date(draft.comped_until).toISOString() : null,
        },
      });
      if (error) throw error;
      toast.success('Saved');
      await fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const updateDraft = (orgId: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({ ...prev, [orgId]: { ...prev[orgId], ...patch } }));
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">404 — Not Found</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Comp Admin</h1>
            <p className="text-sm text-muted-foreground">Manage complimentary access for any organization.</p>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by org or owner name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((org) => {
              const draft = drafts[org.id];
              if (!draft) return null;
              const sub = org.subscription;
              const isDirty =
                draft.is_comped !== (sub?.is_comped ?? false) ||
                draft.comped_reason !== (sub?.comped_reason ?? '') ||
                draft.comped_until !== (sub?.comped_until ? sub.comped_until.slice(0, 10) : '');

              return (
                <Card key={org.id} className="p-4 space-y-4">
                  {/* Header: avatar + identity + badges */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      {org.owner_avatar_url && <AvatarImage src={org.owner_avatar_url} alt={org.owner_name ?? ''} />}
                      <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                        {initials(org.owner_name, org.owner_email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="font-semibold text-base truncate">{org.name}</div>
                          <div className="text-sm font-medium truncate">
                            {org.owner_name ?? <span className="text-muted-foreground italic">No name set</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{org.owner_email ?? '—'}</div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap shrink-0">
                          {sub?.is_comped && (
                            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">
                              Comped
                            </Badge>
                          )}
                          <Badge variant="outline" className="capitalize">{sub?.status ?? 'no sub'}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        Joined {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {/* Plan summary + copyable ID */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan: </span>
                      <span className="font-medium">{planSummary(sub)}</span>
                    </div>
                    <button
                      onClick={() => copyId(org.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono px-2 py-1 rounded-md hover:bg-muted transition-colors"
                      title={org.id}
                    >
                      {copiedId === org.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>ID</span>
                    </button>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={draft.is_comped}
                        onCheckedChange={(v) => updateDraft(org.id, { is_comped: v })}
                      />
                      <span className="text-sm">Complimentary</span>
                    </div>
                    <Input
                      placeholder="Reason (e.g. Founder)"
                      value={draft.comped_reason}
                      onChange={(e) => updateDraft(org.id, { comped_reason: e.target.value })}
                      disabled={!draft.is_comped}
                    />
                    <Input
                      type="date"
                      placeholder="Until (empty = permanent)"
                      value={draft.comped_until}
                      onChange={(e) => updateDraft(org.id, { comped_until: e.target.value })}
                      disabled={!draft.is_comped}
                    />
                  </div>

                  {isDirty && (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => handleSave(org.id)} disabled={savingId === org.id}>
                        {savingId === org.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                        Save
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No organizations match.</p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          {orgs.length} organization{orgs.length === 1 ? '' : 's'} total
        </p>
      </div>
    </div>
  );
}
