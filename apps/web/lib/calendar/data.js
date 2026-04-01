/**
 * Calendar Data Access Layer
 * Functions for fetching and managing calendar data from Supabase
 */

const CALENDAR_CONNECTION_SELECT = `
  id,
  provider,
  provider_account_email,
  calendar_id,
  calendar_name,
  is_active,
  sync_enabled,
  last_synced_at,
  last_sync_error,
  created_at
`;

const AVAILABILITY_RULE_SELECT = `
  id,
  rule_type,
  day_of_week,
  start_time,
  end_time,
  effective_from,
  effective_until,
  timezone,
  is_blocked,
  label
`;

const BOOKING_SELECT = `
  id,
  host_id,
  booker_email,
  booker_name,
  booker_organisation,
  title,
  description,
  meeting_type,
  location_type,
  location_details,
  status,
  starts_at,
  ends_at,
  timezone,
  created_at
`;

const BOOKING_SETTINGS_SELECT = `
  member_id,
  public_booking_enabled,
  public_booking_url_slug,
  default_meeting_duration,
  minimum_notice_hours,
  maximum_booking_days_ahead,
  buffer_minutes_between_meetings,
  timezone,
  available_days,
  confirmation_message,
  cancellation_policy
`;

/**
 * Fetch calendar connections for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{connections: Array, error: Error}>}
 */
export async function fetchCalendarConnections({ memberId, supabase }) {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select(CALENDAR_CONNECTION_SELECT)
    .eq('member_id', memberId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return {
    connections: data || [],
    error,
  };
}

/**
 * Fetch a single calendar connection by ID
 * @param {Object} params
 * @param {string} params.connectionId - Connection UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{connection: Object|null, error: Error}>}
 */
export async function fetchCalendarConnectionById({ connectionId, supabase }) {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('id', connectionId)
    .maybeSingle();

  return {
    connection: data,
    error,
  };
}

/**
 * Fetch availability rules for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{rules: Array, error: Error}>}
 */
export async function fetchAvailabilityRules({ memberId, supabase }) {
  const { data, error } = await supabase
    .from('availability_rules')
    .select(AVAILABILITY_RULE_SELECT)
    .eq('member_id', memberId)
    .order('day_of_week', { ascending: true });

  return {
    rules: data || [],
    error,
  };
}

/**
 * Fetch booking slots for a member within a date range
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{slots: Array, error: Error}>}
 */
export async function fetchBookingSlots({ memberId, startDate, endDate, supabase }) {
  const { data, error } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('member_id', memberId)
    .gte('slot_date', startDate)
    .lte('slot_date', endDate)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return {
    slots: data || [],
    error,
  };
}

/**
 * Fetch available booking slots for public booking
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {string} params.date - Date to fetch slots for (YYYY-MM-DD)
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{slots: Array, error: Error}>}
 */
export async function fetchAvailableSlotsForDate({ memberId, date, supabase }) {
  const { data, error } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('member_id', memberId)
    .eq('slot_date', date)
    .eq('is_available', true)
    .eq('is_blocked', false)
    .is('booking_id', null)
    .order('start_time', { ascending: true });

  return {
    slots: data || [],
    error,
  };
}

/**
 * Fetch bookings for a host
 * @param {Object} params
 * @param {string} params.hostId - Host member UUID
 * @param {string} params.status - Optional status filter
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{bookings: Array, error: Error}>}
 */
export async function fetchHostBookings({ hostId, status, supabase }) {
  let query = supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('host_id', hostId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('starts_at', { ascending: false });

  return {
    bookings: data || [],
    error,
  };
}

/**
 * Fetch upcoming bookings for a host
 * @param {Object} params
 * @param {string} params.hostId - Host member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{bookings: Array, error: Error}>}
 */
export async function fetchUpcomingBookings({ hostId, supabase }) {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('host_id', hostId)
    .in('status', ['confirmed', 'pending'])
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  return {
    bookings: data || [],
    error,
  };
}

/**
 * Fetch booking settings for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{settings: Object|null, error: Error}>}
 */
export async function fetchBookingSettings({ memberId, supabase }) {
  const { data, error } = await supabase
    .from('booking_settings')
    .select(BOOKING_SETTINGS_SELECT)
    .eq('member_id', memberId)
    .maybeSingle();

  return {
    settings: data,
    error,
  };
}

/**
 * Fetch booking settings by public URL slug
 * @param {Object} params
 * @param {string} params.slug - Public booking URL slug
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{settings: Object|null, error: Error}>}
 */
export async function fetchBookingSettingsBySlug({ slug, supabase }) {
  const { data, error } = await supabase
    .from('booking_settings')
    .select(`
      ${BOOKING_SETTINGS_SELECT},
      member:profiles(id, first_name, surname, title, professional_bio)
    `)
    .eq('public_booking_url_slug', slug)
    .eq('public_booking_enabled', true)
    .maybeSingle();

  return {
    settings: data,
    error,
  };
}

/**
 * Fetch a single booking by ID
 * @param {Object} params
 * @param {string} params.bookingId - Booking UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{booking: Object|null, error: Error}>}
 */
export async function fetchBookingById({ bookingId, supabase }) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  return {
    booking: data,
    error,
  };
}

/**
 * Create default booking settings for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{settings: Object|null, error: Error}>}
 */
export async function createDefaultBookingSettings({ memberId, supabase }) {
  // Generate URL slug from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, surname')
    .eq('id', memberId)
    .single();

  const slug = profile 
    ? `${profile.first_name || ''}-${profile.surname || ''}-${memberId.slice(0, 8)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : `member-${memberId.slice(0, 8)}`;

  const { data, error } = await supabase
    .from('booking_settings')
    .insert({
      member_id: memberId,
      public_booking_url_slug: slug,
    })
    .select()
    .single();

  return {
    settings: data,
    error,
  };
}

async function ensureAdminEventRsvps({ communityEvents, isAdmin, memberId, supabase }) {
  if (!isAdmin || !memberId || communityEvents.length === 0) {
    return;
  }

  await supabase
    .from('event_rsvps')
    .upsert(
      communityEvents.map((event) => ({
        event_id: event.id,
        user_id: memberId,
        status: 'going',
      })),
      { onConflict: 'event_id,user_id', ignoreDuplicates: true },
    );
}

/**
 * Fetch external calendar events for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{events: Array, error: Error}>}
 */
export async function fetchExternalCalendarEvents({ memberId, startDate, endDate, supabase }) {
  const { data, error } = await supabase
    .from('external_calendar_events')
    .select(`
      id,
      external_event_id,
      external_calendar_id,
      title,
      description,
      location,
      starts_at,
      ends_at,
      timezone,
      is_all_day,
      recurrence_rule,
      recurring_event_id,
      attendees,
      organizer,
      status,
      visibility,
      external_created_at,
      external_updated_at,
      connection:calendar_connections(provider, calendar_name)
    `)
    .eq('member_id', memberId)
    .gte('starts_at', `${startDate}T00:00:00`)
    .lte('starts_at', `${endDate}T23:59:59`)
    .order('starts_at', { ascending: true });

  if (error) {
    return { events: [], error };
  }

  // Transform to match the event format
  const events = (data || []).map((event) => ({
    ...event,
    event_source: 'external',
    event_type_label: event.connection?.provider
      ? `${PROVIDER_NAMES[event.connection.provider] || event.connection.provider} Event`
      : 'External Event',
    is_rsvped: true, // External events are always "accepted"
  }));

  return { events, error: null };
}

/**
 * Get calendar events for a date range (combines community events, personal bookings, and external events)
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{events: Array, error: Error}>}
 */
export async function fetchCalendarEvents({ memberId, startDate, endDate, supabase, isAdmin = false }) {
  // Fetch community events
  const { data: communityEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title, summary, starts_at, ends_at, location, event_type, visibility, display_date, schedule_status, official_link')
    .eq('status', 'published')
    .gte('starts_at', `${startDate}T00:00:00`)
    .lte('starts_at', `${endDate}T23:59:59`);

  if (eventsError) {
    return { events: [], error: eventsError };
  }

  // Fetch personal bookings (where member is host)
  const { data: hostBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('host_id', memberId)
    .in('status', ['confirmed', 'pending'])
    .gte('starts_at', `${startDate}T00:00:00`)
    .lte('starts_at', `${endDate}T23:59:59`);

  if (bookingsError) {
    return { events: [], error: bookingsError };
  }

  // Fetch external calendar events (wrapped in try-catch in case table doesn't exist yet)
  let externalEvents = [];
  try {
    const { data: extEvents, error: extError } = await supabase
      .from('external_calendar_events')
      .select(`
        id,
        title,
        description,
        location,
        starts_at,
        ends_at,
        timezone,
        is_all_day,
        recurrence_rule,
        recurring_event_id,
        attendees,
        organizer,
        status,
        visibility,
        connection:calendar_connections!inner(provider, calendar_name)
      `)
      .eq('member_id', memberId)
      .gte('starts_at', `${startDate}T00:00:00`)
      .lte('starts_at', `${endDate}T23:59:59`)
      .order('starts_at', { ascending: true });
    
    if (!extError && extEvents) {
      externalEvents = extEvents;
    }
  } catch (e) {
    // External events table might not exist yet, silently skip
    externalEvents = [];
  }

  await ensureAdminEventRsvps({
    communityEvents: communityEvents || [],
    isAdmin,
    memberId,
    supabase,
  });

  const communityEventIds = (communityEvents || []).map((event) => event.id);
  let rsvpedEventIds = new Set();

  if (communityEventIds.length > 0) {
    const { data: memberRsvps, error: memberRsvpError } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', memberId)
      .in('event_id', communityEventIds);

    if (!memberRsvpError) {
      rsvpedEventIds = new Set((memberRsvps || []).map((row) => row.event_id));
    }
  }

  // Transform and combine events
  const events = [
    ...(communityEvents || []).map(e => ({
      ...e,
      event_source: 'community',
      event_type_label: e.event_type || 'Community Event',
      is_rsvped: rsvpedEventIds.has(e.id),
    })),
    ...(hostBookings || []).map(b => ({
      ...b,
      event_source: 'personal',
      event_type_label: 'Meeting',
      title: b.title,
      is_rsvped: true,
    })),
    ...externalEvents.map(e => {
      const provider = e.connection?.provider;
      return {
        ...e,
        event_source: 'external',
        event_type_label: provider
          ? `${PROVIDER_NAMES[provider] || provider} Event`
          : 'External Event',
        is_rsvped: true,
      };
    }),
  ];

  // Sort by start time
  events.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  return { events, error: null };
}

// Provider names mapping
const PROVIDER_NAMES = {
  google: 'Google Calendar',
  microsoft: 'Outlook Calendar',
  zoho: 'Zoho Calendar',
  apple: 'Apple Calendar',
  generic_ical: 'iCal Feed',
};

/**
 * Get calendar statistics for a member
 * @param {Object} params
 * @param {string} params.memberId - Member UUID
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{stats: Object, error: Error}>}
 */
export async function fetchCalendarStats({ memberId, supabase }) {
  const now = new Date().toISOString();

  // Count upcoming bookings
  const { count: upcomingCount, error: upcomingError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('host_id', memberId)
    .in('status', ['confirmed', 'pending'])
    .gte('starts_at', now);

  // Count connected calendars
  const { count: connectedCount, error: connectedError } = await supabase
    .from('calendar_connections')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('is_active', true);

  // Count total bookings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthCount, error: monthError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('host_id', memberId)
    .eq('status', 'confirmed')
    .gte('starts_at', startOfMonth.toISOString());

  // Count external events (wrapped in try-catch in case table doesn't exist yet)
  let externalEventsCount = 0;
  try {
    const { count, error: extError } = await supabase
      .from('external_calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .gte('starts_at', now);
    
    if (!extError && count !== null) {
      externalEventsCount = count;
    }
  } catch (e) {
    // External events table might not exist yet, use 0
    externalEventsCount = 0;
  }

  return {
    stats: {
      upcomingBookings: upcomingCount || 0,
      connectedCalendars: connectedCount || 0,
      bookingsThisMonth: monthCount || 0,
      externalEvents: externalEventsCount,
    },
    error: upcomingError || connectedError || monthError,
  };
}
