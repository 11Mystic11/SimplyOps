import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderInvoiceEmailHtml } from "@/lib/email-templates/invoice";
import { sendInvoiceEmail } from "@/lib/email";
import { type QuoteLine } from "@/lib/pricing";

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
        { error: "Invoice must be finalized before sending email" },
        { status: 400 }
      );
    }
    if (mirror.emailSentAt) {
      return NextResponse.json(
        { error: "Email has already been sent for this invoice" },
        { status: 409 }
      );
    }

    const recipient = mirror.client.billingEmail || mirror.client.email;
    if (!recipient) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 }
      );
    }

    const lines: QuoteLine[] = mirror.quote
      ? JSON.parse(mirror.quote.lines)
      : [];

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

    const subject = `Invoice for ${mirror.client.name} - ${invoiceNumber}`;

    await sendInvoiceEmail(recipient, subject, html);

    // Record email sent
    const updated = await prisma.invoiceMirror.update({
      where: { id },
      data: {
        emailSentAt: new Date(),
        emailRecipient: recipient,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
