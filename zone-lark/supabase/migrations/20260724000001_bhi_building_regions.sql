-- BHI-owned overlay assigning a region (currently: US state) to a building, kept separate
-- from zone-lark's shared `buildings` table since region is a BHI-driven grouping concept,
-- not a general building attribute zone-lark itself models yet — same pattern as
-- bhi_period_inputs (20260723000001_bhi_tables.sql). One row per building; region is
-- reassignable, so this is an upsert target rather than an append-only log.

create table bhi_building_regions (
  building_id uuid primary key references buildings (id) on delete cascade,
  region text not null check (region in ('Florida', 'Georgia', 'Alabama', 'Tennessee')),
  updated_at timestamptz not null default now()
);

alter table bhi_building_regions enable row level security;

-- Mirrors buildings_select/buildings_write from 20260721000003_rls_policies.sql.
create policy bhi_building_regions_select on bhi_building_regions for select
  using (
    building_org_id(building_id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual', 'ownership')
      or (profile_role() = 'regional' and building_portfolio_id(building_id) = any(profile_portfolio_scope()))
    )
  );

create policy bhi_building_regions_write on bhi_building_regions for all
  using (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'));
