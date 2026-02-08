import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the admin user and clients
  const admin = await prisma.user.findUnique({
    where: { email: "admin@simplyops.com" },
  });
  if (!admin) throw new Error("Run base seed first");

  const clients = await prisma.client.findMany();
  const client1 = clients[0];
  const client2 = clients[1];

  if (!client1 || !client2) throw new Error("Run base seed first");

  // Add billing emails to clients
  await prisma.client.update({
    where: { id: client1.id },
    data: { billingEmail: "billing@techcorp.com" },
  });
  await prisma.client.update({
    where: { id: client2.id },
    data: { billingEmail: "billing@retailinnovations.com" },
  });

  // Create completed projects for billing
  await prisma.project.create({
    data: {
      name: "Landing Page Redesign",
      description: "Complete redesign of marketing landing pages with A/B testing",
      type: "Website Build",
      status: "completed",
      budget: 5000.0,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-12-15"),
      clientId: client1.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "CRM Integration",
      description: "Custom API integration with client CRM system",
      type: "Automation Build",
      status: "completed",
      budget: 3500.0,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-01-10"),
      clientId: client1.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Inventory Automation",
      description: "Automated inventory sync between POS and e-commerce",
      type: "Automation Build",
      status: "completed",
      budget: 7500.0,
      startDate: new Date("2025-10-15"),
      endDate: new Date("2026-01-05"),
      clientId: client2.id,
    },
  });

  // Create expenses for billing
  await prisma.expense.create({
    data: {
      category: "Software",
      amount: 49.99,
      description: "VAPI voice AI monthly subscription",
      vendor: "VAPI",
      whoPaid: "you_paid",
      passThroughPolicy: "pass_through_at_cost",
      date: new Date("2026-01-15"),
      clientId: client1.id,
    },
  });

  await prisma.expense.create({
    data: {
      category: "Hosting",
      amount: 29.0,
      description: "Vercel Pro hosting for client site",
      vendor: "Vercel",
      whoPaid: "you_paid",
      passThroughPolicy: "pass_through_at_cost",
      date: new Date("2026-01-01"),
      clientId: client1.id,
    },
  });

  await prisma.expense.create({
    data: {
      category: "Domain",
      amount: 14.99,
      description: "Domain renewal - retailinnovations.com",
      vendor: "Cloudflare",
      whoPaid: "you_paid",
      passThroughPolicy: "pass_through_at_cost",
      date: new Date("2026-01-20"),
      clientId: client2.id,
    },
  });

  await prisma.expense.create({
    data: {
      category: "Software",
      amount: 99.0,
      description: "Zapier automation plan for inventory sync",
      vendor: "Zapier",
      whoPaid: "you_paid",
      passThroughPolicy: "markup_percent",
      markupPercent: 15,
      date: new Date("2026-01-10"),
      clientId: client2.id,
    },
  });

  console.log("Billing test data seeded!");
  console.log("- 3 completed projects (2 for TechCorp, 1 for Retail Innovations)");
  console.log("- 4 expenses (2 per client)");
  console.log("- Billing emails added to both clients");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
