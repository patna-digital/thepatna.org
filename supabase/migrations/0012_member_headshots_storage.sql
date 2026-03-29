insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-headshots',
  'member-headshots',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "member_headshots_public_read" on storage.objects;
create policy "member_headshots_public_read"
on storage.objects
for select
to public
using (bucket_id = 'member-headshots');

drop policy if exists "member_headshots_authenticated_insert" on storage.objects;
create policy "member_headshots_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-headshots'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);

drop policy if exists "member_headshots_authenticated_update" on storage.objects;
create policy "member_headshots_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-headshots'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
)
with check (
  bucket_id = 'member-headshots'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);

drop policy if exists "member_headshots_authenticated_delete" on storage.objects;
create policy "member_headshots_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-headshots'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);
