/**
 * adminWelcomeEmailHtml — sent when a super admin grants the administrator role.
 */
export function adminWelcomeEmailHtml({ recipientName, granterName, adminLink }) {
  return baseTemplate({
    title: "You have been granted admin access",
    preheader: `${granterName} has added you as a PATNA platform administrator`,
    body: `
      <p style="font-size:16px;color:#1a1a2e;margin:0 0 8px;">
        Hi <strong>${escapeHtml(recipientName)}</strong>,
      </p>
      <p style="font-size:14px;color:#5a5a7a;margin:0 0 20px;">
        <strong>${escapeHtml(granterName)}</strong> has granted you administrator access to the PATNA community platform.
      </p>
      <p style="font-size:14px;color:#5a5a7a;margin:0 0 8px;">As an admin, you can:</p>
      <ul style="margin:0 0 20px;padding:0 0 0 20px;font-size:14px;color:#5a5a7a;line-height:1.8;">
        <li>Review and process community applications</li>
        <li>Manage members, spaces, and events</li>
        <li>Send broadcast notifications</li>
        <li>Manage content, publications, and projects</li>
        <li>Handle partnership and service request pipelines</li>
      </ul>
      <p style="font-size:14px;color:#5a5a7a;margin:0;">
        Sign in with your existing account to access the admin workspace.
      </p>
    `,
    ctaText: "Open admin workspace",
    ctaHref: adminLink,
  });
}

function baseTemplate({ title, preheader, body, ctaText, ctaHref }) {
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
          <td style="background:#082640;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">PATNA Admin</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;">${escapeHtml(title)}</h1>
            ${body}
            ${ctaText && ctaHref ? `
            <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="background:#082640;border-radius:8px;padding:12px 24px;">
                  <a href="${ctaHref}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(ctaText)} &rarr;</a>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>
        <tr>
          <td style="background:#f5f7fa;padding:20px 32px;border-top:1px solid #e8ecf3;">
            <p style="margin:0;font-size:12px;color:#9090a8;text-align:center;">
              PATNA Initiative · Platform notification
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
