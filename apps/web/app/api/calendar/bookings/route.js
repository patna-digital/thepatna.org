import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      slot_id,
      booker_name,
      booker_email,
      booker_organisation,
      booker_notes,
      title,
      starts_at,
      ends_at,
    } = body;

    if (!booker_name || !booker_email || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Get the slot to find the member_id
    const { data: slot, error: slotError } = await supabase
      .from("booking_slots")
      .select("member_id, slot_date, start_time, end_time")
      .eq("id", slot_id)
      .single();

    let memberId;
    let slotDate;
    let startTime;
    let endTime;

    if (slotError || !slot) {
      // If slot doesn't exist, extract info from the temp slot_id
      // Format: temp-{date}-{time}
      const parts = slot_id.split("-");
      if (parts[0] === "temp") {
        slotDate = parts[1];
        const time = parseInt(parts[2]);
        memberId = body.member_id; // Need to pass member_id for temp slots
        startTime = minutesToTime(time);
        endTime = minutesToTime(time + 30); // Default 30 min
      }
    } else {
      memberId = slot.member_id;
      slotDate = slot.slot_date;
      startTime = slot.start_time;
      endTime = slot.end_time;
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Unable to determine host" },
        { status: 400 }
      );
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        host_id: memberId,
        booker_name,
        booker_email,
        booker_organisation: booker_organisation || null,
        booker_notes: booker_notes || null,
        title: title || `Meeting with ${booker_name}`,
        status: "confirmed",
        starts_at,
        ends_at,
        timezone: "UTC",
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    // Create or update the booking slot
    if (!slotError && slot) {
      // Update existing slot
      await supabase
        .from("booking_slots")
        .update({
          is_available: false,
          booking_id: booking.id,
        })
        .eq("id", slot_id);
    } else {
      // Create new slot entry
      await supabase.from("booking_slots").insert({
        member_id: memberId,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        timezone: "UTC",
        is_available: false,
        is_blocked: false,
        booking_id: booking.id,
      });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
