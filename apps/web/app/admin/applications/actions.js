"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

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

  if (!userId) {
    // Invite creates auth user; the DB trigger (handle_new_user) creates profiles(id, email)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/app/profile`,
    });

    if (inviteError) {
      redirect("/admin/applications?notice=error");
    }

    userId = inviteData.user.id;
  } else {
    // User already exists — send a password reset so they can set access
    await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/app/profile`,
    });
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
  await adminClient
    .from("profiles")
    .update({
      first_name: application.first_name,
      surname: application.surname,
      role_title: application.role_title || null,
      organisation_name: application.organisation || null,
      country_of_residence: application.country || null,
      phone_number: application.phone_number || null,
      professional_bio: application.motivation_text || null,
    })
    .eq("id", userId);

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

  // Mark application approved and record who actioned it
  await adminClient
    .from("community_applications")
    .update({ status: "approved", reviewed_by_user_id: adminUser.id })
    .eq("id", applicationId);

  redirect("/admin/applications?notice=invited");
}
