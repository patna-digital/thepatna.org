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

function toDisplayCase(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const isMostlyUppercase =
    text === text.toUpperCase() &&
    /[A-Z]/.test(text) &&
    !/\b(?:IMO|UCL|PATNA|MOWCA|MOESNA|NIMASA|COP\d+|GHG|LDCs|SIDS)\b/.test(text);

  if (!isMostlyUppercase) {
    return text;
  }

  return text
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bImo\b/g, "IMO")
    .replace(/\bUcl\b/g, "UCL")
    .replace(/\bPatna\b/g, "PATNA")
    .replace(/\bMowca\b/g, "MOWCA")
    .replace(/\bMoesna\b/g, "MOESNA")
    .replace(/\bNimasa\b/g, "NIMASA")
    .replace(/\bSids\b/g, "SIDS")
    .replace(/\bLdcs\b/g, "LDCs")
    .replace(/\bCop(\d+)\b/g, "COP$1")
    .replace(/\bGhg\b/g, "GHG");
}

function getDisplayField(value, fallback) {
  return toDisplayCase(value) || fallback;
}

function inferRoleFromBio(professionalBio) {
  const bio = String(professionalBio || "").replace(/\s+/g, " ").trim();

  if (!bio) {
    return "";
  }

  const patterns = [
    /^i am (?:currently )?(?:an?|the)\s+([^,.]{3,96})/i,
    /^i'?m (?:currently )?(?:an?|the)\s+([^,.]{3,96})/i,
    /^(?:dr\.\s+)?[a-z][a-z.' -]+ is (?:currently )?(?:an?|the)\s+([^,.]{3,96})/i,
  ];

  const rawMatch = patterns
    .map((pattern) => bio.match(pattern)?.[1] || "")
    .find(Boolean);

  if (!rawMatch) {
    return "";
  }

  return rawMatch
    .split(/\b(?:with|working|focusing|specialising|specializing|supporting|researching|currently serving|serving)\b/i)[0]
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the)\s+/i, "");
}

export function buildMemberProfileView({
  authUser,
  cohortProfile,
  cohortRows,
  inviteRows,
  profile,
  spaceCount = 0,
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
  const inferredRoleTitle = inferRoleFromBio(profile?.professional_bio);

  return {
    ...profile,
    displayName: [profile?.title, profile?.first_name, profile?.surname].filter(Boolean).join(" ") || "PATNA Member",
    displayNameLabel: getDisplayField(
      [profile?.title, profile?.first_name, profile?.surname].filter(Boolean).join(" "),
      "PATNA Member",
    ),
    roleTitleLabel: getDisplayField(profile?.role_title, inferredRoleTitle),
    organisationLabel: getDisplayField(profile?.organisation_name, ""),
    spaceCount,
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
  const [
    authUsers,
    profileResult,
    cohortRowsResult,
    tagRowsResult,
    inviteRowsResult,
    cohortProfileResult,
    spaceMembershipsResult,
  ] =
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
      supabase.from("space_memberships").select("space_id, user_id").eq("user_id", userId),
    ]);

  const error =
    profileResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error ||
    inviteRowsResult.error ||
    cohortProfileResult.error ||
    spaceMembershipsResult.error;

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
      spaceCount: new Set((spaceMembershipsResult.data || []).map((row) => row.space_id).filter(Boolean)).size,
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

  const [profilesResult, cohortRowsResult, tagRowsResult, cohortProfilesResult, spaceMembershipsResult] = await Promise.all([
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
    adminClient
      .from("space_memberships")
      .select("user_id, space_id")
      .in("user_id", memberIds),
  ]);

  const error =
    profilesResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error ||
    cohortProfilesResult.error ||
    spaceMembershipsResult.error;

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
  const spaceCountsByUserId = new Map();

  for (const row of spaceMembershipsResult.data || []) {
    if (!row.user_id || !row.space_id) {
      continue;
    }

    const existing = spaceCountsByUserId.get(row.user_id) || new Set();
    existing.add(row.space_id);
    spaceCountsByUserId.set(row.user_id, existing);
  }

  return {
    error: null,
    members: (profilesResult.data || []).map((profile) =>
      buildMemberProfileView({
        authUser: null,
        cohortProfile: cohortProfileByUserId.get(profile.id) || null,
        cohortRows: allCohortsByUserId.get(profile.id) || [],
        inviteRows: [],
        profile,
        spaceCount: spaceCountsByUserId.get(profile.id)?.size || 0,
        tagRows: allTagsByUserId.get(profile.id) || [],
      }),
    ),
  };
}
