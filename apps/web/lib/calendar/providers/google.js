/**
 * Google Calendar Provider
 * Handles Google Calendar API operations including fetching events and calendars
 */

import { google } from 'googleapis';
import { refreshAccessToken } from './config';

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
export async function fetchGoogleCalendars(accessToken, refreshToken = null) {
  try {
    const calendar = getGoogleCalendarClient(accessToken, refreshToken);
    const response = await calendar.calendarList.list();

    return response.data.items.map((cal) => ({
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
  } catch (error) {
    if (error.code === 401 && refreshToken) {
      // Token expired, try to refresh
      const newTokens = await refreshAccessToken('google', refreshToken);
      const calendar = getGoogleCalendarClient(newTokens.accessToken, refreshToken);
      const response = await calendar.calendarList.list();

      return {
        calendars: response.data.items.map((cal) => ({
          id: cal.id,
          name: cal.summary,
          description: cal.description || null,
          timezone: cal.timeZone || 'UTC',
          primary: cal.primary || false,
          accessRole: cal.accessRole,
          backgroundColor: cal.backgroundColor,
          foregroundColor: cal.foregroundColor,
          selected: cal.selected || false,
        })),
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

    const events = response.data.items.map((event) => ({
      externalEventId: event.id,
      externalCalendarId: calendarId,
      title: event.summary || '(No title)',
      description: event.description || null,
      location: event.location || null,
      startsAt: event.start?.dateTime || event.start?.date,
      endsAt: event.end?.dateTime || event.end?.date,
      timezone: event.start?.timeZone || 'UTC',
      isAllDay: !event.start?.dateTime,
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
    }));

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
