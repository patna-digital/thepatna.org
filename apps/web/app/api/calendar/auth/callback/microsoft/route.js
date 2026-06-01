/**
 * Microsoft Outlook OAuth Callback Handler
 * Handles the OAuth redirect from Microsoft after user authorization
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  exchangeCodeForTokens,
  fetchMicrosoftCalendars,
  getMicrosoftUserInfo,
} from '@/lib/calendar/providers';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Get base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Microsoft OAuth error:', error, errorDescription);
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
    const tokens = await exchangeCodeForTokens('microsoft', code);

    // Get user info
    const userInfo = await getMicrosoftUserInfo(
      tokens.accessToken,
      tokens.refreshToken
    );

    // Fetch available calendars
    const calendarList = await fetchMicrosoftCalendars(
      tokens.accessToken,
      tokens.refreshToken
    );

    const defaultCalendar = calendarList.calendars.find((c) => c.primary) ||
      calendarList.calendars[0];

    const supabase = createSupabaseAdminClient();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('member_id', memberId)
      .eq('provider', 'microsoft')
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
          calendar_id: defaultCalendar?.id,
          calendar_name: defaultCalendar?.name || 'Outlook Calendar',
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
        provider: 'microsoft',
        provider_account_email: userInfo.email,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt?.toISOString(),
        calendar_id: defaultCalendar?.id,
        calendar_name: defaultCalendar?.name || 'Outlook Calendar',
        is_active: true,
        sync_enabled: true,
        scope: tokens.scope,
        auth_method: 'oauth',
      });
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?success=connected&provider=microsoft`
    );
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=token_exchange_failed`
    );
  }
}
