#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_FORM_COLUMN_MAP = {
  Timestamp: "submitted_at",
  Email: "email",
  "First Name": "first_name",
  Surname: "surname",
  "Title (Mr, Mrs, Dr, Prof, Amb, Capt, Engr, etc)": "title",
  "Current Role": "role_title",
  "Current Institution / Organization": "organisation_name",
  "Country of Residence": "country_of_residence",
  "Professional Bio (max 200 words)": "professional_bio",
  "Domain Knowledge / Areas of Competence": "domain_knowledge",
  "Current Research Interest": "focus_area",
  "Relevant Publications or Projects": "notable_work",
  "Would you like to be considered for research collaborations, mentorship, or policy review opportunities within PATNA?":
    "opportunity_interest",
  "Any additional comments or suggestions?": "additional_comments",
  "Upload a Professional Headshot\nFile Upload – Limit to 1 file, JPG/PNG, Max 100MB": "headshot_url",
  "Upload CV/Resume (optional)\nFile Upload – PDF preferred, Max 100MB": "cv_url",
  "Upload CV/Resume\nFile Upload – PDF preferred, Max 100MB": "cv_url",
  "Upload your signed Non-Disclosure Agreement": "nda_url",
  "Upload your signed Code of Conduct document": "code_of_conduct_url",
  "Upload your signed Code of Conduct": "code_of_conduct_url",
  "Select other PATNA cohorts that you are engaged with (if applicable)": "secondary_cohorts",
  "Middle Name(s)": "middle_names",
  Gender: "gender",
  "Languages (check all that apply)": "languages",
};

const TAG_RULES = [
  { slug: "maritime-decarbonisation", patterns: [/maritime/i, /shipping/i, /port/i, /blue economy/i, /marine/i] },
  { slug: "energy-transition", patterns: [/energy/i, /decarbon/i, /renewable/i, /solar/i, /efficiency/i, /electrification/i] },
  { slug: "climate-finance", patterns: [/climate finance/i, /finance/i] },
  { slug: "imo", patterns: [/\bimo\b/i, /marine environment protection committee/i, /\bmepc\b/i] },
  { slug: "unfccc", patterns: [/\bunfccc\b/i, /\bcop\d+\b/i, /climate diplomacy/i] },
  { slug: "sids", patterns: [/\bsids\b/i, /small island/i] },
  { slug: "ldcs", patterns: [/\bldc\b/i, /least developed/i] },
  { slug: "west-africa", patterns: [/west africa/i] },
];

const PROFILE_BIO_MAX_LENGTH = 1200;

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
    batch: "",
    cohort: "",
    dryRun: false,
    help: false,
    input: "",
    overrides: "",
    report: "",
    sendInvites: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--send-invites") {
      args.sendInvites = true;
    } else if (token === "--input") {
      args.input = argv[index + 1] || "";
      index += 1;
    } else if (token === "--cohort") {
      args.cohort = argv[index + 1] || "";
      index += 1;
    } else if (token === "--batch") {
      args.batch = argv[index + 1] || "";
      index += 1;
    } else if (token === "--overrides") {
      args.overrides = argv[index + 1] || "";
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
  pnpm cohorts:import -- --input "/path/to/file.csv" --cohort academic --batch 2026-03-cohort-migration [--overrides ./data/cohort-migration/member-overrides.csv] [--dry-run] [--report ./report.json] [--send-invites]

Accepted inputs:
  - Canonical CSV with columns like email, primary_cohort_slug, first_name, surname
  - Google Forms cohort response CSVs plus --cohort to set the primary cohort slug
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

function mapHeading(heading) {
  return GOOGLE_FORM_COLUMN_MAP[heading] || heading.trim().toLowerCase().replace(/\s+/g, "_");
}

function normaliseText(value) {
  return String(value || "").trim();
}

function clampText(value, maxLength) {
  return normaliseText(value).slice(0, maxLength);
}

function normaliseEmail(value) {
  return normaliseText(value).toLowerCase();
}

function splitList(value) {
  return normaliseText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normaliseCohortSlug(value) {
  const raw = normaliseText(value).toLowerCase();

  if (!raw) {
    return "";
  }

  if (raw === "cso" || raw === "civil society") {
    return "civil-society";
  }

  return raw.replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseSubmittedAt(value) {
  const parsed = new Date(normaliseText(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function inferTagsFromText(value) {
  const text = normaliseText(value);

  if (!text) {
    return [];
  }

  return TAG_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(text))).map(
    (rule) => rule.slug,
  );
}

function canonicaliseRow(rawRow, fallbackCohortSlug, sourceName, rowNumber) {
  const mappedRow = Object.fromEntries(
    Object.entries(rawRow).map(([key, value]) => [mapHeading(key), normaliseText(value)]),
  );

  const hasGoogleFormShape = Object.prototype.hasOwnProperty.call(rawRow, "Timestamp");
  const onboardingCompletedValue = normaliseText(mappedRow.onboarding_completed).toLowerCase();
  const email = normaliseEmail(mappedRow.email);
  const primaryCohortSlug = normaliseCohortSlug(
    mappedRow.primary_cohort_slug || mappedRow.primary_cohort || fallbackCohortSlug,
  );
  const domainTagSlugs = mappedRow.domain_tag_slugs
    ? mappedRow.domain_tag_slugs
        .split(",")
        .map((value) => normaliseText(value).toLowerCase())
        .filter(Boolean)
    : inferTagsFromText(mappedRow.domain_knowledge);
  const secondaryCohortSlugs = [
    ...new Set(
      splitList(mappedRow.secondary_cohort_slugs || mappedRow.secondary_cohorts)
        .map(normaliseCohortSlug)
        .filter(Boolean),
    ),
  ];

  return {
    email,
    primary_cohort_slug: primaryCohortSlug,
    secondary_cohort_slugs: secondaryCohortSlugs,
    first_name: mappedRow.first_name || "",
    surname: mappedRow.surname || mappedRow.last_name || "",
    title: mappedRow.title || "",
    middle_names: mappedRow.middle_names || "",
    gender: mappedRow.gender || "",
    languages: splitList(mappedRow.languages),
    role_title: mappedRow.role_title || "",
    organisation_name: mappedRow.organisation_name || "",
    country_of_residence: mappedRow.country_of_residence || "",
    professional_bio: clampText(mappedRow.professional_bio, PROFILE_BIO_MAX_LENGTH),
    visibility_setting: mappedRow.visibility_setting || "members_only",
    domain_tag_slugs: [...new Set(domainTagSlugs)],
    domain_knowledge: mappedRow.domain_knowledge || "",
    focus_area: mappedRow.focus_area || "",
    notable_work: mappedRow.notable_work || "",
    opportunity_interest: mappedRow.opportunity_interest || "",
    additional_comments: mappedRow.additional_comments || "",
    headshot_url: mappedRow.headshot_url || "",
    cv_url: mappedRow.cv_url || "",
    nda_url: mappedRow.nda_url || "",
    code_of_conduct_url: mappedRow.code_of_conduct_url || "",
    migration_source: sourceName,
    migration_batch_id: mappedRow.migration_batch_id || "",
    submitted_at: parseSubmittedAt(mappedRow.submitted_at),
    onboarding_completed:
      onboardingCompletedValue === "true" ||
      onboardingCompletedValue === "yes" ||
      hasGoogleFormShape,
    raw_responses: mappedRow,
    row_number: rowNumber,
  };
}

function readRowsFromFile(filePath, cohortSlug) {
  const rawText = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const [headers, ...rawRows] = parseCsv(rawText);
  const sourceName = path.basename(filePath);

  return rawRows.map((cells, index) => {
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
    return canonicaliseRow(row, cohortSlug, sourceName, index + 2);
  });
}

function readOverridesFromFile(filePath) {
  const rawText = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const [headers, ...rawRows] = parseCsv(rawText);

  return new Map(
    rawRows.map((cells) => {
      const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
      const mapped = canonicaliseRow(row, "", path.basename(filePath), row.row_number || 0);
      return [mapped.email, mapped];
    }),
  );
}

function validateRows(rows) {
  const errors = [];
  const seenEmails = new Set();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  rows.forEach((row) => {
    if (!row.email || !emailPattern.test(row.email)) {
      errors.push(`Row ${row.row_number}: invalid email.`);
    }

    if (!row.primary_cohort_slug) {
      errors.push(`Row ${row.row_number}: primary_cohort_slug is required.`);
    }

    if (row.secondary_cohort_slugs.includes(row.primary_cohort_slug)) {
      errors.push(`Row ${row.row_number}: primary cohort cannot also appear in secondary cohorts.`);
    }

    if (seenEmails.has(row.email)) {
      errors.push(`Row ${row.row_number}: duplicate email ${row.email} in batch.`);
    }

    seenEmails.add(row.email);
  });

  return errors;
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

function createAuditInviteRow({ email, method, userId }) {
  return {
    user_id: userId,
    email,
    invite_token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    invite_type: "cohort_migration",
    delivery_method: method,
  };
}

function createTemporaryPassword() {
  return `Patna!${crypto.randomUUID()}Aa1`;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured. Check apps/web/.env.local.");
  }

  const rows = readRowsFromFile(resolveReadablePath(args.input), args.cohort);
  const overridesByEmail = args.overrides
    ? readOverridesFromFile(resolveReadablePath(args.overrides))
    : new Map();
  const resolvedRows = rows.map((row) => {
    const override = overridesByEmail.get(row.email);

    if (!override) {
      return row;
    }

    return {
      ...row,
      first_name: override.first_name || row.first_name,
      surname: override.surname || row.surname,
      primary_cohort_slug: override.primary_cohort_slug || row.primary_cohort_slug,
      secondary_cohort_slugs:
        override.secondary_cohort_slugs?.length ? override.secondary_cohort_slugs : row.secondary_cohort_slugs,
      onboarding_completed: override.onboarding_completed || row.onboarding_completed,
    };
  });
  const validationErrors = validateRows(resolvedRows);

  if (validationErrors.length) {
    throw new Error(`Batch validation failed:\n- ${validationErrors.join("\n- ")}`);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [{ data: cohorts, error: cohortError }, { data: tags, error: tagError }, authUsers] =
    await Promise.all([
      supabase.from("cohorts").select("id, slug"),
      supabase.from("domain_tags").select("id, slug"),
      listAllAuthUsers(supabase),
    ]);

  if (cohortError) {
    throw cohortError;
  }

  if (tagError) {
    throw tagError;
  }

  const cohortsBySlug = new Map((cohorts || []).map((cohort) => [cohort.slug, cohort]));
  const tagsBySlug = new Map((tags || []).map((tag) => [tag.slug, tag]));
  const { data: existingProfiles, error: existingProfilesError } = await supabase
    .from("profiles")
    .select("id, email, onboarding_status, invited_at, onboarding_completed_at");

  if (existingProfilesError) {
    throw existingProfilesError;
  }

  const profilesByEmail = new Map(
    (existingProfiles || [])
      .filter((profile) => profile.email)
      .map((profile) => [String(profile.email).trim().toLowerCase(), profile]),
  );
  const usersByEmail = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [String(user.email).trim().toLowerCase(), user]),
  );

  const unknownCohorts = resolvedRows
    .flatMap((row) => {
      const missing = [];
      if (!cohortsBySlug.has(row.primary_cohort_slug)) {
        missing.push(`Row ${row.row_number}: unknown cohort ${row.primary_cohort_slug}.`);
      }
      row.secondary_cohort_slugs.forEach((slug) => {
        if (!cohortsBySlug.has(slug)) {
          missing.push(`Row ${row.row_number}: unknown secondary cohort ${slug}.`);
        }
      });
      return missing;
    });
  const unknownTags = resolvedRows.flatMap((row) =>
    row.domain_tag_slugs
      .filter((slug) => !tagsBySlug.has(slug))
      .map((slug) => `Row ${row.row_number}: unknown domain tag ${slug}.`),
  );

  if (unknownCohorts.length || unknownTags.length) {
    throw new Error(`Reference validation failed:\n- ${[...unknownCohorts, ...unknownTags].join("\n- ")}`);
  }

  const batchId = args.batch || `cohort-migration-${new Date().toISOString().slice(0, 10)}`;
  const results = [];

  for (const row of resolvedRows) {
    const existingUser = usersByEmail.get(row.email);
    const existingProfile = profilesByEmail.get(row.email);
    const cohort = cohortsBySlug.get(row.primary_cohort_slug);
    const secondaryCohortIds = row.secondary_cohort_slugs.map((slug) => cohortsBySlug.get(slug).id);
    const rowTagIds = row.domain_tag_slugs.map((slug) => tagsBySlug.get(slug).id);
    const isExistingUser = Boolean(existingUser);

    if (args.dryRun) {
      results.push({
        email: row.email,
        primary_cohort_slug: row.primary_cohort_slug,
        secondary_cohort_slugs: row.secondary_cohort_slugs,
        onboarding_completed: row.onboarding_completed,
        result: isExistingUser ? "updated" : "created",
        reason: isExistingUser
          ? args.sendInvites
            ? "Existing auth user will be enriched and sent a set-password email."
            : "Existing auth user will be enriched without sending email."
          : args.sendInvites
            ? "New auth user will be invited by email."
            : "New auth user will be created without sending email.",
      });
      continue;
    }

    let userId = existingUser?.id || "";
    let deliveryMethod = "";

    if (!existingUser) {
      let data;
      let error;

      if (args.sendInvites) {
        ({ data, error } = await supabase.auth.admin.inviteUserByEmail(row.email, {
          redirectTo: `${siteUrl}/auth/callback?next=/app`,
        }));
        deliveryMethod = "supabase_invite";
      } else {
        ({ data, error } = await supabase.auth.admin.createUser({
          email: row.email,
          password: createTemporaryPassword(),
          email_confirm: true,
          user_metadata: {
            first_name: row.first_name || undefined,
            surname: row.surname || undefined,
          },
        }));
      }

      if (error) {
        results.push({
          email: row.email,
          primary_cohort_slug: row.primary_cohort_slug,
          result: "failed",
          reason: error.message,
        });
        continue;
      }

      userId = data.user.id;
      usersByEmail.set(row.email, data.user);
    } else if (args.sendInvites) {
      deliveryMethod = "manual_reset";

      const { error } = await supabase.auth.resetPasswordForEmail(row.email, {
        redirectTo: `${siteUrl}/auth/callback?next=/app`,
      });

      if (error) {
        results.push({
          email: row.email,
          primary_cohort_slug: row.primary_cohort_slug,
          result: "failed",
          reason: error.message,
        });
        continue;
      }
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: row.email,
        first_name: row.first_name || null,
        surname: row.surname || null,
        title: row.title || null,
        role_title: row.role_title || null,
        organisation_name: row.organisation_name || null,
        country_of_residence: row.country_of_residence || null,
        professional_bio: row.professional_bio || null,
        visibility_setting: row.visibility_setting || "members_only",
        onboarding_status:
          existingProfile?.onboarding_status === "active" || row.onboarding_completed
            ? "active"
            : "invited",
        migration_source: row.migration_source,
        migration_batch_id: row.migration_batch_id || batchId,
        invited_at: existingProfile?.invited_at || (args.sendInvites ? new Date().toISOString() : null),
        onboarding_completed_at:
          existingProfile?.onboarding_completed_at ||
          (row.onboarding_completed ? new Date().toISOString() : null),
      },
      { onConflict: "id" },
    );

    if (profileError) {
      results.push({
        email: row.email,
        primary_cohort_slug: row.primary_cohort_slug,
        result: "failed",
        reason: profileError.message,
      });
      continue;
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });

    if (roleError) {
      results.push({
        email: row.email,
        primary_cohort_slug: row.primary_cohort_slug,
        result: "failed",
        reason: roleError.message,
      });
      continue;
    }

    await supabase
      .from("user_cohorts")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .neq("cohort_id", cohort.id);

    const { error: cohortErrorForRow } = await supabase.from("user_cohorts").upsert(
      {
        user_id: userId,
        cohort_id: cohort.id,
        is_primary: true,
      },
      { onConflict: "user_id,cohort_id" },
    );

    if (cohortErrorForRow) {
      results.push({
        email: row.email,
        primary_cohort_slug: row.primary_cohort_slug,
        result: "failed",
        reason: cohortErrorForRow.message,
      });
      continue;
    }

    if (secondaryCohortIds.length) {
      const { error: secondaryCohortError } = await supabase.from("user_cohorts").upsert(
        secondaryCohortIds.map((cohortId) => ({
          user_id: userId,
          cohort_id: cohortId,
          is_primary: false,
        })),
        { onConflict: "user_id,cohort_id" },
      );

      if (secondaryCohortError) {
        results.push({
          email: row.email,
          primary_cohort_slug: row.primary_cohort_slug,
          result: "failed",
          reason: secondaryCohortError.message,
        });
        continue;
      }
    }

    if (rowTagIds.length) {
      const { error: tagErrorForRow } = await supabase.from("user_tags").upsert(
        rowTagIds.map((tagId) => ({
          user_id: userId,
          tag_id: tagId,
        })),
        { onConflict: "user_id,tag_id" },
      );

      if (tagErrorForRow) {
        results.push({
          email: row.email,
          primary_cohort_slug: row.primary_cohort_slug,
          result: "failed",
          reason: tagErrorForRow.message,
        });
        continue;
      }
    }

    const { error: cohortProfileError } = await supabase.from("cohort_member_profiles").upsert(
      {
        user_id: userId,
        source_cohort_id: cohort.id,
        source_submitted_at: row.submitted_at,
        middle_names: row.middle_names || null,
        gender: row.gender || null,
        languages: row.languages,
        domain_knowledge: row.domain_knowledge || null,
        focus_area: row.focus_area || null,
        notable_work: row.notable_work || null,
        opportunity_interest: row.opportunity_interest || null,
        additional_comments: row.additional_comments || null,
        headshot_url: row.headshot_url || null,
        cv_url: row.cv_url || null,
        nda_url: row.nda_url || null,
        code_of_conduct_url: row.code_of_conduct_url || null,
        raw_responses: row.raw_responses,
        completed_at: row.onboarding_completed ? row.submitted_at || new Date().toISOString() : null,
      },
      { onConflict: "user_id" },
    );

    if (cohortProfileError) {
      results.push({
        email: row.email,
        primary_cohort_slug: row.primary_cohort_slug,
        result: "failed",
        reason: cohortProfileError.message,
      });
      continue;
    }

    if (args.sendInvites && deliveryMethod) {
      const { error: inviteAuditError } = await supabase
        .from("invites")
        .insert(createAuditInviteRow({ email: row.email, method: deliveryMethod, userId }));

      if (inviteAuditError) {
        results.push({
          email: row.email,
          primary_cohort_slug: row.primary_cohort_slug,
          result: "failed",
          reason: inviteAuditError.message,
        });
        continue;
      }
    }

    results.push({
      email: row.email,
      primary_cohort_slug: row.primary_cohort_slug,
      result: isExistingUser ? "updated" : "created",
      reason: args.sendInvites
        ? deliveryMethod === "supabase_invite"
          ? "Invite email sent and profile prepared."
          : "Existing account enriched and password reset email sent."
        : isExistingUser
          ? "Existing account enriched without sending email."
          : "Account created and profile prepared without sending email.",
    });
  }

  if (args.report) {
    const reportPath = resolveWritablePath(args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  }

  console.log(JSON.stringify({ batchId, dryRun: args.dryRun, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
