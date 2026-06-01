insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-compliance-documents',
  'member-compliance-documents',
  false,
  104857600,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "member_compliance_documents_authenticated_select" on storage.objects;
create policy "member_compliance_documents_authenticated_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'member-compliance-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);

drop policy if exists "member_compliance_documents_authenticated_insert" on storage.objects;
create policy "member_compliance_documents_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-compliance-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);

drop policy if exists "member_compliance_documents_authenticated_update" on storage.objects;
create policy "member_compliance_documents_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-compliance-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
)
with check (
  bucket_id = 'member-compliance-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);

drop policy if exists "member_compliance_documents_authenticated_delete" on storage.objects;
create policy "member_compliance_documents_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-compliance-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role('administrator')
  )
);
