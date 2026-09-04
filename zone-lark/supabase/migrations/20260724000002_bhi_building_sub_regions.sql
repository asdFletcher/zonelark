-- Adds a within-state sub-region to the region overlay from
-- 20260724000001_bhi_building_regions.sql, e.g. region='Florida' + sub_region='Northern Florida'.
-- Nullable: a building can have a state assigned without a sub-region yet. Valid sub-region
-- values per state are enforced in the application layer (bhi-service/src/regions.ts
-- SUB_REGIONS), not a DB check constraint, since "sub_region belongs to region" isn't
-- expressible as a plain single-column check.

alter table bhi_building_regions add column sub_region text;
