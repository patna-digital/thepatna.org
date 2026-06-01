import test from "node:test";
import assert from "node:assert/strict";

import { shouldRetryContentImageUploadWithLegacyBucket } from "./content-images.js";

test("retries with the legacy bucket when the primary content-images bucket is missing", () => {
  assert.equal(
    shouldRetryContentImageUploadWithLegacyBucket({
      message: "Bucket not found",
    }),
    true,
  );

  assert.equal(
    shouldRetryContentImageUploadWithLegacyBucket({
      message: "The storage bucket does not exist",
    }),
    true,
  );
});

test("does not retry with the legacy bucket for unrelated upload failures", () => {
  assert.equal(
    shouldRetryContentImageUploadWithLegacyBucket({
      message: "The object exceeded the maximum allowed size",
    }),
    false,
  );

  assert.equal(
    shouldRetryContentImageUploadWithLegacyBucket({
      message: "The object type is not supported",
    }),
    false,
  );
});
