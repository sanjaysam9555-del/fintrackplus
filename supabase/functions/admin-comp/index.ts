import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_ADMIN_USER_IDS = ['0f2f00e4-47c0-4c4d-8263-77b7f9a2f336'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = userData.user.id;
    if (!SUPER_ADMIN_USER_IDS.includes(userId)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'list') {
      const { data: orgs, error: orgsErr } = await admin
        .from('organizations')
        .select('id, name, owner_id, created_at')
        .order('created_at', { ascending: false });
      if (orgsErr) throw orgsErr;

      const { data: subs } = await admin
        .from('subscriptions')
        .select('org_id, status, is_comped, comped_reason, comped_until, current_period_end, trial_end');

      const subMap = new Map((subs || []).map((s: any) => [s.org_id, s]));

      // Fetch owner emails
      const enriched = await Promise.all(
        (orgs || []).map(async (o: any) => {
          let email = null;
          try {
            const { data } = await admin.auth.admin.getUserById(o.owner_id);
            email = data?.user?.email ?? null;
          } catch (_) {}
          return { ...o, owner_email: email, subscription: subMap.get(o.id) ?? null };
        })
      );

      return new Response(JSON.stringify({ orgs: enriched }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update') {
      const { org_id, is_comped, comped_reason, comped_until } = body;
      if (!org_id) {
        return new Response(JSON.stringify({ error: 'org_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

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

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[admin-comp] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
