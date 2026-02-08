"use client";

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
import { Lock, FileText, AlertTriangle } from "lucide-react";
import {
  type QuoteLine,
  groupLinesByKey,
  formatCurrency,
  computeTotals,
} from "@/lib/pricing";

interface QuoteReviewProps {
  lines: QuoteLine[];
  clientEmail: string | null;
  dueDate: string;
  clientMemo: string;
  onDueDateChange: (val: string) => void;
  onClientMemoChange: (val: string) => void;
  onLock: () => void;
  locking: boolean;
  quoteStatus: string;
}

export default function QuoteReview({
  lines,
  clientEmail,
  dueDate,
  clientMemo,
  onDueDateChange,
  onClientMemoChange,
  onLock,
  locking,
  quoteStatus,
}: QuoteReviewProps) {
  const grouped = groupLinesByKey(
    lines.filter((l) => l.kind !== "discount")
  );
  const discountLines = lines.filter((l) => l.kind === "discount");
  const totals = computeTotals(lines);
  const isLocked = quoteStatus === "locked" || quoteStatus === "invoiced";

  const warnings: string[] = [];
  if (!clientEmail) {
    warnings.push("Client has no email address");
  }
  if (lines.length === 0) {
    warnings.push("No line items in this quote");
  }
  if (totals.total <= 0 && lines.length > 0) {
    warnings.push("Total is zero or negative");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quote Review
        </CardTitle>
        <CardDescription>
          Review the breakdown before locking the quote
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Grouped breakdown */}
        {Object.entries(grouped).map(([group, groupLines]) => (
          <div key={group} className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">{group}</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground">
                    <th className="text-left p-2">Item</th>
                    <th className="text-center p-2">Qty</th>
                    <th className="text-right p-2">Rate</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {groupLines.map((line, i) => (
                    <tr key={i} className="border-t text-sm">
                      <td className="p-2">
                        <span className="font-medium">{line.title}</span>
                        {line.notesClient && (
                          <span className="block text-xs text-muted-foreground">
                            {line.notesClient}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {line.quantity} {line.unitLabel}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(line.unitAmountCents)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(
                          line.quantity * line.unitAmountCents
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Discounts */}
        {discountLines.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-600">Discounts</h4>
            {discountLines.map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 text-sm text-red-600"
              >
                <span>{line.title}</span>
                <span>
                  -{formatCurrency(line.quantity * line.unitAmountCents)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Due</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              disabled={isLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-memo">Client Memo</Label>
            <Input
              id="client-memo"
              placeholder="Message shown on invoice..."
              value={clientMemo}
              onChange={(e) => onClientMemoChange(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>

        {/* Lock button */}
        {!isLocked && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={onLock}
              disabled={locking || lines.length === 0 || totals.total <= 0}
            >
              <Lock className="h-4 w-4 mr-2" />
              {locking ? "Locking..." : "Lock Quote"}
            </Button>
          </div>
        )}

        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Badge className="bg-green-100 text-green-700">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
            <span className="text-sm text-green-700 dark:text-green-400">
              Quote is locked and ready for invoicing.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
