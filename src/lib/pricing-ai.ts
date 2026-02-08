import { type QuoteLine } from "@/lib/pricing";

interface ProjectInput {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  budget?: number | null;
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

export async function suggestPricing(
  projects: ProjectInput[],
  expenses: ExpenseInput[],
  clientName: string
): Promise<QuoteLine[]> {
  const systemPrompt = `You are a pricing assistant for a digital services agency. Given completed projects and expenses for a client, generate structured pricing line items.

Rules:
- Each project should become a quote line with kind "project"
- Each expense should become a quote line with kind "expense"
- Use the project budget as a starting point for project pricing if available
- For expenses with pass_through_at_cost policy, use the exact expense amount
- For expenses with markup_percent policy, apply the markup
- All amounts must be in USD cents (integer). $100 = 10000 cents
- quantity should be 1 for fixed-price items
- unitLabel should be "fixed" for project deliverables, or describe the unit
- groupKey should be the project name or expense category
- Be reasonable with pricing - don't inflate or deflate significantly

You MUST respond with ONLY a valid JSON array of quote line objects. No markdown, no explanation, just the JSON array.

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
${projects.map((p) => `- ID: ${p.id}, Name: "${p.name}", Type: ${p.type}${p.budget ? `, Budget: $${p.budget}` : ""}${p.description ? `, Description: ${p.description}` : ""}`).join("\n")}

Expenses:
${expenses.length > 0 ? expenses.map((e) => `- ID: ${e.id}, Category: ${e.category}, Amount: $${e.amount}, Description: "${e.description}"${e.vendor ? `, Vendor: ${e.vendor}` : ""}, Policy: ${e.passThroughPolicy}${e.markupPercent > 0 ? `, Markup: ${e.markupPercent}%` : ""}`).join("\n") : "No expenses"}

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
