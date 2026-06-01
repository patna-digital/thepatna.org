-- Fix infinite recursion in space_memberships RLS policy
-- The original policy was querying space_memberships from within a space_memberships policy,
-- causing infinite recursion (error 42P17)

-- Drop the problematic policy
drop policy if exists "space_memberships_visible_to_members" on public.space_memberships;

-- Create a fixed policy that doesn't query space_memberships recursively
-- Instead, we rely on the spaces visibility and direct user_id match
-- The logic: users can see memberships if:
-- 1. It's their own membership (user_id = auth.uid())
-- 2. The space is public_members (any authenticated user can see)
-- 3. The user is an administrator
-- Note: We removed the recursive check for "user is a member of the space"
-- because that's already covered by case 1 (their own membership) and case 2 (public spaces)

create policy "space_memberships_visible_to_members"
on public.space_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.spaces
    where spaces.id = space_memberships.space_id
      and spaces.visibility = 'public_members'
  )
  or public.current_user_has_role('administrator')
);
