// Creates a Razorpay customer + subscription for the org's owner.
// Owner-only. Returns subscription ID for Razorpay Checkout.
//
// Reconciliation logic: if an existing subscription row points to a Razorpay
// subscription, we re-verify its real status with Razorpay before reusing it.
// Stale/dead rows are reset so the owner can start a clean attempt instead of
// being trapped on the billing page.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const RZP_PLAN_ID = Deno.env.get("RAZORPAY_PLAN_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const rzpAuth = "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);

async function rzp(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: rzpAuth,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err: any = new Error(`Razorpay ${res.status}: ${JSON.stringify(data)}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Map Razorpay subscription status → our DB status.
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
    const email = claims.claims.email as string | undefined;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify Owner
    const { data: member, error: memErr } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (memErr || !member) throw new Error("Org membership not found");
    if (member.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can manage billing" }), { status: 403, headers: corsHeaders });
    }
    const orgId = member.org_id;

    const body = await req.json().catch(() => ({}));
    const customerName = (body.customer_name as string) || "FinTrack+ Customer";
    const customerGstin = (body.customer_gstin as string) || null;
    const customerBusinessName = (body.customer_business_name as string) || null;
    const customerAddress = (body.customer_address as string) || null;
    const customerStateCode = (body.customer_state_code as string) || null;
    const forceNew = body.force_new === true;

    // Get current subscription row
    let { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    // Comped orgs don't need a Razorpay subscription at all.
    if (sub?.is_comped && (!sub.comped_until || new Date(sub.comped_until).getTime() > Date.now())) {
      return new Response(
        JSON.stringify({ already_active: true, comped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we have an existing Razorpay subscription, reconcile with Razorpay's truth.
    if (!forceNew && sub?.razorpay_subscription_id) {
      try {
        const fresh = await rzp(`/subscriptions/${sub.razorpay_subscription_id}`);
        const mapped = mapRzpStatus(fresh.status);
        const reconciledUpdates: Record<string, any> = {};

        if (mapped && mapped !== sub.status) {
          reconciledUpdates.status = mapped;
        }
        if (fresh.current_start) {
          reconciledUpdates.current_period_start = new Date(fresh.current_start * 1000).toISOString();
        }
        if (fresh.current_end) {
          reconciledUpdates.current_period_end = new Date(fresh.current_end * 1000).toISOString();
        }
        if (Object.keys(reconciledUpdates).length > 0) {
          await admin.from("subscriptions").update(reconciledUpdates).eq("id", sub.id);
          sub = { ...sub, ...reconciledUpdates };
        }

        // Razorpay says it's already authenticated/active → caller already has access.
        if (fresh.status === "authenticated" || fresh.status === "active") {
          return new Response(
            JSON.stringify({ already_active: true, status: sub.status }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Still in `created` and the trial start hasn't passed → resume same checkout.
        // (Mandate auth window is still open.)
        if (fresh.status === "created") {
          return new Response(
            JSON.stringify({
              subscription_id: sub.razorpay_subscription_id,
              razorpay_key_id: RZP_KEY_ID,
              already_exists: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // pending / halted / cancelled / completed / expired → row is dead.
        // Fall through and create a fresh subscription on the same customer.
      } catch (e: any) {
        // If Razorpay can't find it (404), the row is stale. Reset and create new.
        console.error("[create-subscription] reconcile failed:", e?.message);
        await admin
          .from("subscriptions")
          .update({ status: "expired", razorpay_subscription_id: null })
          .eq("id", sub.id);
        sub = { ...sub, status: "expired", razorpay_subscription_id: null };
      }
    }

    // Create or reuse Razorpay customer
    let razorpayCustomerId = sub?.razorpay_customer_id as string | null;
    if (!razorpayCustomerId) {
      const customer = await rzp("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: customerName,
          email: email || `org-${orgId}@fintrackplus.com`,
          fail_existing: "0",
          notes: { org_id: orgId },
        }),
      });
      razorpayCustomerId = customer.id;
    }

    // Create subscription with 7-day trial via start_at
    const startAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const subscription = await rzp("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: RZP_PLAN_ID,
        customer_id: razorpayCustomerId,
        total_count: 120, // 10 years of monthly billing
        quantity: 1,
        start_at: startAt,
        customer_notify: 1,
        notes: {
          org_id: orgId,
          description: "FinTrack+ subscription — refundable mandate authorization (₹1–₹5)",
        },
      }),
    });

    // Persist subscription row
    const upsertPayload = {
      org_id: orgId,
      razorpay_customer_id: razorpayCustomerId,
      razorpay_subscription_id: subscription.id,
      plan_id: RZP_PLAN_ID,
      status: "created",
      trial_end: new Date(startAt * 1000).toISOString(),
      customer_gstin: customerGstin,
      customer_business_name: customerBusinessName,
      customer_address: customerAddress,
      customer_state_code: customerStateCode,
    };

    if (sub) {
      await admin.from("subscriptions").update(upsertPayload).eq("org_id", orgId);
    } else {
      await admin.from("subscriptions").insert(upsertPayload);
    }

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        razorpay_key_id: RZP_KEY_ID,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-subscription]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
