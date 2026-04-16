import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOGO_URL = "https://bright-balance-beam.lovable.app/app-icon-192.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getEmailContent(actionType: string, name: string, actionUrl: string) {
  const configs: Record<string, { subject: string; heading: string; body: string; buttonText: string }> = {
    signup: {
      subject: "Verify Your Email – FinTrack+",
      heading: "Verify Your Email",
      body: `Welcome to FinTrack+! Please verify your email address to get started.`,
      buttonText: "Verify Email",
    },
    recovery: {
      subject: "Reset Your Password – FinTrack+",
      heading: "Reset Your Password",
      body: `We received a request to reset your password. Click the button below to set a new one.`,
      buttonText: "Reset Password",
    },
    magic_link: {
      subject: "Your Login Link – FinTrack+",
      heading: "Your Login Link",
      body: `Click the button below to sign in to your FinTrack+ account.`,
      buttonText: "Sign In",
    },
    email_change: {
      subject: "Confirm Email Change – FinTrack+",
      heading: "Confirm Email Change",
      body: `We received a request to change your email address. Click the button below to confirm.`,
      buttonText: "Confirm Change",
    },
    reauthentication: {
      subject: "Confirm Your Identity – FinTrack+",
      heading: "Confirm Your Identity",
      body: `Please confirm your identity by clicking the button below.`,
      buttonText: "Confirm Identity",
    },
  };

  const config = configs[actionType] || configs.recovery;

  return {
    subject: config.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1665B8,#114E91);">
              <img src="${LOGO_URL}" alt="FinTrack+" width="56" height="56" style="border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">FinTrack+</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#18181b;">${config.heading}</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">Hi ${name},</p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#52525b;">${config.body}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1665B8,#114E91);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                      ${config.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;text-align:center;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">An app by <strong>Saffron Events</strong></p>
              <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">
                <a href="https://fintrackplus.com" style="color:#1665B8;text-decoration:none;">fintrackplus.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, redirectTo } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Missing email or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to generate secure link
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up user to get their name
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = userData?.users?.find((u) => u.email === email);
    const name = foundUser?.user_metadata?.name || "there";

    // Generate secure action link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: type === "recovery" ? "recovery" : "magiclink",
      email,
      options: {
        redirectTo: redirectTo || "https://fintrackplus.com/reset-password",
      },
    });

    if (linkError || !linkData) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Failed to generate link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actionUrl = linkData.properties?.action_link;
    if (!actionUrl) {
      console.error("No action_link in response:", linkData);
      return new Response(
        JSON.stringify({ error: "No action link generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = getEmailContent(type, name, actionUrl);

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FinTrack+ <no-reply@fintrackplus.com>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errorBody = await resendRes.text();
      console.error("Resend error:", errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendRes.json();
    console.log("Branded email sent successfully:", resendData.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
