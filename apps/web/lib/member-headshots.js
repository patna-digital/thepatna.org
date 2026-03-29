import {
  buildStoredDocumentAsset,
  extractPublicBucketStoragePath,
  normaliseStoredValue,
  uploadMemberStorageFile,
} from "./member-documents.js";

export const MEMBER_HEADSHOTS_BUCKET = "member-headshots";
export const MEMBER_HEADSHOT_MAX_BYTES = 5 * 1024 * 1024;
const HEADSHOT_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEADSHOT_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const HEADSHOT_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extractStoragePathFromHeadshotUrl(url) {
  return extractPublicBucketStoragePath(url, MEMBER_HEADSHOTS_BUCKET);
}

export function resolveHeadshotAsset(headshotUrl, rawResponses = {}) {
  const displayUrl = normaliseStoredValue(headshotUrl);
  const storagePath =
    normaliseStoredValue(rawResponses?.headshot_storage_path) || extractStoragePathFromHeadshotUrl(displayUrl);
  const originalUrl = normaliseStoredValue(rawResponses?.headshot_original_url);

  return buildStoredDocumentAsset({
    currentValue: displayUrl,
    storagePath,
    originalUrl,
  });
}

export async function uploadHeadshotFile({ adminSupabase, currentHeadshotUrl, file, userId }) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return {
      headshotUrl: normaliseStoredValue(currentHeadshotUrl),
      asset: resolveHeadshotAsset(currentHeadshotUrl),
    };
  }

  const uploaded = await uploadMemberStorageFile({
    adminSupabase,
    allowedExtensions: HEADSHOT_ALLOWED_EXTENSIONS,
    allowedMimeTypes: HEADSHOT_ALLOWED_MIME_TYPES,
    bucket: MEMBER_HEADSHOTS_BUCKET,
    fallbackExtension: "jpg",
    file,
    maxBytes: MEMBER_HEADSHOT_MAX_BYTES,
    mimeToExtension: HEADSHOT_MIME_TO_EXTENSION,
    publicUrl: true,
    userId,
  });

  return {
    headshotUrl: uploaded.currentValue,
    asset: uploaded.asset,
  };
}
