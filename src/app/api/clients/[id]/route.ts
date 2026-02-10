import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1, "Client name is required").optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "at_risk", "churned"]).optional(),
  healthScore: z.number().min(0).max(100).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        projects: { include: { _count: { select: { tasks: true } } } },
        tasks: { orderBy: { dueDate: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { projects: true, tasks: true, notes: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    const client = await prisma.client.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Manual cascade: Turso FK constraints use RESTRICT, not CASCADE.
    // Delete child records in dependency order within a transaction.
    await prisma.$transaction(async (tx) => {
      // 1. Delete transactions linked to this client's invoices/subscriptions/expenses
      const invoiceIds = (await tx.invoice.findMany({ where: { clientId: id }, select: { id: true } })).map(i => i.id);
      const subscriptionIds = (await tx.subscription.findMany({ where: { clientId: id }, select: { id: true } })).map(s => s.id);
      const expenseIds = (await tx.expense.findMany({ where: { clientId: id }, select: { id: true } })).map(e => e.id);
      if (invoiceIds.length) await tx.transaction.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      if (subscriptionIds.length) await tx.transaction.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
      if (expenseIds.length) await tx.transaction.deleteMany({ where: { expenseId: { in: expenseIds } } });

      // 2. Delete invoice mirrors and quotes
      await tx.invoiceMirror.deleteMany({ where: { clientId: id } });
      await tx.quote.deleteMany({ where: { clientId: id } });

      // 3. Delete notes (client-level, project-level, task-level)
      const projectIds = (await tx.project.findMany({ where: { clientId: id }, select: { id: true } })).map(p => p.id);
      const taskIds = (await tx.task.findMany({ where: { clientId: id }, select: { id: true } })).map(t => t.id);
      await tx.note.deleteMany({ where: { OR: [{ clientId: id }, ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []), ...(taskIds.length ? [{ taskId: { in: taskIds } }] : [])] } });

      // 4. Delete tasks, expenses, invoices, subscriptions
      await tx.task.deleteMany({ where: { OR: [{ clientId: id }, ...(projectIds.length ? [{ projectId: { in: projectIds } }] : [])] } });
      await tx.expense.deleteMany({ where: { clientId: id } });
      await tx.invoice.deleteMany({ where: { clientId: id } });
      await tx.subscription.deleteMany({ where: { clientId: id } });

      // 5. Delete automation scans, contacts, projects
      await tx.automationScan.deleteMany({ where: { clientId: id } });
      await tx.contact.deleteMany({ where: { clientId: id } });
      await tx.project.deleteMany({ where: { clientId: id } });

      // 6. Finally delete the client
      await tx.client.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 },
    );
  }
}
