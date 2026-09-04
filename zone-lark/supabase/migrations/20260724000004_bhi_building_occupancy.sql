-- BHI-owned unit-count/occupancy overlay, kept separate from zone-lark's shared `buildings`
-- table since occupancy is a BHI/property-management concept zone-lark itself doesn't model —
-- same pattern as bhi_building_regions (20260724000001_bhi_building_regions.sql). One row per
-- building; occupied_units is nullable since not every building has occupancy data yet.

create table bhi_building_occupancy (
  building_id uuid primary key references buildings (id) on delete cascade,
  units integer not null,
  occupied_units integer,
  updated_at timestamptz not null default now()
);

alter table bhi_building_occupancy enable row level security;

-- Mirrors buildings_select/buildings_write from 20260721000003_rls_policies.sql.
create policy bhi_building_occupancy_select on bhi_building_occupancy for select
  using (
    building_org_id(building_id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual', 'ownership')
      or (profile_role() = 'regional' and building_portfolio_id(building_id) = any(profile_portfolio_scope()))
    )
  );

create policy bhi_building_occupancy_write on bhi_building_occupancy for all
  using (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'));
