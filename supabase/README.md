# Supabase Plan

This folder is reserved for PATNA backend assets.

Suggested use:
- `migrations/`: SQL schema and RLS policies
- `seed/`: local development seed data
- `functions/`: edge functions for workflows that should not run in the browser
- `types/`: generated database types for the web app

Suggested implementation order:
1. Auth and profiles
2. Cohorts, tags, and spaces
3. Applications and invite workflow
4. Content, attachments, and events
5. Work With Us pipelines
6. Storage buckets and signed upload flows

Core Supabase responsibilities:
- Auth for members, moderators, editors, and admins
- Postgres for PATNA structured data
- Storage for reports, briefs, profile images, and event files
- Row Level Security for public, member, moderator, and admin visibility
