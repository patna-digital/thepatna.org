/**
 * assignmentEmailHtml — sent when an admin assigns an application task to another admin.
 */
export function assignmentEmailHtml({
  recipientName,
  assignerName,
  applicantName,
  applicantEmail,
  applicationStatus,
  assignmentNotes,
  applicationLink,
  unsubscribeLink,
}) {
  const notesBlock = assignmentNotes
    ? `<p style="background:#f0f4ff;border-left:3px solid #0057B7;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;font-size:14px;color:#3a3a5c;white-space:pre-wrap;">${escapeHtml(assignmentNotes)}</p>`
    : "";

  return baseTemplate({
    title: "Application assigned to you",
    preheader: `${assignerName} assigned ${applicantName}'s application to you`,
    body: `
      <p style="font-size:16px;color:#1a1a2e;margin:0 0 8px;">
        Hi <strong>${escapeHtml(recipientName)}</strong>,
      </p>
      <p style="font-size:14px;color:#5a5a7a;margin:0 0 20px;">
        <strong>${escapeHtml(assignerName)}</strong> has assigned an applicant review to you.
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Applicant</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a2e;">${escapeHtml(applicantName)}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#5a5a7a;">${escapeHtml(applicantEmail)}</p>
          </td>
          <td align="right" style="padding:16px;">
            <span style="display:inline-block;padding:4px 10px;background:#dbeafe;color:#1e40af;border-radius:99px;font-size:12px;font-weight:600;">${escapeHtml(applicationStatus || 'submitted')}</span>
          </td>
        </tr>
      </table>
      ${notesBlock}
      <p style="font-size:14px;color:#5a5a7a;margin:0;">
        Open the application to review, update status, or take the next step.
      </p>
    `,
    ctaText: "Review application",
    ctaHref: applicationLink,
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
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&#847;&nbsp;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#0057B7;padding:24px 32px;">
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
              You are receiving this because you are an admin of PATNA Community.
              ${unsubscribeLink ? `<br/><a href="${unsubscribeLink}" style="color:#9090a8;">Manage preferences</a>` : ""}
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
