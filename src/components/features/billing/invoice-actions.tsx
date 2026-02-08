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
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Send,
  Eye,
  CheckCircle,
  Loader2,
  ExternalLink,
  Mail,
  FileCheck,
  Clock,
} from "lucide-react";

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

interface InvoiceActionsProps {
  quoteId: string | null;
  quoteStatus: string;
  invoiceMirror: InvoiceMirror | null;
  onInvoiceMirrorChange: (mirror: InvoiceMirror) => void;
}

export default function InvoiceActions({
  quoteId,
  quoteStatus,
  invoiceMirror,
  onInvoiceMirrorChange,
}: InvoiceActionsProps) {
  const [creating, setCreating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = quoteStatus === "locked" && !invoiceMirror;
  const canFinalize = invoiceMirror?.status === "draft";
  const canPreview =
    invoiceMirror && invoiceMirror.status !== "draft";
  const canSend =
    invoiceMirror?.hostedInvoiceUrl && !invoiceMirror.emailSentAt;

  const handleCreateInvoice = async () => {
    if (!quoteId) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }

      const mirror = await res.json();
      onInvoiceMirrorChange(mirror);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invoice"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleFinalize = async () => {
    if (!invoiceMirror) return;
    setFinalizing(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/invoices/${invoiceMirror.id}/finalize`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to finalize");
      }

      const updated = await res.json();
      onInvoiceMirrorChange(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to finalize invoice"
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handlePreview = async () => {
    if (!invoiceMirror) return;
    setPreviewLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/invoices/${invoiceMirror.id}/email-preview`
      );
      if (!res.ok) throw new Error("Failed to load preview");

      const data = await res.json();
      setPreviewHtml(data.html);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load email preview"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceMirror) return;
    setSendingEmail(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/invoices/${invoiceMirror.id}/send-email`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }

      const updated = await res.json();
      onInvoiceMirrorChange(updated);
      setPreviewHtml(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send email"
      );
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Invoice Actions
        </CardTitle>
        <CardDescription>
          Create, finalize, and send the Stripe invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          {/* Step 1: Create Invoice */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                invoiceMirror
                  ? "bg-green-100 text-green-700"
                  : canCreate
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {invoiceMirror ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">1</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Create Stripe Invoice</p>
              {invoiceMirror && (
                <p className="text-xs text-muted-foreground">
                  {invoiceMirror.stripeInvoiceId}
                </p>
              )}
            </div>
            {canCreate && (
              <Button
                size="sm"
                onClick={handleCreateInvoice}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-1" />
                )}
                Create
              </Button>
            )}
          </div>

          {/* Step 2: Finalize */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                invoiceMirror && invoiceMirror.status !== "draft"
                  ? "bg-green-100 text-green-700"
                  : canFinalize
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {invoiceMirror && invoiceMirror.status !== "draft" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">2</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Finalize Invoice</p>
              {invoiceMirror?.hostedInvoiceUrl && (
                <a
                  href={invoiceMirror.hostedInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View on Stripe
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {canFinalize && (
              <Button
                size="sm"
                onClick={handleFinalize}
                disabled={finalizing}
              >
                {finalizing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4 mr-1" />
                )}
                Finalize
              </Button>
            )}
          </div>

          {/* Step 3: Email */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                invoiceMirror?.emailSentAt
                  ? "bg-green-100 text-green-700"
                  : canSend
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {invoiceMirror?.emailSentAt ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">3</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Send Email</p>
              {invoiceMirror?.emailSentAt && (
                <p className="text-xs text-muted-foreground">
                  Sent to {invoiceMirror.emailRecipient} on{" "}
                  {new Date(invoiceMirror.emailSentAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {canPreview && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Preview
                </Button>
              )}
              {canSend && (
                <Button
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        {invoiceMirror && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              variant={
                invoiceMirror.status === "paid"
                  ? "default"
                  : invoiceMirror.status === "void"
                    ? "destructive"
                    : "secondary"
              }
            >
              {invoiceMirror.status.toUpperCase()}
            </Badge>
            {invoiceMirror.emailSentAt && (
              <Badge variant="secondary" className="text-xs">
                <Mail className="h-3 w-3 mr-1" />
                Email Sent
              </Badge>
            )}
          </div>
        )}

        {/* Email Preview Modal */}
        {previewHtml && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
              <span className="text-sm font-medium">Email Preview</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewHtml(null)}
              >
                Close
              </Button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px] border-0"
              title="Email preview"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
