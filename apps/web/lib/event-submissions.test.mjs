import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEventSubmissionSummary,
  normaliseEventSubmissionRow,
} from "./event-submissions.js";

test("normaliseEventSubmissionRow formats names and list fields", () => {
  const row = normaliseEventSubmissionRow({
    id: "submission_1",
    title: "IMO coordination meeting",
    organising_institutions: ["PATNA Initiative", "IMO"],
    themes: "Decarbonisation;\nNegotiation",
    submission_status: "APPROVED",
    submitted_by_profile: {
      first_name: "Ada",
      surname: "Lovelace",
      email: "ada@example.com",
    },
    reviewed_by_profile: {
      first_name: "Grace",
      surname: "Hopper",
      email: "grace@example.com",
    },
    approved_event: {
      title: "IMO coordination meeting",
      slug: "imo-coordination-meeting",
    },
  });

  assert.equal(row.submission_status, "approved");
  assert.deepEqual(row.organising_institutions, ["PATNA Initiative", "IMO"]);
  assert.deepEqual(row.themes, ["Decarbonisation", "Negotiation"]);
  assert.equal(row.submittedByName, "Ada Lovelace");
  assert.equal(row.reviewedByName, "Grace Hopper");
  assert.equal(row.approvedEventSlug, "imo-coordination-meeting");
});

test("buildEventSubmissionSummary counts queue states", () => {
  const summary = buildEventSubmissionSummary([
    { submission_status: "submitted" },
    { submission_status: "submitted" },
    { submission_status: "approved" },
    { submission_status: "rejected" },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    submitted: 2,
    approved: 1,
    rejected: 1,
  });
});
