import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clientsWithCounts = clients.map((client) => ({
      ...client,
      projectsCount: client._count.projects,
    }));

    return NextResponse.json(clientsWithCounts);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Self-healing: Ensure the user exists in the DB before creating the client
    const user = await import("@/lib/db").then(m => m.ensureAuthenticatedUser(session));
    const userId = user?.id || session.user.id;
    console.log("[CLIENT_API] Creating client for user:", userId);

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        createdById: userId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("[CLIENT_API] Error Details:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create client", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
