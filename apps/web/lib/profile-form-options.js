export const PROFILE_VISIBILITY_OPTIONS = [
  {
    value: "members_only",
    label: "Members only",
    description: "Visible across the PATNA member workspace.",
    details: [
      "Full name, role, and organisation",
      "Professional bio and expertise tags",
      "Cohort assignment and country",
      "Contact link and public booking page (if enabled)",
      "Searchable and browsable in the member directory",
    ],
  },
  {
    value: "limited",
    label: "Limited",
    description: "Shown in selected member-facing contexts only.",
    details: [
      "Display name and role visible to other members",
      "Bio, expertise tags, and contact info are hidden",
      "Appears in directory with reduced detail",
      "Booking page link is not shown",
    ],
  },
  {
    value: "hidden",
    label: "Hidden",
    description: "Hidden from the wider PATNA member directory.",
    details: [
      "Profile does not appear in the member directory",
      "Not searchable or discoverable by other members",
      "Admins and workspace owners can still view your profile",
      "Booking page link is not shown",
    ],
  },
];

export const PROFILE_AVAILABILITY_OPTIONS = [
  {
    value: "available",
    label: "Available",
    description: "Open to collaboration, invitations, and new requests.",
  },
  {
    value: "unavailable",
    label: "Unavailable",
    description: "Not taking on new collaboration requests right now.",
  },
];

export const VALID_PROFILE_VISIBILITY_SETTINGS = PROFILE_VISIBILITY_OPTIONS.map((option) => option.value);
export const VALID_PROFILE_AVAILABILITY_STATUSES = PROFILE_AVAILABILITY_OPTIONS.map((option) => option.value);

export function isValidProfileVisibilitySetting(value) {
  return VALID_PROFILE_VISIBILITY_SETTINGS.includes(String(value || "").trim());
}

export function isValidProfileAvailabilityStatus(value) {
  return VALID_PROFILE_AVAILABILITY_STATUSES.includes(String(value || "").trim());
}

export function formatProfileVisibilitySetting(value) {
  return (
    PROFILE_VISIBILITY_OPTIONS.find((option) => option.value === value)?.label ||
    "Members only"
  );
}

export function formatProfileAvailabilityStatus(value) {
  return (
    PROFILE_AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label ||
    "Available"
  );
}
