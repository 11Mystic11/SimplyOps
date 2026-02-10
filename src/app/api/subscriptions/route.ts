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

        const subscriptions = await prisma.subscription.findMany({
            include: {
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(subscriptions);
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
        const { clientId, name, description, amount, billingCadence, startDate } =
            body;

        if (!clientId || !name || !amount) {
            return NextResponse.json(
                { error: "Client, name, and amount are required" },
                { status: 400 }
            );
        }

        // Calculate next billing date
        const start = startDate ? new Date(startDate) : new Date();
        const nextBilling = new Date(start);

        switch (billingCadence) {
            case "quarterly":
                nextBilling.setMonth(nextBilling.getMonth() + 3);
                break;
            case "annual":
                nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                break;
            default: // monthly
                nextBilling.setMonth(nextBilling.getMonth() + 1);
        }

        const subscription = await prisma.subscription.create({
            data: {
                clientId,
                name,
                description: description || null,
                amount: parseFloat(amount),
                billingCadence: billingCadence || "monthly",
                startDate: start,
                nextBilling,
                status: "active",
            },
            include: {
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(subscription, { status: 201 });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}
