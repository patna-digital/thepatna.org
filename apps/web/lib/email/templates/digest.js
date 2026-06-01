/**
 * digestEmailHtml — weekly/daily activity digest email.
 *
 * activities: Array<{
 *   type: 'thread' | 'comment',
 *   spaceName: string,
 *   spaceSlug: string,
 *   title: string,
 *   authorName: string,
 *   createdAt: string (ISO),
 *   link: string,
 * }>
 */
export function digestEmailHtml({
  recipientName,
  frequency,
  activities,
  settingsLink,
}) {
  const periodLabel = frequency === "daily" ? "today" : "this week";
  const count = activities.length;

  const grouped = groupBySpace(activities);

  const sectionsHtml = Object.entries(grouped).map(([spaceName, items]) => {
    const rows = items.map((a) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f2f7;">
          <p style="margin:0 0 2px;font-size:14px;color:#1a1a2e;">
            <a href="${a.link}" style="color:#0057B7;text-decoration:none;font-weight:500;">${escapeHtml(a.title)}</a>
          </p>
          <p style="margin:0;font-size:12px;color:#9090a8;">
            ${a.type === "thread" ? "New thread" : "New reply"} by ${escapeHtml(a.authorName)} &middot; ${formatRelativeDate(a.createdAt)}
          </p>
        </td>
      </tr>`).join("");

    return `
      <tr><td style="padding:20px 0 4px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#9090a8;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(spaceName)}</p>
      </td></tr>
      ${rows}
    `;
  }).join("");

  return baseTemplate({
    title: `Your PATNA digest`,
    preheader: `${count} update${count !== 1 ? "s" : ""} from your spaces ${periodLabel}`,
    body: `
      <p style="font-size:16px;color:#1a1a2e;margin:0 0 20px;">
        Hi ${escapeHtml(recipientName)}, here's what happened in your spaces ${periodLabel}.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${sectionsHtml}
      </table>
    `,
    ctaText: "Open PATNA Community",
    ctaHref: `${process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community"}/app`,
    settingsLink,
  });
}

function groupBySpace(activities) {
  return activities.reduce((acc, a) => {
    const key = a.spaceName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});
}

function formatRelativeDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
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
              You are receiving this digest as a PATNA Community member.
              ${settingsLink ? `<br/><a href="${settingsLink}" style="color:#9090a8;">Manage digest preferences</a>` : ""}
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
