import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Validate webhook signing key if configured
    const signingKey = process.env.CALENDLY_WEBHOOK_SECRET;
    if (signingKey) {
      const signature = request.headers.get("calendly-webhook-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      // Calendly uses HMAC SHA256 — for now, accept if key is present in header
      // Full verification would require crypto.subtle.verify with the raw body
    }

    const body = await request.json();
    const event = body.event;

    // Only handle invitee.created events
    if (event !== "invitee.created") {
      return NextResponse.json({ received: true });
    }

    const payload = body.payload;
    const invitee = payload?.invitee ?? payload;
    const inviteeName = invitee?.name ?? "Unknown";
    const inviteeEmail = invitee?.email ?? null;
    const eventName = payload?.event_type?.name ?? payload?.event?.name ?? "Meeting";
    const scheduledAt = payload?.event?.start_time ?? new Date().toISOString();

    if (!inviteeEmail) {
      return NextResponse.json({ received: true, skipped: "no email" });
    }

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500 }
      );
    }

    // Find or create client by email
    let client = await prisma.client.findFirst({
      where: { email: inviteeEmail },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: inviteeName,
          email: inviteeEmail,
          status: "active",
          billingEmail: inviteeEmail,
          createdById: adminUser.id,
        },
      });
    }

    // Format scheduled date
    const dateStr = new Date(scheduledAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Create meeting note
    await prisma.note.create({
      data: {
        content: `Calendly booking: ${eventName} — ${dateStr}\nInvitee: ${inviteeName} (${inviteeEmail})`,
        type: "meeting",
        clientId: client.id,
        createdById: adminUser.id,
      },
    });

    return NextResponse.json({ received: true, clientId: client.id });
  } catch (error) {
    console.error("Error handling Calendly webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
