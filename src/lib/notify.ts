import "server-only";

/** Sends an SMS through a generic HTTP gateway; logs in development. */
export async function sendSms(to: string, message: string) {
  const tpl = process.env.SMS_GATEWAY_URL;
  if (!tpl) {
    console.info(`[sms:dev] to=${to} :: ${message}`);
    return;
  }
  const url = tpl.replace("{to}", encodeURIComponent(to)).replace("{message}", encodeURIComponent(message));
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`SMS gateway error ${res.status}`);
}

/** Sends a transactional email through Resend; logs in development. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, " ")}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Meow <no-reply@example.com>", to, subject, html }),
  });
  if (!res.ok) console.error("[email] resend failed", res.status, await res.text());
}
