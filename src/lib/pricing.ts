import { z } from "zod";

export const quoteLineSchema = z.object({
  kind: z.enum(["project", "expense", "retainer", "discount", "adjustment"]),
  sourceId: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unitLabel: z.string(), // "hours", "fixed", "calls", "months", etc.
  unitAmountCents: z.number().int().min(0),
  taxable: z.boolean().default(false),
  groupKey: z.string(), // project name / expense category for grouping
  notesInternal: z.string().optional(),
  notesClient: z.string().optional(),
});

export type QuoteLine = z.infer<typeof quoteLineSchema>;

export const quoteTermsSchema = z.object({
  currency: z.string().default("usd"),
  dueDate: z.string().optional(), // ISO date string
  netTermsDays: z.number().int().optional(),
  paymentMethods: z.array(z.string()).default(["card"]),
  clientMemo: z.string().optional(),
  internalMemo: z.string().optional(),
});

export type QuoteTerms = z.infer<typeof quoteTermsSchema>;

export const quoteLinesArraySchema = z.array(quoteLineSchema);

export interface QuoteTotals {
  subtotal: number; // cents
  discount: number; // cents (positive value)
  total: number; // cents
}

/**
 * Compute deterministic totals from an array of quote lines.
 * Discount lines reduce the total. All amounts are in cents.
 */
export function computeTotals(lines: QuoteLine[]): QuoteTotals {
  let subtotal = 0;
  let discount = 0;

  for (const line of lines) {
    const lineTotal = line.quantity * line.unitAmountCents;
    if (line.kind === "discount") {
      discount += lineTotal;
    } else {
      subtotal += lineTotal;
    }
  }

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  };
}

/**
 * Convert cents to dollars for display.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents for storage.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format cents as a USD currency string.
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Group quote lines by their groupKey for display.
 */
export function groupLinesByKey(
  lines: QuoteLine[]
): Record<string, QuoteLine[]> {
  const groups: Record<string, QuoteLine[]> = {};
  for (const line of lines) {
    const key = line.groupKey || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(line);
  }
  return groups;
}
