import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getCatalogForPrompt } from "@/lib/automation-catalog";

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text ?? "";
}

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

    const scan = await prisma.automationScan.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    if (!scan) {
      return NextResponse.json({ scan: null });
    }

    return NextResponse.json({
      scan: {
        id: scan.id,
        results: JSON.parse(scan.results),
        createdAt: scan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching scan:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan" },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: { select: { name: true, type: true, status: true } },
        notes: {
          select: { content: true, type: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientContext = [
      `Client: ${client.name}`,
      client.industry ? `Industry: ${client.industry}` : null,
      client.website ? `Website: ${client.website}` : null,
      client.projects.length > 0
        ? `Current projects: ${client.projects.map((p) => `${p.name} (${p.type}, ${p.status})`).join("; ")}`
        : "No current projects",
      client.notes.length > 0
        ? `Recent notes:\n${client.notes.map((n) => `[${n.type}] ${n.content}`).join("\n")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const catalog = getCatalogForPrompt();

    const prompt = `You are an automation consultant for Simply Automations. Analyze this client and identify which automation products from our catalog would benefit them. Consider their industry, current projects, and any context from notes.

## Client Info
${clientContext}

## Our Automation Product Catalog
${catalog}

## Instructions
Return a JSON array of opportunities. For each opportunity, include:
- "product": the exact product name from the catalog
- "relevance": "high", "medium", or "low"
- "problem": 1-2 sentences describing the specific problem this client likely has that this product solves
- "pitch": 1-2 sentences on how to pitch this to the client, personalized to their business
- "estimated_value": estimated monthly value range (use the catalog pricing)

Only include products with at least medium relevance. Sort by relevance (high first). Return 3-7 opportunities.

Return ONLY the JSON array, no other text.`;

    const responseText = await callClaude(prompt);

    let opportunities;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      opportunities = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", responseText);
      opportunities = [];
    }

    const scan = await prisma.automationScan.create({
      data: {
        clientId: id,
        results: JSON.stringify(opportunities),
      },
    });

    return NextResponse.json({
      scan: {
        id: scan.id,
        results: opportunities,
        createdAt: scan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error running scan:", error);
    return NextResponse.json(
      { error: "Failed to run automation scan" },
      { status: 500 },
    );
  }
}
