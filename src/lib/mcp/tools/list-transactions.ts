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
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's FinTrack+ transactions. Optionally filter by type, project, or date range. Results are scoped to the caller's organization via RLS.",
  inputSchema: {
    type: z.enum(["income", "expense"]).optional().describe("Filter by transaction type."),
    project_id: z.string().uuid().optional().describe("Filter by project ID."),
    from_date: z.string().optional().describe("Inclusive start date (YYYY-MM-DD)."),
    to_date: z.string().optional().describe("Inclusive end date (YYYY-MM-DD)."),
    limit: z.number().int().positive().optional().describe("Max rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, project_id, from_date, to_date, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const cap = Math.min(Math.max(limit ?? 50, 1), 200);
    let q = supabaseForUser(ctx)
      .from("transactions")
      .select("id, type, amount, title, vendor, project_id, handled_by, payment_method, date, time, notes, is_gst")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(cap);
    if (type) q = q.eq("type", type);
    if (project_id) q = q.eq("project_id", project_id);
    if (from_date) q = q.gte("date", from_date);
    if (to_date) q = q.lte("date", to_date);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
