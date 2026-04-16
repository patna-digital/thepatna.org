// lib/assistant-drive.js
// Google Drive ingestion helpers for PATNA Assistant.
// Handles folder URL validation, file listing, PDF download, and text extraction.
// Uses app-level API key credentials against publicly-shared Drive folders only.
//
// v1 constraints (enforced here):
//   - Folder links only (not individual file links)
//   - Publicly shared folders / files only (API key, no OAuth)
//   - PDF files only (application/pdf)
//   - Manual sync only (no webhooks or scheduled polling)

import { summarizeDriveProviderError } from "./assistant-error-format.js";
import { getGoogleDriveApiKey, getSiteUrl } from "./env.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const SUPPORTED_MIME_TYPES = new Set(["application/pdf"]);
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES_PER_SYNC = 100;
// Truncate extracted text before embedding (gte-small handles ~512 tokens)
const MAX_CONTENT_CHARS = 6000;

// ─────────────────────────────────────────────────────────────────────────────
// HTTP headers for server-side Drive API calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build request headers that satisfy Google's HTTP-referrer key restrictions.
 * Server-to-server requests have no Referer header, which causes a 403 when the
 * API key has referrer restrictions configured.  Supplying the site origin as
 * both Referer and Origin allows the key to validate normally.
 */
function driveApiHeaders(extra = {}) {
  const origin = getSiteUrl() || "http://localhost:3000";
  return {
    Accept: "application/json",
    Referer: origin,
    Origin: origin,
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// URL parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a Drive folder ID from a folder share URL.
 *
 * Accepted patterns:
 *   https://drive.google.com/drive/folders/FOLDER_ID
 *   https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 *   https://drive.google.com/drive/u/0/folders/FOLDER_ID
 *
 * @param {string} url
 * @returns {{ folderId: string } | { error: string }}
 */
export function parseDriveFolderUrl(url) {
  if (!url || typeof url !== "string") {
    return { error: "URL is required." };
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { error: "Not a valid URL." };
  }

  if (parsed.hostname !== "drive.google.com") {
    return { error: "URL must be a drive.google.com link." };
  }

  const match = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return { error: "URL must be a Google Drive folder link (e.g. drive.google.com/drive/folders/…)." };
  }

  return { folderId: match[1] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drive API: list files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List PDF files inside a publicly-shared Drive folder.
 *
 * Returns an array of Drive file metadata objects.
 * Each item: { id, name, mimeType, modifiedTime, md5Checksum, webViewLink, size }
 *
 * @param {string} folderId
 * @returns {Promise<Array<DriveFile>>}
 */
export async function listDriveFolderPdfs(folderId) {
  const apiKey = getGoogleDriveApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_DRIVE_API_KEY is not configured.");
  }

  const fields = "nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum,webViewLink,size)";
  const q = encodeURIComponent(`'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
  const url =
    `${DRIVE_API_BASE}/files` +
    `?q=${q}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&pageSize=${MAX_FILES_PER_SYNC}` +
    `&supportsAllDrives=true` +
    `&includeItemsFromAllDrives=true` +
    `&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: driveApiHeaders(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const detail = tryParseGoogleError(body);
    throw new Error(`Drive API list error (${res.status}): ${detail}`);
  }

  const json = await res.json();
  const files = (json.files || []).filter((f) => SUPPORTED_MIME_TYPES.has(f.mimeType));

  return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// Change detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a stable change key for a Drive file.
 * Uses md5Checksum when available (not present for Shared Drive files),
 * falling back to modifiedTime.
 *
 * @param {{ md5Checksum?: string, modifiedTime?: string }} file
 * @returns {string}
 */
export function computeChangeKey(file) {
  return file.md5Checksum || file.modifiedTime || "";
}

/**
 * Return true if the file has changed since the last indexed version.
 *
 * @param {{ md5Checksum?: string, modifiedTime?: string }} driveFile
 * @param {string | null | undefined} storedChangeKey
 * @returns {boolean}
 */
export function fileHasChanged(driveFile, storedChangeKey) {
  if (!storedChangeKey) {
    return true;
  }

  return computeChangeKey(driveFile) !== storedChangeKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF download and text extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download raw bytes of a publicly-shared Drive PDF.
 *
 * @param {string} fileId
 * @returns {Promise<Buffer>}
 */
async function downloadDriveFile(fileId) {
  const apiKey = getGoogleDriveApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_DRIVE_API_KEY is not configured.");
  }
  // acknowledgeAbuse=true bypasses the virus-scan confirmation page that Drive
  // returns for large or unscanned files, which otherwise produces a 403 with
  // an HTML body instead of the file bytes.
  const url = `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media&acknowledgeAbuse=true&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: driveApiHeaders(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const detail = tryParseGoogleError(body);
    throw new Error(`Drive API download error (${res.status}): ${detail}`);
  }

  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength > MAX_PDF_SIZE_BYTES) {
    throw new Error(`File too large (${contentLength} bytes; limit is ${MAX_PDF_SIZE_BYTES}).`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new Error(`File too large (${buffer.byteLength} bytes; limit is ${MAX_PDF_SIZE_BYTES}).`);
  }

  return buffer;
}

/**
 * Extract plain text from a PDF buffer using pdf-parse.
 * Returns an empty string if extraction yields no usable text.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromPdf(buffer) {
  // Dynamic import so the module is only required server-side in API routes/scripts
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return normalizeText(result.text || "");
}

/**
 * Download a public Drive PDF and return extracted text.
 * Throws if the file cannot be fetched or produces no usable text.
 *
 * @param {string} fileId  Drive file ID
 * @returns {Promise<string>}
 */
export async function fetchAndExtractPdfText(fileId) {
  const buffer = await downloadDriveFile(fileId);
  const text = await extractTextFromPdf(buffer);

  if (!text) {
    throw new Error("PDF produced no extractable text.");
  }

  return text.slice(0, MAX_CONTENT_CHARS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text normalisation
// ─────────────────────────────────────────────────────────────────────────────

function normalizeText(raw) {
  return String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function tryParseGoogleError(body) {
  try {
    const json = JSON.parse(body);
    return summarizeDriveProviderError(json?.error?.message || body);
  } catch {
    return summarizeDriveProviderError(body);
  }
}
