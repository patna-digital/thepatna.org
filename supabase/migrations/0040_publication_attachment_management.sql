alter table public.content_attachments
  add column if not exists source_kind text
    check (source_kind in ('storage', 'external')),
  add column if not exists storage_path text,
  add column if not exists original_url text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists sort_order integer not null default 0;

update public.content_attachments
set source_kind = 'external'
where source_kind is null;

update public.content_attachments
set original_url = file_url
where source_kind = 'external'
  and coalesce(original_url, '') = '';

with ranked_attachments as (
  select
    id,
    content_id,
    row_number() over (
      partition by content_id
      order by created_at asc, id asc
    ) as attachment_rank
  from public.content_attachments
)
update public.content_attachments as attachments
set
  sort_order = ranked_attachments.attachment_rank - 1,
  is_primary = (ranked_attachments.attachment_rank = 1)
from ranked_attachments
where attachments.id = ranked_attachments.id;

create unique index if not exists idx_content_attachments_one_primary_per_content
on public.content_attachments (content_id)
where is_primary = true;

create index if not exists idx_content_attachments_content_order
on public.content_attachments (content_id, is_primary desc, sort_order asc, created_at asc);
