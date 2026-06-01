export const SPACE_TYPES = [
  { value: "cohort", label: "Cohort" },
  { value: "constituency", label: "Constituency" },
  { value: "working_group", label: "Working Group" },
  { value: "geography", label: "Geography" },
];

export const SPACE_VISIBILITY = [
  { value: "public_members", label: "All members" },
  { value: "invite_only", label: "Invite only" },
  { value: "private", label: "Private" },
];

export const SPACE_MEMBER_ROLES = [
  { value: "member", label: "Member" },
  { value: "moderator", label: "Moderator" },
  { value: "lead", label: "Lead" },
];

export function generateSpaceSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatSpaceType(type) {
  const map = {
    cohort: "Cohort",
    constituency: "Constituency",
    working_group: "Working Group",
    geography: "Geography",
  };

  return map[type] || type;
}

export function formatSpaceVisibility(visibility) {
  const map = {
    public_members: "All members",
    invite_only: "Invite only",
    private: "Private",
  };

  return map[visibility] || visibility;
}
