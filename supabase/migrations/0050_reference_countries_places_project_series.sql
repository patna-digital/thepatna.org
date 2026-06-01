-- 0050 · canonical countries, reusable places, and LEAP series standardisation

create or replace function public.normalize_reference_label(value text)
returns text
language sql
immutable
as $$
  select lower(trim(regexp_replace(replace(coalesce(value, ''), '&', ' and '), '[^[:alnum:]]+', ' ', 'g')));
$$;

create table if not exists public.countries (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  alpha2 text not null unique check (alpha2 ~ '^[A-Z]{2}$'),
  name text not null,
  official_name text,
  region text,
  subregion text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.country_aliases (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries (code) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (normalized_alias)
);

create index if not exists idx_countries_name on public.countries (name);
create index if not exists idx_country_aliases_country_code on public.country_aliases (country_code);

create trigger set_countries_updated_at
before update on public.countries
for each row
execute function public.set_updated_at();

insert into public.countries (code, alpha2, name, official_name)
values
  ('AFG','AF','Afghanistan','Islamic Republic of Afghanistan'),
  ('ALA','AX','Åland Islands',null),
  ('ALB','AL','Albania','Republic of Albania'),
  ('DZA','DZ','Algeria','People''s Democratic Republic of Algeria'),
  ('ASM','AS','American Samoa',null),
  ('AND','AD','Andorra','Principality of Andorra'),
  ('AGO','AO','Angola','Republic of Angola'),
  ('AIA','AI','Anguilla',null),
  ('ATA','AQ','Antarctica',null),
  ('ATG','AG','Antigua and Barbuda',null),
  ('ARG','AR','Argentina','Argentine Republic'),
  ('ARM','AM','Armenia','Republic of Armenia'),
  ('ABW','AW','Aruba',null),
  ('AUS','AU','Australia',null),
  ('AUT','AT','Austria','Republic of Austria'),
  ('AZE','AZ','Azerbaijan','Republic of Azerbaijan'),
  ('BHS','BS','Bahamas','Commonwealth of the Bahamas'),
  ('BHR','BH','Bahrain','Kingdom of Bahrain'),
  ('BGD','BD','Bangladesh','People''s Republic of Bangladesh'),
  ('BRB','BB','Barbados',null),
  ('BLR','BY','Belarus','Republic of Belarus'),
  ('BEL','BE','Belgium','Kingdom of Belgium'),
  ('BLZ','BZ','Belize',null),
  ('BEN','BJ','Benin','Republic of Benin'),
  ('BMU','BM','Bermuda',null),
  ('BTN','BT','Bhutan','Kingdom of Bhutan'),
  ('BOL','BO','Bolivia (Plurinational State of)','Plurinational State of Bolivia'),
  ('BES','BQ','Bonaire, Sint Eustatius and Saba',null),
  ('BIH','BA','Bosnia and Herzegovina',null),
  ('BWA','BW','Botswana','Republic of Botswana'),
  ('BVT','BV','Bouvet Island',null),
  ('BRA','BR','Brazil','Federative Republic of Brazil'),
  ('IOT','IO','British Indian Ocean Territory',null),
  ('BRN','BN','Brunei Darussalam','Nation of Brunei, Abode of Peace'),
  ('BGR','BG','Bulgaria','Republic of Bulgaria'),
  ('BFA','BF','Burkina Faso',null),
  ('BDI','BI','Burundi','Republic of Burundi'),
  ('CPV','CV','Cabo Verde','Republic of Cabo Verde'),
  ('KHM','KH','Cambodia','Kingdom of Cambodia'),
  ('CMR','CM','Cameroon','Republic of Cameroon'),
  ('CAN','CA','Canada',null),
  ('CYM','KY','Cayman Islands',null),
  ('CAF','CF','Central African Republic',null),
  ('TCD','TD','Chad','Republic of Chad'),
  ('CHL','CL','Chile','Republic of Chile'),
  ('CHN','CN','China','People''s Republic of China'),
  ('CXR','CX','Christmas Island',null),
  ('CCK','CC','Cocos (Keeling) Islands',null),
  ('COL','CO','Colombia','Republic of Colombia'),
  ('COM','KM','Comoros','Union of the Comoros'),
  ('COG','CG','Republic of the Congo','Republic of the Congo'),
  ('COD','CD','Democratic Republic of the Congo','Democratic Republic of the Congo'),
  ('COK','CK','Cook Islands',null),
  ('CRI','CR','Costa Rica','Republic of Costa Rica'),
  ('CIV','CI','Côte d''Ivoire','Republic of Côte d''Ivoire'),
  ('HRV','HR','Croatia','Republic of Croatia'),
  ('CUB','CU','Cuba','Republic of Cuba'),
  ('CUW','CW','Curaçao',null),
  ('CYP','CY','Cyprus','Republic of Cyprus'),
  ('CZE','CZ','Czechia','Czech Republic'),
  ('DNK','DK','Denmark','Kingdom of Denmark'),
  ('DJI','DJ','Djibouti','Republic of Djibouti'),
  ('DMA','DM','Dominica','Commonwealth of Dominica'),
  ('DOM','DO','Dominican Republic',null),
  ('ECU','EC','Ecuador','Republic of Ecuador'),
  ('EGY','EG','Egypt','Arab Republic of Egypt'),
  ('SLV','SV','El Salvador','Republic of El Salvador'),
  ('GNQ','GQ','Equatorial Guinea','Republic of Equatorial Guinea'),
  ('ERI','ER','Eritrea','State of Eritrea'),
  ('EST','EE','Estonia','Republic of Estonia'),
  ('SWZ','SZ','Eswatini','Kingdom of Eswatini'),
  ('ETH','ET','Ethiopia','Federal Democratic Republic of Ethiopia'),
  ('FLK','FK','Falkland Islands (Malvinas)',null),
  ('FRO','FO','Faroe Islands',null),
  ('FJI','FJ','Fiji','Republic of Fiji'),
  ('FIN','FI','Finland','Republic of Finland'),
  ('FRA','FR','France','French Republic'),
  ('GUF','GF','French Guiana',null),
  ('PYF','PF','French Polynesia',null),
  ('ATF','TF','French Southern Territories',null),
  ('GAB','GA','Gabon','Gabonese Republic'),
  ('GMB','GM','Gambia','Republic of the Gambia'),
  ('GEO','GE','Georgia',null),
  ('DEU','DE','Germany','Federal Republic of Germany'),
  ('GHA','GH','Ghana','Republic of Ghana'),
  ('GIB','GI','Gibraltar',null),
  ('GRC','GR','Greece','Hellenic Republic'),
  ('GRL','GL','Greenland',null),
  ('GRD','GD','Grenada',null),
  ('GLP','GP','Guadeloupe',null),
  ('GUM','GU','Guam',null),
  ('GTM','GT','Guatemala','Republic of Guatemala'),
  ('GGY','GG','Guernsey',null),
  ('GIN','GN','Guinea','Republic of Guinea'),
  ('GNB','GW','Guinea-Bissau','Republic of Guinea-Bissau'),
  ('GUY','GY','Guyana','Co-operative Republic of Guyana'),
  ('HTI','HT','Haiti','Republic of Haiti'),
  ('HMD','HM','Heard Island and McDonald Islands',null),
  ('VAT','VA','Holy See',null),
  ('HND','HN','Honduras','Republic of Honduras'),
  ('HKG','HK','Hong Kong',null),
  ('HUN','HU','Hungary',null),
  ('ISL','IS','Iceland',null),
  ('IND','IN','India','Republic of India'),
  ('IDN','ID','Indonesia','Republic of Indonesia'),
  ('IRN','IR','Iran (Islamic Republic of)','Islamic Republic of Iran'),
  ('IRQ','IQ','Iraq','Republic of Iraq'),
  ('IRL','IE','Ireland',null),
  ('IMN','IM','Isle of Man',null),
  ('ISR','IL','Israel','State of Israel'),
  ('ITA','IT','Italy','Italian Republic'),
  ('JAM','JM','Jamaica',null),
  ('JPN','JP','Japan',null),
  ('JEY','JE','Jersey',null),
  ('JOR','JO','Jordan','Hashemite Kingdom of Jordan'),
  ('KAZ','KZ','Kazakhstan','Republic of Kazakhstan'),
  ('KEN','KE','Kenya','Republic of Kenya'),
  ('KIR','KI','Kiribati','Republic of Kiribati'),
  ('PRK','KP','Korea (Democratic People''s Republic of)','Democratic People''s Republic of Korea'),
  ('KOR','KR','Korea (Republic of)','Republic of Korea'),
  ('KWT','KW','Kuwait','State of Kuwait'),
  ('KGZ','KG','Kyrgyzstan','Kyrgyz Republic'),
  ('LAO','LA','Lao People''s Democratic Republic',null),
  ('LVA','LV','Latvia','Republic of Latvia'),
  ('LBN','LB','Lebanon','Lebanese Republic'),
  ('LSO','LS','Lesotho','Kingdom of Lesotho'),
  ('LBR','LR','Liberia','Republic of Liberia'),
  ('LBY','LY','Libya','State of Libya'),
  ('LIE','LI','Liechtenstein','Principality of Liechtenstein'),
  ('LTU','LT','Lithuania','Republic of Lithuania'),
  ('LUX','LU','Luxembourg','Grand Duchy of Luxembourg'),
  ('MAC','MO','Macao',null),
  ('MDG','MG','Madagascar','Republic of Madagascar'),
  ('MWI','MW','Malawi','Republic of Malawi'),
  ('MYS','MY','Malaysia',null),
  ('MDV','MV','Maldives','Republic of Maldives'),
  ('MLI','ML','Mali','Republic of Mali'),
  ('MLT','MT','Malta','Republic of Malta'),
  ('MHL','MH','Marshall Islands','Republic of the Marshall Islands'),
  ('MTQ','MQ','Martinique',null),
  ('MRT','MR','Mauritania','Islamic Republic of Mauritania'),
  ('MUS','MU','Mauritius','Republic of Mauritius'),
  ('MYT','YT','Mayotte',null),
  ('MEX','MX','Mexico','United Mexican States'),
  ('FSM','FM','Micronesia (Federated States of)','Federated States of Micronesia'),
  ('MDA','MD','Moldova (Republic of)','Republic of Moldova'),
  ('MCO','MC','Monaco','Principality of Monaco'),
  ('MNG','MN','Mongolia',null),
  ('MNE','ME','Montenegro',null),
  ('MSR','MS','Montserrat',null),
  ('MAR','MA','Morocco','Kingdom of Morocco'),
  ('MOZ','MZ','Mozambique','Republic of Mozambique'),
  ('MMR','MM','Myanmar','Republic of the Union of Myanmar'),
  ('NAM','NA','Namibia','Republic of Namibia'),
  ('NRU','NR','Nauru','Republic of Nauru'),
  ('NPL','NP','Nepal','Federal Democratic Republic of Nepal'),
  ('NLD','NL','Netherlands','Kingdom of the Netherlands'),
  ('NCL','NC','New Caledonia',null),
  ('NZL','NZ','New Zealand',null),
  ('NIC','NI','Nicaragua','Republic of Nicaragua'),
  ('NER','NE','Niger','Republic of Niger'),
  ('NGA','NG','Nigeria','Federal Republic of Nigeria'),
  ('NIU','NU','Niue',null),
  ('NFK','NF','Norfolk Island',null),
  ('MKD','MK','North Macedonia','Republic of North Macedonia'),
  ('MNP','MP','Northern Mariana Islands','Commonwealth of the Northern Mariana Islands'),
  ('NOR','NO','Norway','Kingdom of Norway'),
  ('OMN','OM','Oman','Sultanate of Oman'),
  ('PAK','PK','Pakistan','Islamic Republic of Pakistan'),
  ('PLW','PW','Palau','Republic of Palau'),
  ('PSE','PS','Palestine, State of','State of Palestine'),
  ('PAN','PA','Panama','Republic of Panama'),
  ('PNG','PG','Papua New Guinea','Independent State of Papua New Guinea'),
  ('PRY','PY','Paraguay','Republic of Paraguay'),
  ('PER','PE','Peru','Republic of Peru'),
  ('PHL','PH','Philippines','Republic of the Philippines'),
  ('PCN','PN','Pitcairn',null),
  ('POL','PL','Poland','Republic of Poland'),
  ('PRT','PT','Portugal','Portuguese Republic'),
  ('PRI','PR','Puerto Rico',null),
  ('QAT','QA','Qatar','State of Qatar'),
  ('REU','RE','Réunion',null),
  ('ROU','RO','Romania',null),
  ('RUS','RU','Russian Federation',null),
  ('RWA','RW','Rwanda','Republic of Rwanda'),
  ('BLM','BL','Saint Barthélemy',null),
  ('SHN','SH','Saint Helena, Ascension and Tristan da Cunha',null),
  ('KNA','KN','Saint Kitts and Nevis',null),
  ('LCA','LC','Saint Lucia',null),
  ('MAF','MF','Saint Martin (French part)',null),
  ('SPM','PM','Saint Pierre and Miquelon',null),
  ('VCT','VC','Saint Vincent and the Grenadines',null),
  ('WSM','WS','Samoa','Independent State of Samoa'),
  ('SMR','SM','San Marino','Republic of San Marino'),
  ('STP','ST','São Tomé and Príncipe','Democratic Republic of São Tomé and Príncipe'),
  ('SAU','SA','Saudi Arabia','Kingdom of Saudi Arabia'),
  ('SEN','SN','Senegal','Republic of Senegal'),
  ('SRB','RS','Serbia','Republic of Serbia'),
  ('SYC','SC','Seychelles','Republic of Seychelles'),
  ('SLE','SL','Sierra Leone','Republic of Sierra Leone'),
  ('SGP','SG','Singapore','Republic of Singapore'),
  ('SXM','SX','Sint Maarten (Dutch part)',null),
  ('SVK','SK','Slovakia','Slovak Republic'),
  ('SVN','SI','Slovenia','Republic of Slovenia'),
  ('SLB','SB','Solomon Islands',null),
  ('SOM','SO','Somalia','Federal Republic of Somalia'),
  ('ZAF','ZA','South Africa','Republic of South Africa'),
  ('SGS','GS','South Georgia and the South Sandwich Islands',null),
  ('SSD','SS','South Sudan','Republic of South Sudan'),
  ('ESP','ES','Spain','Kingdom of Spain'),
  ('LKA','LK','Sri Lanka','Democratic Socialist Republic of Sri Lanka'),
  ('SDN','SD','Sudan','Republic of the Sudan'),
  ('SUR','SR','Suriname','Republic of Suriname'),
  ('SJM','SJ','Svalbard and Jan Mayen',null),
  ('SWE','SE','Sweden','Kingdom of Sweden'),
  ('CHE','CH','Switzerland','Swiss Confederation'),
  ('SYR','SY','Syrian Arab Republic',null),
  ('TWN','TW','Taiwan, Province of China',null),
  ('TJK','TJ','Tajikistan','Republic of Tajikistan'),
  ('TZA','TZ','Tanzania, United Republic of','United Republic of Tanzania'),
  ('THA','TH','Thailand','Kingdom of Thailand'),
  ('TLS','TL','Timor-Leste','Democratic Republic of Timor-Leste'),
  ('TGO','TG','Togo','Togolese Republic'),
  ('TKL','TK','Tokelau',null),
  ('TON','TO','Tonga','Kingdom of Tonga'),
  ('TTO','TT','Trinidad and Tobago','Republic of Trinidad and Tobago'),
  ('TUN','TN','Tunisia','Republic of Tunisia'),
  ('TUR','TR','Türkiye','Republic of Türkiye'),
  ('TKM','TM','Turkmenistan',null),
  ('TCA','TC','Turks and Caicos Islands',null),
  ('TUV','TV','Tuvalu',null),
  ('UGA','UG','Uganda','Republic of Uganda'),
  ('UKR','UA','Ukraine',null),
  ('ARE','AE','United Arab Emirates',null),
  ('GBR','GB','United Kingdom','United Kingdom of Great Britain and Northern Ireland'),
  ('UMI','UM','United States Minor Outlying Islands',null),
  ('USA','US','United States','United States of America'),
  ('URY','UY','Uruguay','Oriental Republic of Uruguay'),
  ('UZB','UZ','Uzbekistan','Republic of Uzbekistan'),
  ('VUT','VU','Vanuatu','Republic of Vanuatu'),
  ('VEN','VE','Venezuela (Bolivarian Republic of)','Bolivarian Republic of Venezuela'),
  ('VNM','VN','Viet Nam','Socialist Republic of Viet Nam'),
  ('VGB','VG','Virgin Islands (British)',null),
  ('VIR','VI','Virgin Islands (U.S.)',null),
  ('WLF','WF','Wallis and Futuna',null),
  ('ESH','EH','Western Sahara',null),
  ('YEM','YE','Yemen','Republic of Yemen'),
  ('ZMB','ZM','Zambia','Republic of Zambia'),
  ('ZWE','ZW','Zimbabwe','Republic of Zimbabwe')
on conflict (code) do update set
  alpha2 = excluded.alpha2,
  name = excluded.name,
  official_name = excluded.official_name,
  updated_at = timezone('utc', now());

insert into public.country_aliases (country_code, alias, normalized_alias)
select code, name, public.normalize_reference_label(name)
from public.countries
where public.normalize_reference_label(name) <> ''
on conflict (normalized_alias) do update set
  country_code = excluded.country_code,
  alias = excluded.alias;

insert into public.country_aliases (country_code, alias, normalized_alias)
select code, official_name, public.normalize_reference_label(official_name)
from public.countries
where public.normalize_reference_label(official_name) <> ''
on conflict (normalized_alias) do update set
  country_code = excluded.country_code,
  alias = excluded.alias;

insert into public.country_aliases (country_code, alias, normalized_alias)
values
  ('COD','DRC', public.normalize_reference_label('DRC')),
  ('COD','DR Congo', public.normalize_reference_label('DR Congo')),
  ('COD','Dem. Rep. Congo', public.normalize_reference_label('Dem. Rep. Congo')),
  ('COD','Democratic Republic of Congo', public.normalize_reference_label('Democratic Republic of Congo')),
  ('COD','Congo (Democratic Republic of)', public.normalize_reference_label('Congo (Democratic Republic of)')),
  ('COG','Congo', public.normalize_reference_label('Congo')),
  ('GMB','The Gambia', public.normalize_reference_label('The Gambia')),
  ('CIV','Cote d''Ivoire', public.normalize_reference_label('Cote d''Ivoire')),
  ('CIV','Ivory Coast', public.normalize_reference_label('Ivory Coast')),
  ('CMR','Cameroun', public.normalize_reference_label('Cameroun')),
  ('CPV','Cape Verde', public.normalize_reference_label('Cape Verde')),
  ('STP','Sao Tome and Principe', public.normalize_reference_label('Sao Tome and Principe')),
  ('GNQ','Eq. Guinea', public.normalize_reference_label('Eq. Guinea')),
  ('CAF','Central African Rep.', public.normalize_reference_label('Central African Rep.')),
  ('SSD','S. Sudan', public.normalize_reference_label('S. Sudan')),
  ('SWZ','eSwatini', public.normalize_reference_label('eSwatini')),
  ('TZA','Tanzania', public.normalize_reference_label('Tanzania')),
  ('TUR','Turkey', public.normalize_reference_label('Turkey')),
  ('GBR','UK', public.normalize_reference_label('UK')),
  ('GBR','Britain', public.normalize_reference_label('Britain')),
  ('USA','US', public.normalize_reference_label('US')),
  ('USA','United States of America', public.normalize_reference_label('United States of America')),
  ('BOL','Bolivia', public.normalize_reference_label('Bolivia')),
  ('VEN','Venezuela', public.normalize_reference_label('Venezuela')),
  ('IRN','Iran', public.normalize_reference_label('Iran')),
  ('LAO','Laos', public.normalize_reference_label('Laos')),
  ('KOR','South Korea', public.normalize_reference_label('South Korea')),
  ('PRK','North Korea', public.normalize_reference_label('North Korea')),
  ('RUS','Russia', public.normalize_reference_label('Russia')),
  ('PSE','Palestine', public.normalize_reference_label('Palestine'))
on conflict (normalized_alias) do update set
  country_code = excluded.country_code,
  alias = excluded.alias;

create or replace function public.resolve_country_code(value text)
returns text
language plpgsql
stable
as $$
declare
  resolved text;
  candidate text;
begin
  candidate := public.normalize_reference_label(value);

  if candidate <> '' then
    select country_code into resolved
    from public.country_aliases
    where normalized_alias = candidate
    limit 1;

    if resolved is not null then
      return resolved;
    end if;
  end if;

  if position(',' in coalesce(value, '')) > 0 then
    candidate := public.normalize_reference_label(regexp_replace(value, '^.*,', ''));

    select country_code into resolved
    from public.country_aliases
    where normalized_alias = candidate
    limit 1;
  end if;

  return resolved;
end;
$$;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  place_type text not null default 'other'
    check (place_type in ('city', 'venue', 'port', 'office', 'secretariat', 'convening', 'other')),
  country_code text not null references public.countries (code),
  locality text,
  region text,
  latitude double precision not null check (latitude >= -90 and latitude <= 90),
  longitude double precision not null check (longitude >= -180 and longitude <= 180),
  address text,
  source text not null default 'manual'
    check (source in ('manual', 'seed', 'nominatim', 'mapbox', 'google')),
  source_id text,
  confidence numeric(4,3),
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (country_code, slug)
);

create index if not exists idx_places_country_code on public.places (country_code, name);
create index if not exists idx_places_type on public.places (place_type);

create trigger set_places_updated_at
before update on public.places
for each row
execute function public.set_updated_at();

insert into public.places (
  name, slug, place_type, country_code, locality, region, latitude, longitude, address, source, verified_at
)
values
  ('Victoria', 'victoria-seychelles', 'secretariat', 'SYC', 'Victoria', null, -4.6191, 55.4513, 'Victoria, Seychelles', 'seed', timezone('utc', now())),
  ('Addis Ababa', 'addis-ababa', 'city', 'ETH', 'Addis Ababa', null, 8.9806, 38.7578, 'Addis Ababa, Ethiopia', 'seed', timezone('utc', now())),
  ('Dakar', 'dakar', 'city', 'SEN', 'Dakar', null, 14.7167, -17.4677, 'Dakar, Senegal', 'seed', timezone('utc', now())),
  ('Abuja', 'abuja', 'city', 'NGA', 'Abuja', 'Federal Capital Territory', 9.0765, 7.3986, 'Abuja, Nigeria', 'seed', timezone('utc', now())),
  ('London', 'london', 'city', 'GBR', 'London', 'England', 51.5072, -0.1276, 'London, United Kingdom', 'seed', timezone('utc', now())),
  ('Monrovia', 'monrovia', 'city', 'LBR', 'Monrovia', null, 6.3156, -10.8074, 'Monrovia, Liberia', 'seed', timezone('utc', now())),
  ('Belém', 'belem', 'city', 'BRA', 'Belém', 'Pará', -1.4558, -48.5039, 'Belém, Brazil', 'seed', timezone('utc', now())),
  ('Mombasa', 'mombasa', 'city', 'KEN', 'Mombasa', null, -4.0435, 39.6682, 'Mombasa, Kenya', 'seed', timezone('utc', now())),
  ('Kilifi', 'kilifi', 'city', 'KEN', 'Kilifi', null, -3.6305, 39.8499, 'Kilifi, Kenya', 'seed', timezone('utc', now())),
  ('Antalya', 'antalya', 'city', 'TUR', 'Antalya', null, 36.8969, 30.7133, 'Antalya, Türkiye', 'seed', timezone('utc', now())),
  ('Lagos', 'lagos', 'city', 'NGA', 'Lagos', null, 6.5244, 3.3792, 'Lagos, Nigeria', 'seed', timezone('utc', now())),
  ('Nairobi', 'nairobi', 'city', 'KEN', 'Nairobi', null, -1.2921, 36.8219, 'Nairobi, Kenya', 'seed', timezone('utc', now()))
on conflict (country_code, slug) do update set
  name = excluded.name,
  place_type = excluded.place_type,
  locality = excluded.locality,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  source = excluded.source,
  verified_at = excluded.verified_at,
  updated_at = timezone('utc', now());

create table if not exists public.project_series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  status text not null default 'active'
    check (status in ('planned', 'active', 'completed', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_project_series_updated_at
before update on public.project_series
for each row
execute function public.set_updated_at();

insert into public.project_series (title, slug, summary, status, sort_order)
values (
  'LEAP Project Series',
  'leap-project-series',
  'Leading Effective Afrocentric Participation: PATNA''s multi-phase programme for African technical coordination and leadership in IMO maritime decarbonisation.',
  'active',
  10
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

alter table public.projects
  add column if not exists series_id uuid references public.project_series (id) on delete set null,
  add column if not exists series_phase_label text,
  add column if not exists series_phase_order integer,
  add column if not exists phase_summary text;

create index if not exists idx_projects_series_order
  on public.projects (series_id, series_phase_order)
  where series_id is not null;

update public.projects p
set
  series_id = s.id,
  series_phase_label = case p.slug
    when 'leap-phase-i' then 'Phase I'
    when 'leap-phase-ii' then 'Phase II'
    when 'patna-phase-iii-2026' then 'Phase III'
    else p.series_phase_label
  end,
  series_phase_order = case p.slug
    when 'leap-phase-i' then 1
    when 'leap-phase-ii' then 2
    when 'patna-phase-iii-2026' then 3
    else p.series_phase_order
  end,
  short_title = case p.slug
    when 'patna-phase-iii-2026' then 'LEAP Phase III'
    else p.short_title
  end,
  parent_project_id = null
from public.project_series s
where s.slug = 'leap-project-series'
  and p.slug in ('leap-phase-i', 'leap-phase-ii', 'patna-phase-iii-2026');

alter table public.project_countries
  add column if not exists place_id uuid references public.places (id) on delete set null;

alter table public.project_footprint_hubs
  add column if not exists place_id uuid references public.places (id) on delete set null;

alter table public.project_activities
  add column if not exists country_code text,
  add column if not exists place_id uuid references public.places (id) on delete set null;

alter table public.content_items
  add column if not exists workflow_status text not null default 'draft'
    check (workflow_status in ('not_started', 'planned', 'draft', 'in_review', 'published', 'archived')),
  add column if not exists target_publish_date date;

create table if not exists public.content_country_links (
  content_id uuid not null references public.content_items (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  relationship_type text not null default 'subject'
    check (relationship_type in ('subject', 'case_study', 'coverage', 'publication_market', 'other')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (content_id, country_code, relationship_type)
);

alter table public.profiles add column if not exists country_code text;
alter table public.community_applications add column if not exists country_code text;
alter table public.service_requests add column if not exists country_code text;
alter table public.organizations add column if not exists country_code text;
alter table public.external_contributors add column if not exists country_code text;
alter table public.events
  add column if not exists country_code text,
  add column if not exists place_id uuid references public.places (id) on delete set null;

update public.profiles
set country_code = public.resolve_country_code(country_of_residence)
where country_code is null
  and public.resolve_country_code(country_of_residence) is not null;

update public.community_applications
set country_code = public.resolve_country_code(country)
where country_code is null
  and public.resolve_country_code(country) is not null;

update public.service_requests
set country_code = public.resolve_country_code(country)
where country_code is null
  and public.resolve_country_code(country) is not null;

update public.organizations
set country_code = public.resolve_country_code(country)
where country_code is null
  and public.resolve_country_code(country) is not null;

update public.external_contributors
set country_code = public.resolve_country_code(country)
where country_code is null
  and public.resolve_country_code(country) is not null;

update public.events
set country_code = public.resolve_country_code(location)
where country_code is null
  and public.resolve_country_code(location) is not null;

update public.project_countries
set country_code = public.resolve_country_code(country)
where country_code is null
  and public.resolve_country_code(country) is not null;

update public.project_activities
set country_code = public.resolve_country_code(location)
where country_code is null
  and public.resolve_country_code(location) is not null;

update public.events e
set place_id = p.id
from public.places p
where e.place_id is null
  and e.country_code = p.country_code
  and public.normalize_reference_label(e.location) in (
    public.normalize_reference_label(p.name),
    public.normalize_reference_label(p.address)
  );

update public.project_footprint_hubs h
set place_id = p.id
from public.places p
where h.place_id is null
  and h.country_code = p.country_code
  and (
    public.normalize_reference_label(h.city) = public.normalize_reference_label(p.locality)
    or public.normalize_reference_label(h.label) = public.normalize_reference_label(p.name)
  );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'project_countries_country_code_fkey') then
    alter table public.project_countries
      add constraint project_countries_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'project_footprint_hubs_country_code_fkey') then
    alter table public.project_footprint_hubs
      add constraint project_footprint_hubs_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'project_activities_country_code_fkey') then
    alter table public.project_activities
      add constraint project_activities_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_country_code_fkey') then
    alter table public.profiles
      add constraint profiles_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'community_applications_country_code_fkey') then
    alter table public.community_applications
      add constraint community_applications_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'service_requests_country_code_fkey') then
    alter table public.service_requests
      add constraint service_requests_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'organizations_country_code_fkey') then
    alter table public.organizations
      add constraint organizations_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'external_contributors_country_code_fkey') then
    alter table public.external_contributors
      add constraint external_contributors_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'events_country_code_fkey') then
    alter table public.events
      add constraint events_country_code_fkey
      foreign key (country_code) references public.countries (code);
  end if;
end $$;

create table if not exists public.project_country_typologies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  class_code text not null check (class_code in ('A', 'B', 'C', 'D', 'E')),
  profile text not null,
  priority_focus text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, country_code, class_code)
);

delete from public.project_countries pc
using public.projects p
where pc.project_id = p.id
  and p.slug = 'leap-phase-ii'
  and coalesce(pc.phase_label, 'Phase II') = 'Phase II';

insert into public.project_countries (project_id, country, country_code, phase_label, sort_order)
select p.id, c.name, phase.country_code, 'Phase II', phase.sort_order
from public.projects p
join (
  values
    ('AGO', 1), ('BEN', 2), ('BFA', 3), ('CMR', 4), ('TCD', 5),
    ('COG', 6), ('COD', 7), ('CIV', 8), ('GNQ', 9), ('GAB', 10),
    ('GMB', 11), ('GHA', 12), ('GIN', 13), ('KEN', 14), ('LBR', 15),
    ('MLI', 16), ('MRT', 17), ('MOZ', 18), ('NGA', 19), ('SEN', 20),
    ('SLE', 21), ('SYC', 22), ('ZAF', 23), ('TZA', 24), ('TGO', 25)
) as phase(country_code, sort_order) on true
join public.countries c on c.code = phase.country_code
where p.slug = 'leap-phase-ii'
on conflict (project_id, country) do update set
  country_code = excluded.country_code,
  phase_label = excluded.phase_label,
  sort_order = excluded.sort_order;

insert into public.project_countries (project_id, country, country_code, phase_label, sort_order)
select p.id, c.name, phase.country_code, 'Phase III', phase.sort_order
from public.projects p
join (
  values
    ('MUS', 1), ('STP', 2), ('SYC', 3), ('COD', 4), ('ETH', 5),
    ('MWI', 6), ('GMB', 7), ('SEN', 8), ('TZA', 9), ('TGO', 10),
    ('KEN', 11), ('GHA', 12), ('NGA', 13), ('AGO', 14), ('NAM', 15)
) as phase(country_code, sort_order) on true
join public.countries c on c.code = phase.country_code
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, country) do update set
  country_code = excluded.country_code,
  phase_label = excluded.phase_label,
  sort_order = excluded.sort_order;

insert into public.project_country_typologies (
  project_id, country_code, class_code, profile, priority_focus, sort_order
)
select p.id, t.country_code, t.class_code, t.profile, t.priority_focus, t.sort_order
from public.projects p
join (
  values
    ('MUS','A','High Climate Vulnerability (SIDS & Exposed Coastal States)','Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 10),
    ('STP','A','High Climate Vulnerability (SIDS & Exposed Coastal States)','Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 20),
    ('SYC','A','High Climate Vulnerability (SIDS & Exposed Coastal States)','Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 30),
    ('COD','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 40),
    ('ETH','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 50),
    ('MWI','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 60),
    ('GMB','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 70),
    ('SEN','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 80),
    ('TZA','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 90),
    ('TGO','B','Development-Constrained (LDC & LLDC)','Affordability, access to finance, implementation readiness, revenue-use pipelines', 100),
    ('KEN','C','Trade-Sensitive (High Trade Exposure)','Minimising transport cost increases, freight connectivity, and predictable compliance design', 110),
    ('GHA','C','Trade-Sensitive (High Trade Exposure)','Minimising transport cost increases, freight connectivity, and predictable compliance design', 120),
    ('NGA','D','Hydrocarbon-Dependent Economies','Managed transition, industrial diversification, ZNZ fuel/port energy investment pathways', 130),
    ('AGO','D','Hydrocarbon-Dependent Economies','Managed transition, industrial diversification, ZNZ fuel/port energy investment pathways', 140),
    ('GHA','D','Hydrocarbon-Dependent Economies','Managed transition, industrial diversification, ZNZ fuel/port energy investment pathways', 150),
    ('KEN','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 160),
    ('GHA','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 170),
    ('SYC','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 180),
    ('MUS','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 190),
    ('SEN','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 200),
    ('NAM','E','Net Food-Importing Vulnerable States','Food-security-informed NZF design; mitigation of second-order price impacts', 210)
) as t(country_code, class_code, profile, priority_focus, sort_order) on true
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, country_code, class_code) do update set
  profile = excluded.profile,
  priority_focus = excluded.priority_focus,
  sort_order = excluded.sort_order;

insert into public.content_items (
  title, slug, content_type, summary, publish_status, visibility, workflow_status, target_publish_date, published_at
)
values
  ('Ghana''s International Shipping Emissions Inventory Report', 'ghana-international-shipping-emissions-inventory-report', 'report', 'LEAP Phase I country inventory report for Ghana.', 'published', 'public', 'published', null, '2025-08-01'),
  ('An Africa-centric analysis of the UNCTAD Comprehensive Impact Assessment of candidate GHG reduction mid-term measures', 'africa-centric-analysis-unctad-comprehensive-impact-assessment-ghg-mid-term-measures', 'report', 'LEAP I study report translating Comprehensive Impact Assessment implications for African delegations.', 'published', 'public', 'published', null, '2026-01-01'),
  ('Complementary Quantitative Stakeholders'' Analysis: The Case Study of Malawi', 'complementary-quantitative-stakeholders-analysis-malawi', 'case_study', 'LEAP Phase I Malawi case study report.', 'published', 'public', 'published', null, '2026-01-01'),
  ('Impact Assessment of the IMO candidate mid-term GHG reduction measures — Nigeria Case Study', 'impact-assessment-imo-candidate-mid-term-ghg-measures-nigeria-case-study', 'case_study', 'LEAP Phase I Nigeria case study report.', 'published', 'public', 'published', null, null),
  ('Impact Assessment: Liberia Case Study', 'impact-assessment-liberia-case-study', 'case_study', 'LEAP Phase I Liberia case study report.', 'published', 'public', 'published', null, null),
  ('Complementary Quantitative Stakeholders'' Analysis: The Case Study of Namibia', 'complementary-quantitative-stakeholders-analysis-namibia', 'case_study', 'LEAP Phase I Namibia case study report.', 'published', 'public', 'published', null, null),
  ('Kenya Case Study Report', 'kenya-case-study-report', 'case_study', 'LEAP Phase I Kenya case study report.', 'published', 'public', 'published', null, null),
  ('Abuja Summit Report: African Strategic Summit on Shipping Decarbonisation', 'abuja-summit-report-african-strategic-summit-shipping-decarbonisation', 'workshop_proceedings', 'Event report for the Abuja Strategic Summit.', 'draft', 'public', 'in_review', null, null),
  ('Dakar Workshop Report: Advancing Africa''s Maritime Sector to Net-Zero', 'dakar-workshop-report-advancing-africas-maritime-sector-to-net-zero', 'workshop_proceedings', 'Event report for the Dakar Maritime Decarbonisation Workshop.', 'draft', 'public', 'in_review', null, null),
  ('Dakar Workshop Mentimeter Poll Insights', 'dakar-workshop-mentimeter-poll-insights', 'brief', 'Poll insights from the Dakar Maritime Decarbonisation Workshop.', 'draft', 'public', 'in_review', null, null),
  ('The 15 Dakar Declarations', 'the-15-dakar-declarations', 'brief', 'Readout of the 15 Dakar Declarations.', 'draft', 'public', 'not_started', null, null),
  ('PATNA at the Africa Climate Summit 2', 'patna-at-africa-climate-summit-2', 'event_output', 'Event report on PATNA participation at ACS2.', 'draft', 'public', 'in_review', null, null),
  ('Report of MEPC/ES.2 (2nd Extraordinary Session)', 'report-of-mepc-es-2-second-extraordinary-session', 'report', 'Meeting report from MEPC/ES.2.', 'published', 'public', 'published', null, '2025-10-01'),
  ('ISWG-GHG 20 Narrative Report', 'iswg-ghg-20-narrative-report', 'report', 'Narrative report for ISWG-GHG 20.', 'draft', 'public', 'in_review', null, null),
  ('The Path to Maritime Net-Zero (ISWG-GHG 20 Readout)', 'path-to-maritime-net-zero-iswg-ghg-20-readout', 'brief', 'Readout from ISWG-GHG 20.', 'published', 'public', 'published', null, '2025-10-01'),
  ('2025 Review and 2026 In-View Report', '2025-review-and-2026-in-view-report', 'report', 'Annual review and forward look for PATNA activities.', 'published', 'public', 'published', null, '2026-01-01'),
  ('NZF Impact Assessment for Africa', 'nzf-impact-assessment-for-africa', 'report', 'Phase III technical report and brief on affordability and food-security implications.', 'draft', 'public', 'planned', '2026-06-30', null),
  ('Africa Country Typology v1 + Baseline Emissions Inventory Tool', 'africa-country-typology-v1-baseline-emissions-inventory-tool', 'tool', 'Country typology and baseline inventory tool for African countries.', 'draft', 'public', 'planned', '2026-06-30', null),
  ('ZNZ Reward Design Options for Africa', 'znz-reward-design-options-for-africa', 'brief', 'Options paper and submission text for African ZNZ reward design.', 'draft', 'public', 'planned', '2026-07-31', null),
  ('Just Transition Fund Governance & Revenue-Use Principles', 'just-transition-fund-governance-revenue-use-principles', 'brief', 'Policy brief and submission language on fund governance and revenue-use principles.', 'draft', 'public', 'planned', '2026-08-31', null),
  ('Port Readiness Case Study #1', 'port-readiness-case-study-1', 'case_study', 'First Phase III port readiness case study.', 'draft', 'public', 'planned', '2026-10-31', null),
  ('Port Readiness Case Study #2', 'port-readiness-case-study-2', 'case_study', 'Second Phase III port readiness case study.', 'draft', 'public', 'planned', '2026-10-31', null),
  ('Port Readiness Toolkit v1', 'port-readiness-toolkit-v1', 'tool', 'Replicable toolkit and implementation note for port readiness.', 'draft', 'public', 'planned', '2026-10-31', null),
  ('Cycle 1 & 2 Africa Negotiator Packs', 'cycle-1-2-africa-negotiator-packs', 'brief', 'Africa negotiator packs and speaking briefs for the 2026 IMO cycles.', 'draft', 'public', 'planned', '2026-10-31', null),
  ('Multilingual Priority Briefs', 'multilingual-priority-briefs', 'brief', 'French and Portuguese priority briefs for Phase III knowledge products.', 'draft', 'public', 'planned', '2026-10-31', null),
  ('2026 Year-End Synthesis Report', '2026-year-end-synthesis-report', 'report', 'Phase III year-end synthesis report.', 'draft', 'public', 'planned', '2026-11-30', null)
on conflict (slug) do update set
  title = excluded.title,
  content_type = excluded.content_type,
  summary = excluded.summary,
  workflow_status = excluded.workflow_status,
  target_publish_date = excluded.target_publish_date,
  published_at = coalesce(public.content_items.published_at, excluded.published_at),
  updated_at = timezone('utc', now());

insert into public.project_content_links (project_id, content_id, relationship_type, label, sort_order)
select p.id, c.id, link.relationship_type, link.label, link.sort_order
from public.projects p
join (
  values
    ('leap-phase-i', 'ghana-international-shipping-emissions-inventory-report', 'report', 'Ghana Case Study Report', 10),
    ('leap-phase-i', 'africa-centric-analysis-unctad-comprehensive-impact-assessment-ghg-mid-term-measures', 'report', 'LEAP I Study Report', 20),
    ('leap-phase-i', 'complementary-quantitative-stakeholders-analysis-malawi', 'report', 'Malawi Case Study Report', 30),
    ('leap-phase-i', 'impact-assessment-imo-candidate-mid-term-ghg-measures-nigeria-case-study', 'report', 'Nigeria Case Study Report', 40),
    ('leap-phase-i', 'impact-assessment-liberia-case-study', 'report', 'Liberia Case Study Report', 50),
    ('leap-phase-i', 'complementary-quantitative-stakeholders-analysis-namibia', 'report', 'Namibia Case Study Report', 60),
    ('leap-phase-i', 'kenya-case-study-report', 'report', 'Kenya Case Study Report', 70),
    ('leap-phase-ii', 'abuja-summit-report-african-strategic-summit-shipping-decarbonisation', 'planned_product', 'Abuja Summit Report', 10),
    ('leap-phase-ii', 'dakar-workshop-report-advancing-africas-maritime-sector-to-net-zero', 'planned_product', 'Dakar Workshop Report', 20),
    ('leap-phase-ii', 'dakar-workshop-mentimeter-poll-insights', 'planned_product', 'Dakar poll insights', 30),
    ('leap-phase-ii', 'the-15-dakar-declarations', 'planned_product', 'The 15 Dakar Declarations', 40),
    ('leap-phase-ii', 'patna-at-africa-climate-summit-2', 'planned_product', 'PATNA at ACS2', 50),
    ('leap-phase-ii', 'report-of-mepc-es-2-second-extraordinary-session', 'report', 'MEPC/ES.2 meeting report', 60),
    ('leap-phase-ii', 'iswg-ghg-20-narrative-report', 'planned_product', 'ISWG-GHG 20 Narrative Report', 70),
    ('leap-phase-ii', 'path-to-maritime-net-zero-iswg-ghg-20-readout', 'brief', 'ISWG-GHG 20 Readout', 80),
    ('leap-phase-ii', '2025-review-and-2026-in-view-report', 'report', '2025 Review and 2026 In-View Report', 90),
    ('patna-phase-iii-2026', 'nzf-impact-assessment-for-africa', 'planned_product', 'NZF Impact Assessment for Africa', 10),
    ('patna-phase-iii-2026', 'africa-country-typology-v1-baseline-emissions-inventory-tool', 'planned_product', 'Typology and inventory tool', 20),
    ('patna-phase-iii-2026', 'znz-reward-design-options-for-africa', 'planned_product', 'ZNZ options paper', 30),
    ('patna-phase-iii-2026', 'just-transition-fund-governance-revenue-use-principles', 'planned_product', 'Fund governance brief', 40),
    ('patna-phase-iii-2026', 'port-readiness-case-study-1', 'planned_product', 'Port Readiness Case Study #1', 50),
    ('patna-phase-iii-2026', 'port-readiness-case-study-2', 'planned_product', 'Port Readiness Case Study #2', 60),
    ('patna-phase-iii-2026', 'port-readiness-toolkit-v1', 'planned_product', 'Port Readiness Toolkit v1', 70),
    ('patna-phase-iii-2026', 'cycle-1-2-africa-negotiator-packs', 'planned_product', 'Cycle 1 & 2 Africa Negotiator Packs', 80),
    ('patna-phase-iii-2026', 'multilingual-priority-briefs', 'planned_product', 'Multilingual Priority Briefs', 90),
    ('patna-phase-iii-2026', '2026-year-end-synthesis-report', 'planned_product', '2026 Year-End Synthesis Report', 100)
) as link(project_slug, content_slug, relationship_type, label, sort_order)
  on link.project_slug = p.slug
join public.content_items c on c.slug = link.content_slug
where not exists (
  select 1
  from public.project_content_links existing
  where existing.project_id = p.id
    and existing.content_id = c.id
    and existing.relationship_type = link.relationship_type
);

insert into public.content_country_links (content_id, country_code, relationship_type)
select c.id, link.country_code, link.relationship_type
from public.content_items c
join (
  values
    ('ghana-international-shipping-emissions-inventory-report', 'GHA', 'case_study'),
    ('complementary-quantitative-stakeholders-analysis-malawi', 'MWI', 'case_study'),
    ('impact-assessment-imo-candidate-mid-term-ghg-measures-nigeria-case-study', 'NGA', 'case_study'),
    ('impact-assessment-liberia-case-study', 'LBR', 'case_study'),
    ('complementary-quantitative-stakeholders-analysis-namibia', 'NAM', 'case_study'),
    ('kenya-case-study-report', 'KEN', 'case_study'),
    ('nzf-impact-assessment-for-africa', 'GHA', 'coverage'),
    ('nzf-impact-assessment-for-africa', 'KEN', 'coverage'),
    ('nzf-impact-assessment-for-africa', 'NGA', 'coverage'),
    ('africa-country-typology-v1-baseline-emissions-inventory-tool', 'SYC', 'coverage'),
    ('africa-country-typology-v1-baseline-emissions-inventory-tool', 'SEN', 'coverage')
) as link(content_slug, country_code, relationship_type)
  on c.slug = link.content_slug
on conflict do nothing;

alter table public.countries enable row level security;
alter table public.country_aliases enable row level security;
alter table public.places enable row level security;
alter table public.project_series enable row level security;
alter table public.project_country_typologies enable row level security;
alter table public.content_country_links enable row level security;

create policy "countries_public_read"
on public.countries
for select
to anon, authenticated
using (is_active or public.current_user_has_role('administrator'));

create policy "country_aliases_public_read"
on public.country_aliases
for select
to anon, authenticated
using (true);

create policy "places_public_read"
on public.places
for select
to anon, authenticated
using (true);

create policy "project_series_public_read"
on public.project_series
for select
to anon, authenticated
using (true);

create policy "project_country_typologies_visible"
on public.project_country_typologies
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "content_country_links_visible"
on public.content_country_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = content_country_links.content_id
      and (
        (content_items.publish_status = 'published' and content_items.visibility = 'public')
        or (
          content_items.publish_status = 'published'
          and content_items.visibility = 'members'
          and auth.role() = 'authenticated'
        )
        or public.current_user_can_manage_publications()
      )
  )
);

create policy "countries_admin_manage"
on public.countries
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "country_aliases_admin_manage"
on public.country_aliases
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "places_admin_manage"
on public.places
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_series_admin_manage"
on public.project_series
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_country_typologies_admin_manage"
on public.project_country_typologies
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "content_country_links_publication_manager_manage"
on public.content_country_links
for all
to authenticated
using (public.current_user_can_manage_publications())
with check (public.current_user_can_manage_publications());
