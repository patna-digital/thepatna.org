/**
 * Calendar Sync API Route
 * Handles manual sync requests and sync status queries
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { syncCalendarConnection, syncMemberCalendars } from '@/lib/calendar/sync';

// POST /api/calendar/sync - Trigger sync for a connection or all connections
export async function POST(request) {
  try {
    const body = await request.json();
    const { connectionId, memberId, forceFullSync = false } = body;

    // If connectionId is provided, sync just that connection
    if (connectionId) {
      const supabase = createSupabaseAdminClient();
      
      const { data: connection, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('is_active', true)
        .single();

      if (error || !connection) {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        );
      }

      const result = await syncCalendarConnection(connection, { forceFullSync });

      return NextResponse.json(result);
    }

    // If memberId is provided, sync all member's connections
    if (memberId) {
      const result = await syncMemberCalendars(memberId, { forceFullSync });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Either connectionId or memberId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/calendar/sync?memberId=xxx - Get sync status for a member
export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');
  const connectionId = searchParams.get('connectionId');

  if (!memberId && !connectionId) {
    return NextResponse.json(
      { error: 'memberId or connectionId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (connectionId) {
      // Get sync status for specific connection
      const { data: connection, error } = await supabase
        .from('calendar_connections')
        .select(`
          id,
          provider,
          calendar_name,
          last_synced_at,
          last_sync_error,
          sync_enabled,
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
        .eq('id', connectionId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        );
      }

      // Get event count
      const { count } = await supabase
        .from('external_calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('connection_id', connectionId);

      return NextResponse.json({
        connection: {
          ...connection,
          event_count: count || 0,
        },
      });
    }

    // Get sync status for all member connections
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select(`
        id,
        provider,
        calendar_name,
        provider_account_email,
        last_synced_at,
        last_sync_error,
        sync_enabled,
        is_active
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get event counts for each connection
    const { data: eventCounts } = await supabase
      .from('external_calendar_events')
      .select('connection_id, count')
      .eq('member_id', memberId)
      .group('connection_id');

    const eventCountMap = new Map(
      (eventCounts || []).map((e) => [e.connection_id, parseInt(e.count)])
    );

    const enrichedConnections = (connections || []).map((conn) => ({
      ...conn,
      event_count: eventCountMap.get(conn.id) || 0,
    }));

    return NextResponse.json({
      connections: enrichedConnections,
    });
  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
