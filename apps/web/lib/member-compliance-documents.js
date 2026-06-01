import { buildStoredDocumentAsset, normaliseStoredValue, uploadMemberStorageFile } from "./member-documents.js";

export const MEMBER_COMPLIANCE_DOCUMENTS_BUCKET = "member-compliance-documents";
export const MEMBER_COMPLIANCE_DOCUMENT_MAX_BYTES = 100 * 1024 * 1024;

const COMPLIANCE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const COMPLIANCE_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const COMPLIANCE_MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function looksLikeExternalUrl(value) {
  return /^https?:\/\//i.test(normaliseStoredValue(value));
}

function resolveComplianceAsset(value, rawResponses = {}, key) {
  const currentValue = normaliseStoredValue(value);
  const storagePath =
    normaliseStoredValue(rawResponses?.[`${key}_storage_path`]) ||
    (currentValue && !looksLikeExternalUrl(currentValue) ? currentValue : "");
  const originalUrl = normaliseStoredValue(rawResponses?.[`${key}_original_url`]);

  return buildStoredDocumentAsset({
    currentValue,
    storagePath,
    originalUrl,
  });
}

async function uploadComplianceDocumentFile({
  adminSupabase,
  currentValue,
  fallbackExtension = "pdf",
  file,
  userId,
}) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return {
      currentValue: normaliseStoredValue(currentValue),
      asset: buildStoredDocumentAsset({
        currentValue,
        storagePath: looksLikeExternalUrl(currentValue) ? "" : currentValue,
        originalUrl: "",
      }),
    };
  }

  return uploadMemberStorageFile({
    adminSupabase,
    allowedExtensions: COMPLIANCE_ALLOWED_EXTENSIONS,
    allowedMimeTypes: COMPLIANCE_ALLOWED_MIME_TYPES,
    bucket: MEMBER_COMPLIANCE_DOCUMENTS_BUCKET,
    fallbackExtension,
    file,
    maxBytes: MEMBER_COMPLIANCE_DOCUMENT_MAX_BYTES,
    mimeToExtension: COMPLIANCE_MIME_TO_EXTENSION,
    publicUrl: false,
    userId,
  });
}

export function resolveNdaAsset(ndaUrl, rawResponses = {}) {
  return resolveComplianceAsset(ndaUrl, rawResponses, "nda");
}

export function resolveCodeOfConductAsset(codeOfConductUrl, rawResponses = {}) {
  return resolveComplianceAsset(codeOfConductUrl, rawResponses, "code_of_conduct");
}

export async function uploadNdaFile({ adminSupabase, currentNdaUrl, file, userId }) {
  const uploaded = await uploadComplianceDocumentFile({
    adminSupabase,
    currentValue: currentNdaUrl,
    fallbackExtension: "pdf",
    file,
    userId,
  });

  return {
    ndaUrl: uploaded.currentValue,
    asset: uploaded.asset,
  };
}

export async function uploadCodeOfConductFile({ adminSupabase, currentCodeOfConductUrl, file, userId }) {
  const uploaded = await uploadComplianceDocumentFile({
    adminSupabase,
    currentValue: currentCodeOfConductUrl,
    fallbackExtension: "pdf",
    file,
    userId,
  });

  return {
    codeOfConductUrl: uploaded.currentValue,
    asset: uploaded.asset,
  };
}

export async function createComplianceDocumentSignedUrl({ adminSupabase, expiresIn = 120, storagePath }) {
  if (!normaliseStoredValue(storagePath)) {
    return "";
  }

  const { data, error } = await adminSupabase.storage
    .from(MEMBER_COMPLIANCE_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
}
