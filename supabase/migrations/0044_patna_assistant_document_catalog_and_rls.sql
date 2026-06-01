-- 0044 · PATNA Assistant: document catalog metadata + authenticated reads
-- Adds normalized metadata for uploaded documents and allows authenticated
-- users to read catalog rows according to the parent source visibility.

alter table public.assistant_external_documents
  add column if not exists document_code_display text,
  add column if not exists document_code_normalized text,
  add column if not exists meeting_body text,
  add column if not exists meeting_session integer,
  add column if not exists agenda_item text,
  add column if not exists agenda_title text,
  add column if not exists submitter_entities text[] not null default '{}'::text[],
  add column if not exists country_entities text[] not null default '{}'::text[],
  add column if not exists organization_entities text[] not null default '{}'::text[],
  add column if not exists topic_tags text[] not null default '{}'::text[],
  add column if not exists language text,
  add column if not exists summary_excerpt text,
  add column if not exists indexed_chunk_count integer not null default 0,
  add column if not exists content_character_count integer not null default 0;

update public.assistant_external_documents
set
  submitter_entities = coalesce(submitter_entities, '{}'::text[]),
  country_entities = coalesce(country_entities, '{}'::text[]),
  organization_entities = coalesce(organization_entities, '{}'::text[]),
  topic_tags = coalesce(topic_tags, '{}'::text[]),
  indexed_chunk_count = coalesce(indexed_chunk_count, 0),
  content_character_count = coalesce(content_character_count, 0);

create index if not exists assistant_external_documents_document_code_normalized_idx
  on public.assistant_external_documents (document_code_normalized);

create index if not exists assistant_external_documents_meeting_body_session_idx
  on public.assistant_external_documents (meeting_body, meeting_session);

create index if not exists assistant_external_documents_submitter_entities_gin_idx
  on public.assistant_external_documents using gin (submitter_entities);

create index if not exists assistant_external_documents_country_entities_gin_idx
  on public.assistant_external_documents using gin (country_entities);

create index if not exists assistant_external_documents_organization_entities_gin_idx
  on public.assistant_external_documents using gin (organization_entities);

create index if not exists assistant_external_documents_topic_tags_gin_idx
  on public.assistant_external_documents using gin (topic_tags);

drop policy if exists "Service role can manage external sources"
  on public.assistant_external_sources;

drop policy if exists "Service role can manage external documents"
  on public.assistant_external_documents;

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

create policy "Authenticated users can read permitted external sources"
  on public.assistant_external_sources for select
  to authenticated
  using (
    visibility = 'public'
    or (
      visibility = 'members'
      and exists (select 1 from public.profiles where id = auth.uid())
    )
    or (
      visibility = 'admin_only'
      and public.current_user_has_role('administrator')
    )
  );

create policy "Authenticated users can read permitted external documents"
  on public.assistant_external_documents for select
  to authenticated
  using (
    exists (
      select 1
      from public.assistant_external_sources src
      where src.id = assistant_external_documents.source_id
        and (
          src.visibility = 'public'
          or (
            src.visibility = 'members'
            and exists (select 1 from public.profiles where id = auth.uid())
          )
          or (
            src.visibility = 'admin_only'
            and public.current_user_has_role('administrator')
          )
        )
    )
  );
