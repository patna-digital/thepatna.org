# Supabase Remote Workflow

This project now includes:
- remote-safe SQL migrations in `supabase/migrations/`
- a reference seed file in `supabase/seed/001_reference_data.sql`
- package scripts for linking, pushing migrations, and generating database types

## 1. Fill the local environment

Create `apps/web/.env.local` with:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
SUPABASE_DB_PASSWORD=YOUR_DATABASE_PASSWORD
```

Use the values from:
- Supabase project settings
- API settings
- database password used when the project was created

## 2. Link the local repo to the remote project

```bash
pnpm supabase:link
```

## 3. Push the migrations

```bash
pnpm supabase:push
```

If you want a preview first:

```bash
supabase db push --linked --dry-run
```

## 4. Generate TypeScript types

```bash
pnpm supabase:types
```

This writes:

```text
apps/web/lib/database.types.ts
```

## 5. Load the reference seed data

The CLI push command does not automatically execute `supabase/seed/001_reference_data.sql` in this setup.

Run the SQL in one of these ways:
- paste `supabase/seed/001_reference_data.sql` into the Supabase SQL editor
- or execute it through your preferred SQL workflow after the migrations succeed

## Notes

- The login form uses Supabase Auth and session cookies.
- The community join form uses a server action and the service role key to create application records plus cohort and tag interests.
- Protected routes under `/app` and `/admin` now redirect unauthenticated users to `/auth/login`.
- The package scripts source values from `apps/web/.env.local` automatically.
