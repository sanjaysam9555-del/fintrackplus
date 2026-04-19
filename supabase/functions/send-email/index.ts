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

function renderEmail(opts: {
  heading: string;
  name: string;
  bodyHtml: string;
  buttonText?: string;
  actionUrl?: string;
  footerNote?: string;
}) {
  const { heading, name, bodyHtml, buttonText, actionUrl, footerNote } = opts;
  const cta = buttonText && actionUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0">
         <tr><td align="center">
           <a href="${actionUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1665B8,#114E91);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
             ${buttonText}
           </a>
         </td></tr>
       </table>`
    : "";
  const note = footerNote
    ? `<p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">${footerNote}</p>`
    : "";
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1665B8,#114E91);">
          <img src="${LOGO_URL}" alt="FinTrack+" width="56" height="56" style="border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">FinTrack+</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#18181b;">${heading}</h2>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">Hi ${name},</p>
          <div style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#52525b;">${bodyHtml}</div>
          ${cta}
          ${note}
        </td></tr>
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">An app by <strong>Saffron Events</strong></p>
          <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">
            <a href="https://fintrackplus.com" style="color:#1665B8;text-decoration:none;">fintrackplus.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function getAuthEmailContent(actionType: string, name: string, actionUrl: string) {
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
    html: renderEmail({
      heading: config.heading,
      name,
      bodyHtml: `<p style="margin:0;">${config.body}</p>`,
      buttonText: config.buttonText,
      actionUrl,
      footerNote: "If you didn't request this, you can safely ignore this email.",
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { email, type, redirectTo } = payload;

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Missing email or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let subject: string;
    let html: string;

    // Branded transactional emails (non-auth)
    if (type === "subscription_cancelled") {
      const name = payload.name || "there";
      const accessUntil = payload.accessUntil as string | null; // ISO date or null
      const immediate = !accessUntil;
      const formatted = accessUntil
        ? new Date(accessUntil).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          })
        : null;

      subject = immediate
        ? "Your FinTrack+ trial has been cancelled"
        : "Your FinTrack+ subscription has been cancelled";

      const bodyHtml = immediate
        ? `<p style="margin:0 0 12px;">Your FinTrack+ trial has been cancelled and access has ended immediately. We're sorry to see you go.</p>
           <p style="margin:0;">You can resubscribe anytime to restore full access to your data.</p>`
        : `<p style="margin:0 0 12px;">Your FinTrack+ subscription has been cancelled. You'll continue to have full access until <strong>${formatted}</strong>.</p>
           <p style="margin:0;">After that date, your account will move to a read-only state. Your data stays safe — resubscribe anytime to restore full access.</p>`;

      html = renderEmail({
        heading: immediate ? "Trial Cancelled" : "Subscription Cancelled",
        name,
        bodyHtml,
        buttonText: "Manage Subscription",
        actionUrl: "https://fintrackplus.com/application/billing",
        footerNote: "If this wasn't you, please contact support immediately.",
      });
    } else {
      // Auth emails (signup / recovery / magic_link / etc.)
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const foundUser = userData?.users?.find((u) => u.email === email);
      const name = foundUser?.user_metadata?.name || "there";

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
        return new Response(
          JSON.stringify({ error: "No action link generated" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const content = getAuthEmailContent(type, name, actionUrl);
      subject = content.subject;
      html = content.html;
    }

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
    console.log("Branded email sent successfully:", resendData.id, "type:", type);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
