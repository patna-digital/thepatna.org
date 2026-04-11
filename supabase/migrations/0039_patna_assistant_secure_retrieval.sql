-- 0039 · PATNA Assistant: secure retrieval + richer source visibility
-- Expands assistant document source/visibility support and replaces the
-- authenticated match_documents RPC with a service-role-only helper.

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
      'community_application'
    )
  );

alter table public.document_embeddings
  drop constraint if exists document_embeddings_visibility_check;

alter table public.document_embeddings
  add constraint document_embeddings_visibility_check
  check (visibility in ('space_members', 'members', 'public', 'admin_only'));

drop policy if exists "Members can read permitted embeddings" on public.document_embeddings;

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
    or (
      visibility = 'admin_only'
      and public.current_user_has_role('administrator')
    )
  );

create index if not exists document_embeddings_visibility_idx
  on public.document_embeddings (visibility);

revoke execute on function public.match_documents(extensions.vector(384), int, uuid[])
  from anon, authenticated, public;

create or replace function public.match_assistant_documents(
  query_embedding      extensions.vector(384),
  match_count          int      default 8,
  filter_space_ids     uuid[]   default null,
  filter_source_types  text[]   default null,
  allow_member_content boolean  default true,
  allow_admin_content  boolean  default false
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
    1 - (de.embedding <=> query_embedding) as similarity
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
  order by de.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_assistant_documents(
  extensions.vector(384),
  int,
  uuid[],
  text[],
  boolean,
  boolean
) from anon, authenticated, public;

grant execute on function public.match_assistant_documents(
  extensions.vector(384),
  int,
  uuid[],
  text[],
  boolean,
  boolean
) to service_role;
