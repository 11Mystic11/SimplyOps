import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderInvoiceEmailHtml } from "@/lib/email-templates/invoice";
import { type QuoteLine } from "@/lib/pricing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const mirror = await prisma.invoiceMirror.findUnique({
      where: { id },
      include: {
        client: true,
        quote: true,
      },
    });

    if (!mirror) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }
    if (!mirror.hostedInvoiceUrl) {
      return NextResponse.json(
        { error: "Invoice must be finalized before previewing email" },
        { status: 400 }
      );
    }

    const lines: QuoteLine[] = mirror.quote
      ? JSON.parse(mirror.quote.lines)
      : [];

    // Generate invoice number from mirror ID
    const invoiceNumber = `INV-${mirror.stripeInvoiceId.slice(-8).toUpperCase()}`;

    const dueDate = mirror.quote?.dueDate
      ? new Date(mirror.quote.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

    const html = renderInvoiceEmailHtml({
      clientName: mirror.client.name,
      invoiceNumber,
      lines,
      subtotal: Math.round(mirror.subtotal * 100),
      discount: mirror.quote ? Math.round(mirror.quote.discount * 100) : 0,
      total: Math.round(mirror.total * 100),
      dueDate,
      memo: mirror.quote?.clientMemo ?? undefined,
      hostedInvoiceUrl: mirror.hostedInvoiceUrl,
    });

    return NextResponse.json({
      html,
      subject: `Invoice for ${mirror.client.name} - ${invoiceNumber}`,
      to: mirror.client.billingEmail || mirror.client.email,
    });
  } catch (error) {
    console.error("Error generating email preview:", error);
    return NextResponse.json(
      { error: "Failed to generate email preview" },
      { status: 500 }
    );
  }
}
