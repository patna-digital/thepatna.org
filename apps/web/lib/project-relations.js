export function buildProjectRelationshipSummary(project = {}) {
  return {
    activities: Array.isArray(project.project_activities) ? project.project_activities.length : 0,
    contributors: Array.isArray(project.project_contributions) ? project.project_contributions.length : 0,
    events: Array.isArray(project.project_event_links) ? project.project_event_links.length : 0,
    organizations: Array.isArray(project.project_organization_links)
      ? project.project_organization_links.length
      : 0,
    publications: Array.isArray(project.project_content_links) ? project.project_content_links.length : 0,
    workstreams: Array.isArray(project.project_workstreams) ? project.project_workstreams.length : 0,
  };
}
