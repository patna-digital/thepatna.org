import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessPublicationFile,
  isPublicationManager,
} from "./publication-file-access.js";

test("publication managers include admins, publishers, and super admins", () => {
  assert.equal(isPublicationManager({ roles: ["administrator"] }), true);
  assert.equal(isPublicationManager({ roles: ["publisher"] }), true);
  assert.equal(isPublicationManager({ profile: { is_super_admin: true }, roles: [] }), true);
  assert.equal(isPublicationManager({ roles: ["member"] }), false);
});

test("public published publication files are available anonymously", () => {
  assert.equal(
    canAccessPublicationFile({
      contentItem: { publish_status: "published", visibility: "public" },
    }),
    true,
  );
});

test("member publications require an authenticated user unless managed", () => {
  const contentItem = { publish_status: "published", visibility: "members" };

  assert.equal(canAccessPublicationFile({ contentItem }), false);
  assert.equal(canAccessPublicationFile({ contentItem, user: { id: "user-1" } }), true);
  assert.equal(canAccessPublicationFile({ contentItem, roles: ["publisher"] }), true);
});

test("restricted or draft publication files require publication manager access", () => {
  assert.equal(
    canAccessPublicationFile({
      contentItem: { publish_status: "published", visibility: "restricted" },
      user: { id: "user-1" },
    }),
    false,
  );
  assert.equal(
    canAccessPublicationFile({
      contentItem: { publish_status: "draft", visibility: "public" },
      roles: ["administrator"],
    }),
    true,
  );
});
