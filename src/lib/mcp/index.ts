import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactions from "./tools/list-transactions";
import createTransaction from "./tools/create-transaction";
import financialSummary from "./tools/financial-summary";
import listProjects from "./tools/list-projects";
import listCategories from "./tools/list-categories";
import listPartners from "./tools/list-partners";

// Build the OAuth issuer from the project ref so it always points at the direct
// Supabase host (not the Lovable Cloud proxy). Vite inlines this at build time,
// so the entry stays import-safe (no runtime env reads at module top level).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fintrackplus-mcp",
  title: "FinTrack⁺",
  version: "0.1.0",
  instructions:
    "Tools to read and manage FinTrack⁺ finances for the signed-in user: list transactions, create income/expense entries, summarize income/expense, and inspect projects, categories, and partners. All data is scoped to the caller's organization via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTransactions,
    createTransaction,
    financialSummary,
    listProjects,
    listCategories,
    listPartners,
  ],
});
