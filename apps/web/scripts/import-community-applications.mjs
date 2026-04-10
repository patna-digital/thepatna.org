#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  applicationEngagementOptions,
  applicationExpertiseOptions,
} from "../lib/patna-data.js";
import { syncCommunityApplicationAssistantDocument } from "../lib/assistant-indexing.js";

const LEGACY_JOIN_FORM_FIELDS = [
  "first_name",
  "surname",
  "email",
  "country",
  "organisation",
  "role_title",
  "cohort_interests",
  "domain_interests",
  "motivation_text",
];

const EXPERTISE_HEADER_MAP = Object.fromEntries(
  applicationExpertiseOptions.map((option) => {
    const header =
      option.slug === "other"
        ? "Area(s) of expertise (tick all that apply):: Other (please specify)"
        : `Area(s) of expertise (tick all that apply):: ${option.label}`;
    return [header, option.slug];
  }),
);

const ENGAGEMENT_HEADER_MAP = {
  "How would you like to engage with PATNA?: Membership (individual or institutional)": "membership",
  "How would you like to engage with PATNA?: Volunteering": "volunteering",
  "How would you like to engage with PATNA?: Partnerships / Collaborations": "partnerships-collaborations",
  "How would you like to engage with PATNA?: Contributing to research or publications": "research-publications",
  "How would you like to engage with PATNA?: Attending events and workshops": "events-workshops",
  "How would you like to engage with PATNA?: Capacity building and training opportunities":
    "capacity-building-training",
  "How would you like to engage with PATNA?: Other (please specify)": "other",
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
    path.resolve(scriptDir, "../../", filePath),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
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

function parseArgs(argv) {
  const args = {
    dryRun: false,
    help: false,
    input: "",
    report: "",
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
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  pnpm applications:import -- --input "/path/to/wpforms.csv" [--dry-run] [--report ./report.json]
`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((cell) => String(cell || "").trim() !== ""));
}

function normaliseText(value) {
  return String(value || "").trim();
}

function normaliseEmail(value) {
  return normaliseText(value).toLowerCase();
}

function normalisePhone(value) {
  return normaliseText(value).replace(/^'+/, "");
}

function parseBoolean(value) {
  const text = normaliseText(value).toLowerCase();
  return text === "yes" || text === "true" || text === "1" || text === "checked";
}

function parseSubmittedAt(value) {
  const parsed = new Date(normaliseText(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getFieldComparison() {
  const wpformsCanonicalFields = [
    "first_name",
    "surname",
    "email",
    "phone_number",
    "country",
    "organisation",
    "role_title",
    "expertise_slugs",
    "expertise_other_text",
    "engagement_slugs",
    "engagement_other_text",
    "motivation_text",
    "consent_data_storage",
    "consent_updates",
    "submitted_at",
  ];

  return {
    sharedFields: LEGACY_JOIN_FORM_FIELDS.filter((field) => wpformsCanonicalFields.includes(field)),
    legacyJoinFormOnlyFields: LEGACY_JOIN_FORM_FIELDS.filter((field) => !wpformsCanonicalFields.includes(field)),
    wpformsOnlyFields: wpformsCanonicalFields.filter((field) => !LEGACY_JOIN_FORM_FIELDS.includes(field)),
  };
}

function parseWpformsRows(filePath) {
  const rawText = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const [headers, ...rawRows] = parseCsv(rawText);

  return rawRows.map((cells, index) => {
    const rawRow = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
    const expertiseSlugs = Object.entries(EXPERTISE_HEADER_MAP)
      .filter(([header]) => normaliseText(rawRow[header]))
      .map(([, slug]) => slug);
    const engagementSlugs = Object.entries(ENGAGEMENT_HEADER_MAP)
      .filter(([header]) => normaliseText(rawRow[header]))
      .map(([, slug]) => slug);

    return {
      rowNumber: index + 2,
      first_name: normaliseText(rawRow["Name: First"]),
      surname: normaliseText(rawRow["Name: Last"]),
      email: normaliseEmail(rawRow["Email address"]),
      phone_number: normalisePhone(rawRow["Phone number"]),
      country: normaliseText(rawRow["Country of Residence"]),
      organisation: normaliseText(rawRow["Organisation / Institution (if applicable)"]),
      role_title: normaliseText(rawRow["Role / Title"]),
      motivation_text: normaliseText(rawRow["Briefly share why you would like to join PATNA"]),
      expertise_slugs:
        normaliseText(rawRow["Enter area of expertise"]) && !expertiseSlugs.includes("other")
          ? [...expertiseSlugs, "other"]
          : expertiseSlugs,
      expertise_other_text: normaliseText(rawRow["Enter area of expertise"]),
      engagement_slugs:
        normaliseText(rawRow["Enter how you wiould like to engage"]) && !engagementSlugs.includes("other")
          ? [...engagementSlugs, "other"]
          : engagementSlugs,
      engagement_other_text: normaliseText(rawRow["Enter how you wiould like to engage"]),
      consent_data_storage: parseBoolean(
        rawRow["Consent: I consent to PATNA storing my information for the purpose of community engagement."],
      ),
      consent_updates: parseBoolean(
        rawRow["Consent (copy): I would like to receive updates, newsletters, and invitations from PATNA."],
      ),
      submitted_at: parseSubmittedAt(rawRow["Entry Date"]),
      source: "wpforms_import",
      status: "interviewing",
      rawRow,
    };
  });
}

function dedupeRows(rows) {
  const deduped = new Map();
  const collapsed = [];

  for (const row of rows) {
    const current = deduped.get(row.email);

    if (!current) {
      deduped.set(row.email, row);
      continue;
    }

    const currentTime = current.submitted_at ? new Date(current.submitted_at).getTime() : 0;
    const nextTime = row.submitted_at ? new Date(row.submitted_at).getTime() : 0;

    if (nextTime >= currentTime) {
      collapsed.push({
        email: row.email,
        keptRowNumber: row.rowNumber,
        droppedRowNumber: current.rowNumber,
      });
      deduped.set(row.email, row);
    } else {
      collapsed.push({
        email: row.email,
        keptRowNumber: current.rowNumber,
        droppedRowNumber: row.rowNumber,
      });
    }
  }

  return {
    rows: [...deduped.values()],
    collapsed,
  };
}

async function listAllAuthUsers(supabase) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
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

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const envCandidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "apps/web/.env.local"),
    path.resolve(scriptDir, "../.env.local"),
  ];

  envCandidates.forEach(loadEnvFile);

  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured. Check apps/web/.env.local.");
  }

  const parsedRows = parseWpformsRows(resolveReadablePath(args.input));
  const invalidRows = parsedRows
    .filter(
      (row) =>
        !row.email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) ||
        !row.first_name ||
        !row.surname ||
        !row.motivation_text,
    )
    .map((row) => ({
      rowNumber: row.rowNumber,
      email: row.email,
      reason: "Missing or invalid one of: first_name, surname, email, motivation_text.",
    }));
  const validRows = parsedRows.filter((row) =>
    row.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) &&
    row.first_name &&
    row.surname &&
    row.motivation_text,
  );
  const { rows, collapsed } = dedupeRows(validRows);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [authUsers, profilesResult, applicationsResult] = await Promise.all([
    listAllAuthUsers(supabase),
    supabase.from("profiles").select("id, email"),
    supabase
      .from("community_applications")
      .select("id, submitted_by_email, created_at, submitted_at, assigned_cohort_id"),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (applicationsResult.error) {
    throw applicationsResult.error;
  }

  const authEmails = new Set(
    authUsers
      .map((user) => normaliseEmail(user.email))
      .filter(Boolean),
  );
  const profileEmails = new Set(
    (profilesResult.data || [])
      .map((profile) => normaliseEmail(profile.email))
      .filter(Boolean),
  );
  const applicationsByEmail = new Map();

  for (const application of applicationsResult.data || []) {
    const email = normaliseEmail(application.submitted_by_email);

    if (!email) {
      continue;
    }

    const current = applicationsByEmail.get(email);
    const currentTime = current ? new Date(current.submitted_at || current.created_at).getTime() : -1;
    const nextTime = new Date(application.submitted_at || application.created_at).getTime();

    if (!current || nextTime >= currentTime) {
      applicationsByEmail.set(email, application);
    }
  }

  const report = {
    sourceFile: resolveReadablePath(args.input),
    totals: {
      csvRows: parsedRows.length,
      validRows: validRows.length,
      uniqueEmailRows: rows.length,
      inserted: 0,
      updated: 0,
      skippedAlreadyOnboarded: 0,
      invalidRows: invalidRows.length,
    },
    collapsedDuplicates: collapsed,
    invalidRows,
    fieldComparison: getFieldComparison(),
    results: [],
  };

  for (const row of rows) {
    const isOnboarded = authEmails.has(row.email) || profileEmails.has(row.email);

    if (isOnboarded) {
      report.totals.skippedAlreadyOnboarded += 1;
      report.results.push({
        email: row.email,
        rowNumber: row.rowNumber,
        result: "skipped",
        reason: "already_onboarded",
      });
      continue;
    }

    const existingApplication = applicationsByEmail.get(row.email);
    const payload = {
      submitted_by_email: row.email,
      first_name: row.first_name,
      surname: row.surname,
      phone_number: row.phone_number || null,
      country: row.country || null,
      organisation: row.organisation || null,
      role_title: row.role_title || null,
      motivation_text: row.motivation_text,
      expertise_slugs: row.expertise_slugs,
      expertise_other_text: row.expertise_other_text || null,
      engagement_slugs: row.engagement_slugs,
      engagement_other_text: row.engagement_other_text || null,
      consent_data_storage: row.consent_data_storage,
      consent_updates: row.consent_updates,
      source: row.source,
      submitted_at: row.submitted_at || new Date().toISOString(),
      status: "interviewing",
    };

    if (args.dryRun) {
      report.results.push({
        email: row.email,
        rowNumber: row.rowNumber,
        result: existingApplication ? "updated" : "inserted",
        reason: existingApplication ? "existing_application" : "new_application",
      });
      if (existingApplication) {
        report.totals.updated += 1;
      } else {
        report.totals.inserted += 1;
      }
      continue;
    }

    if (existingApplication) {
      const { data, error } = await supabase
        .from("community_applications")
        .update(payload)
        .eq("id", existingApplication.id)
        .select("id")
        .single();

      if (error || !data?.id) {
        report.results.push({
          email: row.email,
          rowNumber: row.rowNumber,
          result: "failed",
          reason: error.message,
        });
        continue;
      }

      try {
        await syncCommunityApplicationAssistantDocument({
          adminSupabase: supabase,
          applicationId: data.id,
        });
      } catch (assistantError) {
        report.results.push({
          email: row.email,
          rowNumber: row.rowNumber,
          result: "failed",
          reason: assistantError.message,
        });
        continue;
      }

      report.totals.updated += 1;
      report.results.push({
        email: row.email,
        rowNumber: row.rowNumber,
        result: "updated",
        reason: "existing_application",
      });
      continue;
    }

    const { data, error } = await supabase
      .from("community_applications")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data?.id) {
      report.results.push({
        email: row.email,
        rowNumber: row.rowNumber,
        result: "failed",
        reason: error.message,
      });
      continue;
    }

    try {
      await syncCommunityApplicationAssistantDocument({
        adminSupabase: supabase,
        applicationId: data.id,
      });
    } catch (assistantError) {
      report.results.push({
        email: row.email,
        rowNumber: row.rowNumber,
        result: "failed",
        reason: assistantError.message,
      });
      continue;
    }

    report.totals.inserted += 1;
    report.results.push({
      email: row.email,
      rowNumber: row.rowNumber,
      result: "inserted",
      reason: "new_application",
    });
  }

  if (args.report) {
    const reportPath = resolveWritablePath(args.report);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report written to ${reportPath}`);
  }

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        totals: report.totals,
        collapsedDuplicates: report.collapsedDuplicates,
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
