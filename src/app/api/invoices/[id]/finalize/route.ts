import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { finalizeInvoice } from "@/lib/stripe";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the invoice mirror
    const mirror = await prisma.invoiceMirror.findUnique({
      where: { id },
      include: {
        quote: true,
      },
    });

    if (!mirror) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }
    if (mirror.status !== "draft") {
      return NextResponse.json(
        { error: `Invoice is already ${mirror.status}` },
        { status: 409 }
      );
    }

    // Finalize on Stripe
    const stripeInvoice = await finalizeInvoice(mirror.stripeInvoiceId);

    // Update local mirror with hosted URL
    const updated = await prisma.invoiceMirror.update({
      where: { id },
      data: {
        status: "open",
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
        finalizedAt: new Date(),
      },
    });

    // Mark linked billables as "billed"
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
          data: {
            billingStatus: "billed",
            billedInvoiceId: mirror.id,
          },
        });
      }

      if (expenseIds.length > 0) {
        await prisma.expense.updateMany({
          where: { id: { in: expenseIds } },
          data: {
            billingStatus: "billed",
            billedInvoiceId: mirror.id,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error finalizing invoice:", error);
    return NextResponse.json(
      { error: "Failed to finalize invoice" },
      { status: 500 }
    );
  }
}
