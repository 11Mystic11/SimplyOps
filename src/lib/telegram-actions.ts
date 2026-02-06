// Action executor for Telegram bot commands

import { prisma } from "@/lib/db";
import type { ActionType, ParsedIntent } from "./intent-parser";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Get or create a system user for bot operations
async function getSystemUserId(): Promise<string> {
  const systemEmail = "bot@simplyops.local";

  let user = await prisma.user.findUnique({
    where: { email: systemEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: systemEmail,
        name: "SimplyOps Bot",
      },
    });
  }

  return user.id;
}

type ActionHandler = (data: Record<string, unknown>) => Promise<ActionResult>;

const actionHandlers: Record<ActionType, ActionHandler> = {
  createClient: async (data) => {
    const name = data.name as string;
    if (!name) {
      return { success: false, message: "Client name is required" };
    }

    const userId = await getSystemUserId();

    const client = await prisma.client.create({
      data: {
        name,
        email: data.email as string | undefined,
        phone: data.phone as string | undefined,
        website: data.website as string | undefined,
        industry: data.industry as string | undefined,
        createdById: userId,
      },
    });

    return {
      success: true,
      message: `✅ Created client: <b>${client.name}</b>`,
      data: client,
    };
  },

  listClients: async () => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { projects: true, tasks: true } } },
    });

    if (clients.length === 0) {
      return { success: true, message: "No clients found." };
    }

    const list = clients
      .map(
        (c) =>
          `• <b>${c.name}</b> (${c._count.projects} projects, ${c._count.tasks} tasks)`
      )
      .join("\n");

    return {
      success: true,
      message: `<b>Clients (${clients.length})</b>\n\n${list}`,
      data: clients,
    };
  },

  getClient: async (data) => {
    const searchTerm = (data.name || data.searchTerm) as string;
    if (!searchTerm) {
      return { success: false, message: "Please specify a client name" };
    }

    const client = await prisma.client.findFirst({
      where: { name: { contains: searchTerm } },
      include: {
        _count: { select: { projects: true, tasks: true, subscriptions: true } },
        subscriptions: { where: { status: "active" }, take: 5 },
      },
    });

    if (!client) {
      return { success: false, message: `Client "${searchTerm}" not found` };
    }

    const mrr = client.subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return {
      success: true,
      message: `<b>${client.name}</b>
Status: ${client.status}
Health: ${client.healthScore}/100
${client.email ? `Email: ${client.email}` : ""}
${client.phone ? `Phone: ${client.phone}` : ""}
${client.industry ? `Industry: ${client.industry}` : ""}

Projects: ${client._count.projects}
Tasks: ${client._count.tasks}
Active subscriptions: ${client._count.subscriptions}
MRR: $${mrr.toFixed(2)}`,
      data: client,
    };
  },

  createProject: async (data) => {
    const name = data.name as string;
    const clientName = data.clientName as string;

    if (!name) {
      return { success: false, message: "Project name is required" };
    }
    if (!clientName) {
      return { success: false, message: "Client name is required for project" };
    }

    const client = await prisma.client.findFirst({
      where: { name: { contains: clientName, mode: "insensitive" } },
    });

    if (!client) {
      return { success: false, message: `Client "${clientName}" not found` };
    }

    const projectType = (data.type as string) || "Custom";
    const validTypes = ["Website Build", "Automation Build", "Custom"];
    const type = validTypes.includes(projectType) ? projectType : "Custom";

    const project = await prisma.project.create({
      data: {
        name,
        description: data.description as string | undefined,
        type,
        clientId: client.id,
        budget: data.budget as number | undefined,
        dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
      },
    });

    let msg = `✅ Created project: <b>${project.name}</b>\nClient: ${client.name}\nType: ${project.type}`;
    if (project.budget) msg += `\nBudget: $${project.budget}`;
    if (project.dueDate) msg += `\nDue: ${project.dueDate.toLocaleDateString()}`;

    return { success: true, message: msg, data: project };
  },

  listProjects: async (data) => {
    const whereClause: Record<string, unknown> = {};

    if (data.status) {
      whereClause.status = data.status;
    } else {
      whereClause.status = { not: "completed" };
    }

    if (data.clientName) {
      const client = await prisma.client.findFirst({
        where: { name: { contains: data.clientName as string, mode: "insensitive" } },
      });
      if (client) {
        whereClause.clientId = client.id;
      }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
    });

    if (projects.length === 0) {
      return { success: true, message: "No projects found." };
    }

    const statusIcon: Record<string, string> = {
      planning: "📋",
      in_progress: "🔄",
      review: "👀",
      completed: "✅",
      on_hold: "⏸️",
      at_risk: "⚠️",
    };

    const list = projects
      .map((p) => {
        const icon = statusIcon[p.status] || "📁";
        const budget = p.budget ? ` ($${p.budget})` : "";
        return `${icon} <b>${p.name}</b> [${p.client.name}]${budget}\n   ${p._count.tasks} tasks • ${p.status}`;
      })
      .join("\n\n");

    return {
      success: true,
      message: `<b>Projects (${projects.length})</b>\n\n${list}`,
      data: projects,
    };
  },

  getProject: async (data) => {
    const searchTerm = (data.name || data.searchTerm) as string;
    if (!searchTerm) {
      return { success: false, message: "Please specify a project name" };
    }

    const project = await prisma.project.findFirst({
      where: { name: { contains: searchTerm, mode: "insensitive" } },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true, notes: true } },
      },
    });

    if (!project) {
      return { success: false, message: `Project "${searchTerm}" not found` };
    }

    const statusIcon: Record<string, string> = {
      planning: "📋",
      in_progress: "🔄",
      review: "👀",
      completed: "✅",
      on_hold: "⏸️",
      at_risk: "⚠️",
    };
    const icon = statusIcon[project.status] || "📁";

    return {
      success: true,
      message: `${icon} <b>${project.name}</b>
Client: ${project.client.name}
Type: ${project.type}
Status: ${project.status}
${project.budget ? `Budget: $${project.budget}` : ""}
${project.description ? `\n${project.description}` : ""}
${project.startDate ? `\nStarted: ${project.startDate.toLocaleDateString()}` : ""}
${project.dueDate ? `Due: ${project.dueDate.toLocaleDateString()}` : ""}

Tasks: ${project._count.tasks}
Notes: ${project._count.notes}`,
      data: project,
    };
  },

  createTask: async (data) => {
    const title = data.title as string;
    if (!title) {
      return { success: false, message: "Task title is required" };
    }

    const userId = await getSystemUserId();

    let clientId: string | undefined;
    let projectId: string | undefined;
    let projectName: string | undefined;
    let clientName: string | undefined;

    // If projectName is provided, find the project and use its clientId
    if (data.projectName) {
      const project = await prisma.project.findFirst({
        where: { name: { contains: data.projectName as string, mode: "insensitive" } },
        include: { client: { select: { id: true, name: true } } },
      });
      if (project) {
        projectId = project.id;
        projectName = project.name;
        clientId = project.client.id;
        clientName = project.client.name;
      }
    }

    // If no project but clientName is provided, find the client
    if (!clientId && data.clientName) {
      const client = await prisma.client.findFirst({
        where: { name: { contains: data.clientName as string, mode: "insensitive" } },
      });
      if (client) {
        clientId = client.id;
        clientName = client.name;
      }
    }

    const taskData: {
      title: string;
      description?: string;
      priority: string;
      dueDate?: Date;
      createdById: string;
      clientId?: string;
      projectId?: string;
    } = {
      title,
      description: data.description as string | undefined,
      priority: (data.priority as string) || "medium",
      dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
      createdById: userId,
    };

    if (clientId) {
      taskData.clientId = clientId;
    }
    if (projectId) {
      taskData.projectId = projectId;
    }

    const task = await prisma.task.create({
      data: taskData,
    });

    let msg = `✅ Created task: <b>${task.title}</b>`;
    if (projectName) msg += `\nProject: ${projectName}`;
    if (clientName && !projectName) msg += `\nClient: ${clientName}`;
    if (task.priority !== "medium") msg += `\nPriority: ${task.priority}`;
    if (task.dueDate) msg += `\nDue: ${task.dueDate.toLocaleDateString()}`;

    return { success: true, message: msg, data: task };
  },

  listTasks: async (data) => {
    const whereClause: Record<string, unknown> = {};
    if (data.status) {
      whereClause.status = data.status;
    } else {
      whereClause.status = { not: "completed" };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 15,
      include: { client: { select: { name: true } } },
    });

    if (tasks.length === 0) {
      return { success: true, message: "No tasks found." };
    }

    const priorityIcon = { high: "🔴", medium: "🟡", low: "🟢" };
    const list = tasks
      .map((t) => {
        const icon = priorityIcon[t.priority as keyof typeof priorityIcon] || "⚪";
        const due = t.dueDate ? ` (due ${t.dueDate.toLocaleDateString()})` : "";
        const client = t.client ? ` [${t.client.name}]` : "";
        return `${icon} ${t.title}${client}${due}`;
      })
      .join("\n");

    return {
      success: true,
      message: `<b>Tasks (${tasks.length})</b>\n\n${list}`,
      data: tasks,
    };
  },

  completeTask: async (data) => {
    const title = (data.title || data.identifier) as string;
    if (!title) {
      return { success: false, message: "Please specify which task to complete" };
    }

    const task = await prisma.task.findFirst({
      where: { title: { contains: title }, status: { not: "completed" } },
    });

    if (!task) {
      return { success: false, message: `Task "${title}" not found` };
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "completed" },
    });

    return {
      success: true,
      message: `✅ Completed: <b>${task.title}</b>`,
    };
  },

  createSubscription: async (data) => {
    const clientName = data.clientName as string;
    const amount = data.amount as number;

    if (!clientName || !amount) {
      return {
        success: false,
        message: "Client name and amount are required for subscription",
      };
    }

    const client = await prisma.client.findFirst({
      where: { name: { contains: clientName } },
    });

    if (!client) {
      return { success: false, message: `Client "${clientName}" not found` };
    }

    const cadence = (data.billingCadence as string) || "monthly";
    const startDate = new Date();
    let nextBilling = new Date();

    switch (cadence) {
      case "quarterly":
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        break;
      case "annual":
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
      default:
        nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        clientId: client.id,
        name: (data.name as string) || `${client.name} Subscription`,
        amount,
        billingCadence: cadence,
        startDate,
        nextBilling,
      },
    });

    return {
      success: true,
      message: `✅ Created subscription for <b>${client.name}</b>
Amount: $${amount}/${cadence}
Next billing: ${nextBilling.toLocaleDateString()}`,
      data: subscription,
    };
  },

  listSubscriptions: async () => {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
      orderBy: { nextBilling: "asc" },
      take: 15,
      include: { client: { select: { name: true } } },
    });

    if (subscriptions.length === 0) {
      return { success: true, message: "No active subscriptions." };
    }

    const mrr = subscriptions.reduce((sum, s) => {
      if (s.billingCadence === "monthly") return sum + s.amount;
      if (s.billingCadence === "quarterly") return sum + s.amount / 3;
      if (s.billingCadence === "annual") return sum + s.amount / 12;
      return sum + s.amount;
    }, 0);

    const list = subscriptions
      .map(
        (s) =>
          `• <b>${s.client.name}</b>: $${s.amount}/${s.billingCadence} (next: ${s.nextBilling.toLocaleDateString()})`
      )
      .join("\n");

    return {
      success: true,
      message: `<b>Active Subscriptions</b>\nMRR: $${mrr.toFixed(2)}\n\n${list}`,
      data: subscriptions,
    };
  },

  createExpense: async (data) => {
    const amount = data.amount as number;
    const description = data.description as string;

    if (!amount || !description) {
      return {
        success: false,
        message: "Amount and description are required for expense",
      };
    }

    let clientId: string | undefined;
    if (data.clientName) {
      const client = await prisma.client.findFirst({
        where: { name: { contains: data.clientName as string } },
      });
      clientId = client?.id;
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        description,
        category: (data.category as string) || "general",
        date: data.date ? new Date(data.date as string) : new Date(),
        clientId,
      },
    });

    return {
      success: true,
      message: `✅ Logged expense: <b>$${amount}</b> - ${description}`,
      data: expense,
    };
  },

  createInvoice: async (data) => {
    const clientName = data.clientName as string;
    const amount = data.amount as number;

    if (!clientName || !amount) {
      return {
        success: false,
        message: "Client name and amount are required for invoice",
      };
    }

    const client = await prisma.client.findFirst({
      where: { name: { contains: clientName } },
    });

    if (!client) {
      return { success: false, message: `Client "${clientName}" not found` };
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
    });
    const lastNum = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.replace("INV-", ""))
      : 0;
    const invoiceNumber = `INV-${String(lastNum + 1).padStart(5, "0")}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const lineItems = JSON.stringify([
      { description: data.description || "Services", amount },
    ]);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: client.id,
        amount,
        description: data.description as string | undefined,
        dueDate: data.dueDate ? new Date(data.dueDate as string) : dueDate,
        lineItems,
      },
    });

    return {
      success: true,
      message: `✅ Created invoice <b>${invoiceNumber}</b> for ${client.name}
Amount: $${amount}
Due: ${invoice.dueDate?.toLocaleDateString()}`,
      data: invoice,
    };
  },

  createNote: async (data) => {
    const content = data.content as string;
    if (!content) {
      return { success: false, message: "Note content is required" };
    }

    const userId = await getSystemUserId();

    let clientId: string | undefined;
    let projectId: string | undefined;
    let contextInfo = "";

    // If projectName is provided, find the project and use its clientId
    if (data.projectName) {
      const project = await prisma.project.findFirst({
        where: { name: { contains: data.projectName as string, mode: "insensitive" } },
        include: { client: { select: { id: true, name: true } } },
      });
      if (project) {
        projectId = project.id;
        clientId = project.client.id;
        contextInfo = ` for project "${project.name}"`;
      }
    }

    // If no project but clientName is provided, find the client
    if (!clientId && data.clientName) {
      const client = await prisma.client.findFirst({
        where: { name: { contains: data.clientName as string, mode: "insensitive" } },
      });
      if (client) {
        clientId = client.id;
        contextInfo = ` for client "${client.name}"`;
      }
    }

    let taskId: string | undefined;
    if (data.taskTitle) {
      const task = await prisma.task.findFirst({
        where: { title: { contains: data.taskTitle as string, mode: "insensitive" } },
      });
      if (task) {
        taskId = task.id;
        if (!contextInfo) contextInfo = ` for task "${task.title}"`;
      }
    }

    const noteData: {
      content: string;
      type: string;
      createdById: string;
      clientId?: string;
      projectId?: string;
      taskId?: string;
    } = {
      content,
      type: (data.type as string) || "general",
      createdById: userId,
    };

    if (clientId) {
      noteData.clientId = clientId;
    }
    if (projectId) {
      noteData.projectId = projectId;
    }
    if (taskId) {
      noteData.taskId = taskId;
    }

    const note = await prisma.note.create({
      data: noteData,
    });

    const typeEmoji = { call: "📞", email: "📧", meeting: "📅", general: "📝" };
    const emoji = typeEmoji[note.type as keyof typeof typeEmoji] || "📝";

    return {
      success: true,
      message: `${emoji} Note added${contextInfo}`,
      data: note,
    };
  },

  help: async () => {
    return { success: true, message: "" }; // Handled specially in webhook
  },

  unknown: async () => {
    return {
      success: false,
      message:
        "I didn't understand that. Type <b>help</b> to see available commands.",
    };
  },
};

export async function executeAction(intent: ParsedIntent): Promise<ActionResult> {
  const handler = actionHandlers[intent.action];
  if (!handler) {
    return {
      success: false,
      message: "Unknown action. Type <b>help</b> for available commands.",
    };
  }

  try {
    return await handler(intent.data);
  } catch (error) {
    console.error(`Action ${intent.action} failed:`, error);
    return {
      success: false,
      message: `Error executing ${intent.action}. Please try again.`,
    };
  }
}
