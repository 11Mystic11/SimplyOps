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

      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          customer: string;
          subscription?: string | null;
          metadata?: Record<string, string>;
        };

        const meta = session.metadata ?? {};
        const clientId = meta.clientId;
        const planId = meta.planId;
        const planTier = meta.planTier || null;
        const addons = meta.addons || null;

        if (clientId && planId && session.subscription) {
          // Find the client to link subscription
          const client = await prisma.client.findUnique({
            where: { id: clientId },
          });

          if (client) {
            // Update client with Stripe customer ID
            await prisma.client.update({
              where: { id: clientId },
              data: { stripeCustomerId: session.customer },
            });

            // Create subscription record
            const monthlyFee = parseFloat(meta.monthlyFee || "0");
            await prisma.subscription.create({
              data: {
                clientId,
                name: meta.planName || "Subscription",
                description: `${meta.planName}${planTier ? ` (${planTier})` : ""}`,
                amount: monthlyFee,
                billingCadence: meta.billingCadence || "monthly",
                status: "active",
                startDate: new Date(),
                nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer,
                planId,
                planTier,
                addons,
                setupPaid: true,
                contactName: meta.contactName || null,
                contactEmail: meta.contactEmail || null,
                contactPhone: meta.contactPhone || null,
                businessName: meta.businessName || null,
                industry: meta.industry || null,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as {
          id: string;
          status: string;
        };
        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "active",
          unpaid: "paused",
          canceled: "cancelled",
          incomplete: "paused",
          incomplete_expired: "cancelled",
          trialing: "active",
          paused: "paused",
        };
        const mapped = statusMap[sub.status] ?? "active";
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: mapped },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "cancelled", endDate: new Date() },
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
