/**
 * Calendar Sync Engine
 * Handles synchronization of external calendar events to the database
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCalendarDisplayRange } from './core';
import { fetchProviderEvents, refreshAccessToken } from './providers';

/**
 * Sync events from an external calendar connection
 * @param {Object} connection - The calendar connection record
 * @param {Object} options - Sync options
 * @returns {Promise<{success: boolean, stats: Object, error: Error|null}>}
 */
export async function syncCalendarConnection(connection, options = {}) {
  const { start: defaultTimeMin, end: defaultTimeMax } = getCalendarDisplayRange();
  const {
    forceFullSync = false,
    timeMin = defaultTimeMin,
    timeMax = defaultTimeMax,
  } = options;

  const supabase = createSupabaseAdminClient();
  const syncStartTime = new Date();

  const stats = {
    eventsProcessed: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };

  try {
    if (!connection?.id) {
      throw new Error('Calendar sync requires a saved connection id');
    }

    if (!connection?.provider) {
      throw new Error(`Calendar connection ${connection.id} is missing a provider`);
    }

    if (!connection?.member_id) {
      throw new Error(`Calendar connection ${connection.id} is missing a member id`);
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    let refreshToken = connection.refresh_token;

    if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
      const newTokens = await refreshAccessToken(connection.provider, refreshToken);
      accessToken = newTokens.accessToken;
      refreshToken = newTokens.refreshToken;

      // Update tokens in database
      await supabase
        .from('calendar_connections')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: newTokens.expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    // Fetch events from provider
    let fetchOptions = {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    };

    // Use incremental sync if available and not forcing full sync
    if (!forceFullSync && connection.last_synced_at) {
      fetchOptions.syncToken = connection.sync_token;
    }

    const fetchResult = await fetchProviderEvents(
      connection.provider,
      accessToken,
      connection.calendar_id || 'primary',
      fetchOptions,
      refreshToken
    );

    // Handle token refresh during fetch
    if (fetchResult.newTokens) {
      await supabase
        .from('calendar_connections')
        .update({
          access_token: fetchResult.newTokens.accessToken,
          refresh_token: fetchResult.newTokens.refreshToken,
          token_expires_at: fetchResult.newTokens.expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    const externalEvents = fetchResult.events || [];
    stats.eventsProcessed = externalEvents.length;

    // Get existing events for this connection
    const { data: existingEvents } = await supabase
      .from('external_calendar_events')
      .select('id, external_event_id, external_updated_at')
      .eq('connection_id', connection.id);

    const existingEventMap = new Map(
      (existingEvents || []).map((e) => [e.external_event_id, e])
    );

    // Process events
    const eventsToCreate = [];
    const eventsToUpdate = [];
    const processedExternalIds = new Set();

    for (const event of externalEvents) {
      processedExternalIds.add(event.externalEventId);

      const existingEvent = existingEventMap.get(event.externalEventId);

      if (!existingEvent) {
        // New event
        eventsToCreate.push({
          connection_id: connection.id,
          member_id: connection.member_id,
          external_event_id: event.externalEventId,
          external_calendar_id: event.externalCalendarId,
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
        });
      } else if (
        event.externalUpdatedAt &&
        existingEvent.external_updated_at !== event.externalUpdatedAt
      ) {
        // Updated event
        eventsToUpdate.push({
          id: existingEvent.id,
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
          external_updated_at: event.externalUpdatedAt,
          last_synced_at: new Date().toISOString(),
        });
      }
    }

    // Insert new events
    if (eventsToCreate.length > 0) {
      const { error: createError } = await supabase
        .from('external_calendar_events')
        .insert(eventsToCreate);

      if (createError) {
        stats.errors.push(`Create error: ${createError.message}`);
      } else {
        stats.eventsCreated = eventsToCreate.length;
      }
    }

    // Update existing events
    if (eventsToUpdate.length > 0) {
      for (const event of eventsToUpdate) {
        const { error: updateError } = await supabase
          .from('external_calendar_events')
          .update(event)
          .eq('id', event.id);

        if (updateError) {
          stats.errors.push(`Update error for ${event.id}: ${updateError.message}`);
        } else {
          stats.eventsUpdated++;
        }
      }
    }

    // Delete events that no longer exist (for incremental syncs)
    if (!forceFullSync && fetchResult.nextSyncToken) {
      const eventsToDelete = (existingEvents || []).filter(
        (e) => !processedExternalIds.has(e.external_event_id)
      );

      for (const event of eventsToDelete) {
        const { error: deleteError } = await supabase
          .from('external_calendar_events')
          .delete()
          .eq('id', event.id);

        if (!deleteError) {
          stats.eventsDeleted++;
        }
      }
    }

    // Update connection sync status
    await supabase
      .from('calendar_connections')
      .update({
        last_synced_at: syncStartTime.toISOString(),
        last_sync_error: stats.errors.length > 0 ? stats.errors.join('; ') : null,
        sync_token: fetchResult.nextSyncToken || fetchResult.deltaLink || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    // Log sync operation
    await supabase.from('calendar_sync_logs').insert({
      connection_id: connection.id,
      sync_type: forceFullSync ? 'full' : 'incremental',
      status: stats.errors.length > 0 ? (stats.eventsCreated + stats.eventsUpdated > 0 ? 'partial' : 'failed') : 'success',
      events_processed: stats.eventsProcessed,
      events_created: stats.eventsCreated,
      events_updated: stats.eventsUpdated,
      events_deleted: stats.eventsDeleted,
      error_message: stats.errors.length > 0 ? stats.errors.join('; ') : null,
      started_at: syncStartTime.toISOString(),
      completed_at: new Date().toISOString(),
    });

    return {
      success: stats.errors.length === 0,
      stats,
      error: stats.errors.length > 0 ? new Error(stats.errors.join('; ')) : null,
    };
  } catch (error) {
    // Log failed sync
    await supabase.from('calendar_sync_logs').insert({
      connection_id: connection.id,
      sync_type: forceFullSync ? 'full' : 'incremental',
      status: 'failed',
      events_processed: stats.eventsProcessed,
      events_created: stats.eventsCreated,
      events_updated: stats.eventsUpdated,
      events_deleted: stats.eventsDeleted,
      error_message: error.message,
      started_at: syncStartTime.toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Update connection with error
    await supabase
      .from('calendar_connections')
      .update({
        last_sync_error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return {
      success: false,
      stats,
      error,
    };
  }
}

/**
 * Sync all active calendar connections for a member
 * @param {string} memberId - The member UUID
 * @param {Object} options - Sync options
 * @returns {Promise<{success: boolean, results: Array, error: Error|null}>}
 */
export async function syncMemberCalendars(memberId, options = {}) {
  const supabase = createSupabaseAdminClient();

  try {
    // Get all active connections for the member
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .eq('sync_enabled', true);

    if (error) {
      throw error;
    }

    const results = [];

    for (const connection of connections || []) {
      const result = await syncCalendarConnection(connection, options);
      results.push({
        connectionId: connection.id,
        provider: connection.provider,
        ...result,
      });
    }

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      results,
      error: allSuccess ? null : new Error('Some calendar syncs failed'),
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error,
    };
  }
}

/**
 * Sync all calendar connections (for scheduled jobs)
 * @param {Object} options - Sync options
 * @returns {Promise<{success: boolean, results: Array, error: Error|null}>}
 */
export async function syncAllCalendars(options = {}) {
  const supabase = createSupabaseAdminClient();

  try {
    // Get all active connections that need syncing
    // (synced more than 15 minutes ago or never synced)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('is_active', true)
      .eq('sync_enabled', true)
      .or(`last_synced_at.is.null,last_synced_at.lt.${fifteenMinutesAgo}`)
      .limit(100); // Process in batches

    if (error) {
      throw error;
    }

    const results = [];

    for (const connection of connections || []) {
      const result = await syncCalendarConnection(connection, options);
      results.push({
        connectionId: connection.id,
        provider: connection.provider,
        memberId: connection.member_id,
        ...result,
      });

      // Small delay between syncs to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      results,
      error: allSuccess ? null : new Error('Some calendar syncs failed'),
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error,
    };
  }
}

/**
 * Delete synced events for a connection (when disconnecting)
 * @param {string} connectionId - The connection UUID
 * @returns {Promise<{success: boolean, deletedCount: number, error: Error|null}>}
 */
export async function deleteSyncedEvents(connectionId) {
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error, count } = await supabase
      .from('external_calendar_events')
      .delete()
      .eq('connection_id', connectionId)
      .select('count');

    if (error) {
      throw error;
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error,
    };
  }
}

/**
 * Get sync status for a member's calendars
 * @param {string} memberId - The member UUID
 * @returns {Promise<{connections: Array, error: Error|null}>}
 */
export async function getMemberSyncStatus(memberId) {
  const supabase = createSupabaseAdminClient();

  try {
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select(`
        id,
        provider,
        calendar_name,
        provider_account_email,
        is_active,
        sync_enabled,
        last_synced_at,
        last_sync_error,
        sync_logs:calendar_sync_logs(
          sync_type,
          status,
          events_processed,
          events_created,
          events_updated,
          started_at,
          completed_at
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get event counts per connection
    const { data: externalEvents } = await supabase
      .from('external_calendar_events')
      .select('connection_id')
      .eq('member_id', memberId);

    const eventCountMap = new Map();
    for (const event of externalEvents || []) {
      if (!event?.connection_id) {
        continue;
      }

      eventCountMap.set(
        event.connection_id,
        (eventCountMap.get(event.connection_id) || 0) + 1
      );
    }

    const enrichedConnections = (connections || []).map((conn) => ({
      ...conn,
      event_count: eventCountMap.get(conn.id) || 0,
      last_sync: conn.sync_logs?.[0] || null,
    }));

    return {
      connections: enrichedConnections,
      error: null,
    };
  } catch (error) {
    return {
      connections: [],
      error,
    };
  }
}
