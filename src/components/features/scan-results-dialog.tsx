"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Target, MessageSquare, RefreshCw } from "lucide-react";

interface Opportunity {
  product: string;
  relevance: string;
  problem: string;
  pitch: string;
  estimated_value: string;
}

interface ScanResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  results: Opportunity[] | null;
  scannedAt: string | null;
  onRescan: () => void;
  isScanning: boolean;
}

const getRelevanceColor = (relevance: string) => {
  switch (relevance.toLowerCase()) {
    case "high":
      return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300";
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default function ScanResultsDialog({
  open,
  onOpenChange,
  clientName,
  results,
  scannedAt,
  onRescan,
  isScanning,
}: ScanResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automation Opportunities</DialogTitle>
          <DialogDescription>
            {results
              ? `${results.length} opportunities found for ${clientName}`
              : `Scanning ${clientName} for automation opportunities...`}
          </DialogDescription>
        </DialogHeader>

        {isScanning && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing client for automation opportunities...
            </p>
          </div>
        )}

        {!isScanning && results && results.length > 0 && (
          <div className="space-y-4">
            {results.map((opp, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{opp.product}</h4>
                  <Badge className={getRelevanceColor(opp.relevance)}>
                    {opp.relevance}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Target className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                    <p className="text-muted-foreground">{opp.problem}</p>
                  </div>

                  <div className="flex gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                    <p className="text-muted-foreground">{opp.pitch}</p>
                  </div>

                  <div className="flex gap-2">
                    <DollarSign className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                    <p className="font-medium">{opp.estimated_value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Scanned{" "}
                {scannedAt
                  ? new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(scannedAt))
                  : "just now"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRescan}
                disabled={isScanning}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Re-scan
              </Button>
            </div>
          </div>
        )}

        {!isScanning && results && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-sm">
              No automation opportunities identified. Try adding more client
              details (industry, notes) and scan again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onRescan}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-scan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
