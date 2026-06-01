import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSpaceJoinRequestContext,
  buildSpaceJoinRequestDetails,
  isClosedSpaceJoinRequestStatus,
  isSpaceJoinRequestContext,
  parseSpaceJoinRequestDetails,
} from "./space-join-requests.js";

test("buildSpaceJoinRequestContext creates a stable service request context key", () => {
  assert.equal(
    buildSpaceJoinRequestContext("space-123"),
    "space_join_request:space-123",
  );
  assert.equal(isSpaceJoinRequestContext("space_join_request:space-123"), true);
  assert.equal(isSpaceJoinRequestContext("other_context"), false);
});

test("buildSpaceJoinRequestDetails and parseSpaceJoinRequestDetails round-trip structured join request fields", () => {
  const details = buildSpaceJoinRequestDetails({
    message: "I contribute to this working group already.",
    requesterUserId: "user-456",
    spaceId: "space-123",
    spaceName: "IMO Strategy WG",
    spaceSlug: "imo-strategy-working-group",
  });

  assert.deepEqual(parseSpaceJoinRequestDetails(details), {
    category: "space_join",
    requesterMessage: "I contribute to this working group already.",
    requesterUserId: "user-456",
    spaceId: "space-123",
    spaceName: "IMO Strategy WG",
    spaceSlug: "imo-strategy-working-group",
  });
});

test("isClosedSpaceJoinRequestStatus matches the closed terminal state", () => {
  assert.equal(isClosedSpaceJoinRequestStatus("closed"), true);
  assert.equal(isClosedSpaceJoinRequestStatus("new"), false);
});
