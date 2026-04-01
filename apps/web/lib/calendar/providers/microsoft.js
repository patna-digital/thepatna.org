/**
 * Microsoft Outlook Calendar Provider
 * Handles Microsoft Graph API operations for Outlook Calendar
 */

import { refreshAccessToken } from './config';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Make authenticated request to Microsoft Graph API
async function makeGraphRequest(
  endpoint,
  accessToken,
  options = {},
  refreshToken = null
) {
  const url = `${GRAPH_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401 && refreshToken) {
    // Token expired, refresh and retry
    const newTokens = await refreshAccessToken('microsoft', refreshToken);
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${newTokens.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!retryResponse.ok) {
      const error = await retryResponse.text();
      throw new Error(`Microsoft Graph API error: ${error}`);
    }

    const data = await retryResponse.json();
    return { data, newTokens };
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph API error: ${error}`);
  }

  const data = await response.json();
  return { data };
}

// Fetch user's calendar list
export async function fetchMicrosoftCalendars(accessToken, refreshToken = null) {
  const result = await makeGraphRequest(
    '/me/calendars',
    accessToken,
    {},
    refreshToken
  );

  const calendars = result.data.value.map((cal) => ({
    id: cal.id,
    name: cal.name,
    description: null, // Outlook doesn't provide description in calendar list
    timezone: cal.changeKey || 'UTC', // Fallback
    primary: cal.isDefaultCalendar || false,
    canEdit: cal.canEdit,
    owner: cal.owner
      ? {
          name: cal.owner.name,
          address: cal.owner.address,
        }
      : null,
  }));

  return result.newTokens ? { calendars, newTokens: result.newTokens } : { calendars };
}

// Fetch events from a specific calendar
export async function fetchMicrosoftEvents(
  accessToken,
  calendarId = null, // null = default calendar
  options = {},
  refreshToken = null
) {
  const {
    startDateTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    top = 100,
    skip = 0,
    deltaToken = null,
  } = options;

  let endpoint;
  if (deltaToken) {
    // Use delta query for incremental sync
    endpoint = calendarId
      ? `/me/calendars/${calendarId}/calendarView/delta?${deltaToken}`
      : `/me/calendar/calendarView/delta?${deltaToken}`;
  } else {
    // Regular calendar view query
    const params = new URLSearchParams({
      startDateTime,
      endDateTime,
      $top: top.toString(),
      $skip: skip.toString(),
      $select:
        'id,subject,body,bodyPreview,location,start,end,attendees,organizer,recurrence,seriesMasterId,isAllDay,responseStatus,createdDateTime,lastModifiedDateTime,showAs,sensitivity,categories',
      $orderby: 'start/dateTime',
    });

    endpoint = calendarId
      ? `/me/calendars/${calendarId}/calendarView?${params.toString()}`
      : `/me/calendar/calendarView?${params.toString()}`;
  }

  const result = await makeGraphRequest(endpoint, accessToken, {}, refreshToken);

  const events = result.data.value.map((event) => ({
    externalEventId: event.id,
    externalCalendarId: calendarId,
    title: event.subject || '(No subject)',
    description: event.body?.content || event.bodyPreview || null,
    location: event.location?.displayName || null,
    startsAt: event.start?.dateTime,
    endsAt: event.end?.dateTime,
    timezone: event.start?.timeZone || 'UTC',
    isAllDay: event.isAllDay || false,
    recurrenceRule: event.recurrence
      ? formatRecurrencePattern(event.recurrence)
      : null,
    recurringEventId: event.seriesMasterId || null,
    attendees: event.attendees?.map((a) => ({
      email: a.emailAddress?.address,
      name: a.emailAddress?.name,
      responseStatus: a.status?.response,
      optional: a.type === 'optional',
    })) || [],
    organizer: event.organizer
      ? {
          email: event.organizer.emailAddress?.address,
          name: event.organizer.emailAddress?.name,
          self: event.isOrganizer || false,
        }
      : null,
    status: mapOutlookStatus(event.showAs),
    visibility: mapOutlookSensitivity(event.sensitivity),
    categories: event.categories || [],
    externalCreatedAt: event.createdDateTime,
    externalUpdatedAt: event.lastModifiedDateTime,
  }));

  return {
    events,
    nextLink: result.data['@odata.nextLink'],
    deltaLink: result.data['@odata.deltaLink'],
    ...(result.newTokens && { newTokens: result.newTokens }),
  };
}

// Get user info from Microsoft
export async function getMicrosoftUserInfo(accessToken, refreshToken = null) {
  const result = await makeGraphRequest(
    '/me?$select=id,displayName,mail,userPrincipalName',
    accessToken,
    {},
    refreshToken
  );

  return {
    email: result.data.mail || result.data.userPrincipalName,
    name: result.data.displayName,
    id: result.data.id,
    ...(result.newTokens && { newTokens: result.newTokens }),
  };
}

// Subscribe to calendar changes (webhook)
export async function setupMicrosoftWebhook(
  accessToken,
  calendarId = null,
  webhookUrl,
  refreshToken = null
) {
  const resource = calendarId
    ? `/me/calendars/${calendarId}/events`
    : '/me/events';

  const subscriptionRequest = {
    changeType: 'created,updated,deleted',
    notificationUrl: webhookUrl,
    resource: resource,
    expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Max 3 days
    clientState: `patna-${Date.now()}`,
  };

  const result = await makeGraphRequest(
    '/subscriptions',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(subscriptionRequest),
    },
    refreshToken
  );

  return {
    subscriptionId: result.data.id,
    clientState: result.data.clientState,
    expirationDateTime: result.data.expirationDateTime,
    resource: result.data.resource,
    ...(result.newTokens && { newTokens: result.newTokens }),
  };
}

// Renew subscription
export async function renewMicrosoftWebhook(
  accessToken,
  subscriptionId,
  refreshToken = null
) {
  const updateRequest = {
    expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const result = await makeGraphRequest(
    `/subscriptions/${subscriptionId}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(updateRequest),
    },
    refreshToken
  );

  return {
    subscriptionId: result.data.id,
    expirationDateTime: result.data.expirationDateTime,
    ...(result.newTokens && { newTokens: result.newTokens }),
  };
}

// Delete subscription
export async function deleteMicrosoftWebhook(
  accessToken,
  subscriptionId,
  refreshToken = null
) {
  const result = await makeGraphRequest(
    `/subscriptions/${subscriptionId}`,
    accessToken,
    {
      method: 'DELETE',
    },
    refreshToken
  );

  return result.newTokens ? { success: true, newTokens: result.newTokens } : { success: true };
}

// Helper: Format Outlook recurrence pattern
function formatRecurrencePattern(recurrence) {
  if (!recurrence.pattern) return null;

  const { type, interval, month, dayOfMonth, daysOfWeek, firstDayOfWeek } =
    recurrence.pattern;

  // Convert to iCal RRULE format
  const parts = [`FREQ=${type.toUpperCase()}`];

  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  if (daysOfWeek && daysOfWeek.length > 0) {
    const dayMap = {
      sunday: 'SU',
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
    };
    parts.push(`BYDAY=${daysOfWeek.map((d) => dayMap[d.toLowerCase()]).join(',')}`);
  }

  if (recurrence.range) {
    if (recurrence.range.endDate) {
      parts.push(`UNTIL=${recurrence.range.endDate.replace(/-/g, '')}`);
    }
    if (recurrence.range.numberOfOccurrences) {
      parts.push(`COUNT=${recurrence.range.numberOfOccurrences}`);
    }
  }

  return `RRULE:${parts.join(';')}`;
}

// Helper: Map Outlook status to standard status
function mapOutlookStatus(showAs) {
  const statusMap = {
    free: 'confirmed',
    tentative: 'tentative',
    busy: 'confirmed',
    oof: 'confirmed',
    workingElsewhere: 'confirmed',
  };
  return statusMap[showAs] || 'confirmed';
}

// Helper: Map Outlook sensitivity to visibility
function mapOutlookSensitivity(sensitivity) {
  const sensitivityMap = {
    normal: 'default',
    personal: 'private',
    private: 'private',
    confidential: 'confidential',
  };
  return sensitivityMap[sensitivity] || 'default';
}
