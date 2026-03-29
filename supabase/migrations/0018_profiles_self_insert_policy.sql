create policy "profiles_self_insert"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  or public.current_user_has_role('administrator')
);
