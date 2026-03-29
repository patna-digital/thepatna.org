insert into public.roles (role, description)
values
  ('member', 'Approved PATNA community member'),
  ('cohort_lead', 'Leads one or more PATNA cohorts'),
  ('moderator', 'Moderates discussions and space participation'),
  ('content_editor', 'Manages PATNA public and member content'),
  ('administrator', 'Full platform administration access')
on conflict (role) do update
set description = excluded.description;

insert into public.cohorts (name, slug, description)
values
  ('Academic', 'academic', 'Researchers, analysts, and evidence contributors'),
  ('Policy', 'policy', 'Officials and policy advisers working on climate and transition processes'),
  ('Industry', 'industry', 'Private-sector and implementation-focused practitioners'),
  ('Civil Society', 'civil-society', 'Civil society actors, advocates, and organisers')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.domain_tags (name, slug, category)
values
  ('SIDS', 'sids', 'constituency'),
  ('LDCs', 'ldcs', 'constituency'),
  ('Maritime Decarbonisation', 'maritime-decarbonisation', 'domain'),
  ('Energy Transition', 'energy-transition', 'domain'),
  ('Climate Finance', 'climate-finance', 'domain'),
  ('IMO', 'imo', 'process'),
  ('UNFCCC', 'unfccc', 'process'),
  ('West Africa', 'west-africa', 'geography')
on conflict (slug) do update
set
  name = excluded.name,
  category = excluded.category;
