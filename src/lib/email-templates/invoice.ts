import { type QuoteLine, formatCurrency, groupLinesByKey } from "@/lib/pricing";

interface InvoiceEmailData {
  clientName: string;
  invoiceNumber: string;
  lines: QuoteLine[];
  subtotal: number; // cents
  discount: number; // cents
  total: number; // cents
  dueDate?: string;
  memo?: string;
  hostedInvoiceUrl: string;
}

export function renderInvoiceEmailHtml(data: InvoiceEmailData): string {
  const grouped = groupLinesByKey(data.lines.filter((l) => l.kind !== "discount"));
  const discountLines = data.lines.filter((l) => l.kind === "discount");

  const lineRowsHtml = Object.entries(grouped)
    .map(([group, lines]) => {
      const groupHeader = `<tr><td colspan="4" style="padding:12px 8px 4px;font-weight:600;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e2e8f0;">${escapeHtml(group)}</td></tr>`;
      const rows = lines
        .map(
          (line) => `
        <tr>
          <td style="padding:8px;font-size:13px;color:#334155;">${escapeHtml(line.title)}${line.notesClient ? `<br><span style="color:#64748b;font-size:12px;">${escapeHtml(line.notesClient)}</span>` : ""}</td>
          <td style="padding:8px;font-size:13px;color:#334155;text-align:center;">${line.quantity} ${escapeHtml(line.unitLabel)}</td>
          <td style="padding:8px;font-size:13px;color:#334155;text-align:right;">${formatCurrency(line.unitAmountCents)}</td>
          <td style="padding:8px;font-size:13px;color:#334155;text-align:right;font-weight:500;">${formatCurrency(line.quantity * line.unitAmountCents)}</td>
        </tr>`
        )
        .join("");
      return groupHeader + rows;
    })
    .join("");

  const discountRowsHtml = discountLines
    .map(
      (line) => `
      <tr>
        <td colspan="3" style="padding:8px;font-size:13px;color:#dc2626;">${escapeHtml(line.title)}</td>
        <td style="padding:8px;font-size:13px;color:#dc2626;text-align:right;">-${formatCurrency(line.quantity * line.unitAmountCents)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">SimplyOps</h1>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Invoice ${escapeHtml(data.invoiceNumber)}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
            Hi ${escapeHtml(data.clientName)},
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#334155;line-height:1.6;">
            Please find your invoice details below. You can pay securely online using the button at the bottom.
          </p>

          <!-- Line Items Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 8px;font-size:12px;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
                <th style="padding:10px 8px;font-size:12px;color:#64748b;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
                <th style="padding:10px 8px;font-size:12px;color:#64748b;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Rate</th>
                <th style="padding:10px 8px;font-size:12px;color:#64748b;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineRowsHtml}
              ${discountRowsHtml}
            </tbody>
            <tfoot>
              <tr style="border-top:1px solid #e2e8f0;">
                <td colspan="3" style="padding:10px 8px;font-size:13px;color:#64748b;text-align:right;">Subtotal</td>
                <td style="padding:10px 8px;font-size:13px;color:#334155;text-align:right;">${formatCurrency(data.subtotal)}</td>
              </tr>
              ${data.discount > 0 ? `<tr><td colspan="3" style="padding:4px 8px 10px;font-size:13px;color:#dc2626;text-align:right;">Discount</td><td style="padding:4px 8px 10px;font-size:13px;color:#dc2626;text-align:right;">-${formatCurrency(data.discount)}</td></tr>` : ""}
              <tr style="border-top:2px solid #1a1a2e;">
                <td colspan="3" style="padding:12px 8px;font-size:16px;font-weight:700;color:#1a1a2e;text-align:right;">Total Due</td>
                <td style="padding:12px 8px;font-size:16px;font-weight:700;color:#1a1a2e;text-align:right;">${formatCurrency(data.total)}</td>
              </tr>
            </tfoot>
          </table>

          ${data.dueDate ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Due Date: <strong style="color:#334155;">${escapeHtml(data.dueDate)}</strong></p>` : ""}
          ${data.memo ? `<p style="margin:0 0 24px;font-size:13px;color:#64748b;">${escapeHtml(data.memo)}</p>` : ""}

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
            <tr><td align="center">
              <a href="${escapeHtml(data.hostedInvoiceUrl)}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;">
                Pay Invoice
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
            If you have any questions, please reply to this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            Sent via SimplyOps
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
