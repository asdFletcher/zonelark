-- Building Health Index (BHI) — raw per-period operational inputs behind a BHI score
-- computation. Consumed by the standalone bhi-service/ (Express) app, which connects to
-- this same Supabase project with the service-role key; RLS is still defined here so any
-- other client (Supabase Studio, a future direct Next.js read) is scoped correctly.
--
-- BHI *scores* reuse the existing metric_snapshots table (scope_type='building',
-- metric_key in 'bhi_compliance'/'bhi_operational'/'bhi_decision'/'bhi_workforce'/
-- 'bhi_overall') rather than a new table — see ../../../Plan.md-equivalent BHI plan.

create table bhi_period_inputs (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  inspections_required integer not null default 0,
  inspections_completed integer not null default 0,
  pm_scheduled integer not null default 0,
  pm_completed integer not null default 0,
  fire_inspection_status text,
  regulatory_compliance_status text,
  total_work_orders integer not null default 0,
  emergency_work_orders integer not null default 0,
  urgent_work_orders integer not null default 0,
  routine_work_orders integer not null default 0,
  pm_work_orders integer not null default 0,
  reactive_work_orders integer not null default 0,
  sla_target integer not null default 0,
  sla_met integer not null default 0,
  employees integer not null default 0,
  available_labor_hours numeric not null default 0,
  productive_labor_hours numeric not null default 0,
  deferred_maintenance_items integer not null default 0,
  source_filename text,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index bhi_period_inputs_building_idx on bhi_period_inputs (building_id, period_end desc);

alter table bhi_period_inputs enable row level security;

-- Mirrors buildings_select/buildings_write from 20260721000003_rls_policies.sql, using the
-- same building_org_id()/building_portfolio_id() security-definer helpers.
create policy bhi_period_inputs_select on bhi_period_inputs for select
  using (
    building_org_id(building_id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual', 'ownership')
      or (profile_role() = 'regional' and building_portfolio_id(building_id) = any(profile_portfolio_scope()))
    )
  );

create policy bhi_period_inputs_write on bhi_period_inputs for all
  using (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual'));
