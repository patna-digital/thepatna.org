function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function setFillTextField(profilePatch, field, existingValue, nextValue) {
  if (hasText(existingValue) || !hasText(nextValue)) {
    return false;
  }

  profilePatch[field] = String(nextValue).trim();
  return true;
}

function setFillValue(profilePatch, field, existingValue, nextValue) {
  if (existingValue !== null && existingValue !== undefined && existingValue !== "") {
    return false;
  }

  if (nextValue === null || nextValue === undefined || nextValue === "") {
    return false;
  }

  profilePatch[field] = nextValue;
  return true;
}

function buildApplicationSnapshot(application) {
  return {
    id: application.id,
    source: application.source || "",
    status: application.status || "",
    submitted_at: application.submitted_at || application.created_at || null,
    assigned_cohort_id: application.assigned_cohort_id || null,
    submitted_by_email: normaliseEmail(application.submitted_by_email),
    first_name: application.first_name || "",
    surname: application.surname || "",
    phone_number: application.phone_number || null,
    country: application.country || null,
    organisation: application.organisation || null,
    role_title: application.role_title || null,
    motivation_text: application.motivation_text || "",
    expertise_slugs: Array.isArray(application.expertise_slugs) ? application.expertise_slugs : [],
    expertise_other_text: application.expertise_other_text || null,
    engagement_slugs: Array.isArray(application.engagement_slugs) ? application.engagement_slugs : [],
    engagement_other_text: application.engagement_other_text || null,
  };
}

async function findLatestApprovedApplication(adminClient, email) {
  const normalizedEmail = normaliseEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await adminClient
    .from("community_applications")
    .select("*")
    .eq("submitted_by_email", normalizedEmail)
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function provisionMemberFromApplication({
  adminClient,
  application = null,
  defaultOnboardingStatus = "",
  email,
  userId,
}) {
  const normalizedEmail = normaliseEmail(email);

  if (!adminClient || !userId || !normalizedEmail) {
    return {
      application: null,
      profile: null,
      reason: "missing-identity",
      status: "skipped",
    };
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("profiles")
    .select(
      "id, email, first_name, surname, role_title, organisation_name, country_of_residence, phone_number, professional_bio, onboarding_status, onboarding_completed_at, profile_status",
    )
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  const resolvedApplication = application || (await findLatestApprovedApplication(adminClient, normalizedEmail));

  if (!resolvedApplication) {
    return {
      application: null,
      profile: existingProfile || null,
      reason: "no-approved-application",
      status: "skipped",
    };
  }

  const [{ data: roleRows, error: roleRowsError }, { data: currentTagRows, error: currentTagRowsError }, { data: currentCohortRows, error: currentCohortRowsError }, { data: existingCohortProfile, error: existingCohortProfileError }] =
    await Promise.all([
      adminClient.from("user_roles").select("role").eq("user_id", userId),
      adminClient.from("user_tags").select("tag_id").eq("user_id", userId),
      adminClient.from("user_cohorts").select("cohort_id, is_primary").eq("user_id", userId),
      adminClient
        .from("cohort_member_profiles")
        .select("user_id, source_cohort_id, source_submitted_at, raw_responses")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (roleRowsError || currentTagRowsError || currentCohortRowsError || existingCohortProfileError) {
    throw roleRowsError || currentTagRowsError || currentCohortRowsError || existingCohortProfileError;
  }

  const profilePatch = {
    id: userId,
  };
  let profileChanged = false;

  if (existingProfile?.email !== normalizedEmail) {
    profilePatch.email = normalizedEmail;
    profileChanged = true;
  }

  profileChanged =
    setFillTextField(profilePatch, "first_name", existingProfile?.first_name, resolvedApplication.first_name) ||
    profileChanged;
  profileChanged =
    setFillTextField(profilePatch, "surname", existingProfile?.surname, resolvedApplication.surname) ||
    profileChanged;
  profileChanged =
    setFillTextField(profilePatch, "role_title", existingProfile?.role_title, resolvedApplication.role_title) ||
    profileChanged;
  profileChanged =
    setFillTextField(
      profilePatch,
      "organisation_name",
      existingProfile?.organisation_name,
      resolvedApplication.organisation,
    ) || profileChanged;
  profileChanged =
    setFillTextField(
      profilePatch,
      "country_of_residence",
      existingProfile?.country_of_residence,
      resolvedApplication.country,
    ) || profileChanged;
  profileChanged =
    setFillTextField(profilePatch, "phone_number", existingProfile?.phone_number, resolvedApplication.phone_number) ||
    profileChanged;
  profileChanged =
    setFillTextField(
      profilePatch,
      "professional_bio",
      existingProfile?.professional_bio,
      resolvedApplication.motivation_text,
    ) || profileChanged;
  profileChanged =
    setFillValue(profilePatch, "profile_status", existingProfile?.profile_status, "active") || profileChanged;
  const currentOnboardingStatus = existingProfile?.onboarding_status || "";
  const isPromotableStatus = !currentOnboardingStatus || currentOnboardingStatus === "invited";
  if (isPromotableStatus && hasText(defaultOnboardingStatus)) {
    profilePatch.onboarding_status = defaultOnboardingStatus;
    profileChanged = true;
  }

  let resolvedProfile = existingProfile || null;

  if (profileChanged) {
    const { data: upsertedProfile, error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert(profilePatch, { onConflict: "id" })
      .select(
        "id, email, first_name, surname, role_title, organisation_name, country_of_residence, phone_number, professional_bio, onboarding_status, onboarding_completed_at, profile_status",
      )
      .single();

    if (profileUpsertError) {
      throw profileUpsertError;
    }

    resolvedProfile = upsertedProfile;
  }

  const hasMemberRole = (roleRows || []).some((row) => row.role === "member");
  let roleChanged = false;

  if (!hasMemberRole) {
    const { error: roleUpsertError } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "member" },
        { ignoreDuplicates: true, onConflict: "user_id,role" },
      );

    if (roleUpsertError) {
      throw roleUpsertError;
    }

    roleChanged = true;
  }

  const expertiseSlugs = [...new Set((resolvedApplication.expertise_slugs || []).filter(Boolean))];
  let tagChanged = false;

  if (expertiseSlugs.length) {
    const { data: matchedTags, error: matchedTagsError } = await adminClient
      .from("domain_tags")
      .select("id")
      .in("slug", expertiseSlugs);

    if (matchedTagsError) {
      throw matchedTagsError;
    }

    const currentTagIds = new Set((currentTagRows || []).map((row) => row.tag_id).filter(Boolean));
    const missingTagIds = (matchedTags || []).map((tag) => tag.id).filter((tagId) => !currentTagIds.has(tagId));

    if (missingTagIds.length) {
      const { error: userTagUpsertError } = await adminClient
        .from("user_tags")
        .upsert(
          missingTagIds.map((tagId) => ({ user_id: userId, tag_id: tagId })),
          { ignoreDuplicates: true, onConflict: "user_id,tag_id" },
        );

      if (userTagUpsertError) {
        throw userTagUpsertError;
      }

      tagChanged = true;
    }
  }

  const hasPrimaryCohort = (currentCohortRows || []).some((row) => row.is_primary);
  let cohortChanged = false;

  if (!hasPrimaryCohort && resolvedApplication.assigned_cohort_id) {
    const { error: cohortUpsertError } = await adminClient
      .from("user_cohorts")
      .upsert(
        {
          user_id: userId,
          cohort_id: resolvedApplication.assigned_cohort_id,
          is_primary: true,
        },
        { onConflict: "user_id,cohort_id" },
      );

    if (cohortUpsertError) {
      throw cohortUpsertError;
    }

    cohortChanged = true;
  }

  const sourceSubmittedAt = resolvedApplication.submitted_at || resolvedApplication.created_at || null;
  const currentRawResponses = asObject(existingCohortProfile?.raw_responses);
  const nextSnapshot = buildApplicationSnapshot(resolvedApplication);
  const currentSnapshot = asObject(currentRawResponses.application_snapshot);
  const shouldWriteSnapshot = JSON.stringify(currentSnapshot) !== JSON.stringify(nextSnapshot);
  const cohortProfilePatch = {
    user_id: userId,
  };
  let cohortProfileChanged = false;

  cohortProfileChanged =
    setFillValue(
      cohortProfilePatch,
      "source_cohort_id",
      existingCohortProfile?.source_cohort_id,
      resolvedApplication.assigned_cohort_id,
    ) || cohortProfileChanged;
  cohortProfileChanged =
    setFillValue(
      cohortProfilePatch,
      "source_submitted_at",
      existingCohortProfile?.source_submitted_at,
      sourceSubmittedAt,
    ) || cohortProfileChanged;

  if (!existingCohortProfile || shouldWriteSnapshot) {
    cohortProfilePatch.raw_responses = {
      ...currentRawResponses,
      application_snapshot: nextSnapshot,
    };
    cohortProfileChanged = true;
  }

  if (cohortProfileChanged) {
    const { error: cohortProfileUpsertError } = await adminClient
      .from("cohort_member_profiles")
      .upsert(cohortProfilePatch, { onConflict: "user_id" });

    if (cohortProfileUpsertError) {
      throw cohortProfileUpsertError;
    }
  }

  return {
    application: resolvedApplication,
    profile: resolvedProfile,
    reason:
      profileChanged || roleChanged || tagChanged || cohortChanged || cohortProfileChanged
        ? ""
        : "already-current",
    status:
      profileChanged || roleChanged || tagChanged || cohortChanged || cohortProfileChanged
        ? "repaired"
        : "skipped",
  };
}
