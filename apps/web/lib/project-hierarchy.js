const ROLLUP_FIELDS = [
  {
    field: "project_activities",
    key: (item) => scopedKey(item.project_id, item.id || item.code || item.title),
  },
  {
    field: "project_contributions",
    key: (item) =>
      [
        item.member_profile_id ? `member:${item.member_profile_id}` : "",
        item.external_contributor_id ? `external:${item.external_contributor_id}` : "",
        item.contribution_type || "",
        item.role_label || "",
      ].join("|"),
  },
  {
    field: "project_content_links",
    key: (item) => scopedKey(item.content_id || item.content_items?.id, item.relationship_type),
  },
  {
    field: "project_countries",
    key: (item) => String(item.country_code || item.country || "").trim().toLowerCase(),
  },
  {
    field: "project_event_links",
    key: (item) => scopedKey(item.event_id || item.events?.id, item.relationship_type),
  },
  {
    field: "project_organization_links",
    key: (item) => scopedKey(item.organization_id || item.organizations?.id, item.relationship_type),
  },
];

export function getDescendantProjectIds(projects = [], projectId) {
  const rootId = String(projectId || "");
  if (!rootId) return new Set();

  const childrenByParentId = buildChildrenByParentId(projects);
  const descendants = new Set();
  const stack = [...(childrenByParentId.get(rootId) || [])];

  while (stack.length > 0) {
    const child = stack.pop();
    const childId = String(child?.id || "");
    if (!childId || descendants.has(childId)) continue;

    descendants.add(childId);
    stack.push(...(childrenByParentId.get(childId) || []));
  }

  return descendants;
}

export function getSelectableParentProjects(projects = [], currentProjectId = null) {
  const excludedIds = getDescendantProjectIds(projects, currentProjectId);
  if (currentProjectId) {
    excludedIds.add(String(currentProjectId));
  }

  return projects.filter((project) => {
    const id = String(project?.id || "");
    return id && !excludedIds.has(id);
  });
}

export function isDescendantProject(projects = [], ancestorId, candidateId) {
  if (!ancestorId || !candidateId) return false;
  return getDescendantProjectIds(projects, ancestorId).has(String(candidateId));
}

export function attachProjectHierarchy(projects = []) {
  const projectCopies = projects.filter(Boolean).map((project) => ({ ...project }));
  const projectsById = new Map(projectCopies.map((project) => [String(project.id), project]));
  const childrenByParentId = buildChildrenByParentId(projectCopies);
  const builtProjects = new Map();

  function buildProject(project, trail = new Set()) {
    const projectId = String(project?.id || "");
    if (!projectId) return project;
    if (builtProjects.has(projectId)) return builtProjects.get(projectId);
    if (trail.has(projectId)) {
      return { ...project, child_projects: [] };
    }

    const nextTrail = new Set(trail);
    nextTrail.add(projectId);
    const childProjects = sortProjects(childrenByParentId.get(projectId) || [])
      .map((child) => buildProject(child, nextTrail));
    const projectWithChildren = applyProjectChildRollups(
      {
        ...project,
        child_projects: childProjects,
      },
      childProjects
    );

    builtProjects.set(projectId, projectWithChildren);
    return projectWithChildren;
  }

  return projectCopies.map((project) => {
    const built = buildProject(project);
    const parentId = String(project.parent_project_id || "");
    const parentProject = parentId ? projectsById.get(parentId) : null;

    return parentProject && !built.parent_project
      ? { ...built, parent_project: pickProjectContext(parentProject) }
      : built;
  });
}

export function applyProjectChildRollups(project = {}, childProjects = []) {
  const nextProject = {
    ...project,
    child_projects: sortProjects(childProjects),
  };

  for (const { field, key } of ROLLUP_FIELDS) {
    nextProject[field] = mergeInheritedRows({
      childProjects,
      directRows: Array.isArray(project[field]) ? project[field] : [],
      field,
      key,
    });
  }

  return nextProject;
}

export function pickProjectContext(project = {}) {
  return {
    id: project.id,
    period_label: project.period_label || null,
    project_type: project.project_type || null,
    section: project.section || null,
    short_title: project.short_title || null,
    slug: project.slug,
    status_label: project.status_label || null,
    summary: project.summary || null,
    title: project.title,
  };
}

function buildChildrenByParentId(projects = []) {
  const childrenByParentId = new Map();

  for (const project of projects) {
    const parentId = String(project?.parent_project_id || "");
    if (!parentId) continue;

    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }
    childrenByParentId.get(parentId).push(project);
  }

  return childrenByParentId;
}

function mergeInheritedRows({ childProjects, directRows, field, key }) {
  const rows = [...directRows];
  const seen = new Set(rows.map((row) => key(row)).filter(Boolean));

  for (const childProject of childProjects) {
    const childRows = Array.isArray(childProject?.[field]) ? childProject[field] : [];
    for (const childRow of childRows) {
      const childKey = key(childRow);
      if (childKey && seen.has(childKey)) continue;
      if (childKey) seen.add(childKey);
      rows.push({
        ...childRow,
        inherited_from_project:
          childRow.inherited_from_project || pickProjectContext(childProject),
        is_inherited_from_child: true,
      });
    }
  }

  return rows;
}

function scopedKey(...parts) {
  return parts.map((part) => String(part || "").trim().toLowerCase()).join("|");
}

function sortProjects(projects = []) {
  return [...projects].sort((left, right) => {
    const leftOrder = Number.isFinite(Number(left?.sort_order)) ? Number(left.sort_order) : 0;
    const rightOrder = Number.isFinite(Number(right?.sort_order)) ? Number(right.sort_order) : 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    return String(left?.title || left?.slug || "").localeCompare(
      String(right?.title || right?.slug || "")
    );
  });
}
