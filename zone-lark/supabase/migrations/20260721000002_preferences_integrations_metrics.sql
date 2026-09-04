-- Zone Lark — per-user autosaved preferences, CMMS/CRM integration framework, operational metrics.

-- One row per user. preferences is schema-light JSONB (last-active route, theme, selected
-- building/portfolio, KPI-tile ordering) validated by Zod at the API boundary, not by Postgres —
-- this shape is expected to keep growing as the dashboard gains more personalizable state.
create table user_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Per-org CMMS/CRM connection config (lib/integrations/*). Vendor is undecided today, so
-- adapter_key defaults to "mock" — see lib/integrations/adapters/mock.ts. Secrets never live in
-- `config`; they're referenced via secret_ref into Supabase Vault (supabase_vault.secrets).
create table integration_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  provider_kind text not null check (provider_kind in ('cmms', 'crm')),
  adapter_key text not null default 'mock',
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  config jsonb not null default '{}',
  secret_ref text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- Normalized work orders synced from a CmmsAdapter (lib/integrations/schemas.ts's NormalizedWorkOrder).
create table cmms_work_orders (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references integration_connections (id) on delete cascade,
  building_id uuid references buildings (id) on delete set null,
  external_id text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  opened_at timestamptz not null,
  responded_at timestamptz,
  closed_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (connection_id, external_id)
);

create index cmms_work_orders_building_id_idx on cmms_work_orders (building_id);

-- Normalized service requests synced from a CrmAdapter (NormalizedServiceRequest).
create table crm_service_requests (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references integration_connections (id) on delete cascade,
  building_id uuid references buildings (id) on delete set null,
  external_id text not null,
  status text not null default 'open',
  opened_at timestamptz not null,
  closed_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (connection_id, external_id)
);

create index crm_service_requests_building_id_idx on crm_service_requests (building_id);

-- Phase 4 operational-metrics output. definition_version means a formula change never rewrites
-- history — old snapshots stay attributable to the version that produced them. See lib/metrics/.
create table metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('building', 'portfolio', 'org')),
  scope_id uuid not null,
  metric_key text not null,
  value numeric not null,
  metadata jsonb not null default '{}',
  definition_version text not null,
  computed_at timestamptz not null default now()
);

create index metric_snapshots_scope_idx on metric_snapshots (scope_type, scope_id, metric_key);
