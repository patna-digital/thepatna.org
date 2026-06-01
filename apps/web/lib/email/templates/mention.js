/**
 * mentionEmailHtml — email sent when a member is @mentioned in a thread comment.
 */
export function mentionEmailHtml({
  recipientName,
  senderName,
  spaceTitle,
  threadTitle,
  commentExcerpt,
  link,
  unsubscribeLink,
}) {
  const excerpt = commentExcerpt
    ? `<p style="background:#f0f4ff;border-left:3px solid #0057B7;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;font-size:14px;color:#3a3a5c;font-style:italic;">${escapeHtml(commentExcerpt)}</p>`
    : "";

  return baseTemplate({
    title: `${senderName} mentioned you`,
    preheader: `${senderName} mentioned you in "${threadTitle}"`,
    body: `
      <p style="font-size:16px;color:#1a1a2e;margin:0 0 8px;">
        <strong>${escapeHtml(senderName)}</strong> mentioned you in a discussion.
      </p>
      <p style="font-size:14px;color:#5a5a7a;margin:0 0 16px;">
        Space: <strong>${escapeHtml(spaceTitle)}</strong> &rsaquo; ${escapeHtml(threadTitle)}
      </p>
      ${excerpt}
    `,
    ctaText: "View discussion",
    ctaHref: link,
    unsubscribeLink,
  });
}

function baseTemplate({ title, preheader, body, ctaText, ctaHref, unsubscribeLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&#847;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#0057B7;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">PATNA Community</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;">${escapeHtml(title)}</h1>
            ${body}
            ${ctaText && ctaHref ? `
            <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="background:#0057B7;border-radius:8px;padding:12px 24px;">
                  <a href="${ctaHref}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(ctaText)} &rarr;</a>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f7fa;padding:20px 32px;border-top:1px solid #e8ecf3;">
            <p style="margin:0;font-size:12px;color:#9090a8;text-align:center;">
              You are receiving this because you are a member of PATNA Community.
              ${unsubscribeLink ? `<br/><a href="${unsubscribeLink}" style="color:#9090a8;">Manage notification preferences</a>` : ""}
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
