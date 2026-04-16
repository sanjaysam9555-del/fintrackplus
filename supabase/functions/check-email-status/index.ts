import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting per IP (per cold-start)
const rateBuckets = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests
const RATE_WINDOW_MS = 60_000; // per minute

function checkRate(ip: string): boolean {
  const now = Date.now();
  const b = rateBuckets.get(ip);
  if (!b || now > b.reset) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  b.count += 1;
  return b.count <= RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (!checkRate(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Look up user by email via admin API
    const normalized = email.trim().toLowerCase();
    let userId: string | null = null;
    let page = 1;
    while (page <= 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      const found = data.users.find(u => (u.email || '').toLowerCase() === normalized);
      if (found) { userId = found.id; break; }
      if (data.users.length < 1000) break;
      page += 1;
    }

    if (!userId) {
      return new Response(JSON.stringify({ status: 'available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Existing user — check if invited & never logged in
    const { data: members } = await admin
      .from('org_members')
      .select('must_change_password')
      .eq('user_id', userId)
      .limit(1);

    const invited = members && members.length > 0 && members[0].must_change_password === true;

    return new Response(JSON.stringify({ status: invited ? 'invited_pending' : 'exists' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[check-email-status] error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
