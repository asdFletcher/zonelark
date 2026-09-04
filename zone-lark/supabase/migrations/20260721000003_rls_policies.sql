-- Zone Lark — RLS. Four tiers: admin (full RW in org), regional (read, portfolio-scoped),
-- ownership (read-only on metrics/rollups, no raw asset/assessment/CMMS detail), individual
-- (RW on their own work + own preferences).
--
-- Helper functions are `security definer`, so they run as the table owner and therefore bypass
-- RLS themselves — this is what avoids infinite recursion when a policy on `profiles` needs to
-- read `profiles` to find the caller's role/org.

create function profile_role()
returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create function profile_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create function profile_is_site_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(is_site_admin, false) from profiles where id = auth.uid();
$$;

create function profile_portfolio_scope()
returns uuid[] language sql stable security definer set search_path = public as $$
  select portfolio_scope from profiles where id = auth.uid();
$$;

create function building_org_id(b_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select p.org_id from buildings b join portfolios p on p.id = b.portfolio_id where b.id = b_id;
$$;

create function building_portfolio_id(b_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select portfolio_id from buildings where id = b_id;
$$;

create function assessment_org_id(a_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select building_org_id(building_id) from assessments where id = a_id;
$$;

create function assessment_portfolio_id(a_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select building_portfolio_id(building_id) from assessments where id = a_id;
$$;

create function asset_org_id(as_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select assessment_org_id(assessment_id) from assets where id = as_id;
$$;

create function metric_scope_org_id(p_scope_type text, p_scope_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select case p_scope_type
    when 'org' then p_scope_id
    when 'portfolio' then (select org_id from portfolios where id = p_scope_id)
    when 'building' then building_org_id(p_scope_id)
  end;
$$;

-- Blocks direct client writes to role/org_id/is_site_admin/portfolio_scope — those only change
-- via app/api/admin/users/* routes, which use the Supabase service-role key (auth.role() =
-- 'service_role', exempt below).
create function profiles_guard_privileged_columns()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    if new.role is distinct from old.role
       or new.org_id is distinct from old.org_id
       or new.is_site_admin is distinct from old.is_site_admin
       or new.portfolio_scope is distinct from old.portfolio_scope then
      raise exception 'role, org_id, is_site_admin, and portfolio_scope can only be changed by an admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged_columns_trigger
  before update on profiles
  for each row execute function profiles_guard_privileged_columns();

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table portfolios enable row level security;
alter table buildings enable row level security;
alter table assessments enable row level security;
alter table assets enable row level security;
alter table jobs enable row level security;
alter table user_preferences enable row level security;
alter table integration_connections enable row level security;
alter table cmms_work_orders enable row level security;
alter table crm_service_requests enable row level security;
alter table metric_snapshots enable row level security;

-- organizations: any member reads their own org; only admins write it.
create policy organizations_select on organizations for select
  using (id = profile_org_id() or profile_is_site_admin());
create policy organizations_write on organizations for all
  using (profile_role() = 'admin' and id = profile_org_id())
  with check (profile_role() = 'admin' and id = profile_org_id());

-- profiles: see your own row or teammates in your org; only update your own row (trigger above
-- blocks privileged-column changes outside the service role).
create policy profiles_select on profiles for select
  using (id = auth.uid() or org_id = profile_org_id());
create policy profiles_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- portfolios / buildings: structural data. Visible to admin/individual/regional(scoped)/ownership
-- (ownership needs building names/context to read metric_snapshots meaningfully); only
-- admin/individual write.
create policy portfolios_select on portfolios for select
  using (
    org_id = profile_org_id()
    and (
      profile_role() in ('admin', 'individual', 'ownership')
      or (profile_role() = 'regional' and id = any(profile_portfolio_scope()))
    )
  );
create policy portfolios_write on portfolios for all
  using (org_id = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (org_id = profile_org_id() and profile_role() in ('admin', 'individual'));

create policy buildings_select on buildings for select
  using (
    building_org_id(id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual', 'ownership')
      or (profile_role() = 'regional' and building_portfolio_id(id) = any(profile_portfolio_scope()))
    )
  );
create policy buildings_write on buildings for all
  using (building_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (building_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'));

-- assessments / assets: operational detail. Admin/individual RW, regional read-only (scoped),
-- ownership has NO access — they see aggregated metric_snapshots instead, never raw rows.
create policy assessments_select on assessments for select
  using (
    assessment_org_id(id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual')
      or (profile_role() = 'regional' and assessment_portfolio_id(id) = any(profile_portfolio_scope()))
    )
  );
create policy assessments_write on assessments for all
  using (assessment_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (assessment_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'));

create policy assets_select on assets for select
  using (
    asset_org_id(id) = profile_org_id()
    and (
      profile_role() in ('admin', 'individual')
      or (profile_role() = 'regional' and assessment_portfolio_id(assessment_id) = any(profile_portfolio_scope()))
    )
  );
create policy assets_write on assets for all
  using (asset_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (asset_org_id(id) = profile_org_id() and profile_role() in ('admin', 'individual'));

create policy jobs_select on jobs for select
  using (
    assessment_org_id(assessment_id) = profile_org_id()
    and profile_role() in ('admin', 'individual')
  );
create policy jobs_write on jobs for all
  using (assessment_org_id(assessment_id) = profile_org_id() and profile_role() in ('admin', 'individual'))
  with check (assessment_org_id(assessment_id) = profile_org_id() and profile_role() in ('admin', 'individual'));

-- user_preferences: always scoped to the caller, regardless of role — autosave must never leak.
create policy user_preferences_all on user_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- integration_connections: admin RW, regional read-only (status/config, never secret_ref values —
-- the secret itself lives in Vault, not this table), individual/ownership no access.
create policy integration_connections_select on integration_connections for select
  using (org_id = profile_org_id() and profile_role() in ('admin', 'regional'));
create policy integration_connections_write on integration_connections for all
  using (org_id = profile_org_id() and profile_role() = 'admin')
  with check (org_id = profile_org_id() and profile_role() = 'admin');

-- cmms_work_orders / crm_service_requests: raw synced records. Same tier as assets — admin and
-- individual read (this feeds the "Facilities Performance" dashboard panel); no direct client
-- writes (only the sync pipeline via the service role writes these).
create policy cmms_work_orders_select on cmms_work_orders for select
  using (
    building_id is null
    or (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual', 'regional'))
  );

create policy crm_service_requests_select on crm_service_requests for select
  using (
    building_id is null
    or (building_org_id(building_id) = profile_org_id() and profile_role() in ('admin', 'individual', 'regional'))
  );

-- metric_snapshots: the one place ownership gets read access — aggregated indices, not raw rows.
create policy metric_snapshots_select on metric_snapshots for select
  using (metric_scope_org_id(scope_type, scope_id) = profile_org_id());
