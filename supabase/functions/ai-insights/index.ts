import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const payload = await req.json();

    const systemPrompt = `You are a senior financial analyst for small Indian businesses (wedding planners, agencies, freelancers). You receive a pre-aggregated financial summary and must generate 3-7 deep, actionable insights.

Analyze the data across these 7 categories (pick only the ones where you have enough data to say something meaningful):

1. **Liquidity Paradox** – Cash vs digital balance mismatches. Are they cash-heavy but digitally poor (or vice versa)? Who handles what?
2. **Profitability Scaling** – Do larger projects have shrinking margins? Is there a "big-ticket trap"?
3. **Vendor Concentration** – How much spend goes to top vendors? Is there negotiation leverage?
4. **Partner Specialization** – Do partners have distinct financial roles (ops vs execution)?
5. **Dead Money** – Are there non-operational losses, back-expenses, or investment write-offs dragging down the bottom line?
6. **GST Compliance** – What % of transactions are GST-tagged? Is this a growth ceiling?
7. **Seasonality & Cash Burn** – Are there months where expenses exceed income? Is there a rolling cash flow risk?

Guidelines:
- Use the Indian Rupee symbol ₹ and Indian number formatting (L for lakhs, K for thousands)
- Be specific with numbers from the data — cite exact amounts
- Each insight should have a clear title, the category it belongs to, severity (info/warning/critical), a detailed body paragraph, and one actionable tip
- Don't generate insights for categories where the data is insufficient
- Write in a professional but conversational tone, as if briefing a business owner
- The body should be 2-4 sentences with specific numbers
- The actionable_tip should be one concrete next step`;

    const userPrompt = `Here is the financial summary data to analyze:\n\n${JSON.stringify(payload, null, 2)}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_insights",
                description:
                  "Return an array of 3-7 financial deep insights based on the data analysis.",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: {
                            type: "string",
                            description:
                              "A compelling, specific title for the insight",
                          },
                          category: {
                            type: "string",
                            enum: [
                              "liquidity",
                              "profitability",
                              "vendor_concentration",
                              "partner_specialization",
                              "dead_money",
                              "gst_compliance",
                              "seasonality",
                            ],
                          },
                          severity: {
                            type: "string",
                            enum: ["info", "warning", "critical"],
                          },
                          body: {
                            type: "string",
                            description:
                              "2-4 sentence detailed analysis with specific numbers",
                          },
                          actionable_tip: {
                            type: "string",
                            description: "One concrete next step",
                          },
                        },
                        required: [
                          "title",
                          "category",
                          "severity",
                          "body",
                          "actionable_tip",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["insights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_insights" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a minute.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Please add funds in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();

    // Extract tool call arguments
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      // Fallback: try to parse content directly
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          return new Response(JSON.stringify(parsed.insights || []), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          // ignore
        }
      }
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args.insights || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
