"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { createSupabaseAdminClient, listSupabaseAuthUsers } from "@/lib/supabase/admin";
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

  let userId = existingProfile?.id;
  let deliveryMethod = "manual_reset";

  if (!userId) {
    // Invite creates auth user; the DB trigger (handle_new_user) creates profiles(id, email)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (inviteError) {
      // User may already exist in auth.users without a matching profile row (e.g. DB trigger failure).
      // Fall back to a password-reset email so they can still gain access.
      if (inviteError.message?.toLowerCase().includes("already")) {
        const authUsers = await listSupabaseAuthUsers(adminClient);
        const existingAuthUser = authUsers.find(
          (u) => String(u.email || "").toLowerCase() === email,
        );
        if (!existingAuthUser) redirect("/admin/applications?notice=error");

        userId = existingAuthUser.id;
        deliveryMethod = "manual_reset";

        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${getSiteUrl()}/auth/verify`,
        });
        if (resetError) redirect("/admin/applications?notice=error");
      } else {
        redirect("/admin/applications?notice=error");
      }
    } else {
      userId = inviteData.user.id;
      deliveryMethod = "supabase_invite";
    }
  } else {
    // User already exists — send a password reset so they can set access
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (resetError) {
      redirect("/admin/applications?notice=error");
    }
  }

  // Resolve domain tag IDs from expertise slugs
  const expertiseSlugs = application.expertise_slugs || [];
  let tagIds = [];

  if (expertiseSlugs.length) {
    const { data: matchedTags } = await adminClient
      .from("domain_tags")
      .select("id, slug")
      .in("slug", expertiseSlugs);

    tagIds = (matchedTags || []).map((t) => t.id);
  }

  // Seed profile fields from application data
  const profileUpdate = {
    first_name: application.first_name,
    surname: application.surname,
    role_title: application.role_title || null,
    organisation_name: application.organisation || null,
    country_of_residence: application.country || null,
    phone_number: application.phone_number || null,
    professional_bio: application.motivation_text || null,
    invited_at: new Date().toISOString(),
  };

  // Only set onboarding_status for brand-new users — don't downgrade an existing active member
  if (!existingProfile) {
    profileUpdate.onboarding_status = "invited";
  }

  await adminClient.from("profiles").update(profileUpdate).eq("id", userId);

  // Seed domain tags from expertise slugs
  if (tagIds.length) {
    await adminClient
      .from("user_tags")
      .upsert(
        tagIds.map((tagId) => ({ user_id: userId, tag_id: tagId })),
        { onConflict: "user_id,tag_id", ignoreDuplicates: true },
      );
  }

  // Assign cohort if set on the application
  if (application.assigned_cohort_id) {
    await adminClient
      .from("user_cohorts")
      .upsert(
        { user_id: userId, cohort_id: application.assigned_cohort_id, is_primary: true },
        { onConflict: "user_id,cohort_id", ignoreDuplicates: true },
      );
  }

  // Audit invite record
  await adminClient
    .from("invites")
    .insert(createAuditInviteRow({ createdByUserId: adminUser.id, email, method: deliveryMethod, userId }));

  // Mark application approved and record who actioned it
  await adminClient
    .from("community_applications")
    .update({ status: "approved", reviewed_by_user_id: adminUser.id })
    .eq("id", applicationId);

  redirect("/admin/applications?notice=invited");
}

export async function resendApplicationInviteAction(formData) {
  const { user: adminUser } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const authUsers = await listSupabaseAuthUsers(adminClient);

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

  const authUser = authUsers.find(
    (u) => String(u.email || "").trim().toLowerCase() === email,
  );

  let userId = authUser?.id || profile?.id;
  let deliveryMethod = "manual_reset";

  if (!authUser) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (error) {
      redirect("/admin/applications?notice=error");
    }

    userId = data.user.id;
    deliveryMethod = "supabase_invite";
  } else {
    const { error } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (error) {
      redirect("/admin/applications?notice=error");
    }
  }

  if (userId) {
    await adminClient
      .from("profiles")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", userId);
  }

  await adminClient
    .from("invites")
    .insert(createAuditInviteRow({ createdByUserId: adminUser.id, email, method: deliveryMethod, userId }));

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
    redirectTo: `${getSiteUrl()}/auth/verify`,
  });

  if (error) {
    redirect("/admin/applications?notice=error");
  }

  redirect("/admin/applications?notice=password-reset-sent");
}
