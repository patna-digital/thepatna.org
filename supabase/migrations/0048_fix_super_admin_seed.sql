-- Fix: seed via profiles.email (already normalized lowercase in migration 0009)
-- The 0046 seed used an auth.users join that may have silently matched zero rows
update public.profiles
set is_super_admin = true
where email = 'thepatnadigital@gmail.com';

-- Remove the overly complex RLS policy added in 0046
-- Protection for is_super_admin lives in the server actions (requireSuperAdminContext + admin client)
drop policy if exists "profiles_no_self_super_admin" on public.profiles;
