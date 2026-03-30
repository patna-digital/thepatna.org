-- Add cover_image_url to content_items for featured/cover images
alter table public.content_items
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text,
  add column if not exists meta_description text;

-- Create publications storage bucket for PDFs and report assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'publications',
  'publications',
  true,
  52428800, -- 50MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for publications bucket
drop policy if exists "publications_public_read" on storage.objects;
create policy "publications_public_read"
on storage.objects
for select
to public
using (bucket_id = 'publications');

-- Only admins can insert/update/delete publication files
drop policy if exists "publications_admin_insert" on storage.objects;
create policy "publications_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'publications'
  and public.current_user_has_role('administrator')
);

drop policy if exists "publications_admin_update" on storage.objects;
create policy "publications_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'publications'
  and public.current_user_has_role('administrator')
)
with check (
  bucket_id = 'publications'
  and public.current_user_has_role('administrator')
);

drop policy if exists "publications_admin_delete" on storage.objects;
create policy "publications_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'publications'
  and public.current_user_has_role('administrator')
);
