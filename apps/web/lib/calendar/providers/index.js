/**
 * Calendar Providers Index
 * Unified interface for all calendar providers
 */

export {
  CALENDAR_PROVIDERS,
  getOAuthConfig,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from './config.js';

export {
  getGoogleAuthClient,
  getGoogleCalendarClient,
  fetchGoogleCalendars,
  fetchGoogleEvents,
  createGoogleEvent,
  deleteGoogleEvent,
  buildGoogleEventRequestBody,
  mapGoogleEvent,
  setupGoogleWebhook,
  stopGoogleWebhook,
  getGoogleUserInfo,
} from './google.js';

export {
  fetchMicrosoftCalendars,
  fetchMicrosoftEvents,
  getMicrosoftUserInfo,
  setupMicrosoftWebhook,
  renewMicrosoftWebhook,
  deleteMicrosoftWebhook,
} from './microsoft.js';

export {
  fetchAndParseICal,
  parseICalData,
  expandRecurringEvent,
  validateICalUrl,
} from './ical.js';

// Provider-specific fetch functions map
export const PROVIDER_FETCHERS = {
  google: {
    fetchCalendars: 'fetchGoogleCalendars',
    fetchEvents: 'fetchGoogleEvents',
    getUserInfo: 'getGoogleUserInfo',
    setupWebhook: 'setupGoogleWebhook',
    stopWebhook: 'stopGoogleWebhook',
  },
  microsoft: {
    fetchCalendars: 'fetchMicrosoftCalendars',
    fetchEvents: 'fetchMicrosoftEvents',
    getUserInfo: 'getMicrosoftUserInfo',
    setupWebhook: 'setupMicrosoftWebhook',
    renewWebhook: 'renewMicrosoftWebhook',
    stopWebhook: 'deleteMicrosoftWebhook',
  },
  generic_ical: {
    fetchEvents: 'fetchAndParseICal',
    validateUrl: 'validateICalUrl',
  },
};

// Unified function to fetch events from any provider
export async function fetchProviderEvents(provider, accessToken, calendarId, options, refreshToken) {
  switch (provider) {
    case 'google': {
      const { fetchGoogleEvents } = await import('./google.js');
      return fetchGoogleEvents(accessToken, calendarId, options, refreshToken);
    }

    case 'microsoft': {
      const { fetchMicrosoftEvents } = await import('./microsoft.js');
      return fetchMicrosoftEvents(accessToken, calendarId, options, refreshToken);
    }

    case 'generic_ical': {
      // For iCal, accessToken is the feed URL
      const { fetchAndParseICal } = await import('./ical.js');
      return fetchAndParseICal(accessToken, options);
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Unified function to fetch calendars from any provider
export async function fetchProviderCalendars(provider, accessToken, refreshToken) {
  switch (provider) {
    case 'google': {
      const { fetchGoogleCalendars } = await import('./google.js');
      return fetchGoogleCalendars(accessToken, refreshToken);
    }

    case 'microsoft': {
      const { fetchMicrosoftCalendars } = await import('./microsoft.js');
      return fetchMicrosoftCalendars(accessToken, refreshToken);
    }

    case 'generic_ical':
      // iCal feeds don't have a calendar list concept
      return { calendars: [] };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Unified function to get user info from any provider
export async function fetchProviderUserInfo(provider, accessToken, refreshToken) {
  switch (provider) {
    case 'google': {
      const { getGoogleUserInfo } = await import('./google.js');
      return getGoogleUserInfo(accessToken, refreshToken);
    }

    case 'microsoft': {
      const { getMicrosoftUserInfo } = await import('./microsoft.js');
      return getMicrosoftUserInfo(accessToken, refreshToken);
    }

    default:
      return { email: null, name: null };
  }
}
