import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { org_id, label, created_by } = body;

    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all org data in parallel
    const [
      transactions,
      categories,
      vendors,
      projects,
      partners,
      projectLabels,
      profiles,
      orgMembers,
      projectDocuments,
    ] = await Promise.all([
      supabase.from("transactions").select("*").eq("org_id", org_id),
      supabase.from("categories").select("*").eq("org_id", org_id),
      supabase.from("vendors").select("*").eq("org_id", org_id),
      supabase.from("projects").select("*").eq("org_id", org_id),
      supabase.from("partners").select("*").eq("org_id", org_id),
      supabase.from("project_labels").select("*").eq("org_id", org_id),
      supabase.from("profiles").select("*").eq("org_id", org_id),
      supabase.from("org_members").select("*").eq("org_id", org_id),
      supabase.from("project_documents").select("*").eq("org_id", org_id),
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

    const { data, error } = await supabase.from("backups").insert({
      org_id,
      created_by: created_by || "00000000-0000-0000-0000-000000000000",
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
