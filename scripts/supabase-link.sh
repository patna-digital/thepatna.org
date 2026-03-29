#!/usr/bin/env bash
set -euo pipefail

if [ -f "apps/web/.env.local" ]; then
  set -a
  . "apps/web/.env.local"
  set +a
fi

: "${SUPABASE_PROJECT_ID:?SUPABASE_PROJECT_ID is required. Set it in apps/web/.env.local.}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required. Set it in apps/web/.env.local.}"

supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD"
