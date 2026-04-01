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
    let calendarId = 'primary';
    
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      memberId = stateData.memberId;
      calendarId = stateData.calendarId || 'primary';
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

    // Fetch available calendars
    const calendarList = await fetchGoogleCalendars(
      tokens.accessToken,
      tokens.refreshToken
    );

    const primaryCalendar = calendarList.calendars.find((c) => c.primary) ||
      calendarList.calendars[0];

    const supabase = createSupabaseAdminClient();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('member_id', memberId)
      .eq('provider', 'google')
      .eq('provider_account_email', userInfo.email)
      .maybeSingle();

    if (existingConnection) {
      // Update existing connection
      await supabase
        .from('calendar_connections')
        .update({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt?.toISOString(),
          calendar_id: primaryCalendar?.id || 'primary',
          calendar_name: primaryCalendar?.name || 'Google Calendar',
          is_active: true,
          sync_enabled: true,
          last_sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      // Create new connection
      await supabase.from('calendar_connections').insert({
        member_id: memberId,
        provider: 'google',
        provider_account_email: userInfo.email,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt?.toISOString(),
        calendar_id: primaryCalendar?.id || 'primary',
        calendar_name: primaryCalendar?.name || 'Google Calendar',
        is_active: true,
        sync_enabled: true,
        scope: tokens.scope,
        auth_method: 'oauth',
      });
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?success=connected&provider=google`
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=token_exchange_failed`
    );
  }
}
