import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, Search, Trash2, Loader2, AlertTriangle } from "lucide-react";

const SUPER_ADMIN_USER_IDS = ['0f2f00e4-47c0-4c4d-8263-77b7f9a2f336'];

type Health = 'active' | 'idle' | 'empty' | 'orphan-duplicate';

interface OrgRow {
  id: string;
  name: string;
  owner_id: string;
  logo_url: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_avatar_url: string | null;
  member_count: number;
  transaction_count: number;
  last_activity_at: string | null;
  owner_other_org_ids: string[];
  health: Health;
  subscription: any | null;
}

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  name: string | null;
  avatar_url: string | null;
  memberships: { org_id: string; org_name: string; role: string; status: string }[];
  owns_multiple_orgs: boolean;
  never_logged_in: boolean;
}

interface Stats {
  orgs_total: number;
  orgs_real: number;
  orgs_empty: number;
  orgs_orphan: number;
  users_total: number;
  users_never_logged_in: number;
  subscriptions: { active: number; trialing: number; comped: number; none: number; cancelled: number };
}

const healthLabel: Record<Health, string> = {
  active: 'Active',
  idle: 'Idle',
  empty: 'Empty',
  'orphan-duplicate': 'Orphan',
};
const healthClass: Record<Health, string> = {
  active: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  idle: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  empty: 'bg-muted text-muted-foreground border-border',
  'orphan-duplicate': 'bg-destructive/15 text-destructive border-destructive/30',
};

function planSummary(sub: any | null): string {
  if (!sub) return 'No subscription';
  const now = Date.now();
  if (sub.is_comped && (!sub.comped_until || new Date(sub.comped_until).getTime() > now)) {
    return sub.comped_until
      ? `Comped until ${format(new Date(sub.comped_until), 'd MMM yyyy')}`
      : 'Comped (no expiry)';
  }
  if (sub.status === 'active') {
    return sub.current_period_end
      ? `Active · renews ${format(new Date(sub.current_period_end), 'd MMM yyyy')}`
      : 'Active';
  }
  if (sub.status === 'trialing') {
    return sub.trial_end
      ? `Trialing until ${format(new Date(sub.trial_end), 'd MMM yyyy')}`
      : 'Trialing';
  }
  if (sub.status === 'cancelled') return 'Cancelled';
  return sub.status || 'Inactive';
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filter, setFilter] = useState<'all' | Health>('all');
  const [search, setSearch] = useState('');

  const isSuper = !!user && SUPER_ADMIN_USER_IDS.includes(user.id);

  const loadOrgs = async () => {
    setLoadingOrgs(true);
    const { data, error } = await supabase.functions.invoke('admin-console', { body: { action: 'list_orgs' } });
    setLoadingOrgs(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Failed to load organizations');
      return;
    }
    setOrgs(data.orgs || []);
  };
  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.functions.invoke('admin-console', { body: { action: 'list_users' } });
    setLoadingUsers(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Failed to load users');
      return;
    }
    setUsers(data.users || []);
  };
  const loadStats = async () => {
    setLoadingStats(true);
    const { data, error } = await supabase.functions.invoke('admin-console', { body: { action: 'stats' } });
    setLoadingStats(false);
    if (error || data?.error) return;
    setStats(data.stats);
  };

  useEffect(() => {
    if (!isSuper) return;
    loadOrgs();
    loadStats();
  }, [isSuper]);

  const filtered = useMemo(() => {
    return orgs.filter((o) => {
      if (filter !== 'all' && o.health !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.name?.toLowerCase().includes(q) ||
          o.owner_email?.toLowerCase().includes(q) ||
          o.owner_name?.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orgs, filter, search]);

  const counts = useMemo(() => {
    const c = { all: orgs.length, active: 0, idle: 0, empty: 0, 'orphan-duplicate': 0 } as any;
    orgs.forEach((o) => { c[o.health]++; });
    return c;
  }, [orgs]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isSuper) return <NotAuthorized />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Manage organizations, users, and subscriptions</p>
        </div>

        <Tabs defaultValue="orgs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orgs">Organizations</TabsTrigger>
            <TabsTrigger value="users" onClick={() => users.length === 0 && loadUsers()}>Users</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          {/* ORGANIZATIONS */}
          <TabsContent value="orgs" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{counts.all} orgs</span>
              <span>·</span>
              <span>{counts.active} active</span>
              <span>·</span>
              <span>{counts.idle} idle</span>
              <span>·</span>
              <span>{counts.empty} empty</span>
              <span>·</span>
              <span>{counts['orphan-duplicate']} orphan</span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={loadOrgs} disabled={loadingOrgs}>
                {loadingOrgs ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'idle', 'empty', 'orphan-duplicate'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : healthLabel[f as Health]} ({f === 'all' ? counts.all : counts[f]})
                </Button>
              ))}
              <div className="relative ml-auto w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search org / owner / id"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {loadingOrgs && orgs.length === 0 ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {filtered.map((org) => (
                  <OrgCard key={org.id} org={org} onChanged={loadOrgs} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No organizations match this filter.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{users.length} users</p>
              <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loadingUsers}>
                {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
            {loadingUsers && users.length === 0 ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => <UserRowCard key={u.id} user={u} />)}
                {users.length === 0 && !loadingUsers && (
                  <p className="text-sm text-muted-foreground text-center py-8">Click Refresh to load users.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats" className="space-y-4">
            {loadingStats || !stats ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Orgs" value={stats.orgs_total} />
                <StatCard label="Real Orgs" value={stats.orgs_real} tone="positive" />
                <StatCard label="Empty Orgs" value={stats.orgs_empty} tone="muted" />
                <StatCard label="Orphan Orgs" value={stats.orgs_orphan} tone="negative" />
                <StatCard label="Total Users" value={stats.users_total} />
                <StatCard label="Never Logged In" value={stats.users_never_logged_in} tone="muted" />
                <StatCard label="Active Subs" value={stats.subscriptions.active} tone="positive" />
                <StatCard label="Comped" value={stats.subscriptions.comped} tone="positive" />
                <StatCard label="Trialing" value={stats.subscriptions.trialing} />
                <StatCard label="Cancelled" value={stats.subscriptions.cancelled} tone="muted" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'negative' | 'muted' }) {
  const toneClass =
    tone === 'positive' ? 'text-emerald-500' :
    tone === 'negative' ? 'text-destructive' :
    tone === 'muted' ? 'text-muted-foreground' : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function OrgCard({ org, onChanged }: { org: OrgRow; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [isComped, setIsComped] = useState(!!org.subscription?.is_comped);
  const [reason, setReason] = useState(org.subscription?.comped_reason || '');
  const [until, setUntil] = useState(org.subscription?.comped_until ? org.subscription.comped_until.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const compActive = !!org.subscription?.is_comped &&
    (!org.subscription.comped_until || new Date(org.subscription.comped_until).getTime() > Date.now());

  const saveComp = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-console', {
      body: {
        action: 'update_comp',
        org_id: org.id,
        is_comped: isComped,
        comped_reason: reason || null,
        comped_until: until ? new Date(until).toISOString() : null,
      },
    });
    setSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Failed to save');
      return;
    }
    toast.success('Comp updated');
    onChanged();
  };

  const deleteOrg = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('admin-console', {
      body: { action: 'delete_org', org_id: org.id },
    });
    setDeleting(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Failed to delete');
      return;
    }
    toast.success('Organization deleted');
    onChanged();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
              {org.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{org.name}</CardTitle>
              <Badge variant="outline" className={`text-xs ${healthClass[org.health]}`}>{healthLabel[org.health]}</Badge>
              {compActive && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Comped</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {format(new Date(org.created_at), 'd MMM yyyy')} · {org.id.slice(0, 8)}…
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="h-6 w-6">
            {org.owner_avatar_url && <AvatarImage src={org.owner_avatar_url} />}
            <AvatarFallback className="text-[10px]">{(org.owner_name || org.owner_email || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{org.owner_name || 'Unnamed owner'}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground truncate">{org.owner_email}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{org.transaction_count} txns</span>
          <span>{org.member_count} {org.member_count === 1 ? 'member' : 'members'}</span>
          {org.last_activity_at ? (
            <span>last activity {formatDistanceToNow(new Date(org.last_activity_at), { addSuffix: true })}</span>
          ) : (
            <span>no activity</span>
          )}
          <span className="ml-auto">{planSummary(org.subscription)}</span>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Manage <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4 border-t">
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Complimentary access</Label>
                  <p className="text-xs text-muted-foreground">Bypass paywall for this org</p>
                </div>
                <Switch checked={isComped} onCheckedChange={setIsComped} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Beta tester" disabled={!isComped} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comp until (optional — blank = forever)</Label>
                <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} disabled={!isComped} />
              </div>
              <Button onClick={saveComp} disabled={saving} size="sm" className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save comp settings
              </Button>
            </div>

            <div className="pt-2 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete organization
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" /> Delete "{org.name}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 text-sm">
                        <p>This will permanently delete:</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                          <li>{org.transaction_count} transactions</li>
                          <li>All projects, partners, categories, vendors, labels</li>
                          <li>All documents, notifications, backups</li>
                          <li>Subscription record</li>
                          <li>{org.member_count} membership(s)</li>
                        </ul>
                        <p className="text-destructive font-medium">This cannot be undone.</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteOrg} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Delete forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function UserRowCard({ user }: { user: UserRow }) {
  const active = user.memberships.filter((m) => m.status === 'active');
  return (
    <Card>
      <CardContent className="p-3 flex items-start gap-3">
        <Avatar className="h-9 w-9">
          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
          <AvatarFallback className="text-xs">{(user.name || user.email || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{user.name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            {user.owns_multiple_orgs && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30">
                In {active.length} orgs
              </Badge>
            )}
            {user.never_logged_in && (
              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Never logged in</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {active.map((m) => (
              <span key={m.org_id} className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                {m.org_name} <span className="text-muted-foreground">· {m.role}</span>
              </span>
            ))}
            {active.length === 0 && <span className="text-[11px] text-muted-foreground">No active org</span>}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Joined {format(new Date(user.created_at), 'd MMM yyyy')}
            {user.last_sign_in_at && ` · last seen ${formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
