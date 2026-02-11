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

    // Manual cascade: Turso FK constraints use RESTRICT (not CASCADE)
    // and LibSQL adapter doesn't support interactive transactions.
    // Delete child records sequentially in dependency order.

    // 1. Gather IDs of related records
    const invoiceIds = (await prisma.invoice.findMany({ where: { clientId: id }, select: { id: true } })).map(i => i.id);
    const subscriptionIds = (await prisma.subscription.findMany({ where: { clientId: id }, select: { id: true } })).map(s => s.id);
    const expenseIds = (await prisma.expense.findMany({ where: { clientId: id }, select: { id: true } })).map(e => e.id);
    const projectIds = (await prisma.project.findMany({ where: { clientId: id }, select: { id: true } })).map(p => p.id);
    const taskIds = (await prisma.task.findMany({ where: { OR: [{ clientId: id }, ...(projectIds.length ? [{ projectId: { in: projectIds } }] : [])] }, select: { id: true } })).map(t => t.id);

    // 2. Delete transactions (deepest leaf — references invoices/subscriptions/expenses)
    if (invoiceIds.length) await prisma.transaction.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
    if (subscriptionIds.length) await prisma.transaction.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
    if (expenseIds.length) await prisma.transaction.deleteMany({ where: { expenseId: { in: expenseIds } } });

    // 3. Delete invoice mirrors and quotes
    await prisma.invoiceMirror.deleteMany({ where: { clientId: id } });
    await prisma.quote.deleteMany({ where: { clientId: id } });

    // 4. Delete notes (references tasks, projects, client)
    if (taskIds.length) await prisma.note.deleteMany({ where: { taskId: { in: taskIds } } });
    if (projectIds.length) await prisma.note.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.note.deleteMany({ where: { clientId: id } });

    // 5. Delete tasks, expenses, invoices, subscriptions
    await prisma.task.deleteMany({ where: { OR: [{ clientId: id }, ...(projectIds.length ? [{ projectId: { in: projectIds } }] : [])] } });
    await prisma.expense.deleteMany({ where: { clientId: id } });
    await prisma.invoice.deleteMany({ where: { clientId: id } });
    await prisma.subscription.deleteMany({ where: { clientId: id } });

    // 6. Delete automation scans, contacts, projects
    await prisma.automationScan.deleteMany({ where: { clientId: id } });
    await prisma.contact.deleteMany({ where: { clientId: id } });
    await prisma.project.deleteMany({ where: { clientId: id } });

    // 7. Finally delete the client
    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error deleting client:", msg, error);
    return NextResponse.json(
      { error: "Failed to delete client", details: msg },
      { status: 500 },
    );
  }
}
