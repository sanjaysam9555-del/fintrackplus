// Owner updates GSTIN / business name / address for tax invoices.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
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
      return new Response(JSON.stringify({ error: "Only owners can update billing details" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const updates: Record<string, string | null> = {
      customer_gstin: body.customer_gstin?.toUpperCase().trim() || null,
      customer_business_name: body.customer_business_name?.trim() || null,
      customer_address: body.customer_address?.trim() || null,
      customer_state_code: body.customer_state_code?.trim() || null,
    };

    // Validate GSTIN format if provided (15 chars, alphanumeric)
    if (updates.customer_gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(updates.customer_gstin)) {
      return new Response(JSON.stringify({ error: "Invalid GSTIN format" }), { status: 400, headers: corsHeaders });
    }

    // Upsert subscription row (creates an empty placeholder if missing)
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id")
      .eq("org_id", member.org_id)
      .maybeSingle();

    if (existing) {
      await admin.from("subscriptions").update(updates).eq("org_id", member.org_id);
    } else {
      await admin.from("subscriptions").insert({ org_id: member.org_id, status: "trialing", trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), ...updates });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[update-billing-details]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
