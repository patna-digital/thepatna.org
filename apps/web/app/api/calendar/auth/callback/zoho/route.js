/**
 * Zoho Calendar OAuth Callback Handler
 * Handles the OAuth redirect from Zoho after user authorization
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens } from '@/lib/calendar/providers';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Zoho OAuth error:', error);
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
    const tokens = await exchangeCodeForTokens('zoho', code);

    // Note: Zoho requires additional API calls to get user info and calendars
    // For now, we'll store the connection with basic info
    // TODO: Implement Zoho Calendar API integration

    const supabase = createSupabaseAdminClient();

    // Create or update connection
    const { data: existingConnection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('member_id', memberId)
      .eq('provider', 'zoho')
      .maybeSingle();

    if (existingConnection) {
      await supabase
        .from('calendar_connections')
        .update({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt?.toISOString(),
          is_active: true,
          sync_enabled: true,
          last_sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      await supabase.from('calendar_connections').insert({
        member_id: memberId,
        provider: 'zoho',
        provider_account_email: null, // Will be populated during sync
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt?.toISOString(),
        calendar_name: 'Zoho Calendar',
        is_active: true,
        sync_enabled: true,
        scope: tokens.scope,
        auth_method: 'oauth',
      });
    }

    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?success=connected&provider=zoho`
    );
  } catch (error) {
    console.error('Zoho OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app/calendar/settings?error=token_exchange_failed`
    );
  }
}
