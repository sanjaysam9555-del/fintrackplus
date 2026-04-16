import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';

const SUPER_ADMIN_USER_IDS = ['0f2f00e4-47c0-4c4d-8263-77b7f9a2f336'];

interface OrgRow {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
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

export default function AdminComp() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
      // Init drafts
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
        (o.owner_email?.toLowerCase().includes(q) ?? false),
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
            placeholder="Search by org name, ID, or owner email…"
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
                <Card key={org.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{org.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{org.owner_email ?? '—'}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">{org.id}</div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {sub?.is_comped && <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30">Comped</Badge>}
                      <Badge variant="outline">{sub?.status ?? 'no sub'}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
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
