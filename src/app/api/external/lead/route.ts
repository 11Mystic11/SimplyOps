import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANS, PLAN_TASKS, ADDONS } from "@/lib/pricing-catalog";
import { z } from "zod";

const leadSchema = z.object({
  planId: z.string(),
  planTier: z.string().optional(),
  addons: z
    .array(z.object({ id: z.string(), tier: z.string().optional() }))
    .optional(),
  businessName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = leadSchema.parse(body);

    // Look up plan
    const plan = PLANS.find((p) => p.id === data.planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Determine setup fee
    let setupFee = plan.setupFee ?? 0;
    if (plan.setupTiers && data.planTier) {
      const tier = plan.setupTiers.find((t) => t.label === data.planTier);
      if (tier) setupFee = tier.fee;
    }

    // Find admin user (first user in DB)
    const adminUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500 }
      );
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name: data.businessName,
        email: data.email,
        phone: data.phone || null,
        industry: data.industry || null,
        status: "active",
        billingEmail: data.email,
        createdById: adminUser.id,
      },
    });

    // Determine project type based on plan
    const projectType =
      data.planId === "foundation" || data.planId === "momentum"
        ? "Automation Build"
        : "Custom";

    // Create project
    const project = await prisma.project.create({
      data: {
        name: `${plan.name}${data.planTier ? ` (${data.planTier})` : ""}`,
        description: `${plan.outcomes} — Contact: ${data.contactName}`,
        type: projectType,
        status: "planning",
        budget: setupFee || null,
        clientId: client.id,
      },
    });

    // Create tasks from plan template
    const taskTitles = PLAN_TASKS[data.planId] ?? [];
    for (const title of taskTitles) {
      await prisma.task.create({
        data: {
          title,
          status: "todo",
          priority: "medium",
          projectId: project.id,
          clientId: client.id,
          createdById: adminUser.id,
        },
      });
    }

    // Create tasks for selected add-ons
    if (data.addons && data.addons.length > 0) {
      const addonNames = data.addons
        .map((a) => {
          const addon = ADDONS.find((x) => x.id === a.id);
          return addon ? `${addon.name}${a.tier ? ` (${a.tier})` : ""}` : null;
        })
        .filter(Boolean);

      if (addonNames.length > 0) {
        // Add a note with add-on selections
        await prisma.note.create({
          data: {
            content: `Selected add-ons: ${addonNames.join(", ")}`,
            type: "general",
            clientId: client.id,
            projectId: project.id,
            createdById: adminUser.id,
          },
        });

        // Create a task per add-on
        for (const name of addonNames) {
          await prisma.task.create({
            data: {
              title: `Setup: ${name}`,
              status: "todo",
              priority: "medium",
              projectId: project.id,
              clientId: client.id,
              createdById: adminUser.id,
            },
          });
        }
      }
    }

    // Add lead notes if provided
    if (data.notes) {
      await prisma.note.create({
        data: {
          content: `Lead notes: ${data.notes}`,
          type: "general",
          clientId: client.id,
          createdById: adminUser.id,
        },
      });
    }

    return NextResponse.json(
      { clientId: client.id, projectId: project.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
