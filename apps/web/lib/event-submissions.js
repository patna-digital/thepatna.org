function formatProfileName(profile) {
  if (!profile) {
    return "";
  }

  const fullName = [profile.first_name, profile.surname].filter(Boolean).join(" ").trim();
  return fullName || profile.email || "";
}

function splitEventList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const EVENT_SUBMISSION_SELECT = `
  *,
  submitted_by_profile:profiles!event_submissions_submitted_by_user_id_fkey(id, email, first_name, surname),
  reviewed_by_profile:profiles!event_submissions_reviewed_by_user_id_fkey(id, email, first_name, surname),
  approved_event:events!event_submissions_approved_event_id_fkey(id, title, slug)
`;

const SUBMISSION_STATUS_RANK = {
  submitted: 0,
  approved: 1,
  rejected: 2,
};

export function normaliseSubmissionStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["submitted", "approved", "rejected"].includes(normalized) ? normalized : "submitted";
}

export function normaliseEventSubmissionRow(row) {
  return {
    ...row,
    submission_status: normaliseSubmissionStatus(row.submission_status),
    organising_institutions: splitEventList(row.organising_institutions),
    themes: splitEventList(row.themes),
    submittedByName: formatProfileName(row.submitted_by_profile),
    reviewedByName: formatProfileName(row.reviewed_by_profile),
    approvedEventTitle: row.approved_event?.title || "",
    approvedEventSlug: row.approved_event?.slug || "",
  };
}

function compareEventSubmissions(left, right) {
  const leftRank = SUBMISSION_STATUS_RANK[left.submission_status] ?? 3;
  const rightRank = SUBMISSION_STATUS_RANK[right.submission_status] ?? 3;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftCreatedAt = new Date(left.created_at || 0).getTime();
  const rightCreatedAt = new Date(right.created_at || 0).getTime();

  return rightCreatedAt - leftCreatedAt;
}

export function buildEventSubmissionSummary(submissions = []) {
  return {
    total: submissions.length,
    submitted: submissions.filter((submission) => submission.submission_status === "submitted").length,
    approved: submissions.filter((submission) => submission.submission_status === "approved").length,
    rejected: submissions.filter((submission) => submission.submission_status === "rejected").length,
  };
}

export async function fetchMemberEventSubmissions({ supabase, memberId }) {
  const { data, error } = await supabase
    .from("event_submissions")
    .select(EVENT_SUBMISSION_SELECT)
    .eq("submitted_by_user_id", memberId)
    .order("created_at", { ascending: false });

  return {
    submissions: (data || []).map(normaliseEventSubmissionRow).sort(compareEventSubmissions),
    error,
  };
}

export async function fetchAdminEventSubmissions({ supabase, status = "all" } = {}) {
  let query = supabase
    .from("event_submissions")
    .select(EVENT_SUBMISSION_SELECT)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("submission_status", status);
  }

  const { data, error } = await query;

  return {
    submissions: (data || []).map(normaliseEventSubmissionRow).sort(compareEventSubmissions),
    error,
  };
}

export async function fetchAdminEventSubmissionById({ submissionId, supabase }) {
  const { data, error } = await supabase
    .from("event_submissions")
    .select(EVENT_SUBMISSION_SELECT)
    .eq("id", submissionId)
    .maybeSingle();

  return {
    submission: data ? normaliseEventSubmissionRow(data) : null,
    error,
  };
}
