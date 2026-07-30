import { sendBatch } from "@/lib/email/resend";
import { leadNotificationEmailHtml } from "@/lib/email/templates/lead-notification";
import { getSiteUrl } from "@/lib/env";

/**
 * Emails every administrator when a new partnership/collaboration/service-request
 * lead comes in through the public "Work with us" forms. Failures are logged but
 * never block the submitter's success response — the lead is already saved.
 */
export async function notifyAdminsOfNewLead(supabase, { subject, heading, fields, detailLabel, detailText, reviewPath }) {
  try {
    const { data: adminRows } = await supabase
      .from("user_roles")
      .select("profiles(email)")
      .eq("role", "administrator");

    const adminEmails = (adminRows || []).map((row) => row.profiles?.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return;
    }

    await sendBatch(
      adminEmails.map((to) => ({
        to,
        subject,
        html: leadNotificationEmailHtml({
          headerLabel: "PATNA Admin · New Enquiry",
          heading,
          fields,
          detailLabel,
          detailText,
          reviewLink: `${getSiteUrl()}${reviewPath}`,
        }),
      })),
    );
  } catch (notifyError) {
    console.error("notifyAdminsOfNewLead error:", notifyError);
  }
}
