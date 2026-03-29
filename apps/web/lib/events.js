import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
import { publicEvents as seededPublicEvents } from "@/lib/patna-data";

const ADMIN_EVENT_SELECT = `
  *,
  created_by_profile:profiles!events_created_by_user_id_fkey(id, email, first_name, surname),
  updated_by_profile:profiles!events_updated_by_user_id_fkey(id, email, first_name, surname)
`;

const SCHEDULE_RANK = {
  upcoming: 0,
  tbc: 1,
  past: 2,
};

function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createEventSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatProfileName(profile) {
  if (!profile) {
    return "";
  }

  const fullName = [profile.first_name, profile.surname].filter(Boolean).join(" ").trim();
  return fullName || profile.email || "";
}

export function splitEventList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseApproximateDisplayDate(displayDate) {
  const raw = String(displayDate || "").trim();

  if (!raw) {
    return null;
  }

  const exactMatch = raw.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);

  if (exactMatch) {
    const parsed = new Date(`${exactMatch[1]} ${exactMatch[2]} ${exactMatch[3]} UTC`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const monthOnlyMatch = raw.match(/^([A-Za-z]+) (\d{4})(?: \(TBC\))?$/i);

  if (monthOnlyMatch) {
    const parsed = new Date(`1 ${monthOnlyMatch[1]} ${monthOnlyMatch[2]} UTC`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function getEventSortDate(event) {
  if (event.starts_at) {
    const parsed = new Date(event.starts_at);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return parseApproximateDisplayDate(event.display_date);
}

function compareEvents(left, right) {
  const leftRank = SCHEDULE_RANK[left.schedule_status] ?? 3;
  const rightRank = SCHEDULE_RANK[right.schedule_status] ?? 3;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftDate = getEventSortDate(left);
  const rightDate = getEventSortDate(right);

  if (!leftDate && !rightDate) {
    return left.title.localeCompare(right.title);
  }

  if (!leftDate) {
    return 1;
  }

  if (!rightDate) {
    return -1;
  }

  if (left.schedule_status === "past" && right.schedule_status === "past") {
    return rightDate.getTime() - leftDate.getTime();
  }

  return leftDate.getTime() - rightDate.getTime();
}

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayDate(event) {
  if (event.display_date) {
    return event.display_date;
  }

  if (event.starts_at && event.ends_at) {
    const startLabel = formatDateLabel(event.starts_at);
    const endLabel = formatDateLabel(event.ends_at);

    if (startLabel && endLabel && startLabel !== endLabel) {
      return `${startLabel} to ${endLabel}`;
    }
  }

  if (event.starts_at) {
    return formatDateLabel(event.starts_at);
  }

  return "";
}

function normaliseVisibility(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["public", "members", "restricted"].includes(normalized) ? normalized : "public";
}

function normalisePublishStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["draft", "published", "archived"].includes(normalized) ? normalized : "draft";
}

function normaliseScheduleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["past", "upcoming", "tbc"].includes(normalized) ? normalized : "tbc";
}

function normaliseEventRow(row) {
  return {
    ...row,
    visibility: normaliseVisibility(row.visibility),
    status: normalisePublishStatus(row.status),
    schedule_status: normaliseScheduleStatus(row.schedule_status),
    organising_institutions: splitEventList(row.organising_institutions),
    themes: splitEventList(row.themes),
    display_date: getDisplayDate(row),
    creatorName: formatProfileName(row.created_by_profile),
    updatedByName: formatProfileName(row.updated_by_profile),
  };
}

function createSeedFallbackEvents() {
  return seededPublicEvents.map((event) => ({
    id: event.slug,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    body: "",
    event_type: event.type,
    location: event.location,
    display_date: event.date,
    starts_at: null,
    ends_at: null,
    schedule_status: "upcoming",
    visibility: "public",
    status: "published",
    organising_institutions: [],
    patna_involvement: "",
    themes: [],
    official_link: "",
    created_by_user_id: null,
    updated_by_user_id: null,
    created_by_profile: null,
    updated_by_profile: null,
    creatorName: "",
    updatedByName: "",
  }));
}

export async function fetchPublicEvents({ limit = 0 } = {}) {
  const fallback = createSeedFallbackEvents();

  if (!isSupabaseConfigured()) {
    return limit > 0 ? fallback.slice(0, limit) : fallback;
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public");

  if (error || !data) {
    return limit > 0 ? fallback.slice(0, limit) : fallback;
  }

  const events = data.map(normaliseEventRow).sort(compareEvents);
  return limit > 0 ? events.slice(0, limit) : events;
}

export async function fetchMemberEvents({ supabase, limit = 0 } = {}) {
  const fallback = createSeedFallbackEvents();

  if (!supabase) {
    return {
      events: limit > 0 ? fallback.slice(0, limit) : fallback,
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published");

  if (error || !data) {
    return {
      events: limit > 0 ? fallback.slice(0, limit) : fallback,
      error,
    };
  }

  const events = data.map(normaliseEventRow).sort(compareEvents);

  return {
    events: limit > 0 ? events.slice(0, limit) : events,
    error: null,
  };
}

export async function fetchAdminEvents({ supabase }) {
  const { data, error } = await supabase
    .from("events")
    .select(ADMIN_EVENT_SELECT)
    .order("created_at", { ascending: false });

  return {
    events: (data || []).map(normaliseEventRow).sort(compareEvents),
    error,
  };
}

export async function fetchAdminEventById({ eventId, supabase }) {
  const { data, error } = await supabase
    .from("events")
    .select(ADMIN_EVENT_SELECT)
    .eq("id", eventId)
    .maybeSingle();

  return {
    event: data ? normaliseEventRow(data) : null,
    error,
  };
}

export function buildAdminEventSummary(events) {
  return {
    total: events.length,
    published: events.filter((event) => event.status === "published").length,
    draft: events.filter((event) => event.status === "draft").length,
    archived: events.filter((event) => event.status === "archived").length,
    upcoming: events.filter((event) => event.schedule_status === "upcoming").length,
    tbc: events.filter((event) => event.schedule_status === "tbc").length,
    past: events.filter((event) => event.schedule_status === "past").length,
  };
}

export function filterAdminEvents(events, { publishStatus = "all", scheduleStatus = "all", search = "", visibility = "all" }) {
  const normalisedSearch = String(search || "").trim().toLowerCase();

  return events.filter((event) => {
    if (publishStatus !== "all" && event.status !== publishStatus) {
      return false;
    }

    if (scheduleStatus !== "all" && event.schedule_status !== scheduleStatus) {
      return false;
    }

    if (visibility !== "all" && event.visibility !== visibility) {
      return false;
    }

    if (!normalisedSearch) {
      return true;
    }

    const haystack = [
      event.title,
      event.location,
      event.summary,
      event.event_type,
      event.patna_involvement,
      ...(event.organising_institutions || []),
      ...(event.themes || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalisedSearch);
  });
}

export function buildEventFormValues(event) {
  if (!event) {
    return {
      id: "",
      title: "",
      event_type: "",
      organising_institutions: "",
      starts_on: "",
      ends_on: "",
      display_date: "",
      location: "",
      summary: "",
      body: "",
      patna_involvement: "",
      themes: "",
      official_link: "",
      visibility: "public",
      status: "draft",
      schedule_status: "upcoming",
      slug: "",
    };
  }

  return {
    id: event.id,
    title: event.title || "",
    event_type: event.event_type || "",
    organising_institutions: (event.organising_institutions || []).join(";\n"),
    starts_on: event.starts_at ? String(event.starts_at).slice(0, 10) : "",
    ends_on: event.ends_at ? String(event.ends_at).slice(0, 10) : "",
    display_date: event.display_date || "",
    location: event.location || "",
    summary: event.summary || "",
    body: event.body || "",
    patna_involvement: event.patna_involvement || "",
    themes: (event.themes || []).join(";\n"),
    official_link: event.official_link || "",
    visibility: event.visibility || "public",
    status: event.status || "draft",
    schedule_status: event.schedule_status || "upcoming",
    slug: event.slug || "",
  };
}
