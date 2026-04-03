const CONFERENCE_PATTERNS = [
  {
    provider: "google_meet",
    pattern: /https:\/\/meet\.google\.com\/[a-z0-9-]+/i,
  },
  {
    provider: "zoom",
    pattern: /https:\/\/(?:[\w-]+\.)?zoom\.us\/(?:j|my|wc)\/[^\s<>"')]+/i,
  },
  {
    provider: "microsoft_teams",
    pattern: /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"')]+/i,
  },
  {
    provider: "google_meet",
    pattern: /https:\/\/workspace\.google\.com\/meeting\/[^\s<>"')]+/i,
  },
];

function cleanUrl(value) {
  return String(value || "").trim().replace(/[),.;]+$/g, "");
}

function flattenValues(values) {
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return flattenValues(value);
    }

    if (typeof value === "object") {
      return flattenValues(Object.values(value));
    }

    return [String(value)];
  });
}

export function findConferenceLink(...values) {
  const candidates = flattenValues(values);

  for (const candidate of candidates) {
    for (const { provider, pattern } of CONFERENCE_PATTERNS) {
      const match = candidate.match(pattern);

      if (match?.[0]) {
        return {
          url: cleanUrl(match[0]),
          provider,
        };
      }
    }
  }

  return null;
}

function normalizeGoogleConferenceProvider(event, fallbackProvider = null) {
  const solutionType = event?.conferenceData?.conferenceSolution?.key?.type;

  if (solutionType === "hangoutsMeet" || solutionType === "eventHangout") {
    return "google_meet";
  }

  if (solutionType === "addOn") {
    return fallbackProvider || "video";
  }

  return fallbackProvider;
}

export function extractGoogleConferenceDetails(event = {}) {
  const entryPoints = Array.isArray(event.conferenceData?.entryPoints)
    ? event.conferenceData.entryPoints
    : [];
  const videoEntryPoint = entryPoints.find((entryPoint) => entryPoint?.entryPointType === "video");
  const explicitConferenceUrl = cleanUrl(
    event.hangoutLink ||
      videoEntryPoint?.uri ||
      "",
  );
  const fallbackConference = findConferenceLink(
    event.location,
    event.description,
    entryPoints.map((entryPoint) => entryPoint?.uri || ""),
  );
  const conferenceUrl = explicitConferenceUrl || fallbackConference?.url || null;
  const conferenceProvider = conferenceUrl
    ? normalizeGoogleConferenceProvider(event, fallbackConference?.provider || "video")
    : null;

  const hasConferencePayload =
    Boolean(conferenceUrl) ||
    Boolean(event.hangoutLink) ||
    entryPoints.length > 0 ||
    Boolean(event.conferenceData?.conferenceId);

  return {
    conferenceUrl,
    conferenceProvider,
    conferenceData: hasConferencePayload
      ? {
          conferenceId: event.conferenceData?.conferenceId || null,
          conferenceSolution: event.conferenceData?.conferenceSolution || null,
          entryPoints,
          hangoutLink: event.hangoutLink || null,
        }
      : null,
  };
}

export function getConferenceCtaLabel(provider) {
  switch (provider) {
    case "google_meet":
      return "Join Google Meet";
    case "zoom":
      return "Join Zoom";
    case "microsoft_teams":
      return "Join Teams";
    default:
      return "Join meeting";
  }
}
