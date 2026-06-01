/**
 * Google Calendar OAuth Callback Handler
 * Handles the OAuth redirect from Google after user authorization
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  exchangeCodeForTokens,
  fetchGoogleCalendars,
  getGoogleUserInfo,
} from '@/lib/calendar/providers';
import { syncCalendarConnection } from '@/lib/calendar/sync';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=oauth_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=missing_code`
    );
  }

  try {
    // Decode state parameter to get member ID
    let memberId;
    
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      memberId = stateData.memberId;
    } catch {
      return NextResponse.redirect(
        `${baseUrl}/app/calendar/settings?error=invalid_state`
      );
    }

    if (!memberId) {
      return NextResponse.redirect(
        `${baseUrl}/app/calendar/settings?error=missing_member`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens('google', code);

    // Get user info
    const userInfo = await getGoogleUserInfo(
      tokens.accessToken,
      tokens.refreshToken
    );

    // Fetch all calendars the user has access to
    const calendarList = await fetchGoogleCalendars(
      tokens.accessToken,
      tokens.refreshToken
    );

    const allCalendars = calendarList.calendars || [];

    const supabase = createSupabaseAdminClient();

    // Upsert a connection for every calendar (primary + subscribed like Holidays)
    // so all events including holidays/shared calendars get synced
    const connectionRecords = allCalendars.length > 0 ? allCalendars : [
      { id: 'primary', name: 'Google Calendar', primary: true, accessRole: 'owner' },
    ];
    const defaultPrimaryCalendarId =
      connectionRecords.find((calendar) => calendar.primary)?.id ||
      connectionRecords[0]?.id ||
      'primary';

    const savedConnections = [];
    const saveErrors = [];
    const { data: existingGoogleConnections = [] } = await supabase
      .from('calendar_connections')
      .select('id, calendar_id, is_primary_calendar')
      .eq('member_id', memberId)
      .eq('provider', 'google');
    const hasExistingPrimary = existingGoogleConnections.some((connection) => connection.is_primary_calendar);

    for (const cal of connectionRecords) {
      const existing = existingGoogleConnections.find((connection) => connection.calendar_id === cal.id) || null;
      const existingError = null;

      if (existingError) {
        saveErrors.push(existingError);
        continue;
      }

      const connectionData = {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt?.toISOString(),
        calendar_id: cal.id,
        calendar_name: cal.name || 'Google Calendar',
        access_role: cal.accessRole || (cal.primary ? 'owner' : null),
        is_primary_calendar: Boolean(
          existing?.is_primary_calendar ||
            (!hasExistingPrimary && cal.id === defaultPrimaryCalendarId),
        ),
        is_active: true,
        sync_enabled: true,
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      };

      let savedConnection;
      if (existing) {
        const { data: updatedConnection, error: updateError } = await supabase
          .from('calendar_connections')
          .update(connectionData)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updateError) {
          saveErrors.push(updateError);
          continue;
        }

        savedConnection = updatedConnection;
      } else {
        const { data: insertedConnection, error: insertError } = await supabase
          .from('calendar_connections')
          .insert({
            member_id: memberId,
            provider: 'google',
            provider_account_email: userInfo.email,
            scope: tokens.scope,
            auth_method: 'oauth',
            ...connectionData,
          })
          .select('*')
          .single();

        if (insertError) {
          saveErrors.push(insertError);
          continue;
        }

        savedConnection = insertedConnection;
      }

      if (savedConnection) {
        savedConnections.push(savedConnection);
      }
    }

    if (savedConnections.length === 0) {
      throw saveErrors[0] || new Error('Failed to save Google Calendar connection');
    }

    const syncResults = await Promise.all(
      savedConnections.map(async (connection) => {
        try {
          return await syncCalendarConnection(connection, { forceFullSync: true });
        } catch (syncError) {
          console.error(`Initial sync failed for ${connection.calendar_id}:`, syncError);
          return {
            success: false,
            stats: null,
            error: syncError,
          };
        }
      })
    );

    const hasPartialSyncFailure = saveErrors.length > 0 || syncResults.some((result) => !result.success);
    const redirectParams = new URLSearchParams({
      success: 'connected',
      provider: 'google',
    });

    if (hasPartialSyncFailure) {
      redirectParams.set('sync', 'partial');
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?${redirectParams.toString()}`
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=token_exchange_failed`
    );
  }
}
