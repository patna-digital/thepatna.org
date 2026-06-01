/**
 * Calendar Auth API Route
 * Handles OAuth initiation and iCal feed connections
 */

import { NextResponse } from 'next/server';
import { CALENDAR_PROVIDERS, generateAuthUrl, validateICalUrl, fetchAndParseICal } from '@/lib/calendar/providers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// POST /api/calendar/auth - Initiate OAuth flow or add iCal feed
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, memberId, icalUrl, calendarName } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    if (!provider) {
      return NextResponse.json(
        { error: 'provider is required' },
        { status: 400 }
      );
    }

    // Handle iCal feed
    if (provider === 'generic_ical') {
      if (!icalUrl) {
        return NextResponse.json(
          { error: 'icalUrl is required for iCal feeds' },
          { status: 400 }
        );
      }

      // Validate the iCal URL
      const validation = await validateICalUrl(icalUrl);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid iCal URL: ${validation.error}` },
          { status: 400 }
        );
      }

      // Parse the feed to verify it's valid
      const { events, error: parseError } = await fetchAndParseICal(icalUrl, {
        timeMin: new Date(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Just check next 7 days
      });

      if (parseError) {
        return NextResponse.json(
          { error: `Failed to parse iCal feed: ${parseError.message}` },
          { status: 400 }
        );
      }

      // Store the connection
      const supabase = createSupabaseAdminClient();
      
      const { data: connection, error: insertError } = await supabase
        .from('calendar_connections')
        .insert({
          member_id: memberId,
          provider: 'generic_ical',
          calendar_name: calendarName || 'iCal Feed',
          webhook_url: icalUrl, // Store the feed URL here
          is_active: true,
          sync_enabled: true,
          auth_method: 'ical_url',
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      // Sync events immediately
      // Import sync function dynamically to avoid circular dependencies
      const { syncCalendarConnection } = await import('@/lib/calendar/sync');
      
      // For iCal, we need to manually import events since syncCalendarConnection expects OAuth tokens
      const { events: allEvents } = await fetchAndParseICal(icalUrl);
      
      const eventsToInsert = allEvents.map((event) => ({
        connection_id: connection.id,
        member_id: memberId,
        external_event_id: event.externalEventId,
        external_calendar_id: null,
        title: event.title,
        description: event.description,
        location: event.location,
        starts_at: event.startsAt,
        ends_at: event.endsAt,
        timezone: event.timezone,
        is_all_day: event.isAllDay,
        recurrence_rule: event.recurrenceRule,
        recurring_event_id: event.recurringEventId,
        attendees: event.attendees,
        organizer: event.organizer,
        status: event.status,
        visibility: event.visibility,
        external_created_at: event.externalCreatedAt,
        external_updated_at: event.externalUpdatedAt,
        last_synced_at: new Date().toISOString(),
      }));

      if (eventsToInsert.length > 0) {
        await supabase.from('external_calendar_events').insert(eventsToInsert);
      }

      // Update connection sync status
      await supabase
        .from('calendar_connections')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      return NextResponse.json({
        success: true,
        connection,
        eventsImported: eventsToInsert.length,
      });
    }

    // Handle OAuth providers (Google, Microsoft, Zoho)
    if (!['google', 'microsoft', 'zoho'].includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    if (CALENDAR_PROVIDERS[provider]?.status === 'coming_soon') {
      return NextResponse.json(
        { error: `${CALENDAR_PROVIDERS[provider].name} is coming soon.` },
        { status: 400 }
      );
    }

    // Generate state parameter with member ID
    const stateData = JSON.stringify({ memberId, timestamp: Date.now() });
    const state = Buffer.from(stateData).toString('base64url');

    // Generate OAuth URL
    const authUrl = generateAuthUrl(provider, state);

    return NextResponse.json({
      success: true,
      authUrl,
      provider,
    });
  } catch (error) {
    console.error('Calendar auth API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/auth - Disconnect a calendar
export async function DELETE(request) {
  const searchParams = request.nextUrl.searchParams;
  const connectionId = searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json(
      { error: 'connectionId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Delete synced events first
    await supabase
      .from('external_calendar_events')
      .delete()
      .eq('connection_id', connectionId);

    // Delete the connection
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
