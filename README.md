# PATNA Platform Workspace

This workspace is now organized for development of the PATNA platform as a Vercel-hosted web application backed by Supabase.

Current state:
- source strategy and requirements documents are under `docs/source/`
- visual references for the public website and community space are under `apps/web/mockups/`
- application, backend, and planning folders are in place, but the production app has not been scaffolded yet

Recommended stack:
- `apps/web`: Next.js App Router application deployed to Vercel
- `supabase/`: database migrations, storage conventions, auth, and edge-function support
- `docs/planning/`: build plan, architecture notes, and implementation decisions

Top-level structure:

```text
apps/
  web/
    app/
    components/
    lib/
    public/
    mockups/
docs/
  planning/
  source/
supabase/
  migrations/
  seed/
  functions/
  types/
```

Priority next steps:
1. Scaffold the Next.js app in `apps/web`
2. Translate the conceptual data model into Supabase SQL migrations
3. Build public marketing pages from the website mockup
4. Build auth, onboarding, spaces, and admin flows from the community mockup

Planning references:
- `docs/planning/project-review-and-build-plan.md`
- `docs/planning/supabase-schema-outline.md`
- `docs/planning/supabase-remote-workflow.md`
- `apps/web/README.md`
- `supabase/README.md`
