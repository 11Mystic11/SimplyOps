// OpenAI-powered intent parser for Telegram messages

export type ActionType =
  | "createClient"
  | "listClients"
  | "getClient"
  | "createProject"
  | "listProjects"
  | "getProject"
  | "createTask"
  | "listTasks"
  | "completeTask"
  | "createSubscription"
  | "listSubscriptions"
  | "createExpense"
  | "createInvoice"
  | "createNote"
  | "help"
  | "unknown";

export interface ParsedIntent {
  action: ActionType;
  data: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  rawMessage: string;
}

const SYSTEM_PROMPT = `You are an intent parser for a CRM system called SimplyOps. Your job is to parse natural language messages and extract the user's intent.

Available actions:
- createClient: Create a new client (requires: name; optional: email, phone, website, industry)
- listClients: List all clients
- getClient: Get details about a specific client (requires: name or search term)
- createProject: Create a new project (requires: name, clientName; optional: type [Website Build/Automation Build/Custom], description, budget, dueDate)
- listProjects: List all projects (optional: status filter, clientName filter)
- getProject: Get details about a specific project (requires: name or search term)
- createTask: Create a new task (requires: title; optional: description, priority [low/medium/high], dueDate, clientName, projectName)
- listTasks: List tasks (optional: status filter)
- completeTask: Mark a task as completed (requires: title or identifier)
- createSubscription: Create a subscription (requires: clientName, amount; optional: name, billingCadence [monthly/quarterly/annual])
- listSubscriptions: List all subscriptions
- createExpense: Log an expense (requires: amount, description; optional: category, clientName, date)
- createInvoice: Create an invoice (requires: clientName, amount; optional: description, dueDate)
- createNote: Add a note (requires: content; optional: type [call/email/meeting/general], clientName, projectName, taskTitle)
- help: User needs help understanding commands
- unknown: Cannot determine intent

Parse the user's message and return a JSON object with:
- action: one of the action types above
- data: extracted parameters for the action
- confidence: how confident you are in this interpretation (high/medium/low)

For dates, interpret relative dates like "tomorrow", "next week", "friday" into ISO date strings.
For amounts, extract the numeric value (e.g., "$500/mo" -> amount: 500, billingCadence: "monthly").

Return ONLY the JSON object, no other text.`;

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function parseIntent(message: string): Promise<ParsedIntent> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  try {
    const responseText = await callOpenAI(message);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        action: "unknown",
        data: {},
        confidence: "low",
        rawMessage: message,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      action: parsed.action || "unknown",
      data: parsed.data || {},
      confidence: parsed.confidence || "low",
      rawMessage: message,
    };
  } catch (error) {
    console.error("Intent parsing error:", error);
    return {
      action: "unknown",
      data: {},
      confidence: "low",
      rawMessage: message,
    };
  }
}

export function getHelpMessage(): string {
  return `<b>SimplyOps Bot Commands</b>

<b>Clients</b>
• "add client [name]" - Create a new client
• "list clients" - Show all clients
• "client [name] info" - Get client details

<b>Projects</b>
• "create project [name] for [client]" - Create a new project
• "list projects" - Show all projects
• "project [name] info" - Get project details

<b>Tasks</b>
• "add task [title]" - Create a task
• "task [title] for [client]" - Task linked to client
• "task [title] for project [name]" - Task linked to project
• "my tasks" or "list tasks" - Show tasks
• "complete [task]" - Mark task done

<b>Financial</b>
• "add subscription $[amount]/mo for [client]"
• "expense $[amount] [description]"
• "invoice [client] $[amount]"

<b>Activity</b>
• "log call with [client]: [notes]"
• "note for [client]: [content]"
• "note for project [name]: [content]"

Just type naturally - I'll figure out what you mean!`;
}
