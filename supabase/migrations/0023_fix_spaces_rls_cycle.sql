-- ─────────────────────────────────────────────────────────────────────────────
-- 0023 · Fix circular RLS recursion between spaces ↔ space_memberships
--
-- Root cause (error 42P17):
--   • spaces_visible_to_members  → queries space_memberships (triggers its policy)
--   • space_memberships policy   → queries spaces (triggers spaces policy) → ∞
--
-- Fix: introduce a SECURITY DEFINER helper that reads space_memberships without
-- triggering RLS, then rewrite the spaces policy to use it.  The cycle breaks
-- because the helper never re-enters the RLS evaluator.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Helper: bypasses RLS on space_memberships ────────────────────────────────

create or replace function public.auth_user_is_space_member(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships
    where space_id = p_space_id
      and user_id  = auth.uid()
  );
$$;

-- 2. Rewrite spaces_visible_to_members to use the helper ─────────────────────
--    (drops old policy from 0008 which directly queried space_memberships)

drop policy if exists "spaces_visible_to_members" on public.spaces;

create policy "spaces_visible_to_members"
on public.spaces
for select
to authenticated
using (
  visibility = 'public_members'
  or public.auth_user_is_space_member(id)
  or public.current_user_has_role('administrator')
);
