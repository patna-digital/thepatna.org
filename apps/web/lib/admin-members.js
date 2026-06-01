import { listSupabaseAuthUsers } from "@/lib/supabase/admin";
import { buildMemberProfileView } from "@/lib/member-profiles";

export const MEMBER_STATUS_FILTERS = [
  "all",
  "imported",
  "not-sent",
  "contacted",
  "active",
  "pending",
  "profile-active",
  "profile-inactive",
  "headshot-recovery",
  "resume-recovery",
];

export function getMemberInviteLabel(latestInvite) {
  if (!latestInvite) {
    return "Not sent";
  }

  return latestInvite.delivery_method === "manual_reset" ? "Set-password sent" : "Invite sent";
}

export function matchesMemberStatusFilter(member, filter) {
  if (filter === "imported") {
    return member.isImported;
  }

  if (filter === "not-sent") {
    return !member.wasContacted;
  }

  if (filter === "contacted") {
    return member.wasContacted;
  }

  if (filter === "active") {
    return member.isActive;
  }

  if (filter === "pending") {
    return !member.isActive;
  }

  if (filter === "headshot-recovery") {
    return member.needsHeadshotRecovery;
  }

  if (filter === "resume-recovery") {
    return member.needsResumeRecovery;
  }

  if (filter === "profile-active") {
    return member.profileStatus !== "inactive";
  }

  if (filter === "profile-inactive") {
    return member.profileStatus === "inactive";
  }

  return true;
}

export function matchesMemberCohortFilter(member, cohortSlug) {
  if (!cohortSlug || cohortSlug === "all") {
    return true;
  }

  return member.cohortSlugs.includes(cohortSlug);
}

export function buildMemberCounts(members) {
  return {
    imported: members.filter((member) => member.isImported).length,
    "not-sent": members.filter((member) => !member.wasContacted).length,
    contacted: members.filter((member) => member.wasContacted).length,
    active: members.filter((member) => member.isActive).length,
    pending: members.filter((member) => !member.isActive).length,
    "profile-active": members.filter((member) => member.profileStatus !== "inactive").length,
    "profile-inactive": members.filter((member) => member.profileStatus === "inactive").length,
    "headshot-recovery": members.filter((member) => member.needsHeadshotRecovery).length,
    "resume-recovery": members.filter((member) => member.needsResumeRecovery).length,
  };
}

export async function fetchAdminMembersDirectory({ supabase, adminClient }) {
  const { data: memberRoleRows, error: memberRoleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "member");

  const memberIds = [...new Set((memberRoleRows || []).map((row) => row.user_id).filter(Boolean))];

  const [authUsers, cohortsResult, profilesResult, allCohortsResult, tagRowsResult, latestInvitesResult, cohortProfilesResult] =
    await Promise.all([
      listSupabaseAuthUsers(adminClient),
      supabase.from("cohorts").select("slug, name").order("name", { ascending: true }),
      memberIds.length
        ? supabase
            .from("profiles")
            .select(
              "id, email, first_name, surname, title, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, migration_batch_id, invited_at, onboarding_completed_at, phone_number, whatsapp_number, timezone, profile_status, availability_status",
            )
            .in("id", memberIds)
            .order("first_name", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      memberIds.length
        ? supabase
            .from("user_cohorts")
            .select("user_id, is_primary, cohorts(name, slug)")
            .in("user_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      memberIds.length
        ? supabase
            .from("user_tags")
            .select("user_id, tag_id, domain_tags(name, slug)")
            .in("user_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      memberIds.length
        ? supabase.from("invites").select("user_id, delivery_method, created_at").in("user_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      memberIds.length
        ? supabase
            .from("cohort_member_profiles")
            .select("user_id, completed_at, source_submitted_at, headshot_url, cv_url, nda_url, code_of_conduct_url, raw_responses")
            .in("user_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const error =
    memberRoleError ||
    cohortsResult.error ||
    profilesResult.error ||
    allCohortsResult.error ||
    tagRowsResult.error ||
    latestInvitesResult.error ||
    cohortProfilesResult.error;
  const allCohortsByUserId = new Map();

  for (const row of allCohortsResult.data || []) {
    const existing = allCohortsByUserId.get(row.user_id) || [];
    allCohortsByUserId.set(row.user_id, [...existing, row]);
  }

  const allTagsByUserId = new Map();

  for (const row of tagRowsResult.data || []) {
    const existing = allTagsByUserId.get(row.user_id) || [];
    allTagsByUserId.set(row.user_id, [...existing, row]);
  }

  const allInvitesByUserId = new Map();

  for (const row of latestInvitesResult.data || []) {
    const existing = allInvitesByUserId.get(row.user_id) || [];
    allInvitesByUserId.set(row.user_id, [...existing, row]);
  }

  const cohortProfileByUserId = new Map(
    (cohortProfilesResult.data || []).map((row) => [row.user_id, row]),
  );

  const members = (profilesResult.data || []).map((profile) => {
    const authUser =
      authUsers.find((candidate) => candidate.id === profile.id) ||
      authUsers.find(
        (candidate) =>
          String(candidate.email || "").trim().toLowerCase() ===
          String(profile.email || "").trim().toLowerCase(),
      ) ||
      null;

    return buildMemberProfileView({
      authUser,
      cohortProfile: cohortProfileByUserId.get(profile.id) || null,
      cohortRows: allCohortsByUserId.get(profile.id) || [],
      inviteRows: allInvitesByUserId.get(profile.id) || [],
      profile,
      tagRows: allTagsByUserId.get(profile.id) || [],
    });
  });

  return {
    error,
    members,
    counts: buildMemberCounts(members),
    cohortOptions: cohortsResult.data || [],
  };
}
