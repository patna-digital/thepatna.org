"use server";

import crypto from "node:crypto";
import { sendAccessSetupEmail } from "@/lib/access-emails";
import { provisionMemberFromApplication } from "@/lib/member-provisioning";
import { syncCommunityApplicationAssistantDocument } from "@/lib/assistant-indexing";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendBatch } from "@/lib/email/resend";
import { applicationNotificationEmailHtml } from "@/lib/email/templates/application-notification";
import { getSiteUrl } from "@/lib/env";

export async function submitCommunityApplicationAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return {
      status: "error",
      message:
        "Supabase admin access is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY before testing application submission.",
    };
  }

  const firstName = String(formData.get("first_name") || "").trim();
  const surname = String(formData.get("surname") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const organisation = String(formData.get("organisation") || "").trim();
  const roleTitle = String(formData.get("role_title") || "").trim();
  const motivationText = String(formData.get("motivation_text") || "").trim();
  const expertiseSlugs = [
    ...new Set(
      formData
        .getAll("expertise_slugs")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
  const expertiseOtherText = String(formData.get("expertise_other_text") || "").trim();
  const engagementSlugs = [
    ...new Set(
      formData
        .getAll("engagement_slugs")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
  const engagementOtherText = String(formData.get("engagement_other_text") || "").trim();
  const consentDataStorage = formData.get("consent_data_storage") === "yes";
  const consentUpdates = formData.get("consent_updates") === "yes";

  if (!firstName || !surname || !email || !motivationText) {
    return {
      status: "error",
      message: "First name, surname, email, and motivation are required.",
    };
  }

  if (!consentDataStorage) {
    return {
      status: "error",
      message: "Consent to store application information is required.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const nextExpertiseSlugs =
    expertiseOtherText && !expertiseSlugs.includes("other")
      ? [...expertiseSlugs, "other"]
      : expertiseSlugs;
  const nextEngagementSlugs =
    engagementOtherText && !engagementSlugs.includes("other")
      ? [...engagementSlugs, "other"]
      : engagementSlugs;

  const { data: application, error: applicationError } = await supabase
    .from("community_applications")
    .insert({
      submitted_by_email: email,
      first_name: firstName,
      surname,
      phone_number: phoneNumber || null,
      country: country || null,
      organisation: organisation || null,
      role_title: roleTitle || null,
      motivation_text: motivationText,
      expertise_slugs: nextExpertiseSlugs,
      expertise_other_text: expertiseOtherText || null,
      engagement_slugs: nextEngagementSlugs,
      engagement_other_text: engagementOtherText || null,
      consent_data_storage: consentDataStorage,
      consent_updates: consentUpdates,
      source: "patna_web_form",
      submitted_at: new Date().toISOString(),
      status: "submitted",
    })
    .select("id")
    .single();

  if (applicationError || !application?.id) {
    return {
      status: "error",
      message: applicationError?.message || "Failed to submit application.",
    };
  }

  // Check if this applicant is pre-approved as an admin
  const { data: preApproval } = await supabase
    .from("pre_approved_admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (preApproval) {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const { userId, deliveryMethod } = await sendAccessSetupEmail({
        adminClient: supabase,
        email,
        profileId: existingProfile?.id || "",
      });

      if (!userId) throw new Error("sendAccessSetupEmail returned no userId");

      await provisionMemberFromApplication({
        adminClient: supabase,
        application: {
          id: application.id,
          submitted_by_email: email,
          first_name: firstName,
          surname,
          phone_number: phoneNumber || null,
          country: country || null,
          organisation: organisation || null,
          role_title: roleTitle || null,
          motivation_text: motivationText,
          expertise_slugs: nextExpertiseSlugs,
          expertise_other_text: expertiseOtherText || null,
          engagement_slugs: nextEngagementSlugs,
          engagement_other_text: engagementOtherText || null,
          status: "approved",
          source: "patna_web_form",
        },
        defaultOnboardingStatus: existingProfile ? "" : "invited",
        email,
        userId,
      });

      await supabase
        .from("profiles")
        .upsert({ id: userId, email, invited_at: new Date().toISOString() }, { onConflict: "id" });

      await supabase.from("invites").insert({
        user_id: userId,
        created_by_user_id: null,
        email,
        invite_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        invite_type: "application_approval",
        delivery_method: deliveryMethod,
      });

      await supabase
        .from("community_applications")
        .update({ status: "approved" })
        .eq("id", application.id);

      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "administrator" }, { onConflict: "user_id,role" });

      await supabase.from("pre_approved_admins").delete().eq("email", email);
    } catch (autoApproveError) {
      console.error("Pre-approved admin auto-approve error:", autoApproveError);
      // Non-fatal: application is submitted, can be reviewed manually
    }

    return {
      status: "success",
      message: "Your application has been received. You'll get an email with your access link shortly.",
    };
  }

  try {
    await syncCommunityApplicationAssistantDocument({
      adminSupabase: supabase,
      applicationId: application.id,
    });
  } catch (assistantError) {
    console.error("submitCommunityApplicationAction assistant sync error:", assistantError);
  }

  // Notify all admins
  try {
    const { data: adminRows } = await supabase
      .from("user_roles")
      .select("profiles(email)")
      .eq("role", "administrator");

    const adminEmails = (adminRows || [])
      .map((r) => r.profiles?.email)
      .filter(Boolean);

    if (adminEmails.length > 0) {
      const motivationSnippet =
        motivationText.length > 220
          ? motivationText.slice(0, 220).trimEnd() + "…"
          : motivationText;

      await sendBatch(
        adminEmails.map((to) => ({
          to,
          subject: `New PATNA application: ${firstName} ${surname}`,
          html: applicationNotificationEmailHtml({
            applicantName: `${firstName} ${surname}`,
            applicantEmail: email,
            country: country || null,
            organisation: organisation || null,
            motivationSnippet,
            reviewLink: `${getSiteUrl()}/admin/applications`,
          }),
        }))
      );
    }
  } catch (notifyError) {
    console.error("submitCommunityApplicationAction admin notify error:", notifyError);
  }

  return {
    status: "success",
    firstName,
    message:
      "Your application has been submitted. PATNA will review it, route it to interview where relevant, and assign cohort fit internally.",
  };
}
