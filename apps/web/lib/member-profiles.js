import { listSupabaseAuthUsers } from "@/lib/supabase/admin";
import { buildPublicBookingUrl } from "@/lib/calendar/booking";
import {
  resolveCodeOfConductAsset,
  resolveNdaAsset,
} from "@/lib/member-compliance-documents";
import { resolveHeadshotAsset } from "@/lib/member-headshots";
import { resolveResumeAsset } from "@/lib/member-resumes";
import { buildProfileProgress } from "@/lib/profile-onboarding";
import { getRequestLocale, translateContentItems } from "@/lib/translation";

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

function getTranslatedDisplayValue(translatedByKey, cacheKey, fallback = "") {
  return translatedByKey.get(cacheKey)?.displayText || fallback;
}

async function translateMemberViews(members, locale) {
  if (!members.length) {
    return members;
  }

  const translationItems = [];
  const pushItem = (cacheKey, contentType, fieldName, text) => {
    if (typeof text !== "string" || !text.trim()) {
      return;
    }

    translationItems.push({
      cacheKey,
      contentType,
      fieldName,
      text,
      format: "text",
    });
  };

  for (const member of members) {
    pushItem(`member:${member.id}:role_title`, "member", "role_title", member.roleTitleLabel || member.role_title || "");
    pushItem(`member:${member.id}:country_of_residence`, "member", "country_of_residence", member.country_of_residence || "");
    pushItem(`member:${member.id}:professional_bio`, "member", "professional_bio", member.professional_bio || "");
    pushItem(`member:${member.id}:domain_knowledge`, "member", "domain_knowledge", member.cohortProfile?.domain_knowledge || "");
    pushItem(`member:${member.id}:focus_area`, "member", "focus_area", member.cohortProfile?.focus_area || "");
    pushItem(`member:${member.id}:notable_work`, "member", "notable_work", member.cohortProfile?.notable_work || "");
    pushItem(`member:${member.id}:opportunity_interest`, "member", "opportunity_interest", member.cohortProfile?.opportunity_interest || "");

    if (member.primaryCohort?.slug && member.primaryCohort?.name) {
      pushItem(`cohort:${member.primaryCohort.slug}:name`, "cohort", "name", member.primaryCohort.name);
    }

    for (const cohort of member.secondaryCohorts || []) {
      if (cohort?.slug && cohort?.name) {
        pushItem(`cohort:${cohort.slug}:name`, "cohort", "name", cohort.name);
      }
    }

    for (const tag of member.domainTags || []) {
      if (tag?.slug && tag?.name) {
        pushItem(`domain_tag:${tag.slug}:name`, "domain_tag", "name", tag.name);
      }
    }

    for (const [index, language] of (member.languages || []).entries()) {
      pushItem(`member:${member.id}:language:${index}`, "member", "language", language);
    }
  }

  const translatedItems = await translateContentItems(locale, translationItems);
  const translatedByKey = new Map(
    translatedItems.map((item) => [item.cacheKey, item]),
  );

  return members.map((member) => ({
    ...member,
    roleTitleDisplay: getTranslatedDisplayValue(
      translatedByKey,
      `member:${member.id}:role_title`,
      member.roleTitleLabel || member.role_title || "",
    ),
    organisationDisplay: member.organisationLabel || member.organisation_name || "",
    countryDisplay: getTranslatedDisplayValue(
      translatedByKey,
      `member:${member.id}:country_of_residence`,
      member.country_of_residence || "",
    ),
    professionalBioDisplay: getTranslatedDisplayValue(
      translatedByKey,
      `member:${member.id}:professional_bio`,
      member.professional_bio || "",
    ),
    primaryCohort: member.primaryCohort
      ? {
          ...member.primaryCohort,
          nameDisplay: getTranslatedDisplayValue(
            translatedByKey,
            `cohort:${member.primaryCohort.slug}:name`,
            member.primaryCohort.name,
          ),
        }
      : null,
    secondaryCohorts: (member.secondaryCohorts || []).map((cohort) => ({
      ...cohort,
      nameDisplay: getTranslatedDisplayValue(
        translatedByKey,
        `cohort:${cohort.slug}:name`,
        cohort.name,
      ),
    })),
    domainTags: (member.domainTags || []).map((tag) => ({
      ...tag,
      nameDisplay: getTranslatedDisplayValue(
        translatedByKey,
        `domain_tag:${tag.slug}:name`,
        tag.name,
      ),
    })),
    languagesDisplay: (member.languages || []).map((language, index) =>
      getTranslatedDisplayValue(
        translatedByKey,
        `member:${member.id}:language:${index}`,
        language,
      )
    ),
    cohortProfileDisplay: {
      domainKnowledge: getTranslatedDisplayValue(
        translatedByKey,
        `member:${member.id}:domain_knowledge`,
        member.cohortProfile?.domain_knowledge || "",
      ),
      focusArea: getTranslatedDisplayValue(
        translatedByKey,
        `member:${member.id}:focus_area`,
        member.cohortProfile?.focus_area || "",
      ),
      notableWork: getTranslatedDisplayValue(
        translatedByKey,
        `member:${member.id}:notable_work`,
        member.cohortProfile?.notable_work || "",
      ),
      opportunityInterest: getTranslatedDisplayValue(
        translatedByKey,
        `member:${member.id}:opportunity_interest`,
        member.cohortProfile?.opportunity_interest || "",
      ),
    },
  }));
}

export function buildMemberProfileView({
  authUser,
  bookingSettings,
  cohortProfile,
  cohortRows,
  inviteRows,
  profile,
  roleRows,
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
  const ndaAsset = resolveNdaAsset(cohortProfile?.nda_url, cohortProfile?.raw_responses);
  const codeOfConductAsset = resolveCodeOfConductAsset(
    cohortProfile?.code_of_conduct_url,
    cohortProfile?.raw_responses,
  );
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
    ndaAsset,
    codeOfConductAsset,
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
    roles: (roleRows || []).map((row) => row.role).filter(Boolean),
    isImported: Boolean(profile?.migration_batch_id),
    wasContacted: Boolean(latestInvite),
    isActive: profile?.onboarding_status === "active",
    isProfileVisible: profile?.profile_status !== "inactive",
    publicBookingEnabled: Boolean(bookingSettings?.public_booking_enabled),
    publicBookingUrl: bookingSettings?.public_booking_enabled
      ? buildPublicBookingUrl(bookingSettings.public_booking_url_slug)
      : "",
    publicBookingUrlSlug: bookingSettings?.public_booking_url_slug || "",
  };
}

export async function fetchMemberProfileView({
  adminClient,
  supabase,
  userId,
  includeAuthUser = false,
  includeInviteHistory = false,
  locale,
}) {
  const [
    authUsers,
    profileResult,
    cohortRowsResult,
    tagRowsResult,
    inviteRowsResult,
    cohortProfileResult,
    spaceMembershipsResult,
    bookingSettingsResult,
    roleRowsResult,
  ] = await Promise.all([
    includeAuthUser ? listSupabaseAuthUsers(adminClient) : Promise.resolve([]),
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
    includeInviteHistory
      ? supabase.from("invites").select("user_id, delivery_method, created_at").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("cohort_member_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("space_memberships").select("space_id, user_id").eq("user_id", userId),
    supabase
      .from("booking_settings")
      .select("member_id, public_booking_enabled, public_booking_url_slug")
      .eq("member_id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  // Only treat profile query errors as fatal - other queries can fail gracefully
  // space_memberships may fail due to RLS infinite recursion (known issue)
  if (profileResult.error) {
    return {
      error: profileResult.error,
      member: null,
    };
  }

  if (!profileResult.data) {
    return {
      error: new Error("Member profile not found."),
      member: null,
    };
  }

  const authUser = includeAuthUser
    ? authUsers.find((candidate) => candidate.id === userId) ||
      authUsers.find(
        (candidate) =>
          String(candidate.email || "").trim().toLowerCase() ===
          String(profileResult.data.email || "").trim().toLowerCase(),
      ) ||
      null
    : null;

  // Handle space_memberships query error gracefully (default to 0 spaces)
  // This is a workaround for RLS infinite recursion issue in space_memberships
  const spaceCount = spaceMembershipsResult.error
    ? 0
    : new Set((spaceMembershipsResult.data || []).map((row) => row.space_id).filter(Boolean)).size;

  const [translatedMember] = await translateMemberViews(
    [
      buildMemberProfileView({
        authUser,
        bookingSettings: bookingSettingsResult.data,
        cohortProfile: cohortProfileResult.data,
        cohortRows: cohortRowsResult.data,
        inviteRows: inviteRowsResult.data,
        profile: profileResult.data,
        roleRows: roleRowsResult.data,
        spaceCount,
        tagRows: tagRowsResult.data,
      }),
    ],
    locale || await getRequestLocale(),
  );

  return {
    error: null,
    member: translatedMember,
  };
}

export async function fetchActiveMemberCounts({ adminClient, cohortSlug = "" }) {
  const { data: memberRoleRows, error: memberRoleError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "member");

  if (memberRoleError) {
    return {
      error: memberRoleError,
      totalActiveMembers: 0,
      cohortMemberCount: 0,
    };
  }

  const memberIds = [...new Set((memberRoleRows || []).map((row) => row.user_id).filter(Boolean))];

  if (!memberIds.length) {
    return {
      error: null,
      totalActiveMembers: 0,
      cohortMemberCount: 0,
    };
  }

  const { data: activeProfiles, error: activeProfilesError } = await adminClient
    .from("profiles")
    .select("id")
    .in("id", memberIds)
    .eq("onboarding_status", "active")
    .eq("profile_status", "active");

  if (activeProfilesError) {
    return {
      error: activeProfilesError,
      totalActiveMembers: 0,
      cohortMemberCount: 0,
    };
  }

  const activeMemberIds = [...new Set((activeProfiles || []).map((row) => row.id).filter(Boolean))];

  if (!activeMemberIds.length) {
    return {
      error: null,
      totalActiveMembers: 0,
      cohortMemberCount: 0,
    };
  }

  if (!cohortSlug) {
    return {
      error: null,
      totalActiveMembers: activeMemberIds.length,
      cohortMemberCount: activeMemberIds.length,
    };
  }

  const { data: cohortRows, error: cohortRowsError } = await adminClient
    .from("user_cohorts")
    .select("user_id, cohorts!inner(slug)")
    .in("user_id", activeMemberIds)
    .eq("is_primary", true)
    .eq("cohorts.slug", cohortSlug);

  if (cohortRowsError) {
    return {
      error: cohortRowsError,
      totalActiveMembers: activeMemberIds.length,
      cohortMemberCount: activeMemberIds.length,
    };
  }

  return {
    error: null,
    totalActiveMembers: activeMemberIds.length,
    cohortMemberCount: new Set((cohortRows || []).map((row) => row.user_id).filter(Boolean)).size,
  };
}

export async function fetchActiveMemberDirectory({ adminClient, locale }) {
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

  const [profilesResult, cohortRowsResult, tagRowsResult, cohortProfilesResult, spaceMembershipsResult, bookingSettingsResult] = await Promise.all([
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
    adminClient
      .from("booking_settings")
      .select("member_id, public_booking_enabled, public_booking_url_slug")
      .in("member_id", memberIds),
  ]);

  const error =
    profilesResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error ||
    cohortProfilesResult.error ||
    spaceMembershipsResult.error ||
    bookingSettingsResult.error;

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
  const bookingSettingsByUserId = new Map(
    (bookingSettingsResult.data || []).map((row) => [row.member_id, row]),
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

  const members = (profilesResult.data || []).map((profile) =>
    buildMemberProfileView({
      authUser: null,
      bookingSettings: bookingSettingsByUserId.get(profile.id) || null,
      cohortProfile: cohortProfileByUserId.get(profile.id) || null,
      cohortRows: allCohortsByUserId.get(profile.id) || [],
      inviteRows: [],
      profile,
      spaceCount: spaceCountsByUserId.get(profile.id)?.size || 0,
      tagRows: allTagsByUserId.get(profile.id) || [],
    }),
  );

  return {
    error: null,
    members: await translateMemberViews(members, locale || await getRequestLocale()),
  };
}
