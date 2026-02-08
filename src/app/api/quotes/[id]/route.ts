import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quoteLinesArraySchema, computeTotals } from "@/lib/pricing";
import { z } from "zod";

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

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, billingEmail: true } },
        invoiceMirror: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...quote,
      lines: JSON.parse(quote.lines),
      billableProjectIds: quote.billableProjectIds
        ? JSON.parse(quote.billableProjectIds)
        : [],
      billableExpenseIds: quote.billableExpenseIds
        ? JSON.parse(quote.billableExpenseIds)
        : [],
    });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

const updateQuoteSchema = z.object({
  lines: quoteLinesArraySchema,
  dueDate: z.string().optional(),
  netTermsDays: z.number().int().optional(),
  clientMemo: z.string().optional(),
  internalMemo: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateQuoteSchema.parse(body);

    // Check quote exists and is editable
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (existing.status !== "proposed") {
      return NextResponse.json(
        { error: "Only proposed quotes can be edited" },
        { status: 409 }
      );
    }

    const totals = computeTotals(data.lines);

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        lines: JSON.stringify(data.lines),
        subtotal: totals.subtotal / 100,
        discount: totals.discount / 100,
        total: totals.total / 100,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
        netTermsDays: data.netTermsDays ?? existing.netTermsDays,
        clientMemo: data.clientMemo ?? existing.clientMemo,
        internalMemo: data.internalMemo ?? existing.internalMemo,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}
