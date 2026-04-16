function truncateText(value, maxLength = 280) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function normalizeErrorText(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeDriveProviderError(value) {
  const normalized = normalizeErrorText(value);
  const lowercase = normalized.toLowerCase();

  if (!normalized) {
    return "Unknown error.";
  }

  if (lowercase.includes("google_drive_api_key is not configured")) {
    return "GOOGLE_DRIVE_API_KEY is not configured.";
  }

  if (
    lowercase.includes("we're sorry")
    || lowercase.includes("google drive - sorry")
    || lowercase.includes("google docs - sorry")
    || (lowercase.includes("sorry") && lowercase.includes("google"))
  ) {
    return "Google Drive blocked the request. Check the API key restrictions, quota, and sharing settings.";
  }

  if (
    lowercase.includes("can't process your request right now")
    || lowercase.includes("computer or network may be sending automated queries")
  ) {
    return "Google Drive blocked the request. Check the API key restrictions, quota, and sharing settings.";
  }

  return truncateText(normalized);
}

export function summarizeSyncErrorReason(value) {
  const normalized = normalizeErrorText(value);
  const lowercase = normalized.toLowerCase();
  const nestedDriveErrorIndex = Math.min(
    ...["drive api list error", "drive api download error"]
      .map((token) => {
        const index = lowercase.indexOf(token);
        return index >= 0 ? index : Number.POSITIVE_INFINITY;
      }),
  );

  if (!normalized) {
    return "Unknown sync error.";
  }

  if (Number.isFinite(nestedDriveErrorIndex) && nestedDriveErrorIndex > 0) {
    const leading = normalized.slice(0, nestedDriveErrorIndex).trim();
    const nested = summarizeSyncErrorReason(normalized.slice(nestedDriveErrorIndex));
    return leading ? `${leading} ${nested}` : nested;
  }

  if (lowercase.startsWith("drive api list error") || lowercase.startsWith("drive api download error")) {
    const separatorIndex = normalized.indexOf(":");
    const prefix = separatorIndex >= 0 ? normalized.slice(0, separatorIndex + 1) : "";
    const detail = separatorIndex >= 0 ? normalized.slice(separatorIndex + 1) : normalized;
    const summarizedDetail = summarizeDriveProviderError(detail);
    return prefix ? `${prefix} ${summarizedDetail}` : summarizedDetail;
  }

  return truncateText(normalized);
}

export function formatStoredSyncSummary(value) {
  return String(value || "")
    .split(/\s*;\s+/)
    .map((part) => summarizeSyncErrorReason(part))
    .filter(Boolean)
    .join("\n");
}
