// Telegram Bot API utilities

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export function validateWebhookSecret(request: Request): boolean {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.warn("TELEGRAM_WEBHOOK_SECRET not configured - skipping validation");
    return true;
  }

  return secretToken === expectedSecret;
}

export function isAuthorizedUser(userId: number): boolean {
  const authorizedId = process.env.TELEGRAM_AUTHORIZED_USER_ID;
  if (!authorizedId) {
    console.warn("TELEGRAM_AUTHORIZED_USER_ID not configured - allowing all users");
    return true;
  }
  return userId.toString() === authorizedId;
}

export async function sendMessage(
  chatId: number,
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
): Promise<boolean> {
  try {
    const token = getBotToken();
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram sendMessage error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

export function parseUpdate(body: unknown): TelegramUpdate | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const update = body as TelegramUpdate;
  if (typeof update.update_id !== "number") {
    return null;
  }

  return update;
}

export function extractMessageText(update: TelegramUpdate): string | null {
  return update.message?.text ?? null;
}

export function extractChatId(update: TelegramUpdate): number | null {
  return update.message?.chat.id ?? null;
}

export function extractUserId(update: TelegramUpdate): number | null {
  return update.message?.from?.id ?? null;
}
