-- 0043 · PATNA Assistant: chunked document retrieval + lexical search
-- Supports multi-chunk embeddings per source, external-source-aware filtering,
-- and lexical title/content search for exact phrase retrieval.

alter table public.document_embeddings
  add column if not exists chunk_index integer not null default 0;

drop index if exists document_embeddings_source_idx;

create unique index if not exists document_embeddings_source_chunk_idx
  on public.document_embeddings (source_type, source_id, chunk_index);

drop function if exists public.match_assistant_documents(
  extensions.vector(384),
  int,
  uuid[],
  text[],
  boolean,
  boolean
);

create function public.match_assistant_documents(
  query_embedding            extensions.vector(384),
  match_count                int      default 8,
  filter_space_ids           uuid[]   default null,
  filter_source_types        text[]   default null,
  allow_member_content       boolean  default true,
  allow_admin_content        boolean  default false,
  filter_external_source_ids text[]   default null
)
returns table (
  id           uuid,
  source_type  text,
  source_id    uuid,
  space_id     uuid,
  visibility   text,
  content_text text,
  metadata     jsonb,
  similarity   float
)
language sql
stable
set search_path = public
as $$
  select
    de.id,
    de.source_type,
    de.source_id,
    de.space_id,
    de.visibility,
    de.content_text,
    de.metadata,
    1 - (de.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.document_embeddings de
  where
    (
      de.visibility = 'public'
      or (allow_member_content and de.visibility = 'members')
      or (
        de.visibility = 'space_members'
        and filter_space_ids is not null
        and de.space_id = any(filter_space_ids)
      )
      or (allow_admin_content and de.visibility = 'admin_only')
    )
    and (
      filter_source_types is null
      or de.source_type = any(filter_source_types)
    )
    and (
      de.source_type <> 'external_document'
      or filter_external_source_ids is null
      or coalesce(de.metadata->>'external_source_id', '') = any(filter_external_source_ids)
    )
  order by de.embedding OPERATOR(extensions.<=>) query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_assistant_documents(
  extensions.vector(384),
  int,
  uuid[],
  text[],
  boolean,
  boolean,
  text[]
) from anon, authenticated, public;

grant execute on function public.match_assistant_documents(
  extensions.vector(384),
  int,
  uuid[],
  text[],
  boolean,
  boolean,
  text[]
) to service_role;

drop function if exists public.search_assistant_documents_lexical(
  text,
  text[],
  int,
  uuid[],
  text[],
  boolean,
  boolean,
  text[]
);

create function public.search_assistant_documents_lexical(
  query_phrase              text    default null,
  query_terms               text[]  default null,
  match_count               int     default 8,
  filter_space_ids          uuid[]  default null,
  filter_source_types       text[]  default null,
  allow_member_content      boolean default true,
  allow_admin_content       boolean default false,
  filter_external_source_ids text[] default null
)
returns table (
  id           uuid,
  source_type  text,
  source_id    uuid,
  space_id     uuid,
  visibility   text,
  content_text text,
  metadata     jsonb,
  lexical_rank float
)
language sql
stable
set search_path = public
as $$
  with prepared as (
    select
      lower(trim(coalesce(query_phrase, ''))) as phrase,
      array(
        select distinct lower(trim(term))
        from unnest(coalesce(query_terms, '{}'::text[])) term
        where length(trim(term)) >= 2
      ) as terms
  )
  select
    de.id,
    de.source_type,
    de.source_id,
    de.space_id,
    de.visibility,
    de.content_text,
    de.metadata,
    (
      case
        when prepared.phrase <> '' and lower(coalesce(de.metadata->>'title', '')) like '%' || prepared.phrase || '%'
          then 6
        else 0
      end +
      case
        when prepared.phrase <> '' and lower(de.content_text) like '%' || prepared.phrase || '%'
          then 4
        else 0
      end +
      coalesce((
        select count(*)::float
        from unnest(prepared.terms) term
        where lower(coalesce(de.metadata->>'title', '')) like '%' || term || '%'
      ), 0) * 2 +
      coalesce((
        select count(*)::float
        from unnest(prepared.terms) term
        where lower(de.content_text) like '%' || term || '%'
      ), 0)
    ) as lexical_rank
  from public.document_embeddings de
  cross join prepared
  where
    (
      de.visibility = 'public'
      or (allow_member_content and de.visibility = 'members')
      or (
        de.visibility = 'space_members'
        and filter_space_ids is not null
        and de.space_id = any(filter_space_ids)
      )
      or (allow_admin_content and de.visibility = 'admin_only')
    )
    and (
      filter_source_types is null
      or de.source_type = any(filter_source_types)
    )
    and (
      de.source_type <> 'external_document'
      or filter_external_source_ids is null
      or coalesce(de.metadata->>'external_source_id', '') = any(filter_external_source_ids)
    )
    and (
      (prepared.phrase <> '' and (
        lower(coalesce(de.metadata->>'title', '')) like '%' || prepared.phrase || '%'
        or lower(de.content_text) like '%' || prepared.phrase || '%'
      ))
      or exists (
        select 1
        from unnest(prepared.terms) term
        where
          lower(coalesce(de.metadata->>'title', '')) like '%' || term || '%'
          or lower(de.content_text) like '%' || term || '%'
      )
    )
  order by lexical_rank desc, de.updated_at desc
  limit greatest(match_count, 1);
$$;

revoke all on function public.search_assistant_documents_lexical(
  text,
  text[],
  int,
  uuid[],
  text[],
  boolean,
  boolean,
  text[]
) from anon, authenticated, public;

grant execute on function public.search_assistant_documents_lexical(
  text,
  text[],
  int,
  uuid[],
  text[],
  boolean,
  boolean,
  text[]
) to service_role;
