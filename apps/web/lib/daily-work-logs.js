import {
  formatAvailabilityToday,
  formatPrioritiesProgress,
  formatWellbeing,
  isFlaggedWellbeing,
} from "@/lib/daily-work-log-options";

function formatProfileName(profile) {
  if (!profile) {
    return "";
  }

  const fullName = [profile.first_name, profile.surname].filter(Boolean).join(" ").trim();
  return fullName || profile.email || "";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function normaliseDailyWorkLogRow(row) {
  if (!row) {
    return null;
  }

  const isFlagged =
    Boolean(row.support_required) || Boolean(row.risks_blockers) || Boolean(row.issues_encountered) || isFlaggedWellbeing(row.wellbeing);

  return {
    ...row,
    availabilityTodayLabel: formatAvailabilityToday(row.availability_today),
    prioritiesProgressLabel: formatPrioritiesProgress(row.priorities_progress),
    wellbeingLabel: formatWellbeing(row.wellbeing),
    hasCheckedIn: Boolean(row.checkin_submitted_at),
    hasCheckedOut: Boolean(row.checkout_submitted_at),
    isFlagged,
  };
}

export async function fetchLineManagerName({ supabase, lineManagerId }) {
  if (!lineManagerId) {
    return "";
  }

  const { data } = await supabase
    .from("profiles")
    .select("first_name, surname, email")
    .eq("id", lineManagerId)
    .maybeSingle();

  return formatProfileName(data);
}

export async function fetchTodayLogForUser({ supabase, userId, logDate = todayIsoDate() }) {
  const { data, error } = await supabase
    .from("daily_work_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .maybeSingle();

  return {
    log: data ? normaliseDailyWorkLogRow(data) : null,
    logDate,
    error,
  };
}

export async function fetchMemberLogHistory({ supabase, userId, limit = 30 }) {
  const { data, error } = await supabase
    .from("daily_work_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);

  return {
    logs: (data || []).map(normaliseDailyWorkLogRow),
    error,
  };
}

export async function fetchAdminStaffRoster({ supabase, logDate = todayIsoDate() }) {
  const { data: staffRoleRows, error: staffRoleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "staff");

  const staffIds = [...new Set((staffRoleRows || []).map((row) => row.user_id).filter(Boolean))];

  if (!staffIds.length) {
    return { staff: [], error: staffRoleError };
  }

  const [profilesResult, todayLogsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, surname, role_title, country_of_residence, timezone, line_manager_id")
      .in("id", staffIds)
      .order("first_name", { ascending: true }),
    supabase.from("daily_work_logs").select("*").in("user_id", staffIds).eq("log_date", logDate),
  ]);

  const error = staffRoleError || profilesResult.error || todayLogsResult.error;
  const profiles = profilesResult.data || [];

  const managerIds = [...new Set(profiles.map((profile) => profile.line_manager_id).filter(Boolean))];
  const managersResult = managerIds.length
    ? await supabase.from("profiles").select("id, first_name, surname, email").in("id", managerIds)
    : { data: [] };
  const managersById = new Map((managersResult.data || []).map((manager) => [manager.id, manager]));

  const todayLogByUserId = new Map(
    (todayLogsResult.data || []).map((row) => [row.user_id, normaliseDailyWorkLogRow(row)]),
  );

  const staff = profiles.map((profile) => ({
    id: profile.id,
    name: formatProfileName(profile),
    email: profile.email,
    roleTitle: profile.role_title || "",
    country: profile.country_of_residence || "",
    timezone: profile.timezone || "",
    lineManagerId: profile.line_manager_id || null,
    lineManagerName: formatProfileName(managersById.get(profile.line_manager_id)),
    todayLog: todayLogByUserId.get(profile.id) || null,
  }));

  return { staff, error };
}

export async function fetchPotentialLineManagers({ supabase }) {
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["administrator", "staff"]);

  const managerIds = [...new Set((roleRows || []).map((row) => row.user_id).filter(Boolean))];

  if (!managerIds.length) {
    return { managers: [], error: roleError };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, surname, email")
    .in("id", managerIds)
    .order("first_name", { ascending: true });

  return {
    managers: (data || []).map((profile) => ({ id: profile.id, name: formatProfileName(profile) })),
    error: roleError || error,
  };
}

export async function fetchAdminStaffLogHistory({ supabase, staffId, limit = 60 }) {
  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, surname, role_title, country_of_residence, timezone, line_manager_id")
      .eq("id", staffId)
      .maybeSingle(),
    supabase
      .from("daily_work_logs")
      .select("*")
      .eq("user_id", staffId)
      .order("log_date", { ascending: false })
      .limit(limit),
  ]);

  const profile = profileResult.data || null;
  const managerResult = profile?.line_manager_id
    ? await supabase.from("profiles").select("id, first_name, surname, email").eq("id", profile.line_manager_id).maybeSingle()
    : { data: null };

  return {
    profile: profile
      ? {
          ...profile,
          name: formatProfileName(profile),
          lineManagerName: formatProfileName(managerResult.data),
        }
      : null,
    logs: (logsResult.data || []).map(normaliseDailyWorkLogRow),
    error: profileResult.error || logsResult.error,
  };
}
