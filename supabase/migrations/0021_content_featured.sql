-- Add featured flag and cover fields support for publications
alter table public.content_items
  add column if not exists featured boolean not null default false;

-- Index for featured + published lookups
create index if not exists idx_content_items_featured
  on public.content_items (featured, publish_status, published_at desc)
  where featured = true;
