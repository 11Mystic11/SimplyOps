import { NextResponse } from "next/server";
import {
  validateWebhookSecret,
  isAuthorizedUser,
  sendMessage,
  parseUpdate,
  extractMessageText,
  extractChatId,
  extractUserId,
} from "@/lib/telegram";
import { parseIntent, getHelpMessage } from "@/lib/intent-parser";
import { executeAction } from "@/lib/telegram-actions";

export async function POST(request: Request) {
  try {
    // 1. Validate webhook secret
    if (!validateWebhookSecret(request)) {
      console.warn("Invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const update = parseUpdate(body);

    if (!update) {
      console.warn("Invalid Telegram update format");
      return NextResponse.json({ ok: true });
    }

    // 3. Extract message details
    const messageText = extractMessageText(update);
    const chatId = extractChatId(update);
    const userId = extractUserId(update);

    // Skip if no text message
    if (!messageText || !chatId) {
      return NextResponse.json({ ok: true });
    }

    // 4. Check authorized user
    if (userId && !isAuthorizedUser(userId)) {
      console.warn(`Unauthorized user: ${userId}`);
      await sendMessage(chatId, "⛔ You are not authorized to use this bot.");
      return NextResponse.json({ ok: true });
    }

    console.log(`Telegram message from ${userId}: ${messageText}`);

    // 5. Parse intent with Claude
    const intent = await parseIntent(messageText);
    console.log(`Parsed intent: ${intent.action} (${intent.confidence})`, intent.data);

    // 6. Handle help command specially
    if (intent.action === "help") {
      await sendMessage(chatId, getHelpMessage());
      return NextResponse.json({ ok: true });
    }

    // 7. Execute the action
    const result = await executeAction(intent);

    // 8. Send response to Telegram
    await sendMessage(chatId, result.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    // Try to notify user of error if we have a chatId
    try {
      const body = await request.clone().json();
      const chatId = body?.message?.chat?.id;
      if (chatId) {
        await sendMessage(chatId, "❌ Something went wrong. Please try again.");
      }
    } catch {
      // Ignore notification errors
    }

    return NextResponse.json({ ok: true });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    bot: "SimplyOps Telegram Bot",
    timestamp: new Date().toISOString(),
  });
}
