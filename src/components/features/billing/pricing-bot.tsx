"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
} from "lucide-react";
import { type QuoteLine, computeTotals, formatCurrency } from "@/lib/pricing";

interface Project {
  id: string;
  name: string;
  type: string;
  description: string | null;
  budget: number | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  vendor: string | null;
  passThroughPolicy: string;
  markupPercent: number;
}

interface PricingBotProps {
  clientName: string;
  projects: Project[];
  expenses: Expense[];
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
}

export default function PricingBot({
  clientName,
  projects,
  expenses,
  lines,
  onLinesChange,
}: PricingBotProps) {
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setSuggesting(true);
    setError(null);

    try {
      const res = await fetch("/api/quotes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            description: p.description,
            budget: p.budget,
          })),
          expenses: expenses.map((e) => ({
            id: e.id,
            category: e.category,
            amount: e.amount,
            description: e.description,
            vendor: e.vendor,
            passThroughPolicy: e.passThroughPolicy,
            markupPercent: e.markupPercent,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get suggestions");
      }

      const data = await res.json();
      onLinesChange(data.lines);
    } catch {
      setError("Failed to get AI pricing suggestions. You can add lines manually.");
    } finally {
      setSuggesting(false);
    }
  };

  const addLine = () => {
    onLinesChange([
      ...lines,
      {
        kind: "project",
        sourceId: null,
        title: "",
        quantity: 1,
        unitLabel: "fixed",
        unitAmountCents: 0,
        taxable: false,
        groupKey: "General",
      },
    ]);
  };

  const addDiscountLine = () => {
    onLinesChange([
      ...lines,
      {
        kind: "discount",
        sourceId: null,
        title: "Discount",
        quantity: 1,
        unitLabel: "fixed",
        unitAmountCents: 0,
        taxable: false,
        groupKey: "Discounts",
      },
    ]);
  };

  const updateLine = (index: number, updates: Partial<QuoteLine>) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], ...updates };
    onLinesChange(updated);
  };

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index));
  };

  const totals = computeTotals(lines);

  const kindOptions = [
    { value: "project", label: "Project" },
    { value: "expense", label: "Expense" },
    { value: "retainer", label: "Retainer" },
    { value: "adjustment", label: "Adjustment" },
    { value: "discount", label: "Discount" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
            <CardDescription>
              AI-suggested or manual line items for the invoice
            </CardDescription>
          </div>
          <Button
            onClick={handleSuggest}
            disabled={suggesting || (projects.length === 0 && expenses.length === 0)}
            variant="outline"
          >
            {suggesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {suggesting ? "Suggesting..." : "AI Suggest"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Line items */}
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border space-y-3 ${
                line.kind === "discount"
                  ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={line.kind}
                    onChange={(e) =>
                      updateLine(index, {
                        kind: e.target.value as QuoteLine["kind"],
                      })
                    }
                    className="text-xs rounded border px-2 py-1 bg-background"
                  >
                    {kindOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Badge variant="secondary" className="text-xs">
                    {line.groupKey}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-4">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={line.title}
                    onChange={(e) =>
                      updateLine(index, { title: e.target.value })
                    }
                    placeholder="Line item title"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(index, {
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={line.unitLabel}
                    onChange={(e) =>
                      updateLine(index, { unitLabel: e.target.value })
                    }
                    placeholder="fixed"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Unit Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(line.unitAmountCents / 100).toFixed(2)}
                    onChange={(e) =>
                      updateLine(index, {
                        unitAmountCents: Math.round(
                          parseFloat(e.target.value || "0") * 100
                        ),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Line Total</Label>
                  <div className="mt-1 h-10 flex items-center font-medium text-sm">
                    {line.kind === "discount" ? "-" : ""}
                    {formatCurrency(line.quantity * line.unitAmountCents)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Group</Label>
                  <Input
                    value={line.groupKey}
                    onChange={(e) =>
                      updateLine(index, { groupKey: e.target.value })
                    }
                    placeholder="Project name or category"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Client Note (optional)</Label>
                  <Input
                    value={line.notesClient || ""}
                    onChange={(e) =>
                      updateLine(index, { notesClient: e.target.value })
                    }
                    placeholder="Note visible to client"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add line buttons */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" />
            Add Line
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDiscountLine}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Discount
          </Button>
        </div>

        {/* Totals */}
        {lines.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
