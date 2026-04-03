/**
 * Google Calendar Provider
 * Handles Google Calendar API operations including fetching events and calendars
 */

import { randomUUID } from "node:crypto";
import { google } from 'googleapis';
import { extractGoogleConferenceDetails } from "../conference.js";
import { refreshAccessToken } from './config.js';
import { normalizeAllDayDateRange } from '../date-helpers.mjs';

// Get Google OAuth2 client
export function getGoogleAuthClient(accessToken, refreshToken = null) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

// Get Google Calendar API client
export function getGoogleCalendarClient(accessToken, refreshToken = null) {
  const auth = getGoogleAuthClient(accessToken, refreshToken);
  return google.calendar({ version: 'v3', auth });
}

// Fetch user's calendar list
function mapCalendarList(items) {
  return items.map((cal) => ({
    id: cal.id,
    name: cal.summary,
    description: cal.description || null,
    timezone: cal.timeZone || 'UTC',
    primary: cal.primary || false,
    accessRole: cal.accessRole,
    backgroundColor: cal.backgroundColor,
    foregroundColor: cal.foregroundColor,
    selected: cal.selected || false,
  }));
}

export function mapGoogleEvent(event, calendarId) {
  const isAllDay = !event.start?.dateTime;
  let startsAt = event.start?.dateTime || event.start?.date;
  let endsAt = event.end?.dateTime || event.end?.date;

  if (isAllDay) {
    const normalizedRange = normalizeAllDayDateRange(startsAt, endsAt);
    startsAt = normalizedRange.startsAt;
    endsAt = normalizedRange.endsAt;
  }

  const conferenceDetails = extractGoogleConferenceDetails(event);

  return {
    externalEventId: event.id,
    externalCalendarId: calendarId,
    title: event.summary || '(No title)',
    description: event.description || null,
    location: event.location || null,
    startsAt,
    endsAt,
    timezone: event.start?.timeZone || event.end?.timeZone || 'UTC',
    isAllDay,
    recurrenceRule: event.recurrence?.[0] || null,
    recurringEventId: event.recurringEventId || null,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      name: a.displayName,
      responseStatus: a.responseStatus,
      optional: a.optional || false,
    })) || [],
    organizer: event.organizer
      ? {
          email: event.organizer.email,
          name: event.organizer.displayName,
          self: event.organizer.self || false,
        }
      : null,
    status: event.status || 'confirmed',
    visibility: event.visibility || 'default',
    externalCreatedAt: event.created,
    externalUpdatedAt: event.updated,
    conferenceUrl: conferenceDetails.conferenceUrl,
    conferenceProvider: conferenceDetails.conferenceProvider,
    conferenceData: conferenceDetails.conferenceData,
  };
}

export function buildGoogleEventRequestBody(event, conferenceRequestId = randomUUID()) {
  const requestBody = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    attendees: event.attendees?.length ? event.attendees : undefined,
    start: event.isAllDay
      ? { date: event.startDate }
      : {
          dateTime: event.startsAt,
          timeZone: event.timezone || 'UTC',
        },
    end: event.isAllDay
      ? { date: event.endDate }
      : {
          dateTime: event.endsAt,
          timeZone: event.timezone || 'UTC',
        },
  };

  if (!event.isAllDay && event.createConference !== false) {
    requestBody.conferenceData = {
      createRequest: {
        conferenceSolutionKey: { type: 'hangoutsMeet' },
        requestId: conferenceRequestId,
      },
    };
  }

  return requestBody;
}

export async function fetchGoogleCalendars(accessToken, refreshToken = null) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);
    const response = await calendar.calendarList.list();

    return { calendars: mapCalendarList(response.data.items || []) };
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      // Token expired, try to refresh
      const newTokens = await refreshAccessToken('google', refreshToken);
      const calendar = getGoogleCalendarClient(newTokens.accessToken, refreshToken);
      const response = await calendar.calendarList.list();

      return {
        calendars: mapCalendarList(response.data.items || []),
        newTokens,
      };
    }
    throw error;
  }
}

// Fetch events from a specific calendar
export async function fetchGoogleEvents(
  accessToken,
  calendarId = 'primary',
  options = {},
  refreshToken = null
) {
  const {
    timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ahead
    maxResults = 2500,
    syncToken = null,
    showDeleted = false,
  } = options;

  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);
    
    const params = {
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
      showDeleted,
    };

    if (syncToken) {
      params.syncToken = syncToken;
      delete params.timeMin;
      delete params.timeMax;
    }

    const response = await calendar.events.list(params);

    const events = (response.data.items || []).map((event) => mapGoogleEvent(event, calendarId));

    return {
      events,
      nextSyncToken: response.data.nextSyncToken,
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      // Token expired, try to refresh and retry
      const newTokens = await refreshAccessToken('google', refreshToken);
      const result = await fetchGoogleEvents(
        newTokens.accessToken,
        calendarId,
        options,
        refreshToken
      );
      return {
        ...result,
        newTokens,
      };
    }
    throw error;
  }
}

export async function createGoogleEvent(
  accessToken,
  calendarId = 'primary',
  event,
  refreshToken = null
) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);
    const requestBody = buildGoogleEventRequestBody(event);

    const response = await calendar.events.insert({
      calendarId,
      requestBody,
      conferenceDataVersion: requestBody.conferenceData ? 1 : undefined,
      sendUpdates: 'none',
    });

    const conferenceDetails = extractGoogleConferenceDetails(response.data);

    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      status: response.data.status,
      conferenceUrl: conferenceDetails.conferenceUrl,
      conferenceProvider: conferenceDetails.conferenceProvider,
      conferenceData: conferenceDetails.conferenceData,
    };
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      const newTokens = await refreshAccessToken('google', refreshToken);
      const result = await createGoogleEvent(
        newTokens.accessToken,
        calendarId,
        event,
        refreshToken,
      );

      return {
        ...result,
        newTokens,
      };
    }

    throw error;
  }
}

export async function deleteGoogleEvent(
  accessToken,
  calendarId = 'primary',
  eventId,
  refreshToken = null
) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'none',
    });

    return true;
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      const newTokens = await refreshAccessToken('google', refreshToken);
      await deleteGoogleEvent(
        newTokens.accessToken,
        calendarId,
        eventId,
        refreshToken,
      );

      return { success: true, newTokens };
    }

    throw error;
  }
}

// Watch for calendar changes (webhook)
export async function setupGoogleWebhook(
  accessToken,
  calendarId = 'primary',
  webhookUrl,
  refreshToken = null
) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: `patna-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
        expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(), // 7 days
      },
    });

    return {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: response.data.expiration,
    };
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      const newTokens = await refreshAccessToken('google', refreshToken);
      const calendar = getGoogleCalendarClient(newTokens.accessToken, refreshToken);

      const response = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: `patna-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(),
        },
      });

      return {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: response.data.expiration,
        newTokens,
      };
    }
    throw error;
  }
}

// Stop watching calendar changes
export async function stopGoogleWebhook(
  accessToken,
  channelId,
  resourceId,
  refreshToken = null
) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);

    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });

    return true;
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      const newTokens = await refreshAccessToken('google', refreshToken);
      const calendar = getGoogleCalendarClient(newTokens.accessToken, refreshToken);

      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId,
        },
      });

      return { success: true, newTokens };
    }
    throw error;
  }
}

// Get user info from Google
export async function getGoogleUserInfo(accessToken, refreshToken = null) {
  try {
    const oauth2 = google.oauth2({
      auth: getGoogleAuthClient(accessToken, refreshToken),
      version: 'v2',
    });

    const response = await oauth2.userinfo.get();

    return {
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
      verified: response.data.verified_email,
    };
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      const newTokens = await refreshAccessToken('google', refreshToken);
      const oauth2 = google.oauth2({
        auth: getGoogleAuthClient(newTokens.accessToken, refreshToken),
        version: 'v2',
      });

      const response = await oauth2.userinfo.get();

      return {
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        verified: response.data.verified_email,
        newTokens,
      };
    }
    throw error;
  }
}
