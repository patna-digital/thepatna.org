import assert from "node:assert/strict";
import test from "node:test";
import {
  applyProjectChildRollups,
  attachProjectHierarchy,
  getSelectableParentProjects,
  isDescendantProject,
} from "./project-hierarchy.js";

test("getSelectableParentProjects excludes the current project and descendants", () => {
  const projects = [
    { id: "parent", title: "Parent" },
    { id: "child", parent_project_id: "parent", title: "Child" },
    { id: "grandchild", parent_project_id: "child", title: "Grandchild" },
    { id: "sibling", title: "Sibling" },
  ];

  assert.deepEqual(
    getSelectableParentProjects(projects, "parent").map((project) => project.id),
    ["sibling"]
  );
  assert.equal(isDescendantProject(projects, "parent", "grandchild"), true);
  assert.equal(isDescendantProject(projects, "child", "sibling"), false);
});

test("attachProjectHierarchy nests child projects and rolls child relationships into parents", () => {
  const [parent] = attachProjectHierarchy([
    {
      id: "parent",
      slug: "parent",
      title: "Parent project",
      project_event_links: [{ id: "direct-event", event_id: "event-1", relationship_type: "launch" }],
      project_content_links: [{ id: "direct-content", content_id: "content-1", relationship_type: "report" }],
      project_activities: [],
    },
    {
      id: "child",
      parent_project_id: "parent",
      short_title: "Child work",
      slug: "child",
      sort_order: 10,
      title: "Child project",
      project_event_links: [
        { id: "child-event", event_id: "event-2", relationship_type: "validation" },
      ],
      project_content_links: [
        { id: "child-content", content_id: "content-2", relationship_type: "brief" },
      ],
      project_activities: [
        { id: "child-activity", project_id: "child", title: "Validation workshop" },
      ],
    },
  ]);

  assert.deepEqual(parent.child_projects.map((project) => project.id), ["child"]);
  assert.equal(parent.project_event_links.length, 2);
  assert.equal(parent.project_content_links.length, 2);
  assert.equal(parent.project_activities.length, 1);
  assert.equal(parent.project_event_links[1].is_inherited_from_child, true);
  assert.equal(parent.project_event_links[1].inherited_from_project.short_title, "Child work");
});

test("applyProjectChildRollups keeps direct parent links over inherited duplicates", () => {
  const project = applyProjectChildRollups(
    {
      id: "parent",
      title: "Parent project",
      project_content_links: [
        { id: "direct-content", content_id: "content-1", relationship_type: "report" },
      ],
    },
    [
      {
        id: "child",
        title: "Child project",
        project_content_links: [
          { id: "child-content", content_id: "content-1", relationship_type: "report" },
        ],
      },
    ]
  );

  assert.deepEqual(
    project.project_content_links.map((link) => link.id),
    ["direct-content"]
  );
});
