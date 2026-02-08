import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateCustomer, createDraftInvoice } from "@/lib/stripe";
import { type QuoteLine } from "@/lib/pricing";
import { z } from "zod";

const createInvoiceSchema = z.object({
  quoteId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quoteId } = createInvoiceSchema.parse(body);

    // Fetch the quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        client: true,
        invoiceMirror: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (quote.status !== "locked") {
      return NextResponse.json(
        { error: "Quote must be locked before creating an invoice" },
        { status: 409 }
      );
    }
    if (quote.invoiceMirror) {
      return NextResponse.json(
        {
          error: "Invoice already exists for this quote",
          invoiceMirror: quote.invoiceMirror,
        },
        { status: 409 }
      );
    }

    const billingEmail =
      quote.client.billingEmail || quote.client.email;
    if (!billingEmail) {
      return NextResponse.json(
        { error: "Client has no billing email" },
        { status: 400 }
      );
    }

    // Idempotency key based on quote ID
    const idempotencyKey = `quote_${quoteId}`;

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      quote.client.id,
      quote.client.name,
      billingEmail,
      idempotencyKey
    );

    // Parse quote lines for invoice items
    const lines: QuoteLine[] = JSON.parse(quote.lines);
    const invoiceLines = lines
      .filter((l) => l.kind !== "discount")
      .map((l) => ({
        title: l.title,
        description: l.notesClient || l.description,
        quantity: l.quantity,
        unitAmountCents: l.unitAmountCents,
      }));

    // Add discount lines as negative amounts
    const discountLines = lines.filter((l) => l.kind === "discount");
    for (const dl of discountLines) {
      invoiceLines.push({
        title: `Discount: ${dl.title}`,
        description: dl.notesClient || dl.description,
        quantity: 1,
        // Stripe uses negative amounts for discounts on invoice items
        unitAmountCents: -(dl.quantity * dl.unitAmountCents),
      });
    }

    // Create Stripe draft invoice
    const stripeInvoice = await createDraftInvoice({
      customerId,
      lines: invoiceLines,
      dueDate: quote.dueDate ?? undefined,
      memo: quote.clientMemo ?? undefined,
      idempotencyKey,
    });

    // Create local invoice mirror record
    const invoiceMirror = await prisma.invoiceMirror.create({
      data: {
        clientId: quote.clientId,
        quoteId: quote.id,
        stripeInvoiceId: stripeInvoice.id,
        stripeCustomerId: customerId,
        status: "draft",
        subtotal: quote.subtotal,
        total: quote.total,
        idempotencyKey,
      },
    });

    // Update quote status
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "invoiced" },
    });

    return NextResponse.json(invoiceMirror, { status: 201 });
  } catch (error) {
    console.error("Error creating Stripe invoice:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe invoice" },
      { status: 500 }
    );
  }
}
