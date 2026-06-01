-- ─────────────────────────────────────────────────────────────────────────────
-- 0055 · Partners — enhanced schema, contact persons, seed data
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Enhance partners table ─────────────────────────────────────────────────

alter table public.partners
  add column if not exists description      text,
  add column if not exists website_url      text,
  add column if not exists logo_url         text,
  add column if not exists logo_storage_path text,
  add column if not exists country          text,
  add column if not exists partnership_type text
    check (partnership_type in ('institutional', 'academic', 'governmental', 'ngo', 'intergovernmental', 'industry')),
  add column if not exists pathway          text not null default 'partnership'
    check (pathway in ('partnership', 'collaboration', 'service')),
  add column if not exists status           text not null default 'active'
    check (status in ('active', 'inactive', 'prospect')),
  add column if not exists is_featured      boolean not null default false,
  add column if not exists notes            text,
  add column if not exists created_by_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at       timestamptz not null default timezone('utc', now()),
  add column if not exists updated_by_user_id uuid references public.profiles (id) on delete set null;

-- Trigger for updated_at
create trigger set_partners_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

-- ── 2. Partner contacts ───────────────────────────────────────────────────────

create table if not exists public.partner_contacts (
  id              uuid primary key default gen_random_uuid(),
  partner_id      uuid not null references public.partners (id) on delete cascade,
  full_name       text not null,
  role_title      text,
  email           text,
  phone           text,
  is_primary      boolean not null default false,
  notes           text,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partner_contacts_partner
  on public.partner_contacts (partner_id);

create trigger set_partner_contacts_updated_at
  before update on public.partner_contacts
  for each row execute function public.set_updated_at();

-- ── 3. Supabase Storage bucket for partner logos ──────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-logos',
  'partner-logos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Storage policies
create policy "Public read for partner logos"
  on storage.objects for select
  using (bucket_id = 'partner-logos');

create policy "Admins can upload partner logos"
  on storage.objects for insert
  with check (
    bucket_id = 'partner-logos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

create policy "Admins can update partner logos"
  on storage.objects for update
  using (
    bucket_id = 'partner-logos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

create policy "Admins can delete partner logos"
  on storage.objects for delete
  using (
    bucket_id = 'partner-logos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

-- ── 4. RLS for partners and partner_contacts ──────────────────────────────────

alter table public.partners enable row level security;
alter table public.partner_contacts enable row level security;

-- Public read for active partners (used on marketing site)
create policy "Public read for active partners"
  on public.partners for select
  using (status = 'active');

-- Admins full access to all partners
create policy "Admins full access to partners"
  on public.partners for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

-- Admins full access to partner contacts
create policy "Admins full access to partner contacts"
  on public.partner_contacts for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

-- ── 5. Seed existing partners from home page ─────────────────────────────────

insert into public.partners (name, slug, partner_group, partnership_type, pathway, is_featured, is_active)
values
  ('African Union Commission',               'african-union-commission',         'institutional', 'intergovernmental', 'partnership', true, true),
  ('IMO Secretariat',                        'imo-secretariat',                  'institutional', 'intergovernmental', 'partnership', true, true),
  ('MOWCA',                                  'mowca',                            'institutional', 'intergovernmental', 'partnership', true, true),
  ('MOESNA',                                 'moesna',                           'institutional', 'governmental',      'partnership', true, true),
  ('AAMA',                                   'aama',                             'institutional', 'ngo',               'partnership', false, true),
  ('University College London',              'university-college-london',        'academic',      'academic',          'collaboration', true, true),
  ('NIMASA',                                 'nimasa',                           'institutional', 'governmental',      'partnership', false, true),
  ('African Maritime Advisory Group (AMAG)', 'african-maritime-advisory-group',  'institutional', 'ngo',               'partnership', false, true),
  ('Ghana Maritime Authority',               'ghana-maritime-authority',         'institutional', 'governmental',      'partnership', false, true),
  ('University of Nairobi',                  'university-of-nairobi',            'academic',      'academic',          'collaboration', false, true),
  ('ANAM Senegal',                           'anam-senegal',                     'institutional', 'governmental',      'partnership', false, true),
  ('University of Lagos',                    'university-of-lagos',              'academic',      'academic',          'collaboration', false, true),
  ('AGNES',                                  'agnes',                            'institutional', 'ngo',               'partnership', false, true),
  ('African Shipowners Association',         'african-shipowners-association',   'industry',      'industry',          'partnership', false, true),
  ('African Parliamentary Union (APU)',      'african-parliamentary-union',      'institutional', 'intergovernmental', 'partnership', false, true),
  ('UNCTAD',                                 'unctad',                           'institutional', 'intergovernmental', 'partnership', true, true)
on conflict (slug) do nothing;
