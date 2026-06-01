import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExternalPublicationAttachmentValues,
  extractPublicationStoragePath,
  findPrimaryPublicationAttachment,
  getNextPrimaryAttachment,
  normalisePublicationAttachment,
  orderPublicationAttachments,
  resolvePublicationAttachmentAsset,
} from "./publication-attachments.js";

test("resolvePublicationAttachmentAsset recognises managed publication storage URLs", () => {
  const asset = resolvePublicationAttachmentAsset({
    file_url: "https://example.supabase.co/storage/v1/object/public/publications/admin-1/report.pdf",
  });

  assert.equal(asset.source_kind, "storage");
  assert.equal(asset.storage_path, "admin-1/report.pdf");
});

test("normalisePublicationAttachment preserves legacy external URLs", () => {
  const attachment = normalisePublicationAttachment({
    file_url: "https://drive.google.com/file/d/legacy-report",
    title: "Legacy report",
  });

  assert.equal(attachment.source_kind, "external");
  assert.equal(attachment.original_url, "https://drive.google.com/file/d/legacy-report");
  assert.equal(attachment.storage_path, "");
});

test("orderPublicationAttachments sorts primary first before archive order", () => {
  const ordered = orderPublicationAttachments([
    { id: "b", is_primary: false, sort_order: 1 },
    { id: "a", is_primary: true, sort_order: 3 },
    { id: "c", is_primary: false, sort_order: 0 },
  ]);

  assert.deepEqual(
    ordered.map((attachment) => attachment.id),
    ["a", "c", "b"],
  );
});

test("findPrimaryPublicationAttachment falls back to the first pdf when no primary is marked", () => {
  const attachment = findPrimaryPublicationAttachment([
    { id: "1", file_url: "https://example.com/image.png", file_type: "image/png", sort_order: 0 },
    { id: "2", file_url: "https://example.com/report.pdf", file_type: "application/pdf", sort_order: 1 },
  ]);

  assert.equal(attachment?.id, "2");
});

test("getNextPrimaryAttachment promotes the next ordered attachment after removal", () => {
  const next = getNextPrimaryAttachment([
    { id: "1", is_primary: true, sort_order: 0 },
    { id: "2", is_primary: false, sort_order: 1 },
    { id: "3", is_primary: false, sort_order: 2 },
  ], "1");

  assert.equal(next?.id, "2");
});

test("buildExternalPublicationAttachmentValues rejects invalid URLs", () => {
  assert.throws(
    () => buildExternalPublicationAttachmentValues({ fileUrl: "not-a-url" }),
    /valid external file URL/i,
  );
});

test("extractPublicationStoragePath reads public bucket URLs", () => {
  assert.equal(
    extractPublicationStoragePath("https://example.supabase.co/storage/v1/object/public/publications/folder/file.pdf"),
    "folder/file.pdf",
  );
});
