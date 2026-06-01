-- 0035 · content-images bucket + gallery tables for projects, insights (content_items), and events

-- ─── 1. Add cover image columns to events ────────────────────────────────────
alter table public.events
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text;

-- ─── 2. Gallery table for projects ───────────────────────────────────────────
create table if not exists public.project_gallery (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url  text not null,
  alt_text   text,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_project_gallery_project_id
  on public.project_gallery (project_id, sort_order);

alter table public.project_gallery enable row level security;

create policy "project_gallery_public_read"
  on public.project_gallery
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_gallery.project_id
        and (projects.status = 'published'
             or public.current_user_has_role('administrator'))
    )
  );

create policy "project_gallery_admin_manage"
  on public.project_gallery
  for all
  to authenticated
  using  (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

-- ─── 3. Gallery table for insights (content_items) ───────────────────────────
create table if not exists public.content_gallery (
  id         uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items (id) on delete cascade,
  image_url  text not null,
  alt_text   text,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_content_gallery_content_id
  on public.content_gallery (content_id, sort_order);

alter table public.content_gallery enable row level security;

create policy "content_gallery_public_read"
  on public.content_gallery
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.content_items
      where content_items.id = content_gallery.content_id
        and (content_items.publish_status = 'published'
             or public.current_user_has_role('administrator'))
    )
  );

create policy "content_gallery_admin_manage"
  on public.content_gallery
  for all
  to authenticated
  using  (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

-- ─── 4. Gallery table for events ─────────────────────────────────────────────
create table if not exists public.event_gallery (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  image_url  text not null,
  alt_text   text,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_event_gallery_event_id
  on public.event_gallery (event_id, sort_order);

alter table public.event_gallery enable row level security;

create policy "event_gallery_public_read"
  on public.event_gallery
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = event_gallery.event_id
        and (events.status = 'published'
             or public.current_user_has_role('administrator'))
    )
  );

create policy "event_gallery_admin_manage"
  on public.event_gallery
  for all
  to authenticated
  using  (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

-- ─── 5. content-images storage bucket ────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (anyone can view images)
drop policy if exists "content_images_public_read" on storage.objects;
create policy "content_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'content-images');

-- Admin-only write
drop policy if exists "content_images_admin_insert" on storage.objects;
create policy "content_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'content-images'
    and public.current_user_has_role('administrator')
  );

drop policy if exists "content_images_admin_update" on storage.objects;
create policy "content_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using  (bucket_id = 'content-images' and public.current_user_has_role('administrator'))
  with check (bucket_id = 'content-images' and public.current_user_has_role('administrator'));

drop policy if exists "content_images_admin_delete" on storage.objects;
create policy "content_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'content-images' and public.current_user_has_role('administrator'));
