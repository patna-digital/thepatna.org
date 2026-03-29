import { listSupabaseAuthUsers } from "@/lib/supabase/admin";
import { resolveHeadshotAsset } from "@/lib/member-headshots";
import { resolveResumeAsset } from "@/lib/member-resumes";
import { buildProfileProgress } from "@/lib/profile-onboarding";

function getLatestInvite(invites) {
  return (invites || []).reduce((latest, invite) => {
    if (!latest) {
      return invite;
    }

    return new Date(invite.created_at).getTime() > new Date(latest.created_at).getTime() ? invite : latest;
  }, null);
}

function normaliseCohort(cohort) {
  if (!cohort) {
    return null;
  }

  return {
    slug: cohort.slug,
    name: cohort.name,
  };
}

function normaliseTag(tag) {
  if (!tag) {
    return null;
  }

  return {
    slug: tag.slug,
    name: tag.name,
  };
}

export function buildMemberProfileView({
  authUser,
  cohortProfile,
  cohortRows,
  inviteRows,
  profile,
  tagRows,
}) {
  const primaryCohortRow = (cohortRows || []).find((row) => row.is_primary && row.cohorts);
  const secondaryCohorts = (cohortRows || [])
    .filter((row) => !row.is_primary && row.cohorts)
    .map((row) => normaliseCohort(row.cohorts))
    .filter(Boolean);
  const domainTags = (tagRows || [])
    .map((row) => normaliseTag(row.domain_tags))
    .filter(Boolean);
  const latestInvite = getLatestInvite(inviteRows);
  const primaryCohort = normaliseCohort(primaryCohortRow?.cohorts);
  const headshotAsset = resolveHeadshotAsset(cohortProfile?.headshot_url, cohortProfile?.raw_responses);
  const resumeAsset = resolveResumeAsset(cohortProfile?.cv_url, cohortProfile?.raw_responses);
  const needsHeadshotRecovery = headshotAsset.source_kind === "external";
  const needsResumeRecovery = resumeAsset.source_kind === "external";
  const progress = buildProfileProgress({
    cohortProfile,
    domainTags,
    primaryCohort,
    profile,
  });

  return {
    ...profile,
    displayName: [profile?.title, profile?.first_name, profile?.surname].filter(Boolean).join(" ") || "PATNA Member",
    profileStatus: profile?.profile_status || "active",
    availabilityStatus: profile?.availability_status || "available",
    authUser: authUser || null,
    latestInvite,
    primaryCohort,
    secondaryCohorts,
    cohortSlugs: [primaryCohort?.slug, ...secondaryCohorts.map((cohort) => cohort.slug)].filter(Boolean),
    domainTags,
    cohortProfile: cohortProfile || null,
    languages: cohortProfile?.languages || [],
    relevantProjects: Array.isArray(cohortProfile?.relevant_projects)
      ? cohortProfile.relevant_projects.map((project) => ({
          title: String(project?.title || "").trim(),
          link: String(project?.link || "").trim(),
        }))
      : [],
    headshotAsset,
    headshotSrc: headshotAsset.display_url,
    hasHeadshot: Boolean(headshotAsset.display_url),
    needsHeadshotRecovery,
    resumeAsset,
    resumeDownloadUrl: "",
    needsResumeRecovery,
    completionPercent: progress.completionPercent,
    completedSections: progress.completedSections,
    firstIncompleteSection: progress.firstIncompleteSection,
    isOnboardingComplete: progress.isOnboardingComplete,
    isProfileComplete: progress.isOnboardingComplete,
    missingProfileFields: progress.missingProfileFields,
    remainingRequiredFields: progress.remainingRequiredFields,
    sectionStatus: progress.sectionStatus,
    isImported: Boolean(profile?.migration_batch_id),
    wasContacted: Boolean(latestInvite),
    isActive: profile?.onboarding_status === "active",
    isProfileVisible: profile?.profile_status !== "inactive",
  };
}

export async function fetchMemberProfileView({ adminClient, supabase, userId }) {
  const [authUsers, profileResult, cohortRowsResult, tagRowsResult, inviteRowsResult, cohortProfileResult] =
    await Promise.all([
      listSupabaseAuthUsers(adminClient),
      supabase
        .from("profiles")
        .select(
          "id, email, first_name, surname, title, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, migration_batch_id, invited_at, onboarding_completed_at, phone_number, whatsapp_number, timezone, profile_status, availability_status",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_cohorts")
        .select("user_id, is_primary, cohorts(name, slug)")
        .eq("user_id", userId),
      supabase
        .from("user_tags")
        .select("tag_id, domain_tags(name, slug)")
        .eq("user_id", userId),
      supabase.from("invites").select("user_id, delivery_method, created_at").eq("user_id", userId),
      supabase.from("cohort_member_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

  const error =
    profileResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error ||
    inviteRowsResult.error ||
    cohortProfileResult.error;

  if (error || !profileResult.data) {
    return {
      error: error || new Error("Member profile not found."),
      member: null,
    };
  }

  const authUser =
    authUsers.find((candidate) => candidate.id === userId) ||
    authUsers.find(
      (candidate) =>
        String(candidate.email || "").trim().toLowerCase() ===
        String(profileResult.data.email || "").trim().toLowerCase(),
    ) ||
    null;

  return {
    error: null,
    member: buildMemberProfileView({
      authUser,
      cohortProfile: cohortProfileResult.data,
      cohortRows: cohortRowsResult.data,
      inviteRows: inviteRowsResult.data,
      profile: profileResult.data,
      tagRows: tagRowsResult.data,
    }),
  };
}

export async function fetchActiveMemberDirectory({ adminClient }) {
  const { data: memberRoleRows, error: memberRoleError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "member");

  if (memberRoleError) {
    return {
      error: memberRoleError,
      members: [],
    };
  }

  const memberIds = [...new Set((memberRoleRows || []).map((row) => row.user_id).filter(Boolean))];

  if (!memberIds.length) {
    return {
      error: null,
      members: [],
    };
  }

  const [profilesResult, cohortRowsResult, tagRowsResult, cohortProfilesResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select(
        "id, email, first_name, surname, title, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, migration_batch_id, invited_at, onboarding_completed_at, phone_number, whatsapp_number, timezone, profile_status, availability_status",
      )
      .in("id", memberIds)
      .eq("onboarding_status", "active")
      .eq("profile_status", "active")
      .order("first_name", { ascending: true }),
    adminClient
      .from("user_cohorts")
      .select("user_id, is_primary, cohorts(name, slug)")
      .in("user_id", memberIds),
    adminClient
      .from("user_tags")
      .select("user_id, tag_id, domain_tags(name, slug)")
      .in("user_id", memberIds),
    adminClient
      .from("cohort_member_profiles")
      .select("*")
      .in("user_id", memberIds),
  ]);

  const error =
    profilesResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error ||
    cohortProfilesResult.error;

  if (error) {
    return {
      error,
      members: [],
    };
  }

  const allCohortsByUserId = new Map();

  for (const row of cohortRowsResult.data || []) {
    const existing = allCohortsByUserId.get(row.user_id) || [];
    allCohortsByUserId.set(row.user_id, [...existing, row]);
  }

  const allTagsByUserId = new Map();

  for (const row of tagRowsResult.data || []) {
    const existing = allTagsByUserId.get(row.user_id) || [];
    allTagsByUserId.set(row.user_id, [...existing, row]);
  }

  const cohortProfileByUserId = new Map(
    (cohortProfilesResult.data || []).map((row) => [row.user_id, row]),
  );

  return {
    error: null,
    members: (profilesResult.data || []).map((profile) =>
      buildMemberProfileView({
        authUser: null,
        cohortProfile: cohortProfileByUserId.get(profile.id) || null,
        cohortRows: allCohortsByUserId.get(profile.id) || [],
        inviteRows: [],
        profile,
        tagRows: allTagsByUserId.get(profile.id) || [],
      }),
    ),
  };
}
