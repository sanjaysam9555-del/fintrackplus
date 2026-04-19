// Cancels Razorpay subscription at period end. Owner-only.
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
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: member } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (!member || member.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can cancel" }), { status: 403, headers: corsHeaders });
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("org_id", member.org_id)
      .maybeSingle();
    if (!sub?.razorpay_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription" }), { status: 404, headers: corsHeaders });
    }

    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`),
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      }
    );
    const data = await res.json();

    // Razorpay refuses to "cancel" a sub that has no active billing cycle
    // (trial never authenticated, already cancelled/expired, or completed).
    // Treat as success — mark DB terminal so the UI moves on.
    const noCycle =
      !res.ok &&
      data?.error?.code === "BAD_REQUEST_ERROR" &&
      typeof data?.error?.description === "string" &&
      data.error.description.toLowerCase().includes("no billing cycle");

    if (!res.ok && !noCycle) {
      throw new Error(`Razorpay cancel failed: ${JSON.stringify(data)}`);
    }

    await admin
      .from("subscriptions")
      .update(
        noCycle
          ? { status: "cancelled", cancel_at_period_end: false, cancelled_at: new Date().toISOString() }
          : { cancel_at_period_end: true }
      )
      .eq("org_id", member.org_id);

    // Send branded confirmation email (best-effort, don't fail the cancel if email fails)
    try {
      const { data: userRow } = await admin.auth.admin.getUserById(userId);
      const email = userRow?.user?.email;
      const name = userRow?.user?.user_metadata?.name || "there";

      // If noCycle (trial never authenticated / already terminal) → access ends immediately.
      // Otherwise, access continues until current_period_end.
      const accessUntil = noCycle ? null : (sub.current_period_end ?? null);

      if (email) {
        const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            email,
            type: "subscription_cancelled",
            name,
            accessUntil,
          }),
        });
        if (!emailRes.ok) {
          console.error("[cancel-subscription] email send failed:", await emailRes.text());
        }
      }
    } catch (emailErr) {
      console.error("[cancel-subscription] email error (non-fatal):", emailErr);
    }

    return new Response(
      JSON.stringify({ ok: true, already_inactive: noCycle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[cancel-subscription]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
