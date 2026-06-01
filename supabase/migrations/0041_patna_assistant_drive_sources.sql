-- 0041 · PATNA Assistant: Google Drive external sources
-- Adds support for admin-managed Google Drive folder sources.
-- Each folder is an assistant_external_source; each discovered PDF becomes
-- an assistant_external_document whose embedding is stored as source_type =
-- 'external_document' in document_embeddings.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend document_embeddings to accept the new source type
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.document_embeddings
  drop constraint if exists document_embeddings_source_type_check;

alter table public.document_embeddings
  add constraint document_embeddings_source_type_check
  check (
    source_type in (
      'thread',
      'comment',
      'content_item',
      'event',
      'profile',
      'community_application',
      'external_document'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- assistant_external_sources
-- One row per configured Google Drive folder.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.assistant_external_sources (
  id                 uuid        primary key default gen_random_uuid(),

  -- Which external provider this source comes from (only 'google_drive' for v1)
  provider           text        not null default 'google_drive',

  -- Shape of the external resource ('folder' for v1)
  source_kind        text        not null default 'folder',

  -- Human-readable label set by the admin
  title              text        not null,

  -- The original URL the admin pasted (used for display and re-validation)
  source_url         text        not null,

  -- The Drive folder ID extracted from source_url
  external_folder_id text        not null,

  -- Embedding visibility for all files in this source
  visibility         text        not null default 'members'
    check (visibility in ('public', 'members', 'admin_only')),

  -- Lifecycle state of the source record itself
  status             text        not null default 'pending'
    check (status in ('pending', 'active', 'error')),

  -- Admin who created the source
  created_by         uuid        references public.profiles(id) on delete set null,

  -- Sync bookkeeping
  last_synced_at     timestamptz,
  last_sync_status   text        check (last_sync_status in ('ok', 'partial', 'error')),
  last_sync_error    text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- assistant_external_documents
-- One row per file discovered inside a configured source folder.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.assistant_external_documents (
  id                  uuid        primary key default gen_random_uuid(),

  -- Parent source
  source_id           uuid        not null
    references public.assistant_external_sources(id) on delete cascade,

  -- Drive file ID (stable across renames)
  external_file_id    text        not null,

  title               text        not null,
  mime_type           text        not null default 'application/pdf',

  -- Web-viewable URL (Drive share link)
  source_url          text        not null,

  -- Direct download URL used by the indexer
  download_url        text,

  -- Drive modifiedTime (ISO 8601 string from the API)
  modified_at         timestamptz,

  -- Stable change key: md5Checksum when available, else modifiedTime string
  checksum_or_version text,

  -- Per-file indexing lifecycle
  status              text        not null default 'pending'
    check (status in ('pending', 'indexed', 'error', 'skipped')),

  last_indexed_at     timestamptz,
  last_error          text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Each file within a source is unique by its Drive file ID
  unique (source_id, external_file_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists assistant_external_documents_source_id_idx
  on public.assistant_external_documents (source_id);

create index if not exists assistant_external_documents_status_idx
  on public.assistant_external_documents (status);

create index if not exists assistant_external_sources_status_idx
  on public.assistant_external_sources (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.assistant_external_sources  enable row level security;
alter table public.assistant_external_documents enable row level security;

-- Service role (used by Next.js API routes and scripts) has full access
create policy "Service role can manage external sources"
  on public.assistant_external_sources for all
  to service_role
  using (true)
  with check (true);

create policy "Service role can manage external documents"
  on public.assistant_external_documents for all
  to service_role
  using (true)
  with check (true);