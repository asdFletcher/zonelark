-- Zone Lark — core tenancy + asset schema.
-- Domain chain: organizations -> profiles (users) -> portfolios -> buildings -> assessments -> assets/jobs.

create extension if not exists "pgcrypto";

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 1:1 extension of auth.users. role drives RLS scoping across the whole app.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references organizations (id) on delete set null,
  role text not null default 'individual' check (role in ('admin', 'regional', 'ownership', 'individual')),
  is_site_admin boolean not null default false,
  display_name text,
  -- Portfolio IDs a 'regional' user is scoped to read; ignored for other roles.
  portfolio_scope uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  building_name text not null default '',
  building_type text not null default '',
  total_sqft numeric not null default 0,
  above_grade_floors integer not null default 1,
  basement_levels integer not null default 0,
  has_roof_level boolean not null default true,
  build_date date,
  remodel_dates date[] not null default '{}',
  created_at timestamptz not null default now()
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings (id) on delete cascade,
  assessment_date date not null default current_date,
  facility_level text,
  floor_id text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Row shape mirrors lib/schemas.ts's AssetRecordSchema field-for-field (camelCase -> snake_case),
-- plus id/assessment_id/timestamps. Kept as real columns (not JSONB) so metrics can run as plain
-- SQL aggregates and lib/config.ts's COLUMNS_SCHEMA/workbook export stay a clean 1:1 mapping.
create table assets (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  floor_id text not null default '01',
  facility_name text not null,
  facility_type text not null,
  facility_level text not null default '1st Floor',
  room_number text not null default '',
  room_name text not null default '',
  area_served text not null default '',
  cmms_id text not null default '',
  asset_name text not null,
  manufacturer text not null default 'Unknown',
  model_number text not null default 'N/A',
  serial_number text not null default 'N/A',
  install_year integer not null,
  notes text not null default '',
  fca_score integer not null default 3 check (fca_score between 1 and 5),
  asset_type text not null,
  uniformat_level2 text,
  asset_size text not null default 'N/A',
  quantity_multiplier numeric not null default 1,
  uom text not null default 'EA',
  repair_or_replace text not null default 'Maintain',
  observed_life_remaining integer not null,
  observed_replacement_year integer,
  unit_probable_cost numeric,
  facility_sqft numeric not null,
  assessment_date date not null default current_date,
  operational_impact integer not null default 3 check (operational_impact between 1 and 5),
  energy_impact integer not null default 3 check (energy_impact between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_assessment_id_idx on assets (assessment_id);

-- Replaces lib/server/jobStore.ts's in-memory Map. export_storage_path points at a Supabase
-- Storage object (bucket "exports") holding the generated .xlsx.
create table jobs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments (id) on delete cascade,
  status text not null default 'complete' check (status in ('pending', 'complete', 'failed')),
  export_storage_path text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up, defaulting to 'individual'.
-- Admin invites (app/api/admin/users) update role/org_id immediately after via the service-role
-- client, so this only sets the baseline row.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
