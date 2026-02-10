import { type QuoteLine } from "@/lib/pricing";
import { PLANS, ADDONS } from "@/lib/pricing-catalog";

interface ProjectInput {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  budget?: number | null;
  tasks?: { title: string; status: string }[];
}

interface ExpenseInput {
  id: string;
  category: string;
  amount: number;
  description: string;
  vendor?: string | null;
  passThroughPolicy: string;
  markupPercent: number;
}

// Build catalog context string for the AI
function buildCatalogContext(): string {
  const planLines = PLANS.map((p) => {
    const setup = p.setupFee
      ? `$${p.setupFee}`
      : p.setupTiers
        ? `$${p.setupTiers[0].fee}–$${p.setupTiers[p.setupTiers.length - 1].fee}`
        : "N/A";
    const monthly = p.monthlyFee
      ? `$${p.monthlyFee}/mo`
      : p.monthlyTiers
        ? `$${p.monthlyTiers[0].fee}–$${p.monthlyTiers[p.monthlyTiers.length - 1].fee}/mo`
        : "N/A";
    return `  - "${p.name}" (id: ${p.id}): Setup ${setup}, Monthly ${monthly}. Includes: ${p.includes.join(", ")}`;
  }).join("\n");

  const addonLines = ADDONS.map((a) => {
    const parts: string[] = [`"${a.name}" (id: ${a.id})`];
    if (a.setupFee) parts.push(`Setup: $${a.setupFee}`);
    if (a.setupTiers)
      parts.push(
        `Setup: $${a.setupTiers[0].fee}–$${a.setupTiers[a.setupTiers.length - 1].fee}`
      );
    if (a.monthlyTiers)
      parts.push(
        `Monthly: $${a.monthlyTiers[0].fee}–$${a.monthlyTiers[a.monthlyTiers.length - 1].fee}/mo`
      );
    if (a.oneTimeTiers)
      parts.push(
        `One-time: $${a.oneTimeTiers[0].fee}–$${a.oneTimeTiers[a.oneTimeTiers.length - 1].fee}`
      );
    if (a.hourlyRate) parts.push(`$${a.hourlyRate}/hr`);
    return `  - ${parts.join(", ")}`;
  }).join("\n");

  return `PRICING CATALOG (use these exact prices when a project matches a catalog plan):
Plans:
${planLines}

Add-Ons:
${addonLines}`;
}

export async function suggestPricing(
  projects: ProjectInput[],
  expenses: ExpenseInput[],
  clientName: string
): Promise<QuoteLine[]> {
  const catalogContext = buildCatalogContext();

  const systemPrompt = `You are a pricing assistant for Simply Automations, a digital automation agency. Given completed projects and expenses for a client, generate structured pricing line items.

${catalogContext}

PRICING RULES:
1. CATALOG MATCH: If a project name contains a catalog plan name (e.g. "Foundation System", "Momentum System", "Command System"), use the EXACT catalog prices:
   - Create a "project" line for the setup fee (one-time)
   - Create a "retainer" line for the monthly recurring fee
   - If the project includes add-ons (check description or notes), add those at catalog rates too

2. BUDGET SET: If the project has a budget set and does NOT match a catalog plan, use the budget as the price.

3. NO BUDGET, NO CATALOG MATCH: Estimate based on project type and tasks:
   - "Website Build": $2,000–$15,000+ (simple landing page ~$3k, multi-page ~$6k, complex ~$10k+)
   - "Automation Build": $1,500–$10,000+ (simple workflow ~$2k, multi-system ~$5k, complex ~$8k+)
   - "Custom": price based on task count and complexity
   - Use the task list to gauge complexity: more tasks = higher end of range
   - Break into meaningful sub-deliverables when appropriate

4. EXPENSES: Follow pass-through policies exactly:
   - pass_through_at_cost: use exact expense amount
   - markup_percent: apply the markup percentage

FORMATTING:
- All amounts in USD cents (integer). $100 = 10000 cents
- quantity = 1 for fixed-price items
- unitLabel = "fixed" for one-time deliverables, "months" for recurring
- groupKey = project name or expense category

You MUST respond with ONLY a valid JSON array of quote line objects. No markdown, no explanation.

Each object must have exactly these fields:
- kind: "project" | "expense" | "retainer" | "discount" | "adjustment"
- sourceId: the original item ID (string) or null
- title: descriptive title (string)
- description: optional detail (string or omit)
- quantity: number (>= 0)
- unitLabel: string (e.g. "fixed", "hours", "months")
- unitAmountCents: integer (>= 0)
- taxable: false
- groupKey: string for grouping
- notesInternal: optional internal note (string or omit)
- notesClient: optional client-facing note (string or omit)`;

  const userPrompt = `Generate pricing for client "${clientName}":

Projects:
${projects
  .map((p) => {
    let line = `- ID: ${p.id}, Name: "${p.name}", Type: ${p.type}`;
    if (p.budget) line += `, Budget: $${p.budget}`;
    if (p.description) line += `, Description: ${p.description}`;
    if (p.tasks && p.tasks.length > 0) {
      const completed = p.tasks.filter(
        (t) => t.status === "completed" || t.status === "done"
      );
      line += `, Tasks (${completed.length} completed of ${p.tasks.length}): [${p.tasks.map((t) => t.title).join(", ")}]`;
    }
    return line;
  })
  .join("\n")}

Expenses:
${
  expenses.length > 0
    ? expenses
        .map(
          (e) =>
            `- ID: ${e.id}, Category: ${e.category}, Amount: $${e.amount}, Description: "${e.description}"${e.vendor ? `, Vendor: ${e.vendor}` : ""}, Policy: ${e.passThroughPolicy}${e.markupPercent > 0 ? `, Markup: ${e.markupPercent}%` : ""}`
        )
        .join("\n")
    : "No expenses"
}

Return ONLY the JSON array.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("No response from AI");
  }

  // Parse the JSON response - strip markdown code fences if present
  let cleanContent = content;
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleanContent);

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array");
  }

  // Ensure each line has required defaults
  return parsed.map((line: Record<string, unknown>) => ({
    kind: line.kind || "project",
    sourceId: line.sourceId || null,
    title: line.title || "Untitled",
    description: line.description || undefined,
    quantity: typeof line.quantity === "number" ? line.quantity : 1,
    unitLabel: line.unitLabel || "fixed",
    unitAmountCents:
      typeof line.unitAmountCents === "number"
        ? Math.round(line.unitAmountCents)
        : 0,
    taxable: false,
    groupKey: line.groupKey || "General",
    notesInternal: line.notesInternal || undefined,
    notesClient: line.notesClient || undefined,
  })) as QuoteLine[];
}
