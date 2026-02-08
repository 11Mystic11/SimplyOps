import Stripe from "stripe";
import { prisma } from "@/lib/db";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return stripeClient;
}

export async function getOrCreateCustomer(
  clientId: string,
  name: string,
  email: string,
  idempotencyKey?: string
): Promise<string> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (client?.stripeCustomerId) {
    return client.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create(
    { name, email, metadata: { clientId } },
    idempotencyKey ? { idempotencyKey: `cust_${idempotencyKey}` } : undefined
  );

  await prisma.client.update({
    where: { id: clientId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export interface CreateInvoiceParams {
  customerId: string;
  lines: Array<{
    title: string;
    description?: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  dueDate?: Date;
  memo?: string;
  idempotencyKey: string;
}

export async function createDraftInvoice(
  params: CreateInvoiceParams
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();

  // Create invoice items for each line
  for (let i = 0; i < params.lines.length; i++) {
    const line = params.lines[i];
    await stripe.invoiceItems.create(
      {
        customer: params.customerId,
        amount: line.unitAmountCents * line.quantity,
        currency: "usd",
        description: line.description
          ? `${line.title} - ${line.description}`
          : line.title,
      },
      {
        idempotencyKey: `${params.idempotencyKey}_item_${i}`,
      }
    );
  }

  // Create the draft invoice
  const invoice = await stripe.invoices.create(
    {
      customer: params.customerId,
      collection_method: "send_invoice",
      days_until_due: params.dueDate
        ? Math.max(
            1,
            Math.ceil(
              (params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          )
        : 30,
      description: params.memo || undefined,
      auto_advance: false, // Prevent Stripe from sending emails
      payment_settings: {
        payment_method_types: ["card"],
      },
    },
    {
      idempotencyKey: `${params.idempotencyKey}_invoice`,
    }
  );

  return invoice;
}

export async function finalizeInvoice(
  stripeInvoiceId: string
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();
  const invoice = await stripe.invoices.finalizeInvoice(stripeInvoiceId, {
    auto_advance: false, // Do NOT send Stripe's email
  });
  return invoice;
}

export async function voidInvoice(
  stripeInvoiceId: string
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();
  return stripe.invoices.voidInvoice(stripeInvoiceId);
}

export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
