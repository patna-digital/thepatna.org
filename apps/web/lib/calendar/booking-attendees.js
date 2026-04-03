const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function flattenEmailInput(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenEmailInput(item));
  }

  return String(value || "").split(/[\n,;]+/);
}

export function normalizeEmailAddress(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmailAddress(value) {
  return EMAIL_PATTERN.test(normalizeEmailAddress(value));
}

export function normalizeGuestEmailsInput(value, { primaryEmail = "" } = {}) {
  const normalizedPrimaryEmail = normalizeEmailAddress(primaryEmail);
  const uniqueEmails = new Set();
  const guestEmails = [];
  const invalidEmails = [];

  for (const rawValue of flattenEmailInput(value)) {
    const email = normalizeEmailAddress(rawValue);

    if (!email || email === normalizedPrimaryEmail || uniqueEmails.has(email)) {
      continue;
    }

    if (!isValidEmailAddress(email)) {
      invalidEmails.push(email);
      continue;
    }

    uniqueEmails.add(email);
    guestEmails.push(email);
  }

  return {
    guestEmails,
    invalidEmails,
  };
}
