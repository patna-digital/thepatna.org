#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { syncEventAssistantDocument } from "../lib/assistant-indexing.js";

const DEFAULT_SOURCE_EMAIL = "thepatnadigital@gmail.com";
const HEADER_ROW_INDEX = 3;
const DATA_START_ROW_INDEX = 4;
const SHEET_ENTRY = "xl/worksheets/sheet1.xml";

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
    help: false,
    input: "",
    report: "",
    sourceEmail: DEFAULT_SOURCE_EMAIL,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--input") {
      args.input = argv[index + 1] || "";
      index += 1;
    } else if (token === "--report") {
      args.report = argv[index + 1] || "";
      index += 1;
    } else if (token === "--source-email") {
      args.sourceEmail = argv[index + 1] || DEFAULT_SOURCE_EMAIL;
      index += 1;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  pnpm events:import -- --input "/path/to/PATNA_Events_Register.xlsx" [--source-email thepatnadigital@gmail.com] [--dry-run] [--report ./events-report.json]
`);
}

function resolveReadablePath(filePath) {
  if (!filePath) {
    return "";
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), "..", filePath),
    path.resolve(process.cwd(), "../..", filePath),
    path.resolve(scriptDir, "../../../", filePath),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractZipEntry(filePath, entryPath) {
  return execFileSync("unzip", ["-p", filePath, entryPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function tryExtractZipEntry(filePath, entryPath) {
  try {
    return extractZipEntry(filePath, entryPath);
  } catch {
    return "";
  }
}

function parseSharedStrings(xml) {
  const values = [];
  const matcher = /<si[\s\S]*?>([\s\S]*?)<\/si>/g;
  let match = matcher.exec(xml);

  while (match) {
    const text = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((item) => decodeXmlEntities(item[1]))
      .join("");
    values.push(text);
    match = matcher.exec(xml);
  }

  return values;
}

function extractCellValue(cellXml, sharedStrings, cellType) {
  if (cellType === "inlineStr") {
    const inlineMatch = cellXml.match(/<is[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);
    return inlineMatch ? decodeXmlEntities(inlineMatch[1]) : "";
  }

  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);

  if (!valueMatch) {
    return "";
  }

  if (cellType === "s") {
    return sharedStrings[Number(valueMatch[1])] || "";
  }

  return decodeXmlEntities(valueMatch[1]);
}

function parseSheetRows(xml, sharedStrings) {
  const rows = new Map();
  const rowMatcher = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch = rowMatcher.exec(xml);

  while (rowMatch) {
    const rowNumber = Number(rowMatch[1]);
    const cellMap = new Map();
    const cellMatcher = /<c([^>]*)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch = cellMatcher.exec(rowMatch[2]);

    while (cellMatch) {
      const attributes = `${cellMatch[1]} ${cellMatch[3]}`;
      const typeMatch = attributes.match(/t="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : "";
      const column = cellMatch[2];
      cellMap.set(column, extractCellValue(cellMatch[4], sharedStrings, cellType));
      cellMatch = cellMatcher.exec(rowMatch[2]);
    }

    rows.set(rowNumber, cellMap);
    rowMatch = rowMatcher.exec(xml);
  }

  return rows;
}

function createEventSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normaliseText(value) {
  return String(value || "").trim();
}

function splitList(value) {
  return normaliseText(value)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExactDate(value, { endOfDay = false } = {}) {
  const match = normaliseText(value).match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);

  if (!match) {
    return null;
  }

  const parsed = new Date(`${match[1]} ${match[2]} ${match[3]} UTC`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (endOfDay) {
    parsed.setUTCHours(23, 59, 59, 0);
  } else {
    parsed.setUTCHours(0, 0, 0, 0);
  }

  return parsed.toISOString();
}

function normaliseVisibility(value) {
  const normalized = normaliseText(value).toLowerCase();
  return ["public", "members", "restricted"].includes(normalized) ? normalized : "public";
}

function normalisePublishStatus(value) {
  const normalized = normaliseText(value).toLowerCase();
  return ["draft", "published", "archived"].includes(normalized) ? normalized : "draft";
}

function normaliseScheduleStatus(status, displayDate) {
  if (/tbc/i.test(displayDate)) {
    return "tbc";
  }

  const normalized = normaliseText(status).toLowerCase();
  return ["past", "upcoming"].includes(normalized) ? normalized : "tbc";
}

function rowToRecord(headers, cellMap) {
  const record = {};

  for (const [column, header] of headers.entries()) {
    record[header] = normaliseText(cellMap.get(column) || "");
  }

  return record;
}

function parseEventsWorkbook(filePath) {
  const sharedStringsXml = tryExtractZipEntry(filePath, "xl/sharedStrings.xml");
  const sheetXml = extractZipEntry(filePath, SHEET_ENTRY);
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : [];
  const rows = parseSheetRows(sheetXml, sharedStrings);
  const headerCells = rows.get(HEADER_ROW_INDEX) || new Map();
  const headers = new Map();

  for (const [column, value] of headerCells.entries()) {
    headers.set(column, value);
  }

  const events = [];

  for (let rowIndex = DATA_START_ROW_INDEX; rows.has(rowIndex); rowIndex += 1) {
    const record = rowToRecord(headers, rows.get(rowIndex));
    const title = record["Event Title"];

    if (!title) {
      continue;
    }

    events.push({
      slug: createEventSlug(title),
      title,
      event_type: record["Event Type"] || "",
      organising_institutions: splitList(record["Organising Institution(s)"]),
      starts_at: parseExactDate(record["Start Date"]),
      ends_at: parseExactDate(record["End Date"], { endOfDay: true }),
      display_date:
        record["Start Date"] && record["End Date"] && record["Start Date"] !== record["End Date"]
          ? `${record["Start Date"]} to ${record["End Date"]}`
          : record["Start Date"] || record["End Date"] || "",
      location: record.Location || "",
      summary: record["Summary / Description"] || "",
      body: record["Summary / Description"] || "",
      status: normalisePublishStatus(record["Publish Status"]),
      schedule_status: normaliseScheduleStatus(record.Status, `${record["Start Date"]} ${record["End Date"]}`),
      visibility: normaliseVisibility(record.Visibility),
      patna_involvement: record["PATNA Involvement"] || "",
      themes: splitList(record["Themes / Tags"]),
      official_link: record["Official Link"] || "",
      spreadsheet_status: record.Status || "",
      spreadsheet_row: record.SN || "",
    });
  }

  return events;
}

async function listAuthUsers(adminClient) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const currentUsers = data?.users ?? [];
    users.push(...currentUsers);

    if (currentUsers.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureSourceAdmin({ adminClient, email, siteUrl }) {
  const normalizedEmail = normaliseText(email).toLowerCase();
  const authUsers = await listAuthUsers(adminClient);
  let authUser = authUsers.find(
    (candidate) => normaliseText(candidate.email).toLowerCase() === normalizedEmail,
  );

  if (!authUser) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: authUser.id,
      email: normalizedEmail,
      onboarding_status: "active",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: roleError } = await adminClient.from("user_roles").upsert(
    {
      user_id: authUser.id,
      role: "administrator",
    },
    { onConflict: "user_id,role" },
  );

  if (roleError) {
    throw roleError;
  }

  return authUser.id;
}

async function upsertEvents({ adminClient, events, sourceUserId }) {
  for (const event of events) {
    const { data: existing } = await adminClient
      .from("events")
      .select("id, created_by_user_id")
      .eq("slug", event.slug)
      .maybeSingle();

    const payload = {
      title: event.title,
      slug: event.slug,
      summary: event.summary,
      body: event.body,
      event_type: event.event_type || null,
      location: event.location || null,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      display_date: event.display_date || null,
      status: event.status,
      schedule_status: event.schedule_status,
      visibility: event.visibility,
      organising_institutions: event.organising_institutions,
      patna_involvement: event.patna_involvement || null,
      themes: event.themes,
      official_link: event.official_link || null,
      created_by_user_id: existing?.created_by_user_id || sourceUserId,
      updated_by_user_id: sourceUserId,
    };

    const { data, error } = await adminClient
      .from("events")
      .upsert(payload, {
        onConflict: "slug",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw error;
    }

    await syncEventAssistantDocument({
      adminSupabase: adminClient,
      eventId: data.id,
    });
  }
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  loadEnvFile(path.resolve(scriptDir, "../.env.local"));

  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = resolveReadablePath(args.input);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const events = parseEventsWorkbook(inputPath);
  const report = {
    input: inputPath,
    sourceEmail: normaliseText(args.sourceEmail).toLowerCase(),
    totalEvents: events.length,
    events: events.map((event) => ({
      slug: event.slug,
      title: event.title,
      status: event.status,
      schedule_status: event.schedule_status,
      display_date: event.display_date,
      visibility: event.visibility,
    })),
  };

  if (args.report) {
    fs.writeFileSync(path.resolve(process.cwd(), args.report), JSON.stringify(report, null, 2));
  }

  if (args.dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin access is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const sourceUserId = await ensureSourceAdmin({
    adminClient,
    email: args.sourceEmail,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  });

  await upsertEvents({
    adminClient,
    events,
    sourceUserId,
  });

  console.log(
    JSON.stringify(
      {
        ...report,
        sourceUserId,
        importedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
