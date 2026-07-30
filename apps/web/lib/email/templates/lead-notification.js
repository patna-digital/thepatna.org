function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generic admin-notification email for the three "Work with us" lead pipelines
 * (partnership, collaboration, service request). Mirrors the visual style of
 * application-notification.js so all admin alert emails look consistent.
 */
export function leadNotificationEmailHtml({
  headerLabel,
  heading,
  fields = [],
  detailLabel,
  detailText,
  reviewLink,
}) {
  const rows = fields
    .filter((field) => field?.value)
    .map(
      (field, index) => `<tr${index % 2 === 1 ? ' style="background:#f5f7fa;"' : ""}>
                <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#5a5a7a;text-transform:uppercase;letter-spacing:0.06em;width:140px;${index > 0 ? "border-top:1px solid #e8ecf3;" : ""}">${escapeHtml(field.label)}</td>
                <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;${index > 0 ? "border-top:1px solid #e8ecf3;" : ""}">${escapeHtml(field.value)}</td>
              </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(heading)}&nbsp;&#847;&nbsp;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#082640;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">${escapeHtml(headerLabel)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;">${escapeHtml(heading)}</h1>
            ${rows ? `<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;border:1px solid #e8ecf3;border-radius:8px;overflow:hidden;">${rows}</table>` : ""}
            ${detailText ? `
            <p style="font-size:12px;font-weight:600;color:#5a5a7a;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">${escapeHtml(detailLabel || "Details")}</p>
            <p style="font-size:14px;color:#5a5a7a;line-height:1.65;margin:0 0 24px;padding:16px;background:#f5f7fa;border-radius:8px;border-left:3px solid #082640;">${escapeHtml(detailText)}</p>
            ` : ""}
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#082640;border-radius:8px;padding:12px 24px;">
                  <a href="${escapeHtml(reviewLink)}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Review in admin panel &rarr;</a>
                </td>
              </tr>
            </table>
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
