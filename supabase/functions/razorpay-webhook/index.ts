// Razorpay webhook receiver. HMAC-verified. Updates subscription state and triggers invoice generation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    if (!signature || !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
      console.error("[razorpay-webhook] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    console.log("[razorpay-webhook] Event:", eventType);

    const subEntity = event.payload?.subscription?.entity;
    const paymentEntity = event.payload?.payment?.entity;
    const subscriptionId = subEntity?.id || paymentEntity?.subscription_id;
    const customerId = subEntity?.customer_id || paymentEntity?.customer_id;

    // Resolve our subscription row. Try by subscription_id first, then fall back
    // to customer_id (handles payment.failed events that arrive without a sub_id).
    let sub: any = null;
    if (subscriptionId) {
      const { data } = await admin
        .from("subscriptions")
        .select("*")
        .eq("razorpay_subscription_id", subscriptionId)
        .maybeSingle();
      sub = data;
    }
    if (!sub && customerId) {
      const { data } = await admin
        .from("subscriptions")
        .select("*")
        .eq("razorpay_customer_id", customerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      sub = data;
    }

    if (!sub) {
      console.log("[razorpay-webhook] No matching subscription row. sub_id:", subscriptionId, "cust_id:", customerId, "event:", eventType);
      return new Response(JSON.stringify({ ok: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, any> = {};

    switch (eventType) {
      case "subscription.authenticated": {
        // Mandate authorized (₹1–₹5 auth succeeded). Trial officially starts now.
        // If trial_end is in the future, mark trialing; else active.
        const trialEndMs = sub.trial_end ? new Date(sub.trial_end).getTime() : 0;
        updates.status = trialEndMs > Date.now() ? "trialing" : "active";
        if (subEntity?.current_start) updates.current_period_start = new Date(subEntity.current_start * 1000).toISOString();
        if (subEntity?.current_end) updates.current_period_end = new Date(subEntity.current_end * 1000).toISOString();
        break;
      }
      case "subscription.activated": {
        updates.status = "active";
        if (subEntity?.current_start) updates.current_period_start = new Date(subEntity.current_start * 1000).toISOString();
        if (subEntity?.current_end) updates.current_period_end = new Date(subEntity.current_end * 1000).toISOString();
        break;
      }
      case "subscription.charged": {
        updates.status = "active";
        if (subEntity?.current_start) updates.current_period_start = new Date(subEntity.current_start * 1000).toISOString();
        if (subEntity?.current_end) updates.current_period_end = new Date(subEntity.current_end * 1000).toISOString();

        // Trigger invoice generation for the payment
        if (paymentEntity?.id) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SERVICE_ROLE}`,
              },
              body: JSON.stringify({
                org_id: sub.org_id,
                subscription_id: sub.id,
                razorpay_payment_id: paymentEntity.id,
                amount_paise: paymentEntity.amount,
              }),
            });
          } catch (e) {
            console.error("[razorpay-webhook] Invoice trigger failed:", e);
          }
        }
        break;
      }
      case "subscription.cancelled":
      case "subscription.completed": {
        updates.status = "cancelled";
        updates.cancelled_at = new Date().toISOString();
        break;
      }
      case "subscription.halted":
      case "subscription.paused": {
        updates.status = "halted";
        break;
      }
      case "subscription.pending": {
        updates.status = "past_due";
        break;
      }
      case "payment.failed": {
        // Mandate auth or charge failed. If subscription is still in `created`
        // (mandate never authenticated), reset to `expired` so create-subscription
        // will allow a fresh attempt instead of reusing the stale row.
        if (sub.status === "created") {
          updates.status = "expired";
          console.log("[razorpay-webhook] Resetting stale created row to expired for org:", sub.org_id);
        } else if (sub.status === "active" || sub.status === "trialing") {
          updates.status = "past_due";
        }
        break;
      }
    }

    if (Object.keys(updates).length > 0) {
      await admin.from("subscriptions").update(updates).eq("id", sub.id);
      console.log("[razorpay-webhook] Updated sub", sub.id, "→", updates);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[razorpay-webhook] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
