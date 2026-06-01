import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
// Note: Translation imports removed to avoid server-only module issues in client components

const ADMIN_SERVICE_REQUEST_SELECT = `
  *,
  assigned_to_profile:profiles!service_requests_assigned_to_user_id_fkey(id, email, first_name, surname),
  updated_by_profile:profiles!service_requests_updated_by_user_id_fkey(id, email, first_name, surname)
`;

const REQUEST_TYPE_ORDER = {
  technical: 0,
  research: 1,
  content: 2,
  events: 3,
  partnership: 4,
  training: 5,
};

function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createServiceRequestSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitServiceRequestDetails(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normaliseServiceRequestRow(row) {
  return {
    ...row,
    request_type: String(row.request_type || "").toLowerCase(),
    status: String(row.status || "new").toLowerCase(),
  };
}

async function translateServiceRequestsForDisplay(serviceRequests, locale) {
  // Stub implementation for MVP - return requests as-is
  return serviceRequests;
}

export async function fetchPublicServiceRequests({ limit = 0 } = {}) {
  // Service requests are typically internal/admin facing, so public fetch might not be needed
  // Returning empty array as placeholder
  return [];
}

export async function fetchAdminServiceRequests({ supabase }) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(ADMIN_SERVICE_REQUEST_SELECT)
    .order("created_at", { ascending: false });

  return {
    serviceRequests: await translateServiceRequestsForDisplay(
      (data || []).map(normaliseServiceRequestRow),
      "en", // Default locale for MVP
    ),
    error,
  };
}

export async function fetchAdminServiceRequestById({ requestId, supabase }) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(ADMIN_SERVICE_REQUEST_SELECT)
    .eq("id", requestId)
    .maybeSingle();

  return {
    serviceRequest: data ? normaliseServiceRequestRow(data) : null,
    error,
  };
}

export function buildServiceRequestSummary(serviceRequests) {
  const statusCounts = {};
  const typeCounts = {};

  serviceRequests.forEach((req) => {
    statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    typeCounts[req.request_type] = (typeCounts[req.request_type] || 0) + 1;
  });

  return {
    total: serviceRequests.length,
    new: statusCounts.new || 0,
    inProgress: statusCounts.in_progress || 0,
    review: statusCounts.review || 0,
    completed: statusCounts.completed || 0,
    cancelled: statusCounts.cancelled || 0,
    technical: typeCounts.technical || 0,
    research: typeCounts.research || 0,
    content: typeCounts.content || 0,
    events: typeCounts.events || 0,
    partnership: typeCounts.partnership || 0,
    training: typeCounts.training || 0,
  };
}

export function filterAdminServiceRequests(serviceRequests, { status = "all", requestType = "all", search = "", sortBy = "created_at", sortDir = "desc" }) {
  const normalisedSearch = String(search || "").trim().toLowerCase();

  const filtered = serviceRequests.filter((request) => {
    if (status !== "all" && request.status !== status) return false;
    if (requestType !== "all" && request.request_type !== requestType) return false;
    if (!normalisedSearch) return true;

    const haystack = [request.requester_name, request.requester_email, request.organisation, request.details, request.request_type, request.country, request.decision_context, request.timeline]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalisedSearch);
  });

  const VALID_SORT_COLS = ["requester_name", "organisation", "request_type", "status", "created_at"];
  const col = VALID_SORT_COLS.includes(sortBy) ? sortBy : "created_at";
  const asc = sortDir === "asc";

  return [...filtered].sort((a, b) => {
    const av = String(a[col] || "").toLowerCase();
    const bv = String(b[col] || "").toLowerCase();
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

export function buildServiceRequestFormValues(request) {
  if (!request) {
    return {
      id: "",
      requester_name: "",
      requester_email: "",
      organisation: "",
      request_type: "",
      details: "",
      country: "",
      decision_context: "",
      timeline: "",
      status: "new",
      assigned_to_user_id: "",
    };
  }

  return {
    id: request.id,
    requester_name: request.requester_name || "",
    requester_email: request.requester_email || "",
    organisation: request.organisation || "",
    request_type: request.request_type || "",
    details: request.details || "",
    country: request.country || "",
    decision_context: request.decision_context || "",
    timeline: request.timeline || "",
    status: request.status || "new",
    assigned_to_user_id: request.assigned_to_user_id || "",
  };
}