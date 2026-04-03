export class BookingConfigurationError extends Error {
  constructor(message, status = 412) {
    super(message);
    this.name = "BookingConfigurationError";
    this.status = status;
  }
}

export class BookingWritebackError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "BookingWritebackError";
    this.status = status;
  }
}

function hasWritebackTokens(connection) {
  return Boolean(connection?.access_token) && Boolean(connection?.refresh_token);
}

export function selectGoogleWritebackConnection(connections = []) {
  return connections.find((connection) =>
    connection?.provider === "google" &&
    connection?.is_primary_calendar &&
    connection?.is_active !== false &&
    connection?.sync_enabled !== false &&
    hasWritebackTokens(connection),
  ) || null;
}

export function buildGoogleBookingDescription({
  bookerName,
  bookerEmail,
  bookerOrganisation,
  notes,
}) {
  const sections = [
    "Booked via PATNA",
    `Booked by: ${bookerName}`,
    `Email: ${bookerEmail}`,
  ];

  if (bookerOrganisation) {
    sections.push(`Organisation: ${bookerOrganisation}`);
  }

  if (notes) {
    sections.push(`Notes: ${notes}`);
  }

  return sections.join("\n");
}

export function buildBookingConferencePatch(event = {}) {
  return {
    location_type: "video",
    location_details: event.conferenceUrl || null,
  };
}

export async function persistBookingWithGoogleWriteback({
  bookingInsert,
  bookingDelete,
  bookingUpdate,
  createProviderEvent,
  deleteProviderEvent,
  googleEventPayload,
  logWritebackResult,
  slotInsert,
  slotInsertPayload,
  writebackConnection,
  bookingInsertPayload,
}) {
  const provisionalBooking = await bookingInsert(bookingInsertPayload);
  let createdEvent = null;

  try {
    createdEvent = await createProviderEvent();

    if (!createdEvent?.conferenceUrl) {
      throw new BookingWritebackError(
        "Google Meet could not be created for this booking. Please try again.",
      );
    }

    const bookingPatch = {
      host_calendar_event_id: createdEvent.id,
      ...buildBookingConferencePatch(createdEvent),
    };

    const booking = await bookingUpdate(provisionalBooking.id, bookingPatch);

    await slotInsert({
      ...slotInsertPayload,
      booking_id: provisionalBooking.id,
      source_calendar_id: writebackConnection.id,
    });

    try {
      await logWritebackResult({
        connectionId: writebackConnection.id,
        eventsCreated: 1,
        status: "success",
      });
    } catch (error) {
      console.error("Failed to log Google booking write-back success:", error);
    }

    return {
      booking,
      writeback: {
        provider: "google",
        success: true,
        error: null,
        conferenceUrl: createdEvent.conferenceUrl,
        conferenceProvider: createdEvent.conferenceProvider,
      },
    };
  } catch (error) {
    if (createdEvent?.id) {
      try {
        await deleteProviderEvent(createdEvent.id);
      } catch (cleanupError) {
        console.error("Failed to clean up Google event after booking failure:", cleanupError);
      }
    }

    try {
      await bookingDelete(provisionalBooking.id);
    } catch (cleanupError) {
      console.error("Failed to roll back provisional PATNA booking:", cleanupError);
    }

    try {
      await logWritebackResult({
        connectionId: writebackConnection.id,
        errorMessage: error.message,
        status: "failed",
      });
    } catch (logError) {
      console.error("Failed to log Google booking write-back failure:", logError);
    }

    if (error instanceof BookingWritebackError) {
      throw error;
    }

    throw new BookingWritebackError(
      error?.message || "Google Calendar write-back failed.",
    );
  }
}
