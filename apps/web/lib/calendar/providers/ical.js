/**
 * iCal Feed Parser
 * Handles parsing of iCal/ICS feeds from any calendar provider
 */

// ical.js is a default-only ESM module; import dynamically to avoid Turbopack
// "Export Component doesn't exist in target module" errors at build time.
async function getICAL() {
  const mod = await import('ical.js');
  return mod.default ?? mod;
}

/**
 * Fetch and parse an iCal feed from a URL
 * @param {string} url - The iCal feed URL
 * @param {Object} options - Parsing options
 * @returns {Promise<{events: Array, error: Error|null}>}
 */
export async function fetchAndParseICal(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/calendar, application/calendar+json, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.status} ${response.statusText}`);
    }

    const icalData = await response.text();
    return await parseICalData(icalData, options);
  } catch (error) {
    return { events: [], error };
  }
}

/**
 * Parse iCal data string
 * @param {string} icalData - The raw iCal data
 * @param {Object} options - Parsing options
 * @returns {{events: Array, error: null}}
 */
export async function parseICalData(icalData, options = {}) {
  const ICAL = await getICAL();
  const {
    timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  } = options;

  try {
    const jcalData = ICAL.parse(icalData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    const events = [];

    for (const vevent of vevents) {
      const event = parseVEvent(ICAL, vevent, timeMin, timeMax);
      if (event) {
        events.push(event);
      }
    }

    return { events, error: null };
  } catch (error) {
    return { events: [], error };
  }
}

/**
 * Parse a single VEVENT component
 * @param {ICAL.Component} vevent - The VEVENT component
 * @param {Date} timeMin - Start of time range
 * @param {Date} timeMax - End of time range
 * @returns {Object|null} Parsed event or null if outside range
 */
function parseVEvent(ICAL, vevent, timeMin, timeMax) {
  const icalEvent = new ICAL.Event(vevent);

  // Get basic event properties
  const uid = icalEvent.uid;
  const summary = vevent.getFirstPropertyValue('summary') || '(No title)';
  const description = vevent.getFirstPropertyValue('description') || null;
  const location = vevent.getFirstPropertyValue('location') || null;

  // Get start and end times
  const startDate = icalEvent.startDate;
  const endDate = icalEvent.endDate;

  if (!startDate) {
    return null;
  }

  // Convert to JavaScript Date
  const startJSDate = startDate.toJSDate();
  const endJSDate = endDate ? endDate.toJSDate() : new Date(startJSDate.getTime() + 60 * 60 * 1000);

  // Check if event is within our time range
  if (endJSDate < timeMin || startJSDate > timeMax) {
    return null;
  }

  // Get timezone
  const timezone = startDate.zone ? startDate.zone.toString() : 'UTC';

  // Check if all-day event
  const isAllDay = startDate.isDate;

  // Get recurrence rule
  let recurrenceRule = null;
  const rrule = vevent.getFirstPropertyValue('rrule');
  if (rrule) {
    recurrenceRule = rrule.toString();
  }

  // Get recurrence ID for recurring event instances
  const recurrenceId = vevent.getFirstPropertyValue('recurrence-id');

  // Get attendees
  const attendees = [];
  const attendeeProps = vevent.getAllProperties('attendee');
  for (const prop of attendeeProps) {
    const email = prop.getFirstValue();
    const cn = prop.getParameter('cn');
    const partstat = prop.getParameter('partstat');
    const role = prop.getParameter('role');

    attendees.push({
      email: email ? email.replace('mailto:', '') : null,
      name: cn || null,
      responseStatus: partstat || 'needs-action',
      optional: role === 'OPT-PARTICIPANT',
    });
  }

  // Get organizer
  let organizer = null;
  const organizerProp = vevent.getFirstProperty('organizer');
  if (organizerProp) {
    const email = organizerProp.getFirstValue();
    const cn = organizerProp.getParameter('cn');
    organizer = {
      email: email ? email.replace('mailto:', '') : null,
      name: cn || null,
      self: false,
    };
  }

  // Get status
  const status = vevent.getFirstPropertyValue('status') || 'CONFIRMED';
  const statusMap = {
    CONFIRMED: 'confirmed',
    TENTATIVE: 'tentative',
    CANCELLED: 'cancelled',
  };

  // Get classification/visibility
  const classification = vevent.getFirstPropertyValue('class') || 'PUBLIC';
  const visibilityMap = {
    PUBLIC: 'public',
    PRIVATE: 'private',
    CONFIDENTIAL: 'confidential',
  };

  // Get created and last modified dates
  const created = vevent.getFirstPropertyValue('created');
  const lastModified = vevent.getFirstPropertyValue('last-modified');
  const dtStamp = vevent.getFirstPropertyValue('dtstamp');

  return {
    externalEventId: uid,
    externalCalendarId: null,
    title: summary,
    description,
    location,
    startsAt: startJSDate.toISOString(),
    endsAt: endJSDate.toISOString(),
    timezone: timezone === 'floating' ? 'UTC' : timezone,
    isAllDay,
    recurrenceRule,
    recurringEventId: recurrenceId || null,
    attendees,
    organizer,
    status: statusMap[status] || 'confirmed',
    visibility: visibilityMap[classification] || 'default',
    externalCreatedAt: created ? created.toJSDate().toISOString() : null,
    externalUpdatedAt: lastModified
      ? lastModified.toJSDate().toISOString()
      : dtStamp
        ? dtStamp.toJSDate().toISOString()
        : null,
  };
}

/**
 * Expand recurring events within a date range
 * @param {Object} event - The master recurring event
 * @param {Date} rangeStart - Start of range
 * @param {Date} rangeEnd - End of range
 * @returns {Array} Array of expanded event instances
 */
export async function expandRecurringEvent(event, rangeStart, rangeEnd) {
  if (!event.recurrenceRule) {
    return [event];
  }

  const ICAL = await getICAL();

  try {
    const jcalData = ICAL.parse(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PATNA//Calendar//EN
BEGIN:VEVENT
UID:${event.externalEventId}
DTSTART:${formatICALDate(new Date(event.startsAt))}
DTEND:${formatICALDate(new Date(event.endsAt))}
RRULE:${event.recurrenceRule}
END:VEVENT
END:VCALENDAR`);

    const vcalendar = new ICAL.Component(jcalData);
    const vevent = vcalendar.getFirstSubcomponent('vevent');
    const icalEvent = new ICAL.Event(vevent);

    const instances = [];
    const iterator = icalEvent.iterator();

    let next;
    while ((next = iterator.next())) {
      const instanceStart = next.toJSDate();
      
      if (instanceStart > rangeEnd) {
        break;
      }

      if (instanceStart >= rangeStart) {
        const duration = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        instances.push({
          ...event,
          externalEventId: `${event.externalEventId}_${instanceStart.toISOString()}`,
          recurringEventId: event.externalEventId,
          startsAt: instanceStart.toISOString(),
          endsAt: instanceEnd.toISOString(),
        });
      }
    }

    return instances;
  } catch (error) {
    console.error('Error expanding recurring event:', error);
    return [event];
  }
}

/**
 * Format a JavaScript Date as iCal date-time string
 * @param {Date} date
 * @returns {string}
 */
function formatICALDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Validate an iCal feed URL
 * @param {string} url
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export async function validateICalUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Check for common iCal URL patterns
    const validProtocols = ['http:', 'https:'];
    if (!validProtocols.includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Attempt a HEAD request to check if URL is accessible
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        Accept: 'text/calendar, */*',
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `URL returned ${response.status}: ${response.statusText}`,
      };
    }

    // Check content type if available
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/calendar') && !contentType.includes('text/plain')) {
      // Some servers return wrong content type, so just warn
      console.warn(`iCal feed has unexpected content type: ${contentType}`);
    }

    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
