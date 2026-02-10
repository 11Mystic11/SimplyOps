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

        const expenses = await prisma.expense.findMany({
            include: {
                client: {
                    select: { id: true, name: true },
                },
                project: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(expenses);
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
        const { category, amount, description, date, projectId, clientId } = body;

        if (!category || !amount || !description) {
            return NextResponse.json(
                { error: "Category, amount, and description are required" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                category,
                amount: parseFloat(amount),
                description,
                date: date ? new Date(date) : new Date(),
                projectId: projectId || null,
                clientId: clientId || null,
            },
            include: {
                client: {
                    select: { id: true, name: true },
                },
                project: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { error: "Failed to create expense" },
            { status: 500 }
        );
    }
}
