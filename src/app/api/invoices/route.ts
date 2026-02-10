import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoices = await prisma.invoice.findMany({
            include: {
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { clientId, amount, dueDate, description, lineItems, notes } = body;

        if (!clientId || !amount) {
            return NextResponse.json(
                { error: "Client and amount are required" },
                { status: 400 }
            );
        }

        // Generate invoice number
        const count = await prisma.invoice.count();
        const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId,
                amount: parseFloat(amount),
                dueDate: dueDate ? new Date(dueDate) : null,
                description: description || null,
                lineItems: JSON.stringify(lineItems || []),
                notes: notes || null,
                status: "draft",
            },
            include: {
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json(
            { error: "Failed to create invoice" },
            { status: 500 }
        );
    }
}
