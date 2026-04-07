"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { sendAccessSetupEmail } from "@/lib/access-emails";
import { getAuthCallbackUrl } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { provisionMemberFromApplication } from "@/lib/member-provisioning";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

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
    redirect(`/admin/applications?notice=error`);
  }

  redirect(`/admin/applications?notice=saved`);
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

  // Check if a profile already exists for this email
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

  // Audit invite record
  const { error: inviteAuditError } = await adminClient
    .from("invites")
    .insert(createAuditInviteRow({ createdByUserId: adminUser.id, email, method: deliveryMethod, userId }));

  if (inviteAuditError) {
    redirect("/admin/applications?notice=error");
  }

  // Mark application approved and record who actioned it
  const { error: applicationUpdateError } = await adminClient
    .from("community_applications")
    .update({ status: "approved", reviewed_by_user_id: adminUser.id })
    .eq("id", applicationId);

  if (applicationUpdateError) {
    redirect("/admin/applications?notice=error");
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

  // Look up profile by email to get the user ID
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
