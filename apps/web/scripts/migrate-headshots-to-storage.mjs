#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { MEMBER_HEADSHOTS_BUCKET, resolveHeadshotAsset } from "../lib/member-headshots.js";

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

function inferExtension(contentType, url) {
  const value = String(contentType || "").toLowerCase();

  if (value.includes("png")) {
    return "png";
  }

  if (value.includes("webp")) {
    return "webp";
  }

  const pathname = new URL(url).pathname;
  const byName = pathname.includes(".") ? pathname.split(".").pop()?.toLowerCase() : "";
  return byName || "jpg";
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
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    url,
  ];
}

async function fetchBinaryResponse(url) {
  const candidates = buildDownloadCandidates(url);
  const failures = [];

  for (const candidateUrl of candidates) {
    const response = await fetch(candidateUrl);

    if (!response.ok) {
      failures.push(`Download failed with ${response.status} for ${candidateUrl}`);
      continue;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.startsWith("image/")) {
      return {
        response,
        contentType,
        resolvedUrl: candidateUrl,
      };
    }

    failures.push(`mime type ${contentType || "unknown"} is not supported for ${candidateUrl}`);
  }

  throw new Error(failures[failures.length - 1] || "No valid binary headshot response found.");
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
    .select("user_id, headshot_url, raw_responses");

  if (error) {
    throw error;
  }

  const candidates = (rows || []).filter((row) => {
    const asset = resolveHeadshotAsset(row.headshot_url, row.raw_responses);
    return asset.source_kind === "external" && asset.display_url;
  });

  const results = [];

  for (const row of candidates) {
    const sourceUrl = resolveHeadshotAsset(row.headshot_url, row.raw_responses).display_url;

    try {
      const { response, contentType, resolvedUrl } = await fetchBinaryResponse(sourceUrl);
      const extension = inferExtension(contentType, resolvedUrl);
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
      const { error: uploadError } = await supabase.storage
        .from(MEMBER_HEADSHOTS_BUCKET)
        .upload(objectPath, buffer, {
          contentType,
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

      const { data } = supabase.storage.from(MEMBER_HEADSHOTS_BUCKET).getPublicUrl(objectPath);
      const rawResponses = {
        ...(row.raw_responses || {}),
        headshot_original_url: sourceUrl,
        headshot_storage_path: objectPath,
        headshot_source_kind: "storage",
        headshot_url: data.publicUrl,
      };
      const { error: updateError } = await supabase
        .from("cohort_member_profiles")
        .update({
          headshot_url: data.publicUrl,
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
        public_url: data.publicUrl,
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

  console.log(JSON.stringify({ dryRun: args.dryRun, bucket: MEMBER_HEADSHOTS_BUCKET, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
