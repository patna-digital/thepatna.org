"use server";

import { revalidatePath } from "next/cache";
import {
  buildBookingSettingsPayload,
  ensureBookingSettingsForMember,
  normalizeBookingSettingsRecord,
} from "@/lib/calendar/booking";
import {
  MEMBER_CALENDAR_ITEM_SELECT,
  normaliseMemberCalendarItemType,
  transformMemberCalendarItems,
} from "@/lib/member-calendar-items";
import {
  isKnownReadOnlyGoogleCalendar,
  isUnknownGoogleCalendarAccess,
} from "@/lib/calendar/google-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";

function combineDateAndTime(dateKey, timeValue, { endOfDay = false } = {}) {
  const normalizedDate = String(dateKey || "").trim();
  const normalizedTime = String(timeValue || "").trim();

  if (!normalizedDate) {
    return null;
  }

  if (!normalizedTime) {
    return endOfDay
      ? new Date(`${normalizedDate}T23:59:59.000Z`).toISOString()
      : new Date(`${normalizedDate}T00:00:00.000Z`).toISOString();
  }

  return new Date(`${normalizedDate}T${normalizedTime}:00.000Z`).toISOString();
}

/**
 * Create a new calendar connection
 * @param {FormData} formData
 */
export async function createCalendarConnection(formData) {
  const memberId = formData.get("member_id");
  const provider = formData.get("provider");
  const calendarName = formData.get("calendar_name");
  const providerAccountEmail = formData.get("provider_account_email");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .insert({
      member_id: memberId,
      provider,
      calendar_name: calendarName,
      provider_account_email: providerAccountEmail,
      is_active: true,
      sync_enabled: true,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar/settings");
  return { success: true, connection: data };
}

/**
 * Disconnect a calendar connection
 * @param {string} connectionId
 */
export async function disconnectCalendar(connectionId) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("calendar_connections")
    .update({ is_active: false, sync_enabled: false })
    .eq("id", connectionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar/settings");
  return { success: true };
}

/**
 * Toggle sync for a calendar connection
 * @param {string} connectionId
 * @param {boolean} enabled
 */
export async function toggleCalendarSync(connectionId, enabled) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("calendar_connections")
    .update({ sync_enabled: enabled })
    .eq("id", connectionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar/settings");
  return { success: true };
}

export async function setPrimaryCalendarConnection(memberId, connectionId) {
  const supabase = createSupabaseAdminClient();

  const { data: targetConnection, error: targetError } = await supabase
    .from("calendar_connections")
    .select("id, member_id, provider, access_role, access_token, refresh_token, is_active, sync_enabled")
    .eq("id", connectionId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (targetError) {
    return { success: false, error: targetError.message };
  }

  if (!targetConnection || targetConnection.provider !== "google") {
    return { success: false, error: "Please choose a connected Google calendar." };
  }

  if (!targetConnection.is_active || !targetConnection.sync_enabled) {
    return { success: false, error: "Only active Google calendars with sync enabled can receive bookings." };
  }

  if (!targetConnection.access_token || !targetConnection.refresh_token) {
    return { success: false, error: "Reconnect this Google calendar before using it for PATNA bookings." };
  }

  if (isKnownReadOnlyGoogleCalendar(targetConnection)) {
    return {
      success: false,
      error: "Choose a writable Google calendar. Read-only or subscribed calendars cannot receive PATNA bookings.",
    };
  }

  if (isUnknownGoogleCalendarAccess(targetConnection)) {
    return {
      success: false,
      error: "PATNA could not confirm write access for this Google calendar yet. Sync or reconnect Google before using it for bookings.",
    };
  }

  const { error: clearError } = await supabase
    .from("calendar_connections")
    .update({
      is_primary_calendar: false,
      updated_at: new Date().toISOString(),
    })
    .eq("member_id", memberId)
    .eq("provider", "google");

  if (clearError) {
    return { success: false, error: clearError.message };
  }

  const { data: updatedConnection, error: updateError } = await supabase
    .from("calendar_connections")
    .update({
      is_primary_calendar: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .select("*")
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { data: bookingSettings } = await supabase
    .from("booking_settings")
    .select("public_booking_url_slug")
    .eq("member_id", memberId)
    .maybeSingle();

  revalidatePath("/app/calendar/settings");
  revalidatePath("/app/profile");
  if (bookingSettings?.public_booking_url_slug) {
    revalidatePath(`/book/${bookingSettings.public_booking_url_slug}`);
  }

  return {
    success: true,
    connection: updatedConnection,
  };
}

export async function setEventRsvp(eventId) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    return { success: false, error: "Please sign in again to RSVP." };
  }

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status: "going",
      },
      { onConflict: "event_id,user_id", ignoreDuplicates: true },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar");
  revalidatePath("/app/events");
  return { success: true };
}

export async function createMemberCalendarItemAction(formData) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    return { success: false, error: "Please sign in again to save this calendar item." };
  }

  const itemType = normaliseMemberCalendarItemType(formData.get("item_type"));
  const dateKey = String(formData.get("date_key") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const meetingUrl = String(formData.get("meeting_url") || "").trim();
  const isAllDay = String(formData.get("is_all_day") || "") === "true";
  const defaultStartTime = itemType === "meeting" ? "10:00" : "09:00";
  const defaultEndTime = itemType === "meeting" ? "10:30" : "09:30";
  const startsAt = combineDateAndTime(
    dateKey,
    isAllDay ? "" : String(formData.get("start_time") || "").trim() || defaultStartTime,
  );
  const endsAt = combineDateAndTime(
    dateKey,
    isAllDay ? "" : String(formData.get("end_time") || "").trim() || defaultEndTime,
    { endOfDay: isAllDay },
  );

  if (!title || !dateKey || !startsAt || !endsAt) {
    return { success: false, error: "Title and date are required to save this item." };
  }

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { success: false, error: "End time must be after the start time." };
  }

  const { data, error } = await supabase
    .from("member_calendar_items")
    .insert({
      member_id: user.id,
      item_type: itemType,
      title,
      notes: notes || null,
      starts_at: startsAt,
      ends_at: endsAt,
      is_all_day: isAllDay,
      location: location || null,
      meeting_url: meetingUrl || null,
    })
    .select(MEMBER_CALENDAR_ITEM_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Could not save this calendar item." };
  }

  revalidatePath("/app/calendar");

  return {
    success: true,
    item: transformMemberCalendarItems([data])[0],
  };
}

/**
 * Create or update availability rules
 * @param {string} memberId
 * @param {Array} rules
 */
export async function updateAvailabilityRules(memberId, rules) {
  const supabase = createSupabaseAdminClient();

  // Delete existing rules
  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("member_id", memberId)
    .eq("rule_type", "recurring");

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Insert new rules
  if (rules.length > 0) {
    const rulesWithMember = rules.map((rule) => ({
      ...rule,
      member_id: memberId,
      rule_type: "recurring",
    }));

    const { error: insertError } = await supabase
      .from("availability_rules")
      .insert(rulesWithMember);

    if (insertError) {
      return { success: false, error: insertError.message };
    }
  }

  try {
    const activeDays = [...new Set(rules.map((rule) => Number(rule.day_of_week)).filter((value) => Number.isInteger(value)))];
    const { settings, created } = await ensureBookingSettingsForMember({
      memberId,
      supabase,
      enablePublicOnCreate: true,
      availableDays: activeDays,
    });

    revalidatePath("/app/calendar/availability");
    revalidatePath("/app/calendar/settings");
    revalidatePath("/app/profile");
    revalidatePath("/app/members");
    if (settings?.public_booking_url_slug) {
      revalidatePath(`/book/${settings.public_booking_url_slug}`);
    }

    return {
      success: true,
      bookingSettingsCreated: created,
      publicBookingEnabled: Boolean(settings?.public_booking_enabled),
      publicBookingUrl: settings?.public_booking_url || "",
      settings,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }

}

/**
 * Add an availability exception (block time)
 * @param {Object} exception
 */
export async function addAvailabilityException(exception) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .insert({
      ...exception,
      rule_type: "exception",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar/availability");
  return { success: true, exception: data };
}

/**
 * Remove an availability exception
 * @param {string} exceptionId
 */
export async function removeAvailabilityException(exceptionId) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", exceptionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar/availability");
  return { success: true };
}

/**
 * Update booking settings
 * @param {string} memberId
 * @param {Object} settings
 */
export async function updateBookingSettings(memberId, settings) {
  const supabase = createSupabaseAdminClient();

  const { data: existingSettings, error: existingSettingsError } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (existingSettingsError && existingSettingsError.code !== "PGRST116") {
    return { success: false, error: existingSettingsError.message };
  }

  try {
    const { payload, previousSlug } = await buildBookingSettingsPayload({
      memberId,
      settings,
      supabase,
      existingSettings,
    });

    const { data, error } = await supabase
      .from("booking_settings")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/app/calendar/settings");
    revalidatePath("/app/profile");
    revalidatePath("/app/members");
    if (previousSlug) {
      revalidatePath(`/book/${previousSlug}`);
    }
    if (data?.public_booking_url_slug) {
      revalidatePath(`/book/${data.public_booking_url_slug}`);
    }

    return {
      success: true,
      settings: normalizeBookingSettingsRecord(data || {}),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate booking slots for a date range
 * @param {string} memberId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Object} options
 */
export async function generateBookingSlots(memberId, startDate, endDate, options = {}) {
  const supabase = createSupabaseAdminClient();

  // Fetch member's availability rules
  const { data: rules, error: rulesError } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("member_id", memberId)
    .eq("rule_type", "recurring");

  if (rulesError) {
    return { success: false, error: rulesError.message };
  }

  // Fetch booking settings
  const { data: settings, error: settingsError } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("member_id", memberId)
    .single();

  if (settingsError && settingsError.code !== "PGRST116") {
    return { success: false, error: settingsError.message };
  }

  const duration = options.duration || settings?.default_meeting_duration || 30;
  const buffer = options.buffer || settings?.buffer_minutes_between_meetings || 10;
  const timezone = settings?.timezone || "UTC";

  // Generate slots for each day
  const start = new Date(startDate);
  const end = new Date(endDate);
  const slots = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateStr = d.toISOString().split("T")[0];

    // Find rules for this day
    const dayRules = rules.filter(
      (rule) => rule.day_of_week === dayOfWeek && !rule.is_blocked
    );

    for (const rule of dayRules) {
      // Generate time slots
      const startMinutes = timeToMinutes(rule.start_time);
      const endMinutes = timeToMinutes(rule.end_time);
      const slotLength = duration + buffer;

      for (
        let time = startMinutes;
        time + duration <= endMinutes;
        time += slotLength
      ) {
        slots.push({
          member_id: memberId,
          slot_date: dateStr,
          start_time: minutesToTime(time),
          end_time: minutesToTime(time + duration),
          timezone,
          is_available: true,
          is_blocked: false,
        });
      }
    }
  }

  // Insert slots (skip duplicates)
  if (slots.length > 0) {
    const { error: insertError } = await supabase
      .from("booking_slots")
      .upsert(slots, {
        onConflict: "member_id,slot_date,start_time",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }
  }

  return { success: true, generatedCount: slots.length };
}

/**
 * Block a booking slot
 * @param {string} slotId
 * @param {string} reason
 */
export async function blockBookingSlot(slotId, reason) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("booking_slots")
    .update({ is_blocked: true, block_reason: reason })
    .eq("id", slotId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar");
  return { success: true };
}

/**
 * Unblock a booking slot
 * @param {string} slotId
 */
export async function unblockBookingSlot(slotId) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("booking_slots")
    .update({ is_blocked: false, block_reason: null })
    .eq("id", slotId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/calendar");
  return { success: true };
}

// Helper functions
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
