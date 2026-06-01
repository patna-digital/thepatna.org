import test from "node:test";
import assert from "node:assert/strict";
import { resolveCodeOfConductAsset, resolveNdaAsset } from "./member-compliance-documents.js";

test("resolveNdaAsset recognises private storage paths", () => {
  const asset = resolveNdaAsset("member-1/nda/signed-nda.pdf", {
    nda_storage_path: "member-1/nda/signed-nda.pdf",
  });

  assert.equal(asset.source_kind, "storage");
  assert.equal(asset.storage_path, "member-1/nda/signed-nda.pdf");
});

test("resolveNdaAsset falls back to external links", () => {
  const asset = resolveNdaAsset("https://drive.google.com/file/d/nda");

  assert.equal(asset.source_kind, "external");
  assert.equal(asset.original_url, "https://drive.google.com/file/d/nda");
});

test("resolveCodeOfConductAsset preserves recorded original links for stored files", () => {
  const asset = resolveCodeOfConductAsset("member-1/code-of-conduct/signed.pdf", {
    code_of_conduct_storage_path: "member-1/code-of-conduct/signed.pdf",
    code_of_conduct_original_url: "https://example.com/original-code.pdf",
  });

  assert.equal(asset.source_kind, "storage");
  assert.equal(asset.storage_path, "member-1/code-of-conduct/signed.pdf");
  assert.equal(asset.original_url, "https://example.com/original-code.pdf");
});
