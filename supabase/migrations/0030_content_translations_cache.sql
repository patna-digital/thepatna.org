create table if not exists public.content_translations (
  cache_key text not null,
  content_type text not null default 'content',
  field_name text not null default '',
  target_locale text not null,
  source_hash text not null,
  source_text text not null,
  translated_text text not null,
  detected_source_locale text,
  format text not null default 'text'
    check (format in ('text', 'html')),
  provider text not null default 'google_cloud_translation',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (cache_key, target_locale)
);

create index if not exists idx_content_translations_content_type
  on public.content_translations (content_type);

create index if not exists idx_content_translations_target_locale
  on public.content_translations (target_locale);

alter table public.content_translations enable row level security;
