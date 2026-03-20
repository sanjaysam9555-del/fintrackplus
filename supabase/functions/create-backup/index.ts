import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { label, created_by } = body;

    let orgId: string | null = null;
    let userId: string | null = null;

    // Check for auth header (manual UI calls)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);

      if (claimsErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = claims.claims.sub as string;

      // Verify owner role
      const { data: member } = await serviceClient
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (!member || member.role !== "owner") {
        return new Response(JSON.stringify({ error: "Only owners can create backups" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      orgId = member.org_id;
    } else {
      // No auth header — pg_cron scheduled call, trust body org_id
      orgId = body.org_id;
    }

    if (!orgId) {
      return new Response(JSON.stringify({ error: "org_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all org data in parallel
    const [
      transactions, categories, vendors, projects,
      partners, projectLabels, profiles, orgMembers, projectDocuments,
    ] = await Promise.all([
      serviceClient.from("transactions").select("*").eq("org_id", orgId),
      serviceClient.from("categories").select("*").eq("org_id", orgId),
      serviceClient.from("vendors").select("*").eq("org_id", orgId),
      serviceClient.from("projects").select("*").eq("org_id", orgId),
      serviceClient.from("partners").select("*").eq("org_id", orgId),
      serviceClient.from("project_labels").select("*").eq("org_id", orgId),
      serviceClient.from("profiles").select("*").eq("org_id", orgId),
      serviceClient.from("org_members").select("*").eq("org_id", orgId),
      serviceClient.from("project_documents").select("*").eq("org_id", orgId),
    ]);

    const snapshot = {
      transactions: transactions.data || [],
      categories: categories.data || [],
      vendors: vendors.data || [],
      projects: projects.data || [],
      partners: partners.data || [],
      project_labels: projectLabels.data || [],
      profiles: profiles.data || [],
      org_members: orgMembers.data || [],
      project_documents: projectDocuments.data || [],
    };

    const backupLabel =
      label ||
      `Manual Backup — ${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })}`;

    const { data, error } = await serviceClient.from("backups").insert({
      org_id: orgId,
      created_by: userId || created_by || "00000000-0000-0000-0000-000000000000",
      snapshot,
      label: backupLabel,
    }).select("id, label, created_at").single();

    if (error) {
      console.error("Backup insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup: data,
        counts: {
          transactions: (transactions.data || []).length,
          categories: (categories.data || []).length,
          vendors: (vendors.data || []).length,
          projects: (projects.data || []).length,
          partners: (partners.data || []).length,
          labels: (projectLabels.data || []).length,
          profiles: (profiles.data || []).length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Backup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
