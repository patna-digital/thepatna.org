export const AVAILABILITY_TODAY_OPTIONS = [
  { value: "normal", label: "Normal agreed hours" },
  { value: "different", label: "Different today" },
];

export const PRIORITIES_PROGRESS_OPTIONS = [
  { value: "all", label: "All completed" },
  { value: "mostly", label: "Mostly completed" },
  { value: "partially", label: "Partially completed" },
  { value: "not_completed", label: "Not completed" },
];

export const WELLBEING_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "under_pressure", label: "Under pressure" },
  { value: "contact_me", label: "Please contact me" },
];

export const PROJECT_WORKED_ON_OPTIONS = [
  "ARISE Programme",
  "LEAP Phase 3",
  "Carbon Market Watch",
  "Maritime Study Consultancy",
  "Partnerships",
  "Governance",
  "Operations",
  "Communications",
  "Membership",
  "Finance",
];

export const VALID_AVAILABILITY_TODAY_VALUES = AVAILABILITY_TODAY_OPTIONS.map((option) => option.value);
export const VALID_PRIORITIES_PROGRESS_VALUES = PRIORITIES_PROGRESS_OPTIONS.map((option) => option.value);
export const VALID_WELLBEING_VALUES = WELLBEING_OPTIONS.map((option) => option.value);

export function formatAvailabilityToday(value) {
  return AVAILABILITY_TODAY_OPTIONS.find((option) => option.value === value)?.label || "";
}

export function formatPrioritiesProgress(value) {
  return PRIORITIES_PROGRESS_OPTIONS.find((option) => option.value === value)?.label || "";
}

export function formatWellbeing(value) {
  return WELLBEING_OPTIONS.find((option) => option.value === value)?.label || "";
}

export function isFlaggedWellbeing(value) {
  return value === "under_pressure" || value === "contact_me";
}
