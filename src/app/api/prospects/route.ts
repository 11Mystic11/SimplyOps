import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createProspectSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  persona: z.string().optional(),
  phone: z.string().optional(),
  personalizedLine: z.string().optional(),
  notes: z.string().optional(),
});

const csvImportSchema = z.object({
  prospects: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().optional().default(""),
      email: z.string().optional().default(""),
      linkedinUrl: z.string().optional().default(""),
      jobTitle: z.string().optional().default(""),
      company: z.string().optional().default(""),
      industry: z.string().optional().default(""),
      companySize: z.string().optional().default(""),
      persona: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      personalizedLine: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const persona = searchParams.get("persona");
    const batch = searchParams.get("batch");

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (persona) where.persona = persona;
    if (batch) where.importBatch = batch;

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 }
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

    // Bulk CSV import
    if (body.prospects && Array.isArray(body.prospects)) {
      const validated = csvImportSchema.parse(body);
      const importBatch = `import_${Date.now()}`;

      const created = await prisma.prospect.createMany({
        data: validated.prospects.map((p) => ({
          ...p,
          source: "csv_import",
          importBatch,
          email: p.email || null,
          linkedinUrl: p.linkedinUrl || null,
          lastName: p.lastName || null,
          jobTitle: p.jobTitle || null,
          company: p.company || null,
          industry: p.industry || null,
          companySize: p.companySize || null,
          persona: p.persona || null,
          phone: p.phone || null,
          personalizedLine: p.personalizedLine || null,
          notes: p.notes || null,
        })),
      });

      return NextResponse.json(
        { imported: created.count, importBatch },
        { status: 201 }
      );
    }

    // Single prospect creation
    const validated = createProspectSchema.parse(body);
    const prospect = await prisma.prospect.create({
      data: {
        ...validated,
        source: "manual",
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating prospect:", error);
    return NextResponse.json(
      { error: "Failed to create prospect" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json(
        { error: "ids parameter required" },
        { status: 400 }
      );
    }

    const idList = ids.split(",");
    const deleted = await prisma.prospect.deleteMany({
      where: { id: { in: idList } },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Error deleting prospects:", error);
    return NextResponse.json(
      { error: "Failed to delete prospects" },
      { status: 500 }
    );
  }
}
