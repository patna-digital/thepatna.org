/**
 * broadcastEmailHtml — admin broadcast / announcement email.
 */
export function broadcastEmailHtml({ subject, body, senderName, settingsLink }) {
  return baseTemplate({
    title: subject,
    preheader: `Message from ${senderName} · PATNA Community`,
    body: `
      <p style="font-size:13px;color:#9090a8;margin:0 0 16px;">
        Message from <strong>${escapeHtml(senderName)}</strong> · PATNA Community team
      </p>
      <div style="font-size:15px;color:#1a1a2e;line-height:1.65;white-space:pre-wrap;">${escapeHtml(body)}</div>
    `,
    ctaText: "Open PATNA Community",
    ctaHref: `${process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community"}/app`,
    settingsLink,
  });
}

function baseTemplate({ title, preheader, body, ctaText, ctaHref, settingsLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&#847;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#0057B7;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">PATNA Community</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#0057B7;text-transform:uppercase;letter-spacing:0.08em;">Announcement</p>
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;">${escapeHtml(title)}</h1>
            ${body}
            ${ctaText && ctaHref ? `
            <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td style="background:#0057B7;border-radius:8px;padding:12px 24px;">
                  <a href="${ctaHref}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(ctaText)} &rarr;</a>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>
        <tr>
          <td style="background:#f5f7fa;padding:20px 32px;border-top:1px solid #e8ecf3;">
            <p style="margin:0;font-size:12px;color:#9090a8;text-align:center;">
              You are receiving this as a PATNA Community member.
              ${settingsLink ? `<br/><a href="${settingsLink}" style="color:#9090a8;">Manage notification preferences</a>` : ""}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
