import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["Website Build", "Automation Build", "Custom"]).optional(),
  status: z
    .enum(["planning", "in_progress", "review", "completed", "on_hold", "at_risk"])
    .optional(),
  clientId: z.string().optional(),
  budget: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        tasks: { orderBy: { dueDate: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { tasks: true, notes: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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
    const validatedData = updateProjectSchema.parse(body);

    const data: Record<string, unknown> = { ...validatedData };
    if (validatedData.startDate) data.startDate = new Date(validatedData.startDate);
    if (validatedData.dueDate) data.dueDate = new Date(validatedData.dueDate);
    if (validatedData.endDate) data.endDate = new Date(validatedData.endDate);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
