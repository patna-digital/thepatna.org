export async function syncMatchedBookingConferenceDetails({
  externalEvents = [],
  memberId,
  supabase,
}) {
  const externalEventIds = externalEvents
    .map((event) => event?.externalEventId)
    .filter(Boolean);

  if (!memberId || externalEventIds.length === 0) {
    return {
      updatedCount: 0,
      errors: [],
    };
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, host_calendar_event_id, location_type, location_details')
    .eq('host_id', memberId)
    .in('host_calendar_event_id', externalEventIds);

  if (error) {
    return {
      updatedCount: 0,
      errors: [error.message],
    };
  }

  const externalEventMap = new Map(
    externalEvents.map((event) => [event.externalEventId, event]),
  );
  const errors = [];
  let updatedCount = 0;

  for (const booking of bookings || []) {
    const matchedEvent = externalEventMap.get(booking.host_calendar_event_id);

    if (!matchedEvent) {
      continue;
    }

    const nextLocationDetails = matchedEvent.conferenceUrl || null;
    const nextLocationType = matchedEvent.conferenceUrl ? 'video' : null;
    const patch = {
      location_type: nextLocationType,
      location_details: nextLocationDetails,
      updated_at: new Date().toISOString(),
    };
    const locationTypeUnchanged = nextLocationType === (booking.location_type || null);
    const locationDetailsUnchanged = nextLocationDetails === (booking.location_details || null);

    if (locationTypeUnchanged && locationDetailsUnchanged) {
      continue;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(patch)
      .eq('id', booking.id);

    if (updateError) {
      errors.push(updateError.message);
      continue;
    }

    updatedCount += 1;
  }

  return {
    updatedCount,
    errors,
  };
}
