-- Replace the blanket admin-manage policy with two targeted policies:
-- 1. Admins can manage any non-administrator role assignment
-- 2. Only super admins can grant or revoke the administrator role

drop policy if exists "user_roles_admin_manage" on public.user_roles;

create policy "user_roles_admin_manage_non_admin_roles"
on public.user_roles
for all
to authenticated
using (
  public.current_user_has_role('administrator')
  and role <> 'administrator'
)
with check (
  public.current_user_has_role('administrator')
  and role <> 'administrator'
);

create policy "user_roles_super_admin_manage_admin_role"
on public.user_roles
for all
to authenticated
using (
  public.current_user_is_super_admin()
  and role = 'administrator'
)
with check (
  public.current_user_is_super_admin()
  and role = 'administrator'
);
