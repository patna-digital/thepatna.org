import { Resend } from "resend";

let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    _client = new Resend(apiKey);
  }
  return _client;
}

const FROM = process.env.RESEND_FROM_EMAIL || "notifications@patna.community";
const FROM_NAME = "PATNA Community";

export async function sendEmail({ to, subject, html }) {
  const client = getClient();
  const { data, error } = await client.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

/**
 * Send up to 100 emails in a single Resend batch call.
 * emails: Array<{ to: string, subject: string, html: string }>
 */
export async function sendBatch(emails) {
  if (!emails.length) return [];
  const client = getClient();
  const payload = emails.map(({ to, subject, html }) => ({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  }));
  const { data, error } = await client.batch.send(payload);
  if (error) throw new Error(`Resend batch error: ${error.message}`);
  return data;
}
