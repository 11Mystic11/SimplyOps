import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;

    // Fetch unbilled completed projects
    const projects = await prisma.project.findMany({
      where: {
        clientId,
        status: "completed",
        billingStatus: "unbilled",
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch unbilled expenses for this client
    const expenses = await prisma.expense.findMany({
      where: {
        clientId,
        billingStatus: "unbilled",
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ projects, expenses });
  } catch (error) {
    console.error("Error fetching billables:", error);
    return NextResponse.json(
      { error: "Failed to fetch billables" },
      { status: 500 }
    );
  }
}
