import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = verifyWebhookSignature(body, signature);

    switch (event.type) {
      case "invoice.finalized": {
        const invoice = event.data.object as { id: string; hosted_invoice_url?: string | null };
        await prisma.invoiceMirror.updateMany({
          where: { stripeInvoiceId: invoice.id },
          data: {
            status: "open",
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
            finalizedAt: new Date(),
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as { id: string };
        await prisma.invoiceMirror.updateMany({
          where: { stripeInvoiceId: invoice.id },
          data: { status: "paid" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as { id: string };
        // Keep status as "open" - payment failed but invoice is still active
        // Could add a separate "payment_failed" flag if needed
        console.warn(`Payment failed for invoice ${invoice.id}`);
        break;
      }

      case "invoice.voided": {
        const invoice = event.data.object as { id: string };
        const mirror = await prisma.invoiceMirror.findFirst({
          where: { stripeInvoiceId: invoice.id },
          include: { quote: true },
        });

        if (mirror) {
          await prisma.invoiceMirror.update({
            where: { id: mirror.id },
            data: { status: "void" },
          });

          // Unmark linked billables so they can be re-invoiced
          if (mirror.quote) {
            const projectIds = mirror.quote.billableProjectIds
              ? JSON.parse(mirror.quote.billableProjectIds)
              : [];
            const expenseIds = mirror.quote.billableExpenseIds
              ? JSON.parse(mirror.quote.billableExpenseIds)
              : [];

            if (projectIds.length > 0) {
              await prisma.project.updateMany({
                where: { id: { in: projectIds } },
                data: { billingStatus: "unbilled", billedInvoiceId: null },
              });
            }
            if (expenseIds.length > 0) {
              await prisma.expense.updateMany({
                where: { id: { in: expenseIds } },
                data: { billingStatus: "unbilled", billedInvoiceId: null },
              });
            }
          }
        }
        break;
      }

      case "invoice.marked_uncollectible": {
        const invoice = event.data.object as { id: string };
        await prisma.invoiceMirror.updateMany({
          where: { stripeInvoiceId: invoice.id },
          data: { status: "uncollectible" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
