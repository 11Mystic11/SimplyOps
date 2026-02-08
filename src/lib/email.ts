import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!);
  }
  return resendClient;
}

export async function sendInvoiceEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string }> {
  const resend = getResendClient();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "billing@simplyops.com";

  const { data, error } = await resend.emails.send({
    from: `SimplyOps Billing <${fromEmail}>`,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data!.id };
}
