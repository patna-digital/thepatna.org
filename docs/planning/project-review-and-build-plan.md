# Project Review And Build Plan

## Review

The repository started as a concept workspace rather than an application workspace.

Current findings:
- There was no app structure, package management, or deployment configuration.
- The two implementation references were a public-site HTML mockup and a community dashboard React mockup.
- The PRD defines three product surfaces: public website, members-only community, and admin workflows.
- The updated data model is already well aligned with a relational Supabase backend.
- The PRD mentions a CMS-oriented stack, but the requested direction is Supabase plus Vercel. That is a strategic shift and should be treated explicitly rather than mixed halfway with WordPress assumptions.

## Recommended Platform Shape

Use one Next.js application in `apps/web` with clear route separation:
- marketing routes for the public site
- auth routes for login and invite acceptance
- member routes under `/app`
- admin routes under `/admin`

Use Supabase for:
- authentication and role-aware access
- primary relational data store
- storage for content files and media
- invite and onboarding workflows
- server-side operations via edge functions where secrets are required

Use Vercel for:
- hosting the Next.js app
- preview deployments per branch
- environment management
- scheduled jobs only if they are simpler there than in Supabase

## Product Breakdown

Phase 1 should deliver the public platform:
- homepage, about, projects, insights, events, community explainer, work-with-us, contact, legal
- content model for insights, project pages, and event outputs
- forms for contact and work-with-us intake

Phase 2 should deliver the member platform:
- invite acceptance and auth
- onboarding flow
- member profiles and cohort assignment
- spaces, threads, comments, and moderation basics

Phase 3 should deliver admin operations:
- application review and invite issuance
- content and event management
- partnership and service-request pipeline review

Phase 4 can add multilingual publishing and AI indexing:
- translated content records and UI language support
- content embeddings and retrieval
- role-aware search and later assistant workflows

## Immediate Build Plan

1. Scaffold a Next.js App Router app in `apps/web`
2. Add shared layout, typography tokens, and PATNA brand variables from the mockup
3. Implement Supabase client wiring for browser, server, and middleware contexts
4. Create initial SQL migrations for profiles, cohorts, tags, spaces, threads, comments, applications, invites, content, and service pipelines
5. Build the public marketing pages from `apps/web/mockups/public-site/patna-website-mockup.html`
6. Build the member dashboard and spaces UX from `apps/web/mockups/community-space/patna-community-dashboard.jsx`
7. Connect Vercel preview and production environments to the Supabase project

## Key Decisions To Lock Early

- Content editing model: admin UI in-app, external CMS, or hybrid
- Multilingual strategy: per-record translations in Postgres or separate content workflow
- File strategy: direct uploads to Supabase Storage or admin-managed upload actions
- Roles: exact mapping for member, cohort lead, moderator, editor, and admin
- Search: Postgres full-text first, external search only if needed later

## Recommended Development Standard

Keep one source of truth for structured content and community data in Supabase.
Avoid splitting content ownership across ad hoc documents, manual spreadsheets, and a second CMS unless there is a clear operational reason.
