import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quoteLinesArraySchema, computeTotals } from "@/lib/pricing";
import { z } from "zod";

const createQuoteSchema = z.object({
  clientId: z.string().min(1),
  lines: quoteLinesArraySchema,
  dueDate: z.string().optional(),
  netTermsDays: z.number().int().optional(),
  clientMemo: z.string().optional(),
  internalMemo: z.string().optional(),
  billableProjectIds: z.array(z.string()).default([]),
  billableExpenseIds: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quotes = await prisma.quote.findMany({
      include: {
        client: { select: { id: true, name: true, email: true } },
        invoiceMirror: { select: { id: true, status: true, stripeInvoiceId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createQuoteSchema.parse(body);

    // Check for double-billing: verify none of the selected items are already billed
    if (data.billableProjectIds.length > 0) {
      const alreadyBilled = await prisma.project.findMany({
        where: {
          id: { in: data.billableProjectIds },
          billingStatus: { not: "unbilled" },
        },
        select: { id: true, name: true },
      });
      if (alreadyBilled.length > 0) {
        return NextResponse.json(
          {
            error: `Projects already billed: ${alreadyBilled.map((p) => p.name).join(", ")}`,
          },
          { status: 409 }
        );
      }
    }

    if (data.billableExpenseIds.length > 0) {
      const alreadyBilled = await prisma.expense.findMany({
        where: {
          id: { in: data.billableExpenseIds },
          billingStatus: { not: "unbilled" },
        },
        select: { id: true, description: true },
      });
      if (alreadyBilled.length > 0) {
        return NextResponse.json(
          {
            error: `Expenses already billed: ${alreadyBilled.map((e) => e.description).join(", ")}`,
          },
          { status: 409 }
        );
      }
    }

    const totals = computeTotals(data.lines);

    const quote = await prisma.quote.create({
      data: {
        clientId: data.clientId,
        createdById: session.user.id,
        lines: JSON.stringify(data.lines),
        subtotal: totals.subtotal / 100, // Store as dollars
        discount: totals.discount / 100,
        total: totals.total / 100,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        netTermsDays: data.netTermsDays ?? null,
        clientMemo: data.clientMemo ?? null,
        internalMemo: data.internalMemo ?? null,
        billableProjectIds: JSON.stringify(data.billableProjectIds),
        billableExpenseIds: JSON.stringify(data.billableExpenseIds),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}
