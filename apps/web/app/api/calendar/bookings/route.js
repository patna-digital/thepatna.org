import { NextResponse } from "next/server";
import {
  fetchBookingAvailabilityContext,
  getAvailableSlotsForDate,
} from "@/lib/calendar/booking";
import {
  buildGoogleBookingDescription,
  BookingConfigurationError,
  persistBookingWithGoogleWriteback,
  selectGoogleWritebackConnection,
} from "@/lib/calendar/booking-writeback";
import {
  isValidEmailAddress,
  normalizeEmailAddress,
  normalizeGuestEmailsInput,
} from "@/lib/calendar/booking-attendees";
import {
  BOOKING_DESTINATION_CONFIGURATION_MESSAGE,
  isGoogleCalendarPermissionError,
  refreshGoogleCalendarConnectionMetadata,
} from "@/lib/calendar/google-connection-metadata.js";
import { createGoogleEvent, deleteGoogleEvent } from "@/lib/calendar/providers";
import { normalizeError } from "@/lib/error-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function logWritebackResult({
  connectionId,
  errorMessage = null,
  eventsCreated = 0,
  status,
}) {
  if (!connectionId) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  await supabase.from("calendar_sync_logs").insert({
    connection_id: connectionId,
    sync_type: "booking_writeback",
    status,
    events_processed: 1,
    events_created: eventsCreated,
    events_updated: 0,
    events_deleted: 0,
    error_message: errorMessage,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
}

export async function POST(request) {
  let memberId = null;
  let supabase = null;
  let providerAccessToken = null;
  let providerRefreshToken = null;
  let writebackConnection = null;

  try {
    const body = await request.json();
    const {
      slot_id,
      member_id,
      slot_date,
      start_time,
      end_time,
      title,
      booker_name,
      booker_email,
      guest_emails,
      booker_organisation,
      booker_notes,
    } = body;
    memberId = member_id;

    if (!member_id || !slot_date || !start_time || !end_time || !booker_name || !booker_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const normalizedBookerName = String(booker_name || "").trim();
    const normalizedBookerEmail = normalizeEmailAddress(booker_email);
    const normalizedBookerOrganisation = String(booker_organisation || "").trim();
    const normalizedBookerNotes = String(booker_notes || "").trim();
    const { guestEmails, invalidEmails } = normalizeGuestEmailsInput(guest_emails, {
      primaryEmail: normalizedBookerEmail,
    });

    if (!normalizedBookerName || !isValidEmailAddress(normalizedBookerEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid name and email address." },
        { status: 400 },
      );
    }

    if (invalidEmails.length) {
      return NextResponse.json(
        {
          error:
            invalidEmails.length === 1
              ? `Invalid guest email: ${invalidEmails[0]}`
              : `Invalid guest emails: ${invalidEmails.join(", ")}`,
        },
        { status: 400 },
      );
    }

    supabase = createSupabaseAdminClient();
    const context = await fetchBookingAvailabilityContext({
      memberId: member_id,
      startDate: slot_date,
      endDate: slot_date,
      supabase,
    });

    if (!context.settings.public_booking_enabled) {
      return NextResponse.json(
        { error: "Public booking is not enabled for this member." },
        { status: 403 },
      );
    }

    const availableSlot = getAvailableSlotsForDate({
      dateKey: slot_date,
      context,
    }).find((slot) => {
      if (slot_id && slot.id === slot_id) {
        return true;
      }

      return slot.start_time === start_time && slot.end_time === end_time;
    });

    if (!availableSlot) {
      return NextResponse.json(
        { error: "That time is no longer available. Please choose another slot." },
        { status: 409 },
      );
    }

    const { data: googleConnections } = await supabase
      .from("calendar_connections")
      .select("id, provider, calendar_id, calendar_name, access_role, access_token, refresh_token, token_expires_at, is_primary_calendar, is_active, sync_enabled")
      .eq("member_id", member_id)
      .eq("provider", "google")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    writebackConnection = selectGoogleWritebackConnection(googleConnections || []);
    providerAccessToken = writebackConnection?.access_token || null;
    providerRefreshToken = writebackConnection?.refresh_token || null;

    if (!writebackConnection) {
      throw new BookingConfigurationError(BOOKING_DESTINATION_CONFIGURATION_MESSAGE);
    }

    const bookingInsertPayload = {
      host_id: member_id,
      booker_name: normalizedBookerName,
      booker_email: normalizedBookerEmail,
      guest_emails: guestEmails,
      booker_organisation: normalizedBookerOrganisation || null,
      booker_notes: normalizedBookerNotes || null,
      title: title || `Meeting with ${normalizedBookerName}`,
      status: "confirmed",
      starts_at: availableSlot.starts_at,
      ends_at: availableSlot.ends_at,
      timezone: context.settings.timezone,
    };

    const slotInsertPayload = {
      member_id: member_id,
      slot_date,
      start_time: availableSlot.start_time,
      end_time: availableSlot.end_time,
      timezone: context.settings.timezone,
      is_available: false,
      is_blocked: false,
    };

    const googleEventPayload = {
      title: bookingInsertPayload.title,
      description: buildGoogleBookingDescription({
        bookerName: normalizedBookerName,
        bookerEmail: normalizedBookerEmail,
        bookerOrganisation: normalizedBookerOrganisation,
        guestEmails,
        notes: normalizedBookerNotes,
      }),
      startsAt: availableSlot.starts_at,
      endsAt: availableSlot.ends_at,
      timezone: context.settings.timezone,
      attendees: [
        {
          email: normalizedBookerEmail,
          displayName: normalizedBookerName,
        },
        ...guestEmails.map((email) => ({ email })),
      ],
      createConference: true,
      sendUpdates: "all",
    };

    const { booking, writeback } = await persistBookingWithGoogleWriteback({
      writebackConnection,
      bookingInsertPayload,
      slotInsertPayload,
      googleEventPayload,
      logWritebackResult,
      bookingInsert: async (payload) => {
        const { data, error } = await supabase
          .from("bookings")
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      },
      bookingUpdate: async (bookingId, payload) => {
        const { data, error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", bookingId)
          .select("*")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      },
      bookingDelete: async (bookingId) => {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId);

        if (error) {
          throw new Error(error.message);
        }
      },
      slotInsert: async (payload) => {
        const { error } = await supabase
          .from("booking_slots")
          .insert(payload);

        if (error) {
          throw new Error(error.message);
        }
      },
      createProviderEvent: async () => {
        let createdEvent;

        try {
          createdEvent = await createGoogleEvent(
            providerAccessToken,
            writebackConnection.calendar_id || "primary",
            googleEventPayload,
            providerRefreshToken,
          );
        } catch (providerError) {
          if (isGoogleCalendarPermissionError(providerError)) {
            try {
              await refreshGoogleCalendarConnectionMetadata({
                accessToken: providerAccessToken,
                refreshToken: providerRefreshToken,
                memberId,
                supabase,
              });
            } catch (refreshError) {
              console.error(
                "Failed to refresh Google calendar metadata after booking permission error:",
                normalizeError(refreshError),
              );
            }

            throw new BookingConfigurationError(BOOKING_DESTINATION_CONFIGURATION_MESSAGE);
          }

          throw providerError;
        }

        if (createdEvent.newTokens) {
          providerAccessToken = createdEvent.newTokens.accessToken;
          providerRefreshToken = createdEvent.newTokens.refreshToken;
          await supabase
            .from("calendar_connections")
            .update({
              access_token: createdEvent.newTokens.accessToken,
              refresh_token: createdEvent.newTokens.refreshToken,
              token_expires_at: createdEvent.newTokens.expiresAt?.toISOString() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", writebackConnection.id);
        }

        return createdEvent;
      },
      deleteProviderEvent: async (eventId) => {
        await deleteGoogleEvent(
          providerAccessToken,
          writebackConnection.calendar_id || "primary",
          eventId,
          providerRefreshToken,
        );
      },
    });

    return NextResponse.json(
      {
        booking,
        writeback,
      },
      { status: 201 },
    );
  } catch (error) {
    let responseError = error;

    if (!(error instanceof BookingConfigurationError) && isGoogleCalendarPermissionError(error)) {
      if (supabase && memberId && providerAccessToken) {
        try {
          await refreshGoogleCalendarConnectionMetadata({
            accessToken: providerAccessToken,
            refreshToken: providerRefreshToken,
            memberId,
            supabase,
          });
        } catch (refreshError) {
          console.error(
            "Failed to refresh Google calendar metadata after booking permission error:",
            normalizeError(refreshError),
          );
        }
      }

      responseError = new BookingConfigurationError(BOOKING_DESTINATION_CONFIGURATION_MESSAGE);
    }

    console.error("Calendar bookings API error:", normalizeError(error));

    return NextResponse.json(
      { error: responseError.message || "Internal server error" },
      { status: responseError.status || 500 },
    );
  }
}
