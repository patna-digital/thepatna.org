import { normalizeError } from "../error-utils.js";
import { fetchGoogleCalendars } from "./providers/google.js";

export const BOOKING_DESTINATION_CONFIGURATION_MESSAGE =
  "Bookings are temporarily unavailable while the host finishes configuring a writable Google Calendar booking destination.";

function normalizeGoogleCalendarId(value) {
  return String(value || "").trim();
}

export function buildGoogleCalendarMetadataPatches({
  calendars = [],
  connections = [],
  updatedAt = new Date().toISOString(),
}) {
  const calendarsById = new Map(
    calendars
      .map((calendar) => [normalizeGoogleCalendarId(calendar?.id), calendar])
      .filter(([calendarId]) => Boolean(calendarId)),
  );

  return connections.flatMap((connection) => {
    const calendarId = normalizeGoogleCalendarId(connection?.calendar_id);

    if (!calendarId || !calendarsById.has(calendarId)) {
      return [];
    }

    const calendar = calendarsById.get(calendarId);
    const nextCalendarName = calendar?.name || connection?.calendar_name || "Google Calendar";
    const nextAccessRole = calendar?.accessRole || (calendar?.primary ? "owner" : null);

    if (
      connection?.calendar_name === nextCalendarName &&
      (connection?.access_role || null) === (nextAccessRole || null)
    ) {
      return [];
    }

    return [
      {
        id: connection.id,
        calendar_name: nextCalendarName,
        access_role: nextAccessRole,
        updated_at: updatedAt,
      },
    ];
  });
}

export function isGoogleCalendarPermissionError(error) {
  const normalized = normalizeError(error);
  const status = Number(normalized.status || normalized.statusCode || normalized.code || 0);
  const message = [normalized.message, normalized.details, normalized.hint]
    .filter(Boolean)
    .join(" ");

  return (
    /writer access to this calendar/i.test(message) ||
    (status === 403 && /insufficient permissions|forbidden|not have .*access|access denied/i.test(message))
  );
}

export async function refreshGoogleCalendarConnectionMetadata({
  accessToken,
  refreshToken,
  memberId,
  supabase,
}) {
  if (!memberId || !supabase || !accessToken) {
    return {
      accessToken,
      refreshToken,
      calendars: [],
      updatedCount: 0,
    };
  }

  const calendarList = await fetchGoogleCalendars(accessToken, refreshToken);
  const refreshedTokens = calendarList?.newTokens || null;
  const nextAccessToken = calendarList?.newTokens?.accessToken || accessToken;
  const nextRefreshToken = calendarList?.newTokens?.refreshToken || refreshToken;
  const calendars = calendarList?.calendars || [];
  const updatedAt = new Date().toISOString();

  if (!calendars.length) {
    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      calendars,
      updatedCount: 0,
      newTokens: refreshedTokens,
    };
  }

  const calendarIds = calendars
    .map((calendar) => normalizeGoogleCalendarId(calendar?.id))
    .filter(Boolean);

  const { data: connections, error } = await supabase
    .from("calendar_connections")
    .select("id, calendar_id, calendar_name, access_role")
    .eq("member_id", memberId)
    .eq("provider", "google")
    .in("calendar_id", calendarIds);

  if (error) {
    throw new Error(error.message);
  }

  const patches = buildGoogleCalendarMetadataPatches({
    calendars,
    connections: connections || [],
    updatedAt,
  });
  const metadataPatchesById = new Map(patches.map((patch) => [patch.id, patch]));

  const connectionPatches = (connections || []).flatMap((connection) => {
    const metadataPatch = metadataPatchesById.get(connection.id);

    if (!metadataPatch && !refreshedTokens) {
      return [];
    }

    return [
      {
        id: connection.id,
        ...(metadataPatch
          ? {
              calendar_name: metadataPatch.calendar_name,
              access_role: metadataPatch.access_role,
            }
          : {}),
        ...(refreshedTokens
          ? {
              access_token: refreshedTokens.accessToken,
              refresh_token: refreshedTokens.refreshToken,
              token_expires_at: refreshedTokens.expiresAt?.toISOString() || null,
            }
          : {}),
        updated_at: updatedAt,
      },
    ];
  });

  if (connectionPatches.length > 0) {
    await Promise.all(
      connectionPatches.map(async (patch) => {
        const { error: updateError } = await supabase
          .from("calendar_connections")
          .update({
            ...(patch.calendar_name !== undefined ? { calendar_name: patch.calendar_name } : {}),
            ...(patch.access_role !== undefined ? { access_role: patch.access_role } : {}),
            ...(patch.access_token !== undefined ? { access_token: patch.access_token } : {}),
            ...(patch.refresh_token !== undefined ? { refresh_token: patch.refresh_token } : {}),
            ...(patch.token_expires_at !== undefined
              ? { token_expires_at: patch.token_expires_at }
              : {}),
            updated_at: patch.updated_at,
          })
          .eq("id", patch.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }),
    );
  }

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    calendars,
    updatedCount: connectionPatches.length,
    newTokens: refreshedTokens,
  };
}
