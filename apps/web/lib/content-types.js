export const INSIGHT_CONTENT_TYPES = [
  { value: "report", label: "Report" },
  { value: "brief", label: "Brief" },
  { value: "case_study", label: "Case Study" },
  { value: "article", label: "Article" },
  { value: "workshop_proceedings", label: "Workshop Proceedings" },
];

export const INSIGHT_STATUSES = [
  { value: "draft", label: "Draft", color: "warning" },
  { value: "published", label: "Published", color: "success" },
  { value: "archived", label: "Archived", color: "muted" },
];

export const INSIGHT_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "members", label: "Members only" },
  { value: "restricted", label: "Restricted" },
];

export function formatContentType(type) {
  const typeMap = {
    report: "Report",
    brief: "Brief",
    case_study: "Case Study",
    article: "Article",
    workshop_proceedings: "Workshop Proceedings",
    blog: "Article",
    news: "News",
    event_output: "Event Output",
    learning_note: "Learning Note",
  };

  return typeMap[type] || type;
}

export function formatPublishStatus(status) {
  const statusMap = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };

  return statusMap[status] || status;
}

export function generateInsightSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
