#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { MEMBER_RESUME_MAX_BYTES, MEMBER_RESUMES_BUCKET, resolveResumeAsset } from "../lib/member-resumes.js";

const RESUME_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const RESUME_EXTENSION_TO_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    report: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--report") {
      args.report = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

function resolveWritablePath(filePath) {
  if (!filePath) {
    return "";
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, "../../../", filePath);
}

function extractGoogleDriveFileId(url) {
  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.hostname.includes("drive.google.com")) {
      return "";
    }

    const queryId = parsedUrl.searchParams.get("id");

    if (queryId) {
      return queryId;
    }

    const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    return pathMatch?.[1] || "";
  } catch {
    return "";
  }
}

function buildDownloadCandidates(url) {
  const fileId = extractGoogleDriveFileId(url);

  if (!fileId) {
    return [url];
  }

  return [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    url,
  ];
}

function normaliseContentType(value) {
  return String(value || "").split(";")[0].trim().toLowerCase();
}

function getExtensionFromFilename(value) {
  const text = String(value || "").trim();
  return text.includes(".") ? text.split(".").pop()?.toLowerCase() || "" : "";
}

function extractFilenameFromDisposition(value) {
  const text = String(value || "");
  const utf8Match = text.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = text.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] || "";
}

function resolveExtension({ contentDisposition, contentType, url }) {
  const dispositionFilename = extractFilenameFromDisposition(contentDisposition);
  const fromDisposition = getExtensionFromFilename(dispositionFilename);

  if (fromDisposition) {
    return fromDisposition;
  }

  const type = normaliseContentType(contentType);

  if (type === "application/pdf") {
    return "pdf";
  }

  if (type === "application/msword") {
    return "doc";
  }

  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }

  try {
    return getExtensionFromFilename(new URL(url).pathname);
  } catch {
    return "";
  }
}

function isSupportedDocument({ contentDisposition, contentType, url }) {
  const type = normaliseContentType(contentType);

  if (RESUME_ALLOWED_MIME_TYPES.has(type)) {
    return true;
  }

  if (!type || type === "application/octet-stream") {
    return RESUME_ALLOWED_EXTENSIONS.has(
      resolveExtension({ contentDisposition, contentType: type, url }),
    );
  }

  return false;
}

async function fetchDocumentResponse(url) {
  const candidates = buildDownloadCandidates(url);
  const failures = [];

  for (const candidateUrl of candidates) {
    const response = await fetch(candidateUrl);

    if (!response.ok) {
      failures.push(`Download failed with ${response.status} for ${candidateUrl}`);
      continue;
    }

    const contentType = response.headers.get("content-type") || "";
    const contentDisposition = response.headers.get("content-disposition") || "";
    const contentLength = Number.parseInt(response.headers.get("content-length") || "0", 10);

    if (contentLength > MEMBER_RESUME_MAX_BYTES) {
      failures.push(`The object exceeded the maximum allowed size for ${candidateUrl}`);
      continue;
    }

    if (
      isSupportedDocument({
        contentDisposition,
        contentType,
        url: candidateUrl,
      })
    ) {
      return {
        contentDisposition,
        contentType: normaliseContentType(contentType) || "application/octet-stream",
        resolvedUrl: candidateUrl,
        response,
      };
    }

    failures.push(
      `mime type ${normaliseContentType(contentType) || "unknown"} is not supported for ${candidateUrl}`,
    );
  }

  throw new Error(failures[failures.length - 1] || "No valid resume response found.");
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "apps/web/.env.local"),
    path.resolve(scriptDir, "../.env.local"),
  ].forEach(loadEnvFile);

  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured. Check apps/web/.env.local.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: rows, error } = await supabase
    .from("cohort_member_profiles")
    .select("user_id, cv_url, raw_responses");

  if (error) {
    throw error;
  }

  const candidates = (rows || []).filter((row) => {
    const asset = resolveResumeAsset(row.cv_url, row.raw_responses);
    return asset.source_kind === "external" && asset.display_url;
  });

  const results = [];

  for (const row of candidates) {
    const sourceUrl = resolveResumeAsset(row.cv_url, row.raw_responses).display_url;

    try {
      const { contentDisposition, contentType, resolvedUrl, response } = await fetchDocumentResponse(sourceUrl);
      const extension = resolveExtension({
        contentDisposition,
        contentType,
        url: resolvedUrl,
      }) || "pdf";
      const uploadContentType = RESUME_EXTENSION_TO_MIME[extension] || contentType;
      const objectPath = `${row.user_id}/migrated-${Date.now()}.${extension}`;

      if (args.dryRun) {
        results.push({
          user_id: row.user_id,
          source_url: sourceUrl,
          resolved_url: resolvedUrl,
          storage_path: objectPath,
          result: "dry-run",
        });
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length > MEMBER_RESUME_MAX_BYTES) {
        results.push({
          user_id: row.user_id,
          source_url: sourceUrl,
          resolved_url: resolvedUrl,
          result: "failed",
          reason: "The object exceeded the maximum allowed size",
        });
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(MEMBER_RESUMES_BUCKET)
        .upload(objectPath, buffer, {
          contentType: uploadContentType,
          upsert: false,
        });

      if (uploadError) {
        results.push({
          user_id: row.user_id,
          source_url: sourceUrl,
          resolved_url: resolvedUrl,
          result: "failed",
          reason: uploadError.message,
        });
        continue;
      }

      const rawResponses = {
        ...(row.raw_responses || {}),
        cv_original_url: sourceUrl,
        cv_source_kind: "storage",
        cv_storage_path: objectPath,
        cv_url: objectPath,
      };
      const { error: updateError } = await supabase
        .from("cohort_member_profiles")
        .update({
          cv_url: objectPath,
          raw_responses: rawResponses,
        })
        .eq("user_id", row.user_id);

      if (updateError) {
        results.push({
          user_id: row.user_id,
          source_url: sourceUrl,
          resolved_url: resolvedUrl,
          storage_path: objectPath,
          result: "failed",
          reason: updateError.message,
        });
        continue;
      }

      results.push({
        user_id: row.user_id,
        source_url: sourceUrl,
        resolved_url: resolvedUrl,
        storage_path: objectPath,
        result: "migrated",
      });
    } catch (migrationError) {
      results.push({
        user_id: row.user_id,
        source_url: sourceUrl,
        result: "failed",
        reason: migrationError instanceof Error ? migrationError.message : String(migrationError),
      });
    }
  }

  if (args.report) {
    const reportPath = resolveWritablePath(args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  }

  console.log(JSON.stringify({ dryRun: args.dryRun, bucket: MEMBER_RESUMES_BUCKET, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
