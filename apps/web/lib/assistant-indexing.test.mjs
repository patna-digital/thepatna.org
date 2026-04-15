import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCommentAssistantPayload,
  buildCommunityApplicationAssistantPayload,
  buildContentItemAssistantPayload,
  buildEventAssistantPayload,
  buildProfileAssistantPayload,
  buildThreadAssistantPayload,
  shouldSyncExternalFile,
  summarizeExternalSyncErrors,
} from "./assistant-indexing.js";

test("buildEventAssistantPayload maps restricted events to admin-only visibility", () => {
  const payload = buildEventAssistantPayload({
    id: "event_1",
    title: "Restricted PATNA event",
    summary: "Members-only briefing",
    body: "<p>Important update</p>",
    event_type: "Briefing",
    location: "Lagos",
    starts_at: "2026-04-20T00:00:00.000Z",
    ends_at: null,
    display_date: "",
    visibility: "restricted",
    status: "published",
    schedule_status: "upcoming",
    themes: ["GHG"],
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/events/event_1");
  assert.match(payload.content_text, /Important update/);
});

test("buildContentItemAssistantPayload skips drafts and maps restricted publications to admin-only", () => {
  assert.equal(
    buildContentItemAssistantPayload({
      id: "draft_1",
      title: "Draft",
      publish_status: "draft",
      visibility: "members",
    }),
    null,
  );

  const payload = buildContentItemAssistantPayload({
    id: "content_1",
    title: "Restricted brief",
    slug: "restricted-brief",
    summary: "Internal PATNA brief",
    body: "<p>Internal only</p>",
    content_type: "brief",
    visibility: "restricted",
    publish_status: "published",
    published_at: "2026-04-01T00:00:00.000Z",
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/insights/content_1");
});

test("buildThreadAssistantPayload and buildCommentAssistantPayload preserve space paths", () => {
  const threadPayload = buildThreadAssistantPayload({
    id: "thread_1",
    space_id: "space_1",
    title: "Levy coordination",
    body: "<p>Discussion body</p>",
    updated_at: "2026-04-10T10:00:00.000Z",
    spaces: { name: "Policy Cohort", slug: "policy-cohort" },
  });

  const commentPayload = buildCommentAssistantPayload({
    id: "comment_1",
    body: "<p>Reply body</p>",
    updated_at: "2026-04-10T10:10:00.000Z",
    thread: {
      id: "thread_1",
      title: "Levy coordination",
      space_id: "space_1",
      space_name: "Policy Cohort",
      space_slug: "policy-cohort",
    },
  });

  assert.equal(threadPayload.metadata.path, "/app/spaces/policy-cohort/threads/thread_1");
  assert.equal(commentPayload.metadata.path, "/app/spaces/policy-cohort/threads/thread_1#replies");
  assert.match(commentPayload.content_text, /Reply in Levy coordination/);
});

test("buildProfileAssistantPayload drops hidden profiles and strips sensitive contact fields", () => {
  const hiddenPayload = buildProfileAssistantPayload({
    profile: {
      id: "profile_hidden",
      visibility_setting: "hidden",
      onboarding_status: "active",
      profile_status: "active",
    },
  });

  assert.equal(hiddenPayload, null);

  const visiblePayload = buildProfileAssistantPayload({
    profile: {
      id: "profile_1",
      first_name: "Ada",
      surname: "Lovelace",
      role_title: "Policy Lead",
      organisation_name: "PATNA",
      country_of_residence: "Nigeria",
      professional_bio: "Works on <strong>SIDS</strong> policy.",
      visibility_setting: "members_only",
      onboarding_status: "active",
      profile_status: "active",
      availability_status: "available",
    },
    cohortProfile: {
      focus_area: "Small island developing states",
      domain_knowledge: "GHG levy and negotiation strategy",
    },
    primaryCohort: { name: "Policy Cohort" },
    tags: [{ name: "SIDS" }, { name: "GHG" }],
  });

  assert.equal(visiblePayload.visibility, "members");
  assert.equal(visiblePayload.metadata.path, "/app/members");
  assert.doesNotMatch(visiblePayload.content_text, /@/);
  assert.match(visiblePayload.content_text, /SIDS/);
});

test("buildCommunityApplicationAssistantPayload stays admin-only", () => {
  const payload = buildCommunityApplicationAssistantPayload({
    application: {
      id: "app_1",
      first_name: "Grace",
      surname: "Hopper",
      status: "submitted",
      organisation: "IMO",
      role_title: "Advisor",
      country: "Liberia",
      motivation_text: "Interested in PATNA collaboration.",
      expertise_slugs: ["policy", "finance"],
      engagement_slugs: ["membership"],
      submitted_at: "2026-04-09T09:00:00.000Z",
    },
    assignedCohortName: "Policy Cohort",
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/applications");
  assert.match(payload.content_text, /Policy Cohort/);
});

test("summarizeExternalSyncErrors groups repeated root causes for drive syncs", () => {
  const summary = summarizeExternalSyncErrors([
    { title: "A.pdf", reason: 'embed-document failed: {"code":"NOT_FOUND","message":"Requested function was not found"}' },
    { title: "B.pdf", reason: 'embed-document failed: {"code":"NOT_FOUND","message":"Requested function was not found"}' },
    { title: "C.pdf", reason: "PDF produced no extractable text." },
    { title: "D.pdf", reason: 'embed-document failed: {"error":"Unsupported source_type"}' },
  ]);

  assert.deepEqual(
    summary.map(({ kind, count }) => ({ kind, count })),
    [
      { kind: "embedding_function_missing", count: 2 },
      { kind: "text_extraction_failed", count: 1 },
      { kind: "embedding_payload_rejected", count: 1 },
    ],
  );
});

test("shouldSyncExternalFile retries unchanged files that previously failed", () => {
  const driveFile = { md5Checksum: "abc", modifiedTime: "2026-04-12T00:00:00.000Z" };

  assert.equal(
    shouldSyncExternalFile(driveFile, {
      checksum_or_version: "abc",
      status: "error",
    }),
    true,
  );

  assert.equal(
    shouldSyncExternalFile(driveFile, {
      checksum_or_version: "abc",
      status: "indexed",
    }),
    false,
  );
});
