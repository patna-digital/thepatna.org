alter table public.profiles
add column if not exists phone_number text;

alter table public.profiles
add column if not exists whatsapp_number text;

alter table public.profiles
add column if not exists timezone text;

create index if not exists idx_profiles_timezone
on public.profiles (timezone);
