-- Adds precise map coordinates to the region overlay from 20260724000001_bhi_building_regions.sql
-- / 20260724000002_bhi_building_sub_regions.sql, for the Portfolio/Building map view. Nullable:
-- a building can have a state/sub-region assigned without exact coordinates yet — the client
-- falls back to the state's rough centroid (bhi-dashboard/src/lib/geo.ts's STATE_CENTROID).

alter table bhi_building_regions add column lat double precision;
alter table bhi_building_regions add column lon double precision;
