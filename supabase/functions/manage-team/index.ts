import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated and is an owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub as string;

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get caller's org membership
    const { data: callerMember, error: callerError } = await adminClient
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", callerUserId)
      .eq("status", "active")
      .single();

    if (callerError || !callerMember) {
      return new Response(
        JSON.stringify({ error: "You are not a member of any organization" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (callerMember.role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only owners can manage team members" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orgId = callerMember.org_id;
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list_members": {
        // Fetch org members with profiles and emails
        const { data: orgMembers, error: membersError } = await adminClient
          .from("org_members")
          .select("id, user_id, role, status, created_at")
          .eq("org_id", orgId);

        if (membersError) {
          return new Response(JSON.stringify({ error: membersError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const enrichedMembers = [];
        for (const m of orgMembers || []) {
          // Get profile
          const { data: profile } = await adminClient
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", m.user_id)
            .maybeSingle();

          // Get email from auth.users
          const { data: authUser } = await adminClient.auth.admin.getUserById(m.user_id);

          // Get linked partner
          const { data: partners } = await adminClient
            .from("partners")
            .select("id, name")
            .eq("user_id", m.user_id)
            .eq("org_id", orgId);

          enrichedMembers.push({
            ...m,
            profile: {
              name: profile?.name || authUser?.user?.user_metadata?.name || "Unknown",
              email: authUser?.user?.email || null,
              avatar_url: profile?.avatar_url || null,
            },
            linkedPartner: partners && partners.length > 0 ? { id: partners[0].id, name: partners[0].name } : null,
          });
        }

        return new Response(JSON.stringify({ members: enrichedMembers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      case "create_member": {
        const { email, name, role, existingPartnerId } = body;

        if (!email || !name || !role) {
          return new Response(
            JSON.stringify({ error: "Email, name, and role are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (!["owner", "admin", "employee"].includes(role)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Check member count
        const { count } = await adminClient
          .from("org_members")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId);

        const { data: org } = await adminClient
          .from("organizations")
          .select("max_members")
          .eq("id", orgId)
          .single();

        if (count !== null && org && count >= org.max_members) {
          return new Response(
            JSON.stringify({
              error: `Maximum ${org.max_members} members allowed`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Generate a temporary password
        const tempPassword =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-4).toUpperCase() +
          "!1";

        let userId: string;

        // Check if a user with this email already exists (e.g. previously banned)
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u: any) => u.email === email
        );

        if (existingUser) {
          // If user is banned, reactivate them
          if (existingUser.banned_until && new Date(existingUser.banned_until) > new Date()) {
            const { error: updateErr } = await adminClient.auth.admin.updateUserById(
              existingUser.id,
              {
                ban_duration: "none",
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name },
              }
            );
            if (updateErr) {
              return new Response(
                JSON.stringify({ error: updateErr.message }),
                {
                  status: 400,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
            userId = existingUser.id;
          } else {
            // User exists and is active — genuine duplicate
            return new Response(
              JSON.stringify({ error: "A user with this email address is already active" }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else {
          // Create new auth user
          const { data: newUser, error: createError } =
            await adminClient.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { name },
            });

          if (createError) {
            return new Response(
              JSON.stringify({ error: createError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          userId = newUser.user.id;
        }

        // Upsert org_member (handle_new_user trigger may have already inserted a row)
        const { error: memberError } = await adminClient
          .from("org_members")
          .upsert(
            {
              org_id: orgId,
              user_id: userId,
              role,
              must_change_password: true,
              status: "active",
            },
            { onConflict: "user_id", ignoreDuplicates: false }
          );

        if (memberError) {
          // Cleanup: delete the created auth user if it was new
          if (!existingUser) {
            await adminClient.auth.admin.deleteUser(userId);
          }
          return new Response(
            JSON.stringify({ error: memberError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Ensure the invited member's profile belongs to the organization being managed
        await adminClient
          .from("profiles")
          .update({ org_id: orgId, name })
          .eq("user_id", userId);

        const { data: partnerCandidates } = await adminClient
          .from("partners")
          .select("id, org_id")
          .eq("user_id", userId);

        const existingOrgPartner = partnerCandidates?.find((partner) => partner.org_id === orgId);
        const foreignOrgPartner = partnerCandidates?.find((partner) => partner.org_id !== orgId);

        // Create partner record for ALL roles (not just owners)
        if (!existingOrgPartner) {
          if (role === "owner" && existingPartnerId) {
            await adminClient
              .from("partners")
              .update({ user_id: userId })
              .eq("id", existingPartnerId)
              .eq("org_id", orgId);
          } else if (foreignOrgPartner) {
            await adminClient
              .from("partners")
              .update({ org_id: orgId, name, role })
              .eq("id", foreignOrgPartner.id);
          } else {
            await adminClient.from("partners").insert({
              user_id: userId,
              name,
              org_id: orgId,
              role,
            });
          }
        } else {
          // Update role on existing partner
          await adminClient.from("partners").update({ role }).eq("id", existingOrgPartner.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            tempPassword,
            userId,
            message: `Member ${name} created successfully`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "update_role": {
        const { memberId, newRole } = body;

        if (!memberId || !newRole) {
          return new Response(
            JSON.stringify({ error: "Member ID and new role are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Can't change own role
        const { data: targetMember } = await adminClient
          .from("org_members")
          .select("user_id, role, org_id")
          .eq("id", memberId)
          .eq("org_id", orgId)
          .single();

        if (!targetMember) {
          return new Response(
            JSON.stringify({ error: "Member not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (targetMember.user_id === callerUserId) {
          return new Response(
            JSON.stringify({ error: "Cannot change your own role" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error: updateError } = await adminClient
          .from("org_members")
          .update({ role: newRole })
          .eq("id", memberId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // If changing to owner, create partner if not exists
        if (newRole === "owner") {
          const { data: existingPartner } = await adminClient
            .from("partners")
            .select("id")
            .eq("user_id", targetMember.user_id)
            .eq("org_id", orgId)
            .maybeSingle();

          if (!existingPartner) {
            const { data: profile } = await adminClient
              .from("profiles")
              .select("name")
              .eq("user_id", targetMember.user_id)
              .single();

            await adminClient.from("partners").insert({
              user_id: targetMember.user_id,
              name: profile?.name || "Partner",
              org_id: orgId,
            });
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: "Role updated" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "remove_member": {
        const { memberId } = body;

        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Member ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: targetMember } = await adminClient
          .from("org_members")
          .select("user_id, role, org_id")
          .eq("id", memberId)
          .eq("org_id", orgId)
          .single();

        if (!targetMember) {
          return new Response(
            JSON.stringify({ error: "Member not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (targetMember.user_id === callerUserId) {
          return new Response(
            JSON.stringify({ error: "Cannot remove yourself" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Delete org_member
        const { error: removeMemberError } = await adminClient
          .from("org_members")
          .delete()
          .eq("id", memberId);

        if (removeMemberError) {
          return new Response(
            JSON.stringify({ error: removeMemberError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Delete linked partner and unassign their transactions
        const { data: linkedPartner } = await adminClient
          .from("partners")
          .select("id")
          .eq("user_id", targetMember.user_id)
          .eq("org_id", orgId)
          .maybeSingle();

        if (linkedPartner) {
          // Unassign transactions from this partner
          await adminClient
            .from("transactions")
            .update({ partner_id: null })
            .eq("partner_id", linkedPartner.id)
            .eq("org_id", orgId);

          // Delete the partner record
          await adminClient
            .from("partners")
            .delete()
            .eq("id", linkedPartner.id);
        }

        // Delete auth/profile only if this user no longer belongs to any org
        const { count: remainingMemberships, error: membershipsError } = await adminClient
          .from("org_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", targetMember.user_id);

        if (membershipsError) {
          return new Response(
            JSON.stringify({ error: membershipsError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if ((remainingMemberships ?? 0) === 0) {
          await adminClient
            .from("profiles")
            .delete()
            .eq("user_id", targetMember.user_id);

          await adminClient.auth.admin.deleteUser(targetMember.user_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Member removed" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "link_partner": {
        const { memberId, partnerId } = body;

        if (!memberId || !partnerId) {
          return new Response(
            JSON.stringify({ error: "Member ID and Partner ID are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: targetMember } = await adminClient
          .from("org_members")
          .select("user_id, role, org_id")
          .eq("id", memberId)
          .eq("org_id", orgId)
          .single();

        if (!targetMember) {
          return new Response(
            JSON.stringify({ error: "Member not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (targetMember.role !== "owner") {
          return new Response(
            JSON.stringify({ error: "Only owner members can be linked to partners" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Update the chosen partner's user_id to the target member's user_id
        const { error: linkError } = await adminClient
          .from("partners")
          .update({ user_id: targetMember.user_id })
          .eq("id", partnerId)
          .eq("org_id", orgId);

        if (linkError) {
          return new Response(
            JSON.stringify({ error: linkError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Partner linked successfully" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
