import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { suggestPricing } from "@/lib/pricing-ai";
import { z } from "zod";

const suggestSchema = z.object({
  clientName: z.string().min(1),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      description: z.string().nullable().optional(),
      budget: z.number().nullable().optional(),
    })
  ),
  expenses: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      amount: z.number(),
      description: z.string(),
      vendor: z.string().nullable().optional(),
      passThroughPolicy: z.string(),
      markupPercent: z.number(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = suggestSchema.parse(body);

    const lines = await suggestPricing(
      data.projects,
      data.expenses,
      data.clientName
    );

    return NextResponse.json({ lines });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error suggesting pricing:", error);
    return NextResponse.json(
      { error: "Failed to suggest pricing" },
      { status: 500 }
    );
  }
}
