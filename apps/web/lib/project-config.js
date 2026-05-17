export const PROJECT_TYPES = [
  { value: "flagship_programme", label: "Flagship Programme" },
  { value: "convening", label: "Convening" },
  { value: "technical_analysis", label: "Technical Analysis" },
  { value: "capacity_building", label: "Capacity Building" },
];

export const PROJECT_SECTIONS = [
  { value: "flagship", label: "Flagship Programmes" },
  { value: "convening", label: "Regional Convenings" },
  { value: "other", label: "Other Projects" },
];

export const PROJECT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const PROJECT_STATUS_LABELS = ["Active", "Completed", "Upcoming", "Ongoing"];

export const PROJECT_ICON_TYPES = [
  { value: "globe", label: "Globe" },
  { value: "team", label: "Team / People" },
  { value: "layers", label: "Layers / Stack" },
  { value: "calendar", label: "Calendar" },
  { value: "chart", label: "Bar Chart" },
  { value: "check", label: "Checkmark" },
];

export const PROJECT_FOOTPRINT_HUB_TYPES = [
  { value: "convening", label: "Convening" },
  { value: "partner", label: "Partner anchor" },
  { value: "secretariat", label: "Secretariat" },
];

export const PROJECT_WORKSTREAM_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export const PROJECT_ACTIVITY_TYPES = [
  { value: "research", label: "Research" },
  { value: "convening", label: "Convening" },
  { value: "publication", label: "Publication" },
  { value: "negotiation_support", label: "Negotiation support" },
  { value: "capacity_building", label: "Capacity building" },
  { value: "coordination", label: "Coordination" },
  { value: "fellowship", label: "Fellowship" },
  { value: "milestone", label: "Milestone" },
  { value: "other", label: "Other" },
];

export const PROJECT_ORGANIZATION_RELATIONSHIP_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "research_partner", label: "Research partner" },
  { value: "strategic_partner", label: "Strategic partner" },
  { value: "funder", label: "Funder" },
  { value: "implementing_partner", label: "Implementing partner" },
  { value: "institutional_partner", label: "Institutional partner" },
  { value: "host", label: "Host" },
  { value: "co_organizer", label: "Co-organizer" },
  { value: "supporter", label: "Supporter" },
  { value: "participant", label: "Participant" },
  { value: "other", label: "Other" },
];

export const PROJECT_CONTRIBUTION_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "technical", label: "Technical" },
  { value: "policy", label: "Policy" },
  { value: "coordination", label: "Coordination" },
  { value: "facilitation", label: "Facilitation" },
  { value: "research", label: "Research" },
  { value: "communications", label: "Communications" },
  { value: "reviewer", label: "Reviewer" },
  { value: "participant", label: "Participant" },
  { value: "other", label: "Other" },
];

export const PROJECT_CONTENT_RELATIONSHIP_TYPES = [
  { value: "deliverable", label: "Deliverable" },
  { value: "report", label: "Report" },
  { value: "brief", label: "Brief" },
  { value: "tool", label: "Tool" },
  { value: "evidence", label: "Evidence" },
  { value: "output", label: "Output" },
  { value: "reference", label: "Reference" },
  { value: "planned_product", label: "Planned product" },
  { value: "other", label: "Other" },
];

export const PROJECT_EVENT_RELATIONSHIP_TYPES = [
  { value: "convening", label: "Convening" },
  { value: "launch", label: "Launch" },
  { value: "validation", label: "Validation" },
  { value: "presentation", label: "Presentation" },
  { value: "negotiation_session", label: "Negotiation session" },
  { value: "participation", label: "Participation" },
  { value: "output_source", label: "Output source" },
  { value: "other", label: "Other" },
];

export function formatProjectType(value) {
  return PROJECT_TYPES.find((type) => type.value === value)?.label || value || "";
}

export function formatProjectSection(value) {
  return PROJECT_SECTIONS.find((section) => section.value === value)?.label || value || "";
}

export function generateProjectSlug(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function getProjectHref(slug) {
  return `/projects/${slug}`;
}
