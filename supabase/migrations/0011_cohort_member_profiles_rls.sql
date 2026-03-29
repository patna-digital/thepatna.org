alter table public.cohort_member_profiles enable row level security;

create policy "cohort_member_profiles_self_or_admin_read"
on public.cohort_member_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "cohort_member_profiles_self_or_admin_insert"
on public.cohort_member_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "cohort_member_profiles_self_or_admin_update"
on public.cohort_member_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);
