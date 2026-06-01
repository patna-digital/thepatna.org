import test from "node:test";
import assert from "node:assert/strict";

import {
  isMissingContentGalleryRelation,
  serialisePublicationError,
} from "./publication-query-fallback.js";

test("serialisePublicationError preserves useful PostgREST fields", () => {
  const error = serialisePublicationError({
    code: "PGRST200",
    details: "Searched for a foreign key relationship.",
    hint: "Verify the table and relationship exist.",
    message: "Could not find a relationship between content_items and content_gallery.",
  });

  assert.deepEqual(error, {
    code: "PGRST200",
    details: "Searched for a foreign key relationship.",
    hint: "Verify the table and relationship exist.",
    message: "Could not find a relationship between content_items and content_gallery.",
  });
});

test("isMissingContentGalleryRelation detects missing gallery relation errors", () => {
  assert.equal(
    isMissingContentGalleryRelation({
      code: "PGRST200",
      message: "Could not find a relationship between 'content_items' and 'content_gallery' in the schema cache",
    }),
    true,
  );

  assert.equal(
    isMissingContentGalleryRelation({
      message: 'relation "public.content_gallery" does not exist',
    }),
    true,
  );
});

test("isMissingContentGalleryRelation ignores unrelated publication errors", () => {
  assert.equal(
    isMissingContentGalleryRelation({
      message: "permission denied for table content_items",
    }),
    false,
  );
});
