"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  FolderKanban,
  DollarSign,
  FileText,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import ClientSelector from "@/components/features/billing/client-selector";
import BillablesList from "@/components/features/billing/billables-list";
import PricingBot from "@/components/features/billing/pricing-bot";
import QuoteReview from "@/components/features/billing/quote-review";
import InvoiceActions from "@/components/features/billing/invoice-actions";
import { type QuoteLine } from "@/lib/pricing";

interface Client {
  id: string;
  name: string;
  email: string | null;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  status: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  description: string | null;
  budget: number | null;
  status: string;
  endDate: string | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  vendor: string | null;
  passThroughPolicy: string;
  markupPercent: number;
  project: { id: string; name: string } | null;
}

interface InvoiceMirror {
  id: string;
  stripeInvoiceId: string;
  status: string;
  hostedInvoiceUrl: string | null;
  finalizedAt: string | null;
  emailSentAt: string | null;
  emailRecipient: string | null;
  subtotal: number;
  total: number;
}

const steps = [
  { id: 1, name: "Client", icon: Users },
  { id: 2, name: "Billables", icon: FolderKanban },
  { id: 3, name: "Pricing", icon: DollarSign },
  { id: 4, name: "Review", icon: FileText },
  { id: 5, name: "Invoice", icon: CreditCard },
];

export default function BillingPage() {
  const [step, setStep] = useState(1);

  // Client state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Billables state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Expense[]>([]);

  // Pricing state
  const [lines, setLines] = useState<QuoteLine[]>([]);

  // Quote state
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteStatus, setQuoteStatus] = useState("proposed");
  const [dueDate, setDueDate] = useState("");
  const [clientMemo, setClientMemo] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);
  const [lockingQuote, setLockingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Invoice state
  const [invoiceMirror, setInvoiceMirror] = useState<InvoiceMirror | null>(
    null
  );

  const canAdvance = () => {
    switch (step) {
      case 1:
        return !!selectedClient;
      case 2:
        return selectedProjectIds.length > 0 || selectedExpenseIds.length > 0;
      case 3:
        return lines.length > 0;
      case 4:
        return quoteStatus === "locked" || quoteStatus === "invoiced";
      default:
        return true;
    }
  };

  const handleSaveQuote = async () => {
    if (!selectedClient) return;
    setSavingQuote(true);
    setQuoteError(null);

    try {
      const body = {
        clientId: selectedClient.id,
        lines,
        dueDate: dueDate || undefined,
        clientMemo: clientMemo || undefined,
        billableProjectIds: selectedProjectIds,
        billableExpenseIds: selectedExpenseIds,
      };

      let res;
      if (quoteId) {
        // Update existing quote
        res = await fetch(`/api/quotes/${quoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // Create new quote
        res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save quote");
      }

      const quote = await res.json();
      setQuoteId(quote.id);
      setQuoteStatus(quote.status);
      setStep(4);
    } catch (err) {
      setQuoteError(
        err instanceof Error ? err.message : "Failed to save quote"
      );
    } finally {
      setSavingQuote(false);
    }
  };

  const handleLockQuote = async () => {
    if (!quoteId) return;
    setLockingQuote(true);
    setQuoteError(null);

    try {
      const res = await fetch(`/api/quotes/${quoteId}/lock`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to lock quote");
      }

      setQuoteStatus("locked");
    } catch (err) {
      setQuoteError(
        err instanceof Error ? err.message : "Failed to lock quote"
      );
    } finally {
      setLockingQuote(false);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      // Save quote when moving from Pricing to Review
      handleSaveQuote();
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedClient(null);
    setSelectedProjectIds([]);
    setSelectedProjects([]);
    setSelectedExpenseIds([]);
    setSelectedExpenses([]);
    setLines([]);
    setQuoteId(null);
    setQuoteStatus("proposed");
    setDueDate("");
    setClientMemo("");
    setInvoiceMirror(null);
    setQuoteError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/finance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Finance
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Invoice Builder
          </h1>
          <p className="text-muted-foreground">
            Create AI-assisted invoices with Stripe payments
          </p>
        </div>
        {(quoteId || selectedClient) && (
          <Button variant="outline" onClick={handleReset}>
            Start Over
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                // Allow navigating back to completed steps
                if (s.id <= step) setStep(s.id);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                s.id === step
                  ? "bg-primary text-primary-foreground"
                  : s.id < step
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.name}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px mx-1 ${
                  s.id < step ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <ClientSelector
          selectedClientId={selectedClient?.id || null}
          onSelect={setSelectedClient}
        />
      )}

      {step === 2 && selectedClient && (
        <BillablesList
          clientId={selectedClient.id}
          selectedProjectIds={selectedProjectIds}
          selectedExpenseIds={selectedExpenseIds}
          onProjectsChange={(ids, projects) => {
            setSelectedProjectIds(ids);
            setSelectedProjects(projects);
          }}
          onExpensesChange={(ids, expenses) => {
            setSelectedExpenseIds(ids);
            setSelectedExpenses(expenses);
          }}
        />
      )}

      {step === 3 && selectedClient && (
        <PricingBot
          clientName={selectedClient.name}
          projects={selectedProjects}
          expenses={selectedExpenses}
          lines={lines}
          onLinesChange={setLines}
        />
      )}

      {step === 4 && (
        <>
          {quoteError && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {quoteError}
            </p>
          )}
          <QuoteReview
            lines={lines}
            clientEmail={
              selectedClient?.billingEmail || selectedClient?.email || null
            }
            dueDate={dueDate}
            clientMemo={clientMemo}
            onDueDateChange={setDueDate}
            onClientMemoChange={setClientMemo}
            onLock={handleLockQuote}
            locking={lockingQuote}
            quoteStatus={quoteStatus}
          />
        </>
      )}

      {step === 5 && (
        <InvoiceActions
          quoteId={quoteId}
          quoteStatus={quoteStatus}
          invoiceMirror={invoiceMirror}
          onInvoiceMirrorChange={setInvoiceMirror}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {selectedClient && (
            <Badge variant="secondary" className="text-xs">
              {selectedClient.name}
            </Badge>
          )}
          {selectedProjectIds.length + selectedExpenseIds.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedProjectIds.length + selectedExpenseIds.length} items
            </Badge>
          )}
        </div>

        {step < 5 && (
          <Button
            onClick={handleNext}
            disabled={!canAdvance() || savingQuote}
          >
            {savingQuote ? "Saving..." : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {step === 5 && (
          <Button variant="outline" onClick={handleReset}>
            New Invoice
          </Button>
        )}
      </div>
    </div>
  );
}
