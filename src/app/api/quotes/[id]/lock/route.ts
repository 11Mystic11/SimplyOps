import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (quote.status !== "proposed") {
      return NextResponse.json(
        { error: `Quote is already ${quote.status}` },
        { status: 409 }
      );
    }

    // Validate quote has lines and a total
    const lines = JSON.parse(quote.lines);
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "Quote must have at least one line item" },
        { status: 400 }
      );
    }
    if (quote.total <= 0) {
      return NextResponse.json(
        { error: "Quote total must be greater than zero" },
        { status: 400 }
      );
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: { status: "locked" },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error locking quote:", error);
    return NextResponse.json(
      { error: "Failed to lock quote" },
      { status: 500 }
    );
  }
}
