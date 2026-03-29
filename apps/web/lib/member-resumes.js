import { buildStoredDocumentAsset, normaliseStoredValue, uploadMemberStorageFile } from "./member-documents.js";

export const MEMBER_RESUMES_BUCKET = "member-resumes";
export const MEMBER_RESUME_MAX_BYTES = 100 * 1024 * 1024;
const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const RESUME_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
const RESUME_MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function looksLikeExternalUrl(value) {
  return /^https?:\/\//i.test(normaliseStoredValue(value));
}

export function resolveResumeAsset(cvUrl, rawResponses = {}) {
  const currentValue = normaliseStoredValue(cvUrl);
  const storagePath =
    normaliseStoredValue(rawResponses?.cv_storage_path) ||
    (currentValue && !looksLikeExternalUrl(currentValue) ? currentValue : "");
  const originalUrl = normaliseStoredValue(rawResponses?.cv_original_url);

  return buildStoredDocumentAsset({
    currentValue,
    storagePath,
    originalUrl,
  });
}

export async function uploadResumeFile({ adminSupabase, currentCvUrl, file, userId }) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return {
      cvUrl: normaliseStoredValue(currentCvUrl),
      asset: resolveResumeAsset(currentCvUrl),
    };
  }

  const uploaded = await uploadMemberStorageFile({
    adminSupabase,
    allowedExtensions: RESUME_ALLOWED_EXTENSIONS,
    allowedMimeTypes: RESUME_ALLOWED_MIME_TYPES,
    bucket: MEMBER_RESUMES_BUCKET,
    fallbackExtension: "pdf",
    file,
    maxBytes: MEMBER_RESUME_MAX_BYTES,
    mimeToExtension: RESUME_MIME_TO_EXTENSION,
    publicUrl: false,
    userId,
  });

  return {
    cvUrl: uploaded.currentValue,
    asset: uploaded.asset,
  };
}

export async function createResumeSignedUrl({ adminSupabase, expiresIn = 120, storagePath }) {
  if (!normaliseStoredValue(storagePath)) {
    return "";
  }

  const { data, error } = await adminSupabase.storage
    .from(MEMBER_RESUMES_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
}
