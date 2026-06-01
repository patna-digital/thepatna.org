"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { syncCommunityApplicationAssistantDocument } from "@/lib/assistant-indexing";
import { sendAccessSetupEmail } from "@/lib/access-emails";
import { getAuthCallbackUrl } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { provisionMemberFromApplication } from "@/lib/member-provisioning";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { sendEmail } from "@/lib/email/resend";
import { assignmentEmailHtml } from "@/lib/email/templates/assignment";

function createAuditInviteRow({ createdByUserId, email, method, userId }) {
  return {
    user_id: userId,
    created_by_user_id: createdByUserId,
    email,
    invite_token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    invite_type: "application_approval",
    delivery_method: method,
  };
}

export async function reviewApplicationAction(formData) {
  const { supabase, user } = await requireAdminContext();

  const applicationId = String(formData.get("application_id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const reviewNotes = String(formData.get("review_notes") || "").trim();
  const assignedCohortId = String(formData.get("assigned_cohort_id") || "").trim();

  if (!applicationId || !status) {
    redirect("/admin/applications?notice=missing-fields");
  }

  const { error } = await supabase
    .from("community_applications")
    .update({
      status,
      review_notes: reviewNotes || null,
      assigned_cohort_id: assignedCohortId || null,
      reviewed_by_user_id: user.id,
    })
    .eq("id", applicationId);

  if (error) {
    redirect("/admin/applications?notice=error");
  }

  try {
    await syncCommunityApplicationAssistantDocument({
      adminSupabase: supabase,
      applicationId,
    });
  } catch (assistantError) {
    console.error("reviewApplicationAction assistant sync error:", assistantError);
  }

  redirect("/admin/applications?notice=saved");
}

/**
 * Assign an application to an admin — creates an in-app notification and
 * sends an email to the assignee.
 */
export async function assignApplicationAction(formData) {
  const { supabase, user: currentAdmin } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const applicationId = String(formData.get("application_id") || "").trim();
  const assigneeId = String(formData.get("assigned_to_user_id") || "").trim();
  const assignmentNotes = String(formData.get("assignment_notes") || "").trim();

  if (!applicationId || !assigneeId) {
    redirect("/admin/applications?notice=missing-fields");
  }

  // Load application + assigner profile in parallel
  const [{ data: application }, { data: assigner }, { data: assignee }] = await Promise.all([
    adminClient
      .from("community_applications")
      .select("id, first_name, surname, submitted_by_email, status")
      .eq("id", applicationId)
      .maybeSingle(),
    adminClient
      .from("profiles")
      .select("id, first_name, surname, email")
      .eq("id", currentAdmin.id)
      .maybeSingle(),
    adminClient
      .from("profiles")
      .select("id, first_name, surname, email")
      .eq("id", assigneeId)
      .maybeSingle(),
  ]);

  if (!application || !assignee) {
    redirect("/admin/applications?notice=error");
  }

  const { error: updateError } = await adminClient
    .from("community_applications")
    .update({
      assigned_to_user_id: assigneeId,
      assignment_notes: assignmentNotes || null,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) {
    redirect("/admin/applications?notice=error");
  }

  const applicantName = [application.first_name, application.surname].filter(Boolean).join(" ") || application.submitted_by_email;
  const assignerName = [assigner?.first_name, assigner?.surname].filter(Boolean).join(" ") || "An admin";
  const assigneeName = [assignee.first_name, assignee.surname].filter(Boolean).join(" ") || assignee.email;

  const siteUrl = getSiteUrl();
  const applicationLink = `${siteUrl}/admin/applications`;

  // Create in-app notification for the assignee
  await adminClient.from("notifications").insert({
    recipient_id: assigneeId,
    type: "task_assignment",
    title: `Application assigned to you: ${applicantName}`,
    body: assignmentNotes
      ? assignmentNotes.slice(0, 200)
      : `${assignerName} has assigned an applicant review to you.`,
    link: "/admin/applications",
    metadata: {
      application_id: applicationId,
      assigner_id: currentAdmin.id,
      assigner_name: assignerName,
      applicant_name: applicantName,
    },
  });

  // Send email notification to assignee
  if (assignee.email) {
    try {
      await sendEmail({
        to: assignee.email,
        subject: `Application assigned to you: ${applicantName}`,
        html: assignmentEmailHtml({
          recipientName: assigneeName,
          assignerName,
          applicantName,
          applicantEmail: application.submitted_by_email,
          applicationStatus: application.status,
          assignmentNotes,
          applicationLink,
        }),
      });
    } catch (emailError) {
      // Non-fatal: in-app notification was created; log email failure
      console.error("assignApplicationAction email error:", emailError);
    }
  }

  redirect("/admin/applications?notice=assigned");
}

/**
 * Save admin-assigned cohorts for an application (replaces single cohort field).
 * Accepts: cohort_ids[] (array of cohort UUIDs) and primary_cohort_id.
 */
export async function updateApplicationCohortsAction(formData) {
  const { supabase, user } = await requireAdminContext();

  const applicationId = String(formData.get("application_id") || "").trim();
  const primaryCohortId = String(formData.get("primary_cohort_id") || "").trim();
  const rawCohortIds = formData.getAll("cohort_ids[]");
  const cohortIds = rawCohortIds
    .map((id) => String(id).trim())
    .filter(Boolean);

  if (!applicationId) {
    redirect("/admin/applications?notice=missing-fields");
  }

  // Always include primary in the set
  const allCohortIds = primaryCohortId
    ? [...new Set([...cohortIds, primaryCohortId])]
    : cohortIds;

  // Replace all cohort assignments for this application
  const { error: deleteError } = await supabase
    .from("application_assigned_cohorts")
    .delete()
    .eq("application_id", applicationId);

  if (deleteError) {
    redirect("/admin/applications?notice=error");
  }

  if (allCohortIds.length > 0) {
    const rows = allCohortIds.map((cohortId) => ({
      application_id: applicationId,
      cohort_id: cohortId,
      is_primary: cohortId === primaryCohortId,
    }));

    const { error: insertError } = await supabase
      .from("application_assigned_cohorts")
      .insert(rows);

    if (insertError) {
      redirect("/admin/applications?notice=error");
    }
  }

  // Keep legacy assigned_cohort_id in sync with primary for backward compat
  await supabase
    .from("community_applications")
    .update({
      assigned_cohort_id: primaryCohortId || null,
      reviewed_by_user_id: user.id,
    })
    .eq("id", applicationId);

  redirect("/admin/applications?notice=cohorts-saved");
}

export async function approveAndInviteApplicationAction(formData) {
  const { user: adminUser } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const applicationId = String(formData.get("application_id") || "").trim();

  if (!applicationId) {
    redirect("/admin/applications?notice=missing-fields");
  }

  const { data: application, error: fetchError } = await adminClient
    .from("community_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    redirect("/admin/applications?notice=error");
  }

  const email = application.submitted_by_email?.toLowerCase();

  if (!email) {
    redirect("/admin/applications?notice=error");
  }

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId = existingProfile?.id || "";
  let deliveryMethod = "manual_reset";

  try {
    const accessEmailResult = await sendAccessSetupEmail({
      adminClient,
      email,
      profileId: existingProfile?.id || "",
    });

    userId = accessEmailResult.userId || userId;
    deliveryMethod = accessEmailResult.deliveryMethod;
  } catch {
    redirect("/admin/applications?notice=error");
  }

  if (!userId) {
    redirect("/admin/applications?notice=error");
  }

  try {
    await provisionMemberFromApplication({
      adminClient,
      application: {
        ...application,
        status: "approved",
      },
      defaultOnboardingStatus: existingProfile ? "" : "invited",
      email,
      userId,
    });
  } catch {
    redirect("/admin/applications?notice=error");
  }

  const { error: inviteProfileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        invited_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (inviteProfileError) {
    redirect("/admin/applications?notice=error");
  }

  const { error: inviteAuditError } = await adminClient
    .from("invites")
    .insert(createAuditInviteRow({ createdByUserId: adminUser.id, email, method: deliveryMethod, userId }));

  if (inviteAuditError) {
    redirect("/admin/applications?notice=error");
  }

  const { error: applicationUpdateError } = await adminClient
    .from("community_applications")
    .update({ status: "approved", reviewed_by_user_id: adminUser.id })
    .eq("id", applicationId);

  if (applicationUpdateError) {
    redirect("/admin/applications?notice=error");
  }

  try {
    await syncCommunityApplicationAssistantDocument({
      adminSupabase: adminClient,
      applicationId,
    });
  } catch (assistantError) {
    console.error("approveAndInviteApplicationAction assistant sync error:", assistantError);
  }

  redirect("/admin/applications?notice=invited");
}

export async function resendApplicationInviteAction(formData) {
  const { user: adminUser } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const applicationId = String(formData.get("application_id") || "").trim();

  if (!applicationId) {
    redirect("/admin/applications?notice=missing-fields");
  }

  const { data: application, error: fetchError } = await adminClient
    .from("community_applications")
    .select("submitted_by_email")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    redirect("/admin/applications?notice=error");
  }

  const email = application.submitted_by_email?.toLowerCase();

  if (!email) {
    redirect("/admin/applications?notice=error");
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId = profile?.id || "";
  let deliveryMethod = "manual_reset";

  try {
    const accessEmailResult = await sendAccessSetupEmail({
      adminClient,
      email,
      profileId: profile?.id || "",
    });

    userId = accessEmailResult.userId || userId;
    deliveryMethod = accessEmailResult.deliveryMethod;
  } catch {
    redirect("/admin/applications?notice=error");
  }

  if (userId) {
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .upsert(
        { id: userId, email, invited_at: new Date().toISOString() },
        { onConflict: "id" },
      );

    if (profileUpdateError) {
      redirect("/admin/applications?notice=error");
    }
  }

  const { error: inviteAuditError } = await adminClient
    .from("invites")
    .insert(createAuditInviteRow({ createdByUserId: adminUser.id, email, method: deliveryMethod, userId }));

  if (inviteAuditError) {
    redirect("/admin/applications?notice=error");
  }

  redirect("/admin/applications?notice=invite-resent");
}

export async function sendPasswordResetLinkAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const applicationId = String(formData.get("application_id") || "").trim();

  if (!applicationId) {
    redirect("/admin/applications?notice=missing-fields");
  }

  const { data: application, error: fetchError } = await adminClient
    .from("community_applications")
    .select("submitted_by_email")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    redirect("/admin/applications?notice=error");
  }

  const email = application.submitted_by_email?.toLowerCase();

  if (!email) {
    redirect("/admin/applications?notice=error");
  }

  const { error } = await adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(getSiteUrl(), "/auth/reset-password"),
  });

  if (error) {
    redirect("/admin/applications?notice=error");
  }

  redirect("/admin/applications?notice=password-reset-sent");
}
