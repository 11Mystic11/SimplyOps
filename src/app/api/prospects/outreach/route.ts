import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const outreachSchema = z.object({
  prospectIds: z.array(z.string()).min(1, "At least one prospect required"),
  channels: z.array(z.enum(["email", "linkedin"])).min(1, "At least one channel required"),
  persona: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prospectIds, channels, persona } = outreachSchema.parse(body);

    // Fetch the selected prospects
    const prospects = await prisma.prospect.findMany({
      where: { id: { in: prospectIds } },
    });

    if (prospects.length === 0) {
      return NextResponse.json(
        { error: "No prospects found" },
        { status: 404 }
      );
    }

    // Validate prospects have required contact info for selected channels
    const emailProspects = channels.includes("email")
      ? prospects.filter((p) => p.email)
      : [];
    const linkedinProspects = channels.includes("linkedin")
      ? prospects.filter((p) => p.linkedinUrl)
      : [];

    const skipped = prospects.length - new Set([
      ...emailProspects.map((p) => p.id),
      ...linkedinProspects.map((p) => p.id),
    ]).size;

    // Build the outreach payload that maps to the Antigravity execution scripts
    const campaignId = `campaign_${Date.now()}`;
    const outreachPayload = {
      campaignId,
      channels,
      persona: persona || "owner_operator",
      emailCount: emailProspects.length,
      linkedinCount: linkedinProspects.length,
      skippedCount: skipped,
      prospects: prospects.map((p) => ({
        id: p.id,
        first_name: p.firstName,
        last_name: p.lastName || "",
        email: p.email || "",
        linkedin_url: p.linkedinUrl || "",
        job_title: p.jobTitle || "",
        company: p.company || "",
        industry: p.industry || "",
        company_size: p.companySize || "",
        persona: p.persona || persona || "owner_operator",
        personalized_line: p.personalizedLine || "",
      })),
    };

    // Update prospect statuses to "contacted"
    const channelLabel = channels.join("+");
    await prisma.prospect.updateMany({
      where: { id: { in: prospectIds } },
      data: {
        status: "contacted",
        outreachChannel: channelLabel,
        campaignId,
      },
    });

    // In production, this would call the Antigravity execution scripts:
    // 1. Write prospects to CSV in .tmp/outreach/leads/
    // 2. Call outreach_email_sequences.py via child_process or API
    // 3. Call outreach_linkedin.py via child_process or API
    //
    // For now, return the payload so the frontend can confirm the action.

    return NextResponse.json({
      success: true,
      campaignId,
      summary: {
        totalProspects: prospects.length,
        emailEnrolled: emailProspects.length,
        linkedinEnrolled: linkedinProspects.length,
        skipped,
        channels,
      },
      // The outreach payload can be used to trigger execution scripts
      _outreachPayload: outreachPayload,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error launching outreach:", error);
    return NextResponse.json(
      { error: "Failed to launch outreach" },
      { status: 500 }
    );
  }
}
