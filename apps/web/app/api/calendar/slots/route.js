import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const date = searchParams.get("date");

  if (!memberId || !date) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  // Fetch available slots for the date
  const { data: slots, error } = await supabase
    .from("booking_slots")
    .select("*")
    .eq("member_id", memberId)
    .eq("slot_date", date)
    .eq("is_available", true)
    .eq("is_blocked", false)
    .is("booking_id", null)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no slots exist yet, generate them from availability rules
  if (!slots || slots.length === 0) {
    // Fetch availability rules for this day of week
    const dayOfWeek = new Date(date).getDay();
    
    const { data: rules } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("member_id", memberId)
      .eq("rule_type", "recurring")
      .eq("day_of_week", dayOfWeek)
      .eq("is_blocked", false);

    // Fetch booking settings for duration
    const { data: settings } = await supabase
      .from("booking_settings")
      .select("default_meeting_duration, buffer_minutes_between_meetings, timezone")
      .eq("member_id", memberId)
      .single();

    const duration = settings?.default_meeting_duration || 30;
    const buffer = settings?.buffer_minutes_between_meetings || 0;
    const timezone = settings?.timezone || "UTC";

    // Generate slots from rules
    const generatedSlots = [];
    
    if (rules) {
      for (const rule of rules) {
        const startMinutes = timeToMinutes(rule.start_time);
        const endMinutes = timeToMinutes(rule.end_time);
        const slotLength = duration + buffer;

        for (
          let time = startMinutes;
          time + duration <= endMinutes;
          time += slotLength
        ) {
          generatedSlots.push({
            id: `temp-${date}-${time}`,
            member_id: memberId,
            slot_date: date,
            start_time: minutesToTime(time),
            end_time: minutesToTime(time + duration),
            timezone,
            is_available: true,
            is_blocked: false,
          });
        }
      }
    }

    return NextResponse.json(generatedSlots);
  }

  return NextResponse.json(slots);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
