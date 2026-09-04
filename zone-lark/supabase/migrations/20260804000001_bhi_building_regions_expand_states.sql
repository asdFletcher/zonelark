-- Widens bhi_building_regions' region check (20260724000001_bhi_building_regions.sql) from the
-- original 4-state FSR High-Rise portfolio (Florida/Georgia/Alabama/Tennessee) to all 12 states
-- the Range Water portfolio actually operates in, matching bhi-service/src/regions.ts's REGIONS
-- after its 2026-08-04 expansion. New states each also need a SUB_REGIONS entry there (already
-- added) since sub_region validity is application-layer only (see
-- 20260724000002_bhi_building_sub_regions.sql).

alter table bhi_building_regions drop constraint bhi_building_regions_region_check;

alter table bhi_building_regions add constraint bhi_building_regions_region_check
  check (region in (
    'Florida', 'Georgia', 'Alabama', 'Tennessee',
    'North Carolina', 'South Carolina', 'Texas', 'Arizona',
    'Colorado', 'Virginia', 'Indiana', 'West Virginia'
  ));
