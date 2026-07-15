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
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Return total income, total expense, and net balance for the caller's organization in an optional date range. Excludes internal transfers by convention (transfers are typically tagged with the vendor 'Internal Transfer', 'Self Transfer', or 'Company Bank Account').",
  inputSchema: {
    from_date: z.string().optional().describe("Inclusive start date (YYYY-MM-DD)."),
    to_date: z.string().optional().describe("Inclusive end date (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("transactions")
      .select("type, amount, vendor")
      .range(0, 9999);
    if (from_date) q = q.gte("date", from_date);
    if (to_date) q = q.lte("date", to_date);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const TRANSFER_VENDORS = new Set([
      "Internal Transfer",
      "Self Transfer",
      "Company Bank Account",
    ]);
    let income = 0;
    let expense = 0;
    for (const row of data ?? []) {
      if (row.vendor && TRANSFER_VENDORS.has(row.vendor)) continue;
      const amt = Number(row.amount) || 0;
      if (row.type === "income") income += amt;
      else if (row.type === "expense") expense += amt;
    }
    const summary = {
      from_date: from_date ?? null,
      to_date: to_date ?? null,
      income,
      expense,
      balance: income - expense,
      count: data?.length ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
