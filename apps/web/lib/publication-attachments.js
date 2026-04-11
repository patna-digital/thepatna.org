import {
  buildStoredDocumentAsset,
  extractPublicBucketStoragePath,
  normaliseStoredValue,
  uploadMemberStorageFile,
} from "./member-documents.js";

export const PUBLICATION_ATTACHMENTS_BUCKET = "publications";
export const PUBLICATION_ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;
const PUBLICATION_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const PUBLICATION_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"];
const PUBLICATION_MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isHttpUrl(value) {
  return /^https?:\/\//i.test(normaliseStoredValue(value));
}

export function extractPublicationStoragePath(url) {
  return extractPublicBucketStoragePath(url, PUBLICATION_ATTACHMENTS_BUCKET);
}

export function resolvePublicationAttachmentAsset(attachment = {}) {
  const displayUrl = normaliseStoredValue(attachment?.file_url);
  const storagePath =
    normaliseStoredValue(attachment?.storage_path) ||
    extractPublicationStoragePath(displayUrl);
  const originalUrl = normaliseStoredValue(attachment?.original_url);
  const explicitSourceKind = normaliseStoredValue(attachment?.source_kind);
  const sourceKind = explicitSourceKind || (storagePath ? "storage" : displayUrl ? "external" : "none");

  return buildStoredDocumentAsset({
    currentValue: displayUrl,
    storagePath: sourceKind === "storage" ? storagePath : "",
    originalUrl:
      sourceKind === "external"
        ? originalUrl || displayUrl
        : originalUrl,
  });
}

export function normalisePublicationAttachment(attachment = {}) {
  const asset = resolvePublicationAttachmentAsset(attachment);
  const fileUrl = normaliseStoredValue(attachment?.file_url) || asset.display_url;

  return {
    ...attachment,
    file_url: fileUrl,
    source_kind: asset.source_kind === "none" ? "external" : asset.source_kind,
    storage_path: asset.storage_path || "",
    original_url:
      asset.source_kind === "external"
        ? asset.original_url || fileUrl
        : asset.original_url || "",
    is_primary: Boolean(attachment?.is_primary),
    sort_order: Number.isFinite(Number(attachment?.sort_order)) ? Number(attachment.sort_order) : 0,
  };
}

export function orderPublicationAttachments(attachments = []) {
  return attachments
    .map(normalisePublicationAttachment)
    .sort((left, right) => {
      if (Boolean(left.is_primary) !== Boolean(right.is_primary)) {
        return left.is_primary ? -1 : 1;
      }

      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }

      const leftCreatedAt = Date.parse(left.created_at || "") || 0;
      const rightCreatedAt = Date.parse(right.created_at || "") || 0;
      if (leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
      }

      return String(left.id || "").localeCompare(String(right.id || ""));
    });
}

export function isPdfLikePublicationAttachment(attachment = {}) {
  const fileType = normaliseStoredValue(attachment?.file_type).toLowerCase();
  const fileUrl = normaliseStoredValue(attachment?.file_url).toLowerCase();

  return (
    fileType === "pdf" ||
    fileType === "application/pdf" ||
    fileUrl.endsWith(".pdf")
  );
}

export function findPrimaryPublicationAttachment(attachments = []) {
  const ordered = orderPublicationAttachments(attachments);
  return (
    ordered.find((attachment) => attachment.is_primary) ||
    ordered.find((attachment) => isPdfLikePublicationAttachment(attachment)) ||
    ordered[0] ||
    null
  );
}

export function getNextPrimaryAttachment(attachments = [], removedAttachmentId = "") {
  const remaining = orderPublicationAttachments(attachments).filter((attachment) => attachment.id !== removedAttachmentId);
  return remaining[0] || null;
}

export async function uploadPublicationAttachmentFile({ adminSupabase, file, userId }) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return null;
  }

  const uploaded = await uploadMemberStorageFile({
    adminSupabase,
    allowedExtensions: PUBLICATION_ALLOWED_EXTENSIONS,
    allowedMimeTypes: PUBLICATION_ALLOWED_MIME_TYPES,
    bucket: PUBLICATION_ATTACHMENTS_BUCKET,
    fallbackExtension: "pdf",
    file,
    maxBytes: PUBLICATION_ATTACHMENT_MAX_BYTES,
    mimeToExtension: PUBLICATION_MIME_TO_EXTENSION,
    publicUrl: true,
    userId,
  });

  return {
    fileType: normaliseStoredValue(file?.type) || null,
    fileUrl: uploaded.currentValue,
    asset: uploaded.asset,
  };
}

export function buildExternalPublicationAttachmentValues({
  fileUrl,
  fileType,
}) {
  const resolvedFileUrl = normaliseStoredValue(fileUrl);

  if (!resolvedFileUrl || !isHttpUrl(resolvedFileUrl)) {
    throw new Error("A valid external file URL is required");
  }

  return {
    file_url: resolvedFileUrl,
    file_type: normaliseStoredValue(fileType) || null,
    original_url: resolvedFileUrl,
    source_kind: "external",
    storage_path: "",
  };
}
