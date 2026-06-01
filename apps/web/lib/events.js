import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
import { ensureAdminEventRsvps } from "@/lib/calendar/data";
import { publicEvents as seededPublicEvents } from "@/lib/patna-data";
import { getRequestLocale, translateContentItems } from "@/lib/translation";

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

const PATNA_EVENT_SLUGS = new Set([
  "african-strategic-summit-on-shipping-decarbonisation",
  "dakar-maritime-decarbonisation-workshop",
  "african-climate-summit-ii-acs2",
]);

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

function endOfUtcDay(date) {
  const next = new Date(date);
  next.setUTCHours(23, 59, 59, 999);
  return next;
}

function parseDateLabel(value, { endOfDay = false } = {}) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const parsed = new Date(`${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : endOfDay ? endOfUtcDay(parsed) : parsed;
  }

  const exactMatch = raw.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);

  if (exactMatch) {
    const parsed = new Date(`${exactMatch[1]} ${exactMatch[2]} ${exactMatch[3]} UTC`);
    return Number.isNaN(parsed.getTime()) ? null : endOfDay ? endOfUtcDay(parsed) : parsed;
  }

  return null;
}

function parseDisplayDateRange(displayDate) {
  const raw = String(displayDate || "").trim();

  if (!raw) {
    return null;
  }

  const rangeParts = raw.split(/\s+(?:to|–|—)\s+/i);

  if (rangeParts.length === 2) {
    const start = parseDateLabel(rangeParts[0]);
    const end = parseDateLabel(rangeParts[1], { endOfDay: true });

    if (start && end) {
      return { start, end, approximate: false };
    }
  }

  const exact = parseDateLabel(raw, { endOfDay: true });

  if (exact) {
    return { start: parseDateLabel(raw), end: exact, approximate: false };
  }

  const monthOnlyMatch = raw.match(/^([A-Za-z]+) (\d{4})(?: \(TBC\))?$/i);

  if (monthOnlyMatch) {
    const parsed = new Date(`1 ${monthOnlyMatch[1]} ${monthOnlyMatch[2]} UTC`);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const end = new Date(parsed);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    end.setUTCHours(23, 59, 59, 999);

    return { start: parsed, end, approximate: true };
  }

  return null;
}

function parseApproximateDisplayDate(displayDate) {
  return parseDisplayDateRange(displayDate)?.start || null;
}

function getEventDateRange(event) {
  const start = event.starts_at ? new Date(event.starts_at) : null;
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

  if (validStart || validEnd) {
    return {
      start: validStart || validEnd,
      end: validEnd || endOfUtcDay(validStart),
      approximate: false,
    };
  }

  return parseDisplayDateRange(event.display_date);
}

function deriveScheduleStatus(event, now = new Date()) {
  const storedStatus = normaliseScheduleStatus(event.schedule_status);
  const range = getEventDateRange(event);

  if (!range?.end) {
    return storedStatus === "past" ? "past" : "tbc";
  }

  if (range.end.getTime() < now.getTime()) {
    return "past";
  }

  return storedStatus === "tbc" || range.approximate ? "tbc" : "upcoming";
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
  const event = {
    ...row,
    visibility: normaliseVisibility(row.visibility),
    status: normalisePublishStatus(row.status),
    organising_institutions: splitEventList(row.organising_institutions),
    themes: splitEventList(row.themes),
    display_date: getDisplayDate(row),
    creatorName: formatProfileName(row.created_by_profile),
    updatedByName: formatProfileName(row.updated_by_profile),
  };

  return {
    ...event,
    schedule_status: deriveScheduleStatus(event),
  };
}

async function translateEventsForDisplay(events, locale) {
  if (!events.length) {
    return events;
  }

  const items = [];
  const pushItem = (cacheKey, fieldName, text) => {
    if (typeof text !== "string" || !text.trim()) {
      return;
    }

    items.push({
      cacheKey,
      contentType: "event",
      fieldName,
      text,
      format: "text",
    });
  };

  for (const event of events) {
    pushItem(`event:${event.id}:title`, "title", event.title || "");
    pushItem(`event:${event.id}:summary`, "summary", event.summary || "");
    pushItem(`event:${event.id}:body`, "body", event.body || "");
    pushItem(`event:${event.id}:location`, "location", event.location || "");
    pushItem(`event:${event.id}:event_type`, "event_type", event.event_type || "");
    pushItem(`event:${event.id}:display_date`, "display_date", event.display_date || "");
    pushItem(`event:${event.id}:patna_involvement`, "patna_involvement", event.patna_involvement || "");

    for (const [index, institution] of (event.organising_institutions || []).entries()) {
      pushItem(`event:${event.id}:organising_institution:${index}`, "organising_institution", institution);
    }

    for (const [index, theme] of (event.themes || []).entries()) {
      pushItem(`event:${event.id}:theme:${index}`, "theme", theme);
    }
  }

  const translated = await translateContentItems(locale, items);
  const translatedByKey = new Map(translated.map((item) => [item.cacheKey, item.displayText]));

  return events.map((event) => ({
    ...event,
    sourceTitle: event.title,
    sourceSummary: event.summary,
    sourceBody: event.body,
    sourceLocation: event.location,
    sourcePatnaInvolvement: event.patna_involvement,
    sourceOrganisingInstitutions: event.organising_institutions || [],
    sourceThemes: event.themes || [],
    title: translatedByKey.get(`event:${event.id}:title`) || event.title,
    summary: translatedByKey.get(`event:${event.id}:summary`) || event.summary,
    body: translatedByKey.get(`event:${event.id}:body`) || event.body,
    location: translatedByKey.get(`event:${event.id}:location`) || event.location,
    eventTypeDisplay: translatedByKey.get(`event:${event.id}:event_type`) || event.event_type,
    displayDateDisplay: translatedByKey.get(`event:${event.id}:display_date`) || event.display_date,
    patna_involvement:
      translatedByKey.get(`event:${event.id}:patna_involvement`) || event.patna_involvement,
    organising_institutions: (event.organising_institutions || []).map((institution, index) =>
      translatedByKey.get(`event:${event.id}:organising_institution:${index}`) || institution
    ),
    themes: (event.themes || []).map((theme, index) =>
      translatedByKey.get(`event:${event.id}:theme:${index}`) || theme
    ),
  }));
}

function createSeedFallbackEvents() {
  return seededPublicEvents.map((event) => normaliseEventRow({
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
    is_rsvped: false,
  }));
}

export async function fetchPublicEvents({ limit = 0 } = {}) {
  const fallback = createSeedFallbackEvents();

  if (!isSupabaseConfigured()) {
    const events = limit > 0 ? fallback.slice(0, limit) : fallback;
    return translateEventsForDisplay(events, await getRequestLocale());
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public");

  if (error || !data) {
    const events = limit > 0 ? fallback.slice(0, limit) : fallback;
    return translateEventsForDisplay(events, await getRequestLocale());
  }

  const events = data.map(normaliseEventRow).sort(compareEvents);
  return translateEventsForDisplay(
    limit > 0 ? events.slice(0, limit) : events,
    await getRequestLocale(),
  );
}

export function isPatnaLedEvent(event) {
  return PATNA_EVENT_SLUGS.has(event?.slug);
}

export function splitPublicEventCollections(events) {
  return events.reduce(
    (collections, event) => {
      if (isPatnaLedEvent(event)) {
        collections.patnaEvents.push(event);
      } else {
        collections.externalEvents.push(event);
      }

      return collections;
    },
    { patnaEvents: [], externalEvents: [] },
  );
}

export async function fetchMemberEvents({ supabase, memberId = "", isAdmin = false, limit = 0 } = {}) {
  const fallback = createSeedFallbackEvents();

  if (!supabase) {
    const events = limit > 0 ? fallback.slice(0, limit) : fallback;
    return {
      events: await translateEventsForDisplay(events, await getRequestLocale()),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published");

  if (error || !data) {
    const events = limit > 0 ? fallback.slice(0, limit) : fallback;
    return {
      events: await translateEventsForDisplay(events, await getRequestLocale()),
      error,
    };
  }

  const events = data.map(normaliseEventRow).sort(compareEvents);
  const scopedEvents = limit > 0 ? events.slice(0, limit) : events;
  let rsvpedEventIds = new Set();

  if (memberId && scopedEvents.length > 0) {
    await ensureAdminEventRsvps({
      communityEvents: scopedEvents,
      isAdmin,
      memberId,
      supabase,
    });

    const { data: memberRsvps, error: memberRsvpError } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("user_id", memberId)
      .in("event_id", scopedEvents.map((event) => event.id));

    if (!memberRsvpError) {
      rsvpedEventIds = new Set((memberRsvps || []).map((row) => row.event_id));
    }
  }

  const memberAwareEvents = scopedEvents.map((event) => ({
    ...event,
    is_rsvped: rsvpedEventIds.has(event.id),
  }));

  return {
    events: await translateEventsForDisplay(memberAwareEvents, await getRequestLocale()),
    error: null,
  };
}

export async function fetchAdminEvents({ supabase }) {
  const { data, error } = await supabase
    .from("events")
    .select(ADMIN_EVENT_SELECT)
    .order("created_at", { ascending: false });

  return {
    events: await translateEventsForDisplay(
      (data || []).map(normaliseEventRow).sort(compareEvents),
      await getRequestLocale(),
    ),
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

export function filterAdminEvents(events, { publishStatus = "all", scheduleStatus = "all", visibility = "all" }) {
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

    return true;
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
      cover_image_url: "",
      cover_image_alt: "",
    };
  }

  return {
    id: event.id || "",
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
    cover_image_url: event.cover_image_url || "",
    cover_image_alt: event.cover_image_alt || "",
  };
}

export async function fetchEventGallery({ supabase, eventId }) {
  const { data, error } = await supabase
    .from("event_gallery")
    .select("id, image_url, alt_text, caption, sort_order")
    .eq("event_id", eventId)
    .order("sort_order");

  return { images: data || [], error };
}

export async function fetchPublicEventBySlug({ supabase, slug }) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return {
    event: data ? normaliseEventRow(data) : null,
    error,
  };
}
