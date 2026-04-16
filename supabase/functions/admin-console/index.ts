import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_ADMIN_USER_IDS = ['0f2f00e4-47c0-4c4d-8263-77b7f9a2f336'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    if (!SUPER_ADMIN_USER_IDS.includes(userData.user.id)) return json({ error: 'Forbidden' }, 403);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ---------- LIST ORGS ----------
    if (action === 'list_orgs') {
      const [{ data: orgs }, { data: subs }, { data: members }, { data: profiles }] = await Promise.all([
        admin.from('organizations').select('id, name, owner_id, logo_url, created_at, is_personal').order('created_at', { ascending: false }),
        admin.from('subscriptions').select('*'),
        admin.from('org_members').select('id, org_id, user_id, role, status'),
        admin.from('profiles').select('user_id, name, avatar_url'),
      ]);

      const subMap = new Map((subs || []).map((s: any) => [s.org_id, s]));
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Members per org + user-to-orgs index
      const membersByOrg = new Map<string, any[]>();
      const orgsByUser = new Map<string, string[]>();
      (members || []).forEach((m: any) => {
        if (!membersByOrg.has(m.org_id)) membersByOrg.set(m.org_id, []);
        membersByOrg.get(m.org_id)!.push(m);
        if (m.status === 'active') {
          if (!orgsByUser.has(m.user_id)) orgsByUser.set(m.user_id, []);
          orgsByUser.get(m.user_id)!.push(m.org_id);
        }
      });

      // Transaction counts + last activity per org (paginated)
      const txCountByOrg = new Map<string, number>();
      const lastActivityByOrg = new Map<string, string>();
      const orgIds = (orgs || []).map((o: any) => o.id);
      for (const orgId of orgIds) {
        const { count } = await admin
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId);
        txCountByOrg.set(orgId, count || 0);
        const { data: latest } = await admin
          .from('transactions')
          .select('created_at')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.created_at) lastActivityByOrg.set(orgId, latest.created_at);
      }

      const now = Date.now();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      // Build org-id -> name lookup for owner_active_org_name
      const orgNameById = new Map((orgs || []).map((o: any) => [o.id, o.name]));

      const enriched = await Promise.all(
        (orgs || []).map(async (o: any) => {
          let owner_email: string | null = null;
          try {
            const { data } = await admin.auth.admin.getUserById(o.owner_id);
            owner_email = data?.user?.email ?? null;
          } catch (_) {}
          const ownerProfile = profileMap.get(o.owner_id);
          const orgMembers = membersByOrg.get(o.id) || [];
          const txCount = txCountByOrg.get(o.id) || 0;
          const lastActivity = lastActivityByOrg.get(o.id) || null;
          const ownerOtherOrgs = (orgsByUser.get(o.owner_id) || []).filter((id) => id !== o.id);
          // Find owner's active non-personal org (excluding this one)
          let owner_active_org_name: string | null = null;
          for (const otherId of ownerOtherOrgs) {
            const other = (orgs || []).find((x: any) => x.id === otherId);
            if (other && !other.is_personal) { owner_active_org_name = other.name; break; }
          }
          if (!owner_active_org_name && ownerOtherOrgs.length > 0) {
            owner_active_org_name = orgNameById.get(ownerOtherOrgs[0]) ?? null;
          }

          let health: 'active' | 'idle' | 'empty' | 'orphan-duplicate' | 'personal' = 'empty';
          if (o.is_personal) {
            health = 'personal';
          } else if (ownerOtherOrgs.length > 0 && txCount === 0) {
            health = 'orphan-duplicate';
          } else if (txCount === 0 && orgMembers.filter((m: any) => m.status === 'active').length <= 1) {
            health = 'empty';
          } else if (lastActivity && now - new Date(lastActivity).getTime() < THIRTY_DAYS) {
            health = 'active';
          } else {
            health = 'idle';
          }

          return {
            ...o,
            owner_email,
            owner_name: ownerProfile?.name ?? null,
            owner_avatar_url: ownerProfile?.avatar_url ?? null,
            member_count: orgMembers.filter((m: any) => m.status === 'active').length,
            transaction_count: txCount,
            last_activity_at: lastActivity,
            owner_other_org_ids: ownerOtherOrgs,
            owner_active_org_name,
            health,
            subscription: subMap.get(o.id) ?? null,
          };
        })
      );

      return json({ orgs: enriched });
    }

    // ---------- LIST USERS ----------
    if (action === 'list_users') {
      const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const [{ data: members }, { data: profiles }, { data: orgs }, { data: subs }] = await Promise.all([
        admin.from('org_members').select('user_id, org_id, role, status'),
        admin.from('profiles').select('user_id, name, avatar_url'),
        admin.from('organizations').select('id, name'),
        admin.from('subscriptions').select('*'),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o]));
      const subByOrg = new Map((subs || []).map((s: any) => [s.org_id, s]));
      const membersByUser = new Map<string, any[]>();
      (members || []).forEach((m: any) => {
        if (!membersByUser.has(m.user_id)) membersByUser.set(m.user_id, []);
        membersByUser.get(m.user_id)!.push(m);
      });

      const now = Date.now();
      const enriched = (usersList?.users || []).map((u: any) => {
        const userMembers = membersByUser.get(u.id) || [];
        const memberships = userMembers.map((m: any) => ({
          org_id: m.org_id,
          org_name: orgMap.get(m.org_id)?.name ?? '(unknown)',
          role: m.role,
          status: m.status,
          subscription: subByOrg.get(m.org_id) ?? null,
        }));
        const profile = profileMap.get(u.id);
        const activeMemberships = memberships.filter((m) => m.status === 'active');
        const compedOrgIds = activeMemberships
          .filter((m) => {
            const s = m.subscription;
            return s?.is_comped && (!s.comped_until || new Date(s.comped_until).getTime() > now);
          })
          .map((m) => m.org_id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          name: profile?.name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          memberships,
          owns_multiple_orgs: activeMemberships.length > 1,
          never_logged_in: !u.last_sign_in_at,
          comped_org_ids: compedOrgIds,
        };
      });

      return json({ users: enriched });
    }

    // ---------- STATS ----------
    if (action === 'stats') {
      const [{ data: orgs }, { data: subs }, { data: members }] = await Promise.all([
        admin.from('organizations').select('id, owner_id, is_personal'),
        admin.from('subscriptions').select('status, is_comped, comped_until, trial_end'),
        admin.from('org_members').select('user_id, org_id, status'),
      ]);
      const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });

      // tx counts per org
      const txByOrg = new Map<string, number>();
      for (const o of orgs || []) {
        const { count } = await admin.from('transactions').select('id', { count: 'exact', head: true }).eq('org_id', o.id);
        txByOrg.set(o.id, count || 0);
      }

      const orgsByUser = new Map<string, string[]>();
      (members || []).forEach((m: any) => {
        if (m.status !== 'active') return;
        if (!orgsByUser.has(m.user_id)) orgsByUser.set(m.user_id, []);
        orgsByUser.get(m.user_id)!.push(m.org_id);
      });

      let real = 0, empty = 0, orphan = 0, personal = 0;
      for (const o of orgs || []) {
        const txCount = txByOrg.get(o.id) || 0;
        const ownerOther = (orgsByUser.get(o.owner_id) || []).filter((id) => id !== o.id);
        if ((o as any).is_personal) personal++;
        else if (ownerOther.length > 0 && txCount === 0) orphan++;
        else if (txCount === 0) empty++;
        else real++;
      }

      const now = Date.now();
      const subStats = {
        active: 0, trialing: 0, comped: 0, none: 0, cancelled: 0,
      };
      const orgIdsWithSub = new Set((subs || []).map((s: any) => (s as any).org_id));
      void orgIdsWithSub;
      (subs || []).forEach((s: any) => {
        if (s.is_comped && (!s.comped_until || new Date(s.comped_until).getTime() > now)) subStats.comped++;
        else if (s.status === 'active') subStats.active++;
        else if (s.status === 'trialing') subStats.trialing++;
        else if (s.status === 'cancelled') subStats.cancelled++;
      });

      return json({
        stats: {
          orgs_total: (orgs || []).length,
          orgs_real: real,
          orgs_empty: empty,
          orgs_orphan: orphan,
          orgs_personal: personal,
          users_total: usersList?.users?.length || 0,
          users_never_logged_in: (usersList?.users || []).filter((u: any) => !u.last_sign_in_at).length,
          subscriptions: subStats,
        },
      });
    }

    // ---------- UPDATE COMP ----------
    if (action === 'update_comp') {
      const { org_id, is_comped, comped_reason, comped_until } = body;
      if (!org_id) return json({ error: 'org_id required' }, 400);

      const { data: existing } = await admin.from('subscriptions').select('id').eq('org_id', org_id).maybeSingle();
      const payload: any = {
        is_comped: !!is_comped,
        comped_reason: comped_reason || null,
        comped_until: comped_until || null,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await admin.from('subscriptions').update(payload).eq('org_id', org_id);
        if (error) throw error;
      } else {
        const { error } = await admin.from('subscriptions').insert({ org_id, status: 'inactive', ...payload });
        if (error) throw error;
      }
      return json({ success: true });
    }

    // ---------- DELETE ORG (cascade) ----------
    if (action === 'delete_org') {
      const { org_id } = body;
      if (!org_id) return json({ error: 'org_id required' }, 400);

      // Collect user_ids that belong to this org (for profile cleanup decisions)
      const { data: orgMembers } = await admin.from('org_members').select('user_id').eq('org_id', org_id);
      const userIds = (orgMembers || []).map((m: any) => m.user_id);

      // Delete child tables first
      const tables = [
        'transactions',
        'project_documents',
        'projects',
        'project_labels',
        'partners',
        'categories',
        'vendors',
        'notifications',
        'change_approvals',
        'subscriptions',
        'backups',
        'org_members',
      ];
      for (const t of tables) {
        const { error } = await admin.from(t).delete().eq('org_id', org_id);
        if (error) console.error(`[delete_org] ${t}:`, error.message);
      }

      // Delete profiles only for users with no other active org
      for (const uid of userIds) {
        const { data: other } = await admin.from('org_members').select('id').eq('user_id', uid).limit(1);
        if (!other || other.length === 0) {
          await admin.from('profiles').delete().eq('user_id', uid);
        }
      }

      const { error: orgErr } = await admin.from('organizations').delete().eq('id', org_id);
      if (orgErr) throw orgErr;

      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err: any) {
    console.error('[admin-console] Error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
