# Cohort Migration Runbook

Use the cohort import script to migrate existing PATNA cohort members directly into the new app.

## Command pattern

```bash
pnpm cohorts:import -- --input "/absolute/path/to/file.csv" --cohort academic --batch 2026-03-cohort-migration --overrides "./data/cohort-migration/member-overrides.csv" --dry-run
```

Remove `--dry-run` to perform the import without sending emails. Add `--send-invites` only when you want the script itself to send access emails.

## Supported input shapes

- Canonical CSV with `email` and `primary_cohort_slug`
- Google Forms response CSVs from existing PATNA cohort profile forms, with `--cohort` supplied on the command line
- Optional overrides CSV for major/secondary cohort corrections and completed-onboarding flags

## Example commands

```bash
pnpm cohorts:import -- --input "/Users/petgrave/Downloads/Academia Working Group Research Profile Request (Responses) - Form Responses 1.csv" --cohort academic --batch 2026-03-academic --overrides "./data/cohort-migration/member-overrides.csv" --dry-run
```

```bash
pnpm cohorts:import -- --input "/Users/petgrave/Downloads/Policy Cohort Research Profile Request (Responses) - Form Responses 1.csv" --cohort policy --batch 2026-03-policy --overrides "./data/cohort-migration/member-overrides.csv" --dry-run
```

```bash
pnpm cohorts:import -- --input "./data/cohort-migration/2026-03-academic-policy-canonical.csv" --batch 2026-03-academic-policy-live --report "./data/cohort-migration/reports/2026-03-academic-policy-live-report.json"
```

## Required environment

The script reads credentials from `apps/web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Expected outcomes

- New members are created in Supabase Auth without being contacted yet
- Existing users are enriched without changing their contact state
- Admins can later send login emails from the admin portal
- Each user gets one primary cohort assignment
- Secondary cohorts can be imported as non-primary memberships
- Google Form cohort responses are treated as completed onboarding data unless explicitly overridden
