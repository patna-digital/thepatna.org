-- 0042 · PATNA Assistant: Google Drive sync progress tracking
-- Adds lightweight per-source progress counters so the admin UI can display
-- a live progress bar while Drive files are being synced and embedded.

alter table public.assistant_external_sources
  add column if not exists current_sync_total integer not null default 0
    check (current_sync_total >= 0),
  add column if not exists current_sync_processed integer not null default 0
    check (current_sync_processed >= 0),
  add column if not exists current_sync_stage text,
  add column if not exists current_sync_started_at timestamptz;
