import crypto from "node:crypto";

export function normaliseStoredValue(value) {
  return String(value || "").trim();
}

export function sanitiseStoredFilename(value) {
  return normaliseStoredValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferStoredFileExtension(file, mimeToExtension = {}, fallbackExtension = "bin") {
  const fileName = normaliseStoredValue(file?.name);
  const byName = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";

  if (byName) {
    return byName;
  }

  const mimeType = normaliseStoredValue(file?.type).toLowerCase();
  return mimeToExtension[mimeType] || fallbackExtension;
}

export function extractPublicBucketStoragePath(url, bucket) {
  const value = normaliseStoredValue(url);

  if (!value) {
    return "";
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = value.indexOf(marker);

  if (index === -1) {
    return "";
  }

  return value.slice(index + marker.length);
}

export function buildStoredDocumentAsset({ currentValue, storagePath, originalUrl }) {
  const resolvedValue = normaliseStoredValue(currentValue);
  const resolvedStoragePath = normaliseStoredValue(storagePath);
  const resolvedOriginalUrl = normaliseStoredValue(originalUrl);

  if (!resolvedValue && !resolvedStoragePath) {
    return {
      source_kind: "none",
      display_url: "",
      storage_path: "",
      original_url: "",
    };
  }

  if (resolvedStoragePath) {
    return {
      source_kind: "storage",
      display_url: resolvedValue || resolvedStoragePath,
      storage_path: resolvedStoragePath,
      original_url: resolvedOriginalUrl,
    };
  }

  return {
    source_kind: "external",
    display_url: resolvedValue,
    storage_path: "",
    original_url: resolvedOriginalUrl || resolvedValue,
  };
}

export async function uploadMemberStorageFile({
  adminSupabase,
  allowedExtensions = [],
  allowedMimeTypes = [],
  bucket,
  fallbackExtension,
  file,
  maxBytes,
  mimeToExtension = {},
  publicUrl = false,
  userId,
}) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return null;
  }

  if (maxBytes && size > maxBytes) {
    throw new Error("The object exceeded the maximum allowed size");
  }

  const mimeType = normaliseStoredValue(file.type).toLowerCase();
  const extension = inferStoredFileExtension(file, mimeToExtension, fallbackExtension);
  const extensionAllowed = allowedExtensions.length === 0 || allowedExtensions.includes(extension);
  const mimeAllowed =
    !mimeType ||
    mimeType === "application/octet-stream" ||
    allowedMimeTypes.length === 0 ||
    allowedMimeTypes.includes(mimeType);

  if (!extensionAllowed || !mimeAllowed) {
    throw new Error("The object type is not supported");
  }

  const safeName =
    sanitiseStoredFilename(file.name || `file.${extension}`) || `file.${extension}`;
  const objectPath = `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await adminSupabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType: mimeType || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  if (publicUrl) {
    const { data } = adminSupabase.storage.from(bucket).getPublicUrl(objectPath);

    return {
      currentValue: data.publicUrl,
      asset: buildStoredDocumentAsset({
        currentValue: data.publicUrl,
        storagePath: objectPath,
        originalUrl: "",
      }),
    };
  }

  return {
    currentValue: objectPath,
    asset: buildStoredDocumentAsset({
      currentValue: objectPath,
      storagePath: objectPath,
      originalUrl: "",
    }),
  };
}
