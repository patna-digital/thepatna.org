import { NextResponse } from "next/server";
import {
  fetchBookingAvailabilityContext,
  getAvailableDateKeysForMonth,
  getAvailableSlotsForDate,
  getMonthDateKeys,
} from "@/lib/calendar/booking";
import { selectGoogleWritebackConnection } from "@/lib/calendar/booking-writeback";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isValidDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isValidMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(String(value || ""));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 },
    );
  }

  if (!date && !month) {
    return NextResponse.json(
      { error: "Either date or month is required" },
      { status: 400 },
    );
  }

  if (date && !isValidDateKey(date)) {
    return NextResponse.json(
      { error: "date must use YYYY-MM-DD" },
      { status: 400 },
    );
  }

  if (month && !isValidMonthKey(month)) {
    return NextResponse.json(
      { error: "month must use YYYY-MM" },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: googleConnections } = await supabase
      .from("calendar_connections")
      .select("id, provider, access_role, access_token, refresh_token, is_primary_calendar, is_active, sync_enabled")
      .eq("member_id", memberId)
      .eq("provider", "google")
      .eq("is_active", true);
    const writebackReady = Boolean(selectGoogleWritebackConnection(googleConnections || []));

    if (date) {
      const context = await fetchBookingAvailabilityContext({
        memberId,
        startDate: date,
        endDate: date,
        supabase,
      });

      if (!context.settings.public_booking_enabled || !writebackReady) {
        return NextResponse.json([]);
      }

      return NextResponse.json(
        getAvailableSlotsForDate({ dateKey: date, context }),
      );
    }

    const monthKeys = getMonthDateKeys(month);
    const startDate = monthKeys[0];
    const endDate = monthKeys.at(-1);

    if (!startDate || !endDate) {
      return NextResponse.json({ availableDates: [] });
    }

    const context = await fetchBookingAvailabilityContext({
      memberId,
      startDate,
      endDate,
      supabase,
    });

    if (!context.settings.public_booking_enabled || !writebackReady) {
      return NextResponse.json({ availableDates: [] });
    }

    return NextResponse.json({
      availableDates: getAvailableDateKeysForMonth({ monthKey: month, context }),
    });
  } catch (error) {
    console.error("Calendar slots API error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to load booking slots" },
      { status: 500 },
    );
  }
}
