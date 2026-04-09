-- 0038 · PATNA Assistant: vector embeddings for RAG
-- Enables pgvector, creates document_embeddings table with RLS,
-- and exposes a match_documents RPC for filtered similarity search.

-- Enable pgvector (built into all Supabase projects)
create extension if not exists vector with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- document_embeddings
-- Stores chunked text + 384-dim embeddings for threads, comments,
-- content_items, events, and profiles.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.document_embeddings (
  id           uuid primary key default gen_random_uuid(),

  -- Which source record this chunk came from
  source_type  text not null
    check (source_type in ('thread', 'comment', 'content_item', 'event', 'profile')),
  source_id    uuid not null,

  -- Space scoping:
  --   NULL  → globally scoped content (content_items, events, profiles)
  --   uuid  → visible only to members of that space (threads, comments)
  space_id     uuid references public.spaces(id) on delete cascade,

  -- Mirrors source-table visibility
  --   'space_members' → only members of space_id can read
  --   'members'       → any authenticated member
  --   'public'        → everyone
  visibility   text not null default 'space_members'
    check (visibility in ('space_members', 'members', 'public')),

  content_text text not null,
  embedding    extensions.vector(384),
  metadata     jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Unique constraint enabling efficient upserts (source_type, source_id pair is unique per chunk)
create unique index if not exists document_embeddings_source_idx
  on public.document_embeddings (source_type, source_id);

-- HNSW index for fast approximate nearest-neighbour cosine search
create index if not exists document_embeddings_hnsw_idx
  on public.document_embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists document_embeddings_space_id_idx
  on public.document_embeddings (space_id);

create index if not exists document_embeddings_source_type_idx
  on public.document_embeddings (source_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.document_embeddings enable row level security;

-- Authenticated members may read embeddings they are permitted to see
create policy "Members can read permitted embeddings"
  on public.document_embeddings for select
  to authenticated
  using (
    visibility = 'public'
    or (
      visibility = 'members'
      and exists (select 1 from public.profiles where id = auth.uid())
    )
    or (
      visibility = 'space_members'
      and space_id in (
        select space_id from public.space_memberships where user_id = auth.uid()
      )
    )
  );

-- Service role (used by Edge Functions and backfill) bypasses RLS
create policy "Service role can manage embeddings"
  on public.document_embeddings for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- match_documents RPC
-- Called from the Next.js API route to do a filtered similarity search.
-- filter_space_ids: array of space UUIDs the requesting user belongs to.
--   Pass NULL to skip space filtering (admin use / global content only).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.match_documents(
  query_embedding  extensions.vector(384),
  match_count      int     default 8,
  filter_space_ids uuid[]  default null
)
returns table (
  id           uuid,
  source_type  text,
  source_id    uuid,
  content_text text,
  metadata     jsonb,
  similarity   float
)
language sql stable
security definer
set search_path = public
as $$
  select
    de.id,
    de.source_type,
    de.source_id,
    de.content_text,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  where
    -- include space-scoped content the user belongs to, or globally scoped content
    (
      filter_space_ids is null
      or de.space_id = any(filter_space_ids)
      or de.space_id is null
    )
  order by de.embedding <=> query_embedding
  limit match_count;
$$;

-- Grant execution to authenticated users (RLS on the table still applies within)
grant execute on function public.match_documents to authenticated;
grant execute on function public.match_documents to service_role;
