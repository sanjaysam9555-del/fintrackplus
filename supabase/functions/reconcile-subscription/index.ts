// Reconciles the org's subscription row with Razorpay's live state.
// Owner-only. Safe to call repeatedly — read-only against Razorpay,
// only updates our DB to match. Used to self-heal stuck `created` rows
// when webhook events were missed (e.g. due to invalid signature).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const rzpAuth = "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);

async function rzp(path: string) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: { "Content-Type": "application/json", Authorization: rzpAuth },
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err: any = new Error(`Razorpay ${res.status}: ${JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function mapRzpStatus(rzpStatus: string): string | null {
  switch (rzpStatus) {
    case "created": return "created";
    case "authenticated":
    case "active": return "active";
    case "pending": return "past_due";
    case "halted": return "halted";
    case "cancelled":
    case "completed":
    case "expired": return "expired";
    default: return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: member, error: memErr } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (memErr || !member) throw new Error("Org membership not found");
    if (member.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can reconcile billing" }), { status: 403, headers: corsHeaders });
    }
    const orgId = member.org_id;

    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    if (!sub) {
      return new Response(
        JSON.stringify({ reconciled: false, reason: "no_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub.razorpay_subscription_id) {
      return new Response(
        JSON.stringify({ reconciled: false, reason: "no_razorpay_id", status: sub.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fresh = await rzp(`/subscriptions/${sub.razorpay_subscription_id}`);
    const mapped = mapRzpStatus(fresh.status);
    const updates: Record<string, any> = {};

    if (mapped && mapped !== sub.status) updates.status = mapped;
    if (fresh.current_start) {
      updates.current_period_start = new Date(fresh.current_start * 1000).toISOString();
    }
    if (fresh.current_end) {
      updates.current_period_end = new Date(fresh.current_end * 1000).toISOString();
    }
    if (fresh.start_at) {
      updates.trial_end = new Date(fresh.start_at * 1000).toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await admin.from("subscriptions").update(updates).eq("id", sub.id);
    }

    return new Response(
      JSON.stringify({
        reconciled: true,
        razorpay_status: fresh.status,
        db_status: updates.status ?? sub.status,
        changed: Object.keys(updates),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[reconcile-subscription]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
