import { fetchAdminMembersDirectory, matchesMemberCohortFilter, matchesMemberStatusFilter, MEMBER_STATUS_FILTERS } from "@/lib/admin-members";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

export async function GET(request) {
  const context = await getCurrentUserContext();

  if (!context.user || !context.isAdmin || !context.supabase) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get("status") || "all";
  const requestedCohort = url.searchParams.get("cohort") || "all";
  const activeFilter = MEMBER_STATUS_FILTERS.includes(requestedStatus) ? requestedStatus : "all";
  const adminClient = createSupabaseAdminClient();
  const { error, members, cohortOptions } = await fetchAdminMembersDirectory({
    supabase: context.supabase,
    adminClient,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const activeCohort = cohortOptions.some((cohort) => cohort.slug === requestedCohort) ? requestedCohort : "all";
  const filteredMembers = members.filter(
    (member) =>
      matchesMemberStatusFilter(member, activeFilter) && matchesMemberCohortFilter(member, activeCohort),
  );

  const header = [
    "email",
    "first_name",
    "surname",
    "primary_cohort",
    "secondary_cohorts",
    "organisation_name",
    "role_title",
    "country_of_residence",
    "phone_number",
    "whatsapp_number",
    "timezone",
    "onboarding_status",
    "profile_status",
    "availability_status",
    "profile_complete",
    "completion_percent",
    "missing_profile_fields",
    "headshot_recovery_needed",
    "resume_recovery_needed",
    "invite_status",
    "last_login_email_at",
    "last_sign_in_at",
    "migration_batch_id",
  ];

  const rows = filteredMembers.map((member) => [
    member.email,
    member.first_name || "",
    member.surname || "",
    member.primaryCohort?.name || "",
    member.secondaryCohorts.map((cohort) => cohort.name).join("; "),
    member.organisation_name || "",
    member.role_title || "",
    member.country_of_residence || "",
    member.phone_number || "",
    member.whatsapp_number || "",
    member.timezone || "",
    member.onboarding_status,
    member.profileStatus,
    member.availabilityStatus,
    member.isProfileComplete ? "yes" : "no",
    String(member.completionPercent || 0),
    member.missingProfileFields.join("; "),
    member.needsHeadshotRecovery ? "yes" : "no",
    member.needsResumeRecovery ? "yes" : "no",
    member.latestInvite ? member.latestInvite.delivery_method : "not_sent",
    formatDate(member.latestInvite?.created_at),
    formatDate(member.authUser?.last_sign_in_at),
    member.migration_batch_id || "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const fileSuffix = activeCohort === "all" ? activeFilter : `${activeFilter}-${activeCohort}`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patna-member-status-${fileSuffix}.csv"`,
    },
  });
}
