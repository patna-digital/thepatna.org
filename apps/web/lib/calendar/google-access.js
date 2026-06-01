export const GOOGLE_WRITABLE_ACCESS_ROLES = new Set(["owner", "writer"]);

function getAccessRoleValue(valueOrConnection) {
  if (typeof valueOrConnection === "string") {
    return valueOrConnection;
  }

  return valueOrConnection?.access_role || valueOrConnection?.accessRole || "";
}

export function normalizeGoogleCalendarAccessRole(valueOrConnection) {
  return String(getAccessRoleValue(valueOrConnection) || "").trim().toLowerCase();
}

export function isGoogleCalendarWriteCapable(valueOrConnection, { allowUnknown = false } = {}) {
  const accessRole = normalizeGoogleCalendarAccessRole(valueOrConnection);

  if (!accessRole) {
    return allowUnknown;
  }

  return GOOGLE_WRITABLE_ACCESS_ROLES.has(accessRole);
}

export function isGoogleCalendarAccessKnown(valueOrConnection) {
  return Boolean(normalizeGoogleCalendarAccessRole(valueOrConnection));
}

export function isUnknownGoogleCalendarAccess(valueOrConnection) {
  return !isGoogleCalendarAccessKnown(valueOrConnection);
}

export function isKnownReadOnlyGoogleCalendar(valueOrConnection) {
  const accessRole = normalizeGoogleCalendarAccessRole(valueOrConnection);

  if (!accessRole) {
    return false;
  }

  return !GOOGLE_WRITABLE_ACCESS_ROLES.has(accessRole);
}

export function getGoogleCalendarAccessLabel(valueOrConnection) {
  const accessRole = normalizeGoogleCalendarAccessRole(valueOrConnection);

  const labels = {
    owner: "Owner",
    writer: "Writer",
    reader: "Read-only",
    freebusyreader: "Free/busy only",
  };

  return labels[accessRole] || (accessRole ? accessRole : "Access unknown");
}
