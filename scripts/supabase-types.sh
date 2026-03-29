#!/usr/bin/env bash
set -euo pipefail

if [ -f "apps/web/.env.local" ]; then
  set -a
  . "apps/web/.env.local"
  set +a
fi

supabase gen types --linked --lang typescript --schema public > apps/web/lib/database.types.ts
