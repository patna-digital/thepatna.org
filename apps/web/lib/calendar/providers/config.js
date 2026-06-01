/**
 * Calendar Provider Configuration
 * OAuth settings and provider metadata for external calendar integrations
 */

// Provider metadata and display configuration
export const CALENDAR_PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google Calendar',
    icon: '🔍',
    color: '#4285F4',
    status: 'available',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    supportsWebhook: true,
    supportsSync: true,
    supportsWriteBack: true,
  },
  microsoft: {
    id: 'microsoft',
    name: 'Outlook Calendar',
    icon: '📧',
    color: '#0078D4',
    status: 'available',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'Calendars.Read',
      'Calendars.Read.Shared',
      'User.Read',
    ],
    supportsWebhook: true,
    supportsSync: true,
    supportsWriteBack: false,
  },
  apple: {
    id: 'apple',
    name: 'Apple Calendar',
    icon: '🍎',
    color: '#FF9500',
    status: 'available',
    // Apple uses App-specific passwords or iCloud integration
    // For now, we'll use CalDAV or iCal URL approach
    supportsWebhook: false,
    supportsSync: false, // Requires app-specific implementation
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho Calendar',
    icon: '📊',
    color: '#E42527',
    status: 'coming_soon',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    scopes: [
      'ZohoCalendar.calendar.READ',
      'ZohoCalendar.event.READ',
    ],
    supportsWebhook: false,
    supportsSync: true,
    supportsWriteBack: false,
  },
  generic_ical: {
    id: 'generic_ical',
    name: 'iCal Feed',
    icon: '📅',
    color: '#6B7280',
    status: 'available',
    // iCal feeds use direct URL import, no OAuth
    supportsWebhook: false,
    supportsSync: true,
    supportsWriteBack: false,
  },
};

// Get OAuth client configuration from environment
export function getOAuthConfig(provider) {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/auth/callback/google`,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/auth/callback/microsoft`,
    },
    zoho: {
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/auth/callback/zoho`,
    },
  };

  return configs[provider] || null;
}

// Generate OAuth authorization URL
export function generateAuthUrl(provider, state) {
  const config = CALENDAR_PROVIDERS[provider];
  const oauthConfig = getOAuthConfig(provider);

  if (!config || !oauthConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(provider, code) {
  const config = CALENDAR_PROVIDERS[provider];
  const oauthConfig = getOAuthConfig(provider);

  if (!config || !oauthConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: oauthConfig.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
    scope: data.scope,
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(provider, refreshToken) {
  const config = CALENDAR_PROVIDERS[provider];
  const oauthConfig = getOAuthConfig(provider);

  if (!config || !oauthConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
    scope: data.scope,
  };
}
