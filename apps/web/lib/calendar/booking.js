import { getSiteUrl } from "../env.js";
import { resolveHeadshotAsset } from "../member-headshots.js";
import { getRequestLocale, translateContentItems } from "../translation.js";
import { selectGoogleWritebackConnection } from "./booking-writeback.js";
import { generateTimeSlots } from "./core.js";

export const DEFAULT_AVAILABLE_DAYS = [1, 2, 3, 4, 5];
export const DEFAULT_BOOKING_SETTINGS = {
  public_booking_enabled: false,
  public_booking_url_slug: "",
  default_meeting_duration: 30,
  minimum_notice_hours: 24,
  maximum_booking_days_ahead: 30,
  buffer_minutes_between_meetings: 10,
  timezone: "UTC",
  available_days: DEFAULT_AVAILABLE_DAYS,
  confirmation_message: "",
  cancellation_policy: "",
};

function normalizeNullableText(value) {
  return value ? String(value) : "";
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;
const DATE_TIME_FORMATTERS = new Map();

function getDateTimeFormatter(timeZone, withTime = true) {
  const key = `${timeZone}:${withTime ? "datetime" : "date"}`;

  if (!DATE_TIME_FORMATTERS.has(key)) {
    DATE_TIME_FORMATTERS.set(
      key,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime
          ? {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hourCycle: "h23",
            }
          : {}),
      }),
    );
  }

  return DATE_TIME_FORMATTERS.get(key);
}

function getDateTimeParts(date, timeZone, withTime = true) {
  const formatter = getDateTimeFormatter(timeZone, withTime);
  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return values;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateKey(dateKey) {
  if (!DATE_KEY_PATTERN.test(String(dateKey || ""))) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function createUtcDateFromKey(dateKey) {
  const parsed = parseDateKey(dateKey);
  return parsed ? new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)) : null;
}

function formatUtcDateKey(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const parts = getDateTimeParts(date, timeZone);
  const utcTimestamp = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour || "0"),
    Number(parts.minute || "0"),
    Number(parts.second || "0"),
  );

  return (utcTimestamp - date.getTime()) / 60000;
}

function sanitizeAvailabilityDays(days) {
  if (!Array.isArray(days)) {
    return DEFAULT_AVAILABLE_DAYS;
  }

  const preferredOrder = [1, 2, 3, 4, 5, 6, 0];
  const unique = [...new Set(days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))];

  if (!unique.length) {
    return DEFAULT_AVAILABLE_DAYS;
  }

  return preferredOrder.filter((value) => unique.includes(value));
}

function createSlotId(memberId, dateKey, startTime, endTime) {
  return `slot-${memberId}-${dateKey}-${startTime}-${endTime}`.replace(/[^a-zA-Z0-9-]/g, "");
}

function getDisplayName(member = {}) {
  return [member.title, member.first_name, member.surname].filter(Boolean).join(" ").trim() || "PATNA Member";
}

function getSummaryDescription(member = {}) {
  const roleLine = [member.role_title, member.organisation_name].filter(Boolean).join(" at ");
  if (member.professional_bio) {
    return member.professional_bio.trim();
  }
  if (roleLine) {
    return `Book time with ${getDisplayName(member)}, ${roleLine}.`;
  }
  return `Book time with ${getDisplayName(member)} on PATNA.`;
}

function getInitials(member = {}) {
  return getDisplayName(member)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";
}

function truncateText(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

async function translateBookingMemberForDisplay(member, locale) {
  if (!member) {
    return null;
  }

  const baseMember = {
    ...member,
    displayName: getDisplayName(member),
    profileSummary: truncateText(getSummaryDescription(member), 190),
    initials: getInitials(member),
  };

  const translationItems = [
    {
      cacheKey: `booking_member:${member.id}:role_title`,
      contentType: "member",
      fieldName: "role_title",
      text: baseMember.role_title || "",
    },
    {
      cacheKey: `booking_member:${member.id}:country_of_residence`,
      contentType: "member",
      fieldName: "country_of_residence",
      text: baseMember.country_of_residence || "",
    },
    {
      cacheKey: `booking_member:${member.id}:professional_bio`,
      contentType: "member",
      fieldName: "professional_bio",
      text: baseMember.professional_bio || "",
    },
    {
      cacheKey: `booking_member:${member.id}:profile_summary`,
      contentType: "member",
      fieldName: "profile_summary",
      text: baseMember.profileSummary || "",
    },
  ];

  const translated = await translateContentItems(locale, translationItems);
  const translatedByKey = new Map(translated.map((item) => [item.cacheKey, item.displayText]));

  return {
    ...baseMember,
    sourceRoleTitle: baseMember.role_title,
    sourceCountryOfResidence: baseMember.country_of_residence,
    sourceProfessionalBio: baseMember.professional_bio,
    role_title:
      translatedByKey.get(`booking_member:${member.id}:role_title`) || baseMember.role_title,
    country_of_residence:
      translatedByKey.get(`booking_member:${member.id}:country_of_residence`) || baseMember.country_of_residence,
    professional_bio:
      translatedByKey.get(`booking_member:${member.id}:professional_bio`) || baseMember.professional_bio,
    profileSummary:
      translatedByKey.get(`booking_member:${member.id}:profile_summary`) || baseMember.profileSummary,
  };
}

function intervalsOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function shouldTreatSlotRowAsBlocked(slot) {
  return Boolean(slot?.booking_id || slot?.is_blocked || slot?.is_available === false);
}

export function normalizeBookingSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);
}

export function buildPublicBookingUrl(slug) {
  if (!slug) {
    return "";
  }

  return `${getSiteUrl()}/book/${slug}`;
}

export function normalizeBookingSettingsRecord(record = {}) {
  const normalized = {
    ...DEFAULT_BOOKING_SETTINGS,
    ...record,
  };

  return {
    ...normalized,
    available_days: sanitizeAvailabilityDays(normalized.available_days || DEFAULT_AVAILABLE_DAYS),
    public_booking_url: buildPublicBookingUrl(normalized.public_booking_url_slug || ""),
    confirmation_message: normalizeNullableText(normalized.confirmation_message),
    cancellation_policy: normalizeNullableText(normalized.cancellation_policy),
    writeback_ready: Boolean(normalized.writeback_ready),
    writeback_calendar_name: normalized.writeback_calendar_name || null,
  };
}

export function getDateKeyInTimeZone(date, timeZone = "UTC") {
  const parts = getDateTimeParts(date, timeZone, false);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function zonedDateTimeToUtc(dateKey, timeValue = "00:00", timeZone = "UTC") {
  const parsedDate = parseDateKey(dateKey);
  if (!parsedDate) {
    return null;
  }

  const [hours, minutes] = String(timeValue || "00:00")
    .split(":")
    .map((value) => Number(value));

  let utcGuess = new Date(
    Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, hours || 0, minutes || 0, 0, 0),
  );

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
    const corrected = new Date(
      Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, hours || 0, minutes || 0, 0, 0) -
        offsetMinutes * 60 * 1000,
    );

    if (corrected.getTime() === utcGuess.getTime()) {
      break;
    }

    utcGuess = corrected;
  }

  return utcGuess;
}

export function addDaysToDateKey(dateKey, days) {
  const parsedDate = createUtcDateFromKey(dateKey);
  if (!parsedDate) {
    return "";
  }

  parsedDate.setUTCDate(parsedDate.getUTCDate() + days);
  return formatUtcDateKey(parsedDate);
}

export function getMonthDateKeys(monthKey) {
  if (!MONTH_KEY_PATTERN.test(String(monthKey || ""))) {
    return [];
  }

  const [year, month] = monthKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const keys = [];

  for (let day = 1; day <= lastDay; day += 1) {
    keys.push(formatUtcDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

export async function ensureUniqueBookingSlug({
  baseSlug,
  memberId,
  supabase,
  excludeMemberId = null,
}) {
  let candidate = normalizeBookingSlug(baseSlug) || `member-${String(memberId || "").slice(0, 8)}`;
  let suffix = 2;

  while (true) {
    let query = supabase
      .from("booking_settings")
      .select("member_id")
      .eq("public_booking_url_slug", candidate)
      .limit(1);

    if (excludeMemberId) {
      query = query.neq("member_id", excludeMemberId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data || data.member_id === excludeMemberId) {
      return candidate;
    }

    candidate = `${normalizeBookingSlug(baseSlug) || `member-${String(memberId || "").slice(0, 8)}`}-${suffix}`;
    suffix += 1;
  }
}

export async function generateDefaultBookingSlug({ memberId, supabase }) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, surname")
    .eq("id", memberId)
    .maybeSingle();

  const baseSlug = normalizeBookingSlug(
    [profile?.first_name, profile?.surname].filter(Boolean).join("-"),
  ) || `member-${String(memberId || "").slice(0, 8)}`;

  return ensureUniqueBookingSlug({ baseSlug, memberId, supabase, excludeMemberId: memberId });
}

export async function ensureBookingSettingsForMember({
  memberId,
  supabase,
  enablePublicOnCreate = false,
  availableDays = DEFAULT_AVAILABLE_DAYS,
}) {
  const normalizedDays = sanitizeAvailabilityDays(availableDays);
  const { data: existing, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (existing) {
    const patch = {};

    if (!existing.public_booking_url_slug) {
      patch.public_booking_url_slug = await generateDefaultBookingSlug({ memberId, supabase });
    }

    if (JSON.stringify(existing.available_days || []) !== JSON.stringify(normalizedDays)) {
      patch.available_days = normalizedDays;
    }

    if (!Object.keys(patch).length) {
      return {
        settings: normalizeBookingSettingsRecord(existing),
        created: false,
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from("booking_settings")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("member_id", memberId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      settings: normalizeBookingSettingsRecord(updated),
      created: false,
    };
  }

  const slug = await generateDefaultBookingSlug({ memberId, supabase });
  const { data: created, error: insertError } = await supabase
    .from("booking_settings")
    .insert({
      member_id: memberId,
      public_booking_enabled: enablePublicOnCreate,
      public_booking_url_slug: slug,
      available_days: normalizedDays,
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    settings: normalizeBookingSettingsRecord(created),
    created: true,
  };
}

export async function buildBookingSettingsPayload({
  memberId,
  settings,
  supabase,
  existingSettings = null,
}) {
  const ensured = existingSettings
    ? {
        settings: normalizeBookingSettingsRecord(existingSettings),
        created: false,
      }
    : await ensureBookingSettingsForMember({
        memberId,
        supabase,
        enablePublicOnCreate: false,
      });

  const baseSlug =
    normalizeBookingSlug(settings.public_booking_url_slug) ||
    ensured.settings.public_booking_url_slug ||
    (await generateDefaultBookingSlug({ memberId, supabase }));

  const publicBookingUrlSlug = await ensureUniqueBookingSlug({
    baseSlug,
    memberId,
    supabase,
    excludeMemberId: memberId,
  });

  return {
    previousSlug: ensured.settings.public_booking_url_slug || "",
    payload: {
      member_id: memberId,
      public_booking_enabled: Boolean(settings.public_booking_enabled),
      public_booking_url_slug: publicBookingUrlSlug,
      default_meeting_duration: Number(settings.default_meeting_duration) || DEFAULT_BOOKING_SETTINGS.default_meeting_duration,
      minimum_notice_hours: Number(settings.minimum_notice_hours) || DEFAULT_BOOKING_SETTINGS.minimum_notice_hours,
      maximum_booking_days_ahead:
        Number(settings.maximum_booking_days_ahead) || DEFAULT_BOOKING_SETTINGS.maximum_booking_days_ahead,
      buffer_minutes_between_meetings:
        Number(settings.buffer_minutes_between_meetings) || DEFAULT_BOOKING_SETTINGS.buffer_minutes_between_meetings,
      timezone: String(settings.timezone || ensured.settings.timezone || DEFAULT_BOOKING_SETTINGS.timezone),
      available_days: sanitizeAvailabilityDays(settings.available_days || ensured.settings.available_days),
      confirmation_message: String(settings.confirmation_message || "").trim() || null,
      cancellation_policy: String(settings.cancellation_policy || "").trim() || null,
      updated_at: new Date().toISOString(),
    },
  };
}

export async function fetchPublicBookingPageData({ slug, supabase }) {
  const { data: settings, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("public_booking_url_slug", slug)
    .eq("public_booking_enabled", true)
    .maybeSingle();

  if (error || !settings) {
    return { settings: null, error };
  }

  const [{ data: member }, { data: cohortProfile }, { data: googleConnections }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, surname, title, role_title, organisation_name, country_of_residence, professional_bio")
      .eq("id", settings.member_id)
      .maybeSingle(),
    supabase
      .from("cohort_member_profiles")
      .select("headshot_url, raw_responses")
      .eq("user_id", settings.member_id)
      .maybeSingle(),
    supabase
      .from("calendar_connections")
      .select("id, provider, calendar_name, access_role, access_token, refresh_token, is_primary_calendar, is_active, sync_enabled")
      .eq("member_id", settings.member_id)
      .eq("provider", "google")
      .eq("is_active", true),
  ]);
  const writebackConnection = selectGoogleWritebackConnection(googleConnections || []);

  const headshotAsset = resolveHeadshotAsset(
    cohortProfile?.headshot_url,
    cohortProfile?.raw_responses,
  );
  const locale = await getRequestLocale();

  return {
    settings: {
      ...normalizeBookingSettingsRecord({
        ...settings,
        writeback_ready: Boolean(writebackConnection),
        writeback_calendar_name: writebackConnection?.calendar_name || null,
      }),
      member: member
        ? {
            ...(await translateBookingMemberForDisplay(member, locale)),
            headshotSrc: headshotAsset.display_url,
          }
        : null,
    },
    error: null,
  };
}

export async function fetchBookingAvailabilityContext({
  memberId,
  startDate,
  endDate,
  supabase,
}) {
  const { data: settingsRow } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  const settings = {
    ...DEFAULT_BOOKING_SETTINGS,
    ...(settingsRow || {}),
    available_days: sanitizeAvailabilityDays(settingsRow?.available_days || DEFAULT_AVAILABLE_DAYS),
  };

  const rangeStartUtc = zonedDateTimeToUtc(startDate, "00:00", settings.timezone) || new Date(`${startDate}T00:00:00.000Z`);
  const rangeEndUtc =
    zonedDateTimeToUtc(addDaysToDateKey(endDate, 1), "00:00", settings.timezone) ||
    new Date(`${endDate}T23:59:59.999Z`);

  const [rulesResult, bookingsResult, externalEventsResult, slotRowsResult] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("*")
      .eq("member_id", memberId)
      .in("rule_type", ["recurring", "exception"]),
    supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status")
      .eq("host_id", memberId)
      .in("status", ["confirmed", "pending"])
      .lt("starts_at", rangeEndUtc.toISOString())
      .gt("ends_at", rangeStartUtc.toISOString()),
    supabase
      .from("external_calendar_events")
      .select("id, starts_at, ends_at, status")
      .eq("member_id", memberId)
      .neq("status", "cancelled")
      .lt("starts_at", rangeEndUtc.toISOString())
      .gt("ends_at", rangeStartUtc.toISOString()),
    supabase
      .from("booking_slots")
      .select("id, slot_date, start_time, end_time, is_available, is_blocked, booking_id")
      .eq("member_id", memberId)
      .gte("slot_date", startDate)
      .lte("slot_date", endDate),
  ]);

  if (rulesResult.error) {
    throw rulesResult.error;
  }

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  if (externalEventsResult.error) {
    throw externalEventsResult.error;
  }

  if (slotRowsResult.error) {
    throw slotRowsResult.error;
  }

  return {
    memberId,
    settings,
    recurringRules: (rulesResult.data || []).filter((rule) => rule.rule_type === "recurring"),
    exceptionRules: (rulesResult.data || []).filter((rule) => rule.rule_type === "exception"),
    bookings: bookingsResult.data || [],
    externalEvents: externalEventsResult.data || [],
    slotRows: slotRowsResult.data || [],
  };
}

export function getAvailableSlotsForDate({ dateKey, context }) {
  const parsedDate = parseDateKey(dateKey);
  if (!parsedDate) {
    return [];
  }

  const {
    settings = DEFAULT_BOOKING_SETTINGS,
    recurringRules = [],
    exceptionRules = [],
    bookings = [],
    externalEvents = [],
    slotRows = [],
    memberId,
  } = context;

  const dayOfWeek = createUtcDateFromKey(dateKey)?.getUTCDay();
  const availableDays = sanitizeAvailabilityDays(settings.available_days);

  if (!availableDays.includes(dayOfWeek)) {
    return [];
  }

  const now = new Date();
  const minimumStart = new Date(now.getTime() + Number(settings.minimum_notice_hours || 0) * 60 * 60 * 1000);
  const maximumStart = new Date(
    now.getTime() + Number(settings.maximum_booking_days_ahead || DEFAULT_BOOKING_SETTINGS.maximum_booking_days_ahead) * 24 * 60 * 60 * 1000,
  );

  const recurringForDay = recurringRules.filter(
    (rule) => rule.day_of_week === dayOfWeek && !rule.is_blocked,
  );

  if (!recurringForDay.length) {
    return [];
  }

  const blockedIntervals = [
    ...bookings.map((booking) => ({
      start: new Date(booking.starts_at),
      end: new Date(booking.ends_at),
    })),
    ...externalEvents.map((event) => ({
      start: new Date(event.starts_at),
      end: new Date(event.ends_at),
    })),
    ...slotRows
      .filter((slot) => slot.slot_date === dateKey && shouldTreatSlotRowAsBlocked(slot))
      .map((slot) => ({
        start: zonedDateTimeToUtc(dateKey, slot.start_time, settings.timezone),
        end: zonedDateTimeToUtc(dateKey, slot.end_time, settings.timezone),
      })),
    ...exceptionRules
      .filter((rule) => {
        if (!rule.is_blocked) {
          return false;
        }

        if (rule.effective_from && rule.effective_from > dateKey) {
          return false;
        }

        if (rule.effective_until && rule.effective_until < dateKey) {
          return false;
        }

        return true;
      })
      .map((rule) => ({
        start: zonedDateTimeToUtc(dateKey, rule.start_time, settings.timezone),
        end: zonedDateTimeToUtc(dateKey, rule.end_time, settings.timezone),
      })),
  ].filter((interval) => interval.start && interval.end);

  const allSlots = [];
  const seenStarts = new Set();

  for (const rule of recurringForDay) {
    const timeSlots = generateTimeSlots(
      rule.start_time,
      rule.end_time,
      Number(settings.default_meeting_duration || DEFAULT_BOOKING_SETTINGS.default_meeting_duration),
      Number(settings.buffer_minutes_between_meetings || 0),
    );

    for (const timeSlot of timeSlots) {
      const slotStart = zonedDateTimeToUtc(dateKey, timeSlot.start, settings.timezone);
      const slotEnd = zonedDateTimeToUtc(dateKey, timeSlot.end, settings.timezone);

      if (!slotStart || !slotEnd) {
        continue;
      }

      if (slotStart < minimumStart || slotStart > maximumStart) {
        continue;
      }

      if (
        blockedIntervals.some((interval) =>
          intervalsOverlap(slotStart, slotEnd, interval.start, interval.end),
        )
      ) {
        continue;
      }

      if (seenStarts.has(timeSlot.start)) {
        continue;
      }

      seenStarts.add(timeSlot.start);
      allSlots.push({
        id: createSlotId(memberId, dateKey, timeSlot.start, timeSlot.end),
        member_id: memberId,
        slot_date: dateKey,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        timezone: settings.timezone,
        starts_at: slotStart.toISOString(),
        ends_at: slotEnd.toISOString(),
        is_available: true,
        is_blocked: false,
      });
    }
  }

  return allSlots.sort((left, right) => left.start_time.localeCompare(right.start_time));
}

export function getAvailableDateKeysForMonth({ monthKey, context }) {
  return getMonthDateKeys(monthKey).filter((dateKey) =>
    getAvailableSlotsForDate({ dateKey, context }).length > 0,
  );
}
