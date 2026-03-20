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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Check role
    const { data: member } = await serviceClient
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!member || member.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can restore backups" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = member.org_id;

    const { backup_id } = await req.json();
    if (!backup_id) {
      return new Response(JSON.stringify({ error: "backup_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the backup
    const { data: backup, error: fetchErr } = await serviceClient
      .from("backups")
      .select("*")
      .eq("id", backup_id)
      .eq("org_id", orgId)
      .single();

    if (fetchErr || !backup) {
      return new Response(JSON.stringify({ error: "Backup not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = backup.snapshot as any;

    // Delete current org data (order matters for foreign keys)
    // project_documents references projects, transactions references categories/projects
    await serviceClient.from("project_documents").delete().eq("org_id", orgId);
    await serviceClient.from("transactions").delete().eq("org_id", orgId);
    await serviceClient.from("projects").delete().eq("org_id", orgId);
    await serviceClient.from("categories").delete().eq("org_id", orgId);
    await serviceClient.from("vendors").delete().eq("org_id", orgId);
    await serviceClient.from("partners").delete().eq("org_id", orgId);
    await serviceClient.from("project_labels").delete().eq("org_id", orgId);

    // Re-insert from snapshot (order: independent tables first, then dependent)
    const insertIfPresent = async (table: string, rows: any[]) => {
      if (rows && rows.length > 0) {
        const { error } = await serviceClient.from(table).insert(rows);
        if (error) {
          console.error(`Error inserting ${table}:`, error);
          throw new Error(`Failed to restore ${table}: ${error.message}`);
        }
      }
    };

    await insertIfPresent("categories", snapshot.categories || []);
    await insertIfPresent("vendors", snapshot.vendors || []);
    await insertIfPresent("partners", snapshot.partners || []);
    await insertIfPresent("project_labels", snapshot.project_labels || []);
    await insertIfPresent("projects", snapshot.projects || []);
    await insertIfPresent("transactions", snapshot.transactions || []);
    await insertIfPresent("project_documents", snapshot.project_documents || []);

    // Update profiles from snapshot (don't delete/recreate — just update fields)
    if (snapshot.profiles && snapshot.profiles.length > 0) {
      for (const profile of snapshot.profiles) {
        await serviceClient
          .from("profiles")
          .update({
            name: profile.name,
            avatar_url: profile.avatar_url,
            theme: profile.theme,
            onboarding_completed: profile.onboarding_completed,
          })
          .eq("user_id", profile.user_id)
          .eq("org_id", orgId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Backup restored successfully",
        counts: {
          transactions: (snapshot.transactions || []).length,
          categories: (snapshot.categories || []).length,
          vendors: (snapshot.vendors || []).length,
          projects: (snapshot.projects || []).length,
          partners: (snapshot.partners || []).length,
          labels: (snapshot.project_labels || []).length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Restore error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
