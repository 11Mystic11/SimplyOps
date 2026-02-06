import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  type: z.enum(["call", "email", "meeting", "general"]).optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const where: Record<string, string> = {};
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;

    const notes = await prisma.note.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: {
        content: validatedData.content,
        type: validatedData.type ?? "general",
        clientId: validatedData.clientId || undefined,
        projectId: validatedData.projectId || undefined,
        taskId: validatedData.taskId || undefined,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
