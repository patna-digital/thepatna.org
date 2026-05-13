import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectRelationshipSummary } from "./projects.js";

test("buildProjectRelationshipSummary counts normalized relationship arrays", () => {
  assert.deepEqual(
    buildProjectRelationshipSummary({
      project_activities: [{ id: "a1" }],
      project_content_links: [{ id: "c1" }, { id: "c2" }],
      project_contributions: [{ id: "u1" }],
      project_event_links: [{ id: "e1" }],
      project_organization_links: [{ id: "o1" }, { id: "o2" }],
      project_workstreams: [{ id: "w1" }],
    }),
    {
      activities: 1,
      contributors: 1,
      events: 1,
      organizations: 2,
      publications: 2,
      workstreams: 1,
    },
  );
});

test("buildProjectRelationshipSummary treats missing relationship arrays as empty", () => {
  assert.deepEqual(buildProjectRelationshipSummary({}), {
    activities: 0,
    contributors: 0,
    events: 0,
    organizations: 0,
    publications: 0,
    workstreams: 0,
  });
});
