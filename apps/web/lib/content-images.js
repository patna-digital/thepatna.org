import { uploadMemberStorageFile } from "./member-documents.js";

export const CONTENT_IMAGES_BUCKET = "content-images";
export const LEGACY_CONTENT_IMAGES_BUCKET = "publications";
export const CONTENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getStorageErrorMessage(error) {
  return `${String(error?.message || "")} ${String(error?.error || "")}`.trim().toLowerCase();
}

export function shouldRetryContentImageUploadWithLegacyBucket(error) {
  const message = getStorageErrorMessage(error);

  if (!message) {
    return false;
  }

  return (
    message.includes("bucket") &&
    (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("missing")
    )
  );
}

async function uploadContentImageToBucket({
  adminSupabase,
  bucket,
  file,
  userId,
}) {
  return uploadMemberStorageFile({
    adminSupabase,
    allowedExtensions: ALLOWED_EXTENSIONS,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    bucket,
    fallbackExtension: "jpg",
    file,
    maxBytes: CONTENT_IMAGE_MAX_BYTES,
    mimeToExtension: MIME_TO_EXTENSION,
    publicUrl: true,
    userId,
  });
}

/**
 * Upload a content image (cover or gallery), preferring the dedicated
 * content-images bucket and falling back to the legacy publications bucket
 * when older environments have not provisioned the newer bucket yet.
 *
 * @param {object} params
 * @param {import("@supabase/supabase-js").SupabaseClient} params.adminSupabase
 * @param {File|null} params.file
 * @param {string} params.userId - Admin user ID
 * @param {string} params.subfolder - "projects" | "insights" | "events"
 * @param {string} [params.currentImageUrl] - Existing URL to return unchanged when no file
 * @returns {Promise<{ imageUrl: string }>}
 */
export async function uploadContentImage({
  adminSupabase,
  file,
  userId,
  subfolder,
  currentImageUrl = "",
}) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return { imageUrl: String(currentImageUrl || "").trim() };
  }

  const storageUserPath = `${subfolder}/${userId}`;
  let result;

  try {
    result = await uploadContentImageToBucket({
      adminSupabase,
      bucket: CONTENT_IMAGES_BUCKET,
      file,
      userId: storageUserPath,
    });
  } catch (error) {
    if (!shouldRetryContentImageUploadWithLegacyBucket(error)) {
      console.error("Content image upload failed", {
        bucket: CONTENT_IMAGES_BUCKET,
        error: getStorageErrorMessage(error),
        subfolder,
        userId,
      });
      throw error;
    }

    console.warn("Primary content image bucket unavailable. Falling back to legacy bucket.", {
      bucket: CONTENT_IMAGES_BUCKET,
      fallbackBucket: LEGACY_CONTENT_IMAGES_BUCKET,
      subfolder,
      userId,
    });

    try {
      result = await uploadContentImageToBucket({
        adminSupabase,
        bucket: LEGACY_CONTENT_IMAGES_BUCKET,
        file,
        userId: storageUserPath,
      });
    } catch (fallbackError) {
      console.error("Legacy content image fallback upload failed", {
        bucket: LEGACY_CONTENT_IMAGES_BUCKET,
        error: getStorageErrorMessage(fallbackError),
        subfolder,
        userId,
      });
      throw fallbackError;
    }
  }

  return { imageUrl: result?.currentValue || "" };
}
