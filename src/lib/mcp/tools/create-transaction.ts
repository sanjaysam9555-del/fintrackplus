import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "create_transaction",
  title: "Create transaction",
  description:
    "Create an income or expense entry in FinTrack+ for the signed-in user's organization. Amount is in the org's currency (INR).",
  inputSchema: {
    type: z.enum(["income", "expense"]).describe("Transaction type."),
    amount: z.number().positive().describe("Amount, must be positive."),
    vendor: z.string().min(1).describe("Vendor or payer name."),
    category_id: z.string().uuid().describe("Category ID (see list_categories)."),
    payment_method: z.enum(["cash", "online"]).describe("Payment method."),
    date: z.string().describe("Date in YYYY-MM-DD (local timezone)."),
    time: z.string().optional().describe("Time in HH:mm (24h). Defaults to now."),
    title: z.string().optional(),
    project_id: z.string().uuid().optional(),
    handled_by: z.string().optional().describe("Partner or company account handle."),
    notes: z.string().optional(),
    is_gst: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    // Resolve org_id via RPC — required for RLS.
    const { data: orgId, error: orgErr } = await sb.rpc("get_user_org_id", { _user_id: userId });
    if (orgErr || !orgId) {
      return { content: [{ type: "text", text: "Could not resolve organization for user." }], isError: true };
    }
    const row = {
      type: input.type,
      amount: input.amount,
      vendor: input.vendor,
      category_id: input.category_id,
      payment_method: input.payment_method,
      date: input.date,
      time: input.time ?? new Date().toTimeString().slice(0, 5),
      title: input.title ?? null,
      project_id: input.project_id ?? null,
      handled_by: input.handled_by ?? null,
      notes: input.notes ?? null,
      is_gst: input.is_gst ?? false,
      user_id: userId,
      org_id: orgId,
    };
    const { data, error } = await sb.from("transactions").insert(row).select().single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created transaction ${data.id}` }],
      structuredContent: { transaction: data },
    };
  },
});
