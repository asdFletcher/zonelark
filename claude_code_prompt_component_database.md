# Project Brief: Multifamily Component Pricing & Reserve Database

## Context

I manage facilities and capital planning for multifamily real estate (Class A/B/C — high-rise, mid-rise, garden-style, and built-to-rent). I need a system that:

1. Maintains a taxonomy of every physical component in a multifamily property (HVAC, plumbing, electrical, life safety, envelope, amenity, etc.)
2. Scrapes and validates pricing data for those components from vendor/retailer/cost-guide websites
3. Tracks component instances at specific properties with install dates, so I can forecast when each one needs replacement
4. Prioritizes data freshness for components coming due for replacement within the next 1-5 years, especially the 20-year reserve planning window
5. Produces inflation-adjusted replacement cost forecasts for capital/reserve planning

Build this as a Python + PostgreSQL project. I want something I can run locally first, expand later. Work incrementally and confirm each phase works before moving to the next.

---

## Phase 1: Schema

Create Postgres migration files (use Alembic or plain SQL migrations, your call) for:

**`components`** — the taxonomy, one row per distinct replaceable item type
- `component_id` (PK)
- `category`, `subcategory`, `item_name`
- `unit_of_measure` (Each, Sq Ft, Linear Ft, Ton, Set)
- `applicable_class` (array: A/B/C)
- `applicable_building_type` (array: high-rise/mid-rise/garden/BTR)
- `replacement_cycle_years` (useful life)
- `is_reserve_item` — generated column, TRUE when `replacement_cycle_years <= 20`
- unique constraint on (category, item_name, unit_of_measure)

**`sources`** — every website in the scraping registry
- `source_id` (PK), `domain`, `source_type` (manufacturer/wholesaler/retailer/cost_guide/contractor_quote)
- `scrape_allowed` (bool — result of a robots.txt/ToS check, must be TRUE before the fetcher will touch it)
- `trust_score` (numeric, default 0.5, updated over time based on validation outcomes)
- `last_crawled`

**`price_observations`** — append-only, one row per scrape hit, never overwritten
- `observation_id` (PK), `component_id` (FK), `source_id` (FK)
- `raw_price`, `currency`, `price_type` (equipment_only/installed/labor_only/unknown)
- `unit_of_measure`, `product_url`, `scraped_at`
- `is_valid` (bool, set by the validator — never by the scraper), `validation_notes`

**`properties`** — the physical assets in the portfolio
- `property_id` (PK), `name`, `address`, `class` (A/B/C), `building_type`, `unit_count`, `year_built`

**`property_component_instances`** — actual installed components at actual properties
- `instance_id` (PK), `property_id` (FK), `component_id` (FK)
- `location_detail` (free text, e.g. "Unit 204", "Roof — East Wing")
- `install_date`, `condition_rating` (1-5), `last_inspected_at`
- `expected_replace_date` — generated from `install_date + replacement_cycle_years`
- `remaining_useful_life_years` — nullable override for condition-adjusted RUL

**`cost_forecast_assumptions`**
- `component_id` (FK), `annual_inflation_pct` (default 3.5, category-specific overrides allowed), `source` (citation for the inflation assumption)

Seed `components` with a starter catalog of ~120 items spanning: Appliances, Plumbing, Electrical, HVAC, Flooring, Interior Finishes, Cabinetry & Countertops, Doors & Windows, Life Safety, Vertical Transportation, Access Control, Amenity, Building Envelope, Site & Grounds. I can supply this list if useful — ask me for it before generating placeholder data.

---

## Phase 2: Validation Pipeline (build and test this before wiring up real scrapers)

Write a `validator` module that runs as a **separate pass after scraping**, not inline in the fetcher. It should mark `is_valid` on each observation and write `validation_notes` explaining any rejection. Rules to implement:

1. **Schema completeness** — reject if price, currency, or unit didn't all parse cleanly.
2. **Range sanity per component** — each component has a configurable plausible min/max band; flag anything outside it rather than silently accepting or silently dropping it.
3. **Unit normalization** — never compare $/sqft to $/each; normalize or explicitly tag mismatches.
4. **Price-type tagging** — attempt to classify equipment-only vs. installed vs. labor-only from page context; default to `unknown` and exclude `unknown` from aggregates unless explicitly included.
5. **Source trust scoring** — after each validation run, adjust the source's `trust_score` based on how often its observations get flagged invalid or contradicted by other sources for the same component.
6. **Staleness** — observations older than a configurable window (default 90 days, override per category) should be excluded from "current" aggregate views even if originally valid.
7. **Duplicate detection** — flag repeated identical scrapes from the same URL over time (possible stale/cached page).
8. **Statistical outlier detection** — once a component has 3+ valid observations, flag new ones that fall more than 2.5 standard deviations from the trailing median for manual review instead of auto-accepting.

Write unit tests for each rule with obviously-valid and obviously-invalid fixture data before connecting anything to a real website.

---

## Phase 3: Scraper Framework

- One parser/adapter per source, not a generic universal scraper — sites differ too much in structure (Shopify vs. Magento vs. WooCommerce vs. static HTML).
- Before any source is added to the `sources` table and before the fetcher runs against it, check `robots.txt` and note any Terms of Service restriction. If disallowed, set `scrape_allowed = FALSE` and do not fetch.
- Rate-limit per domain (configurable, conservative default).
- Use `httpx`/`requests` for static pages; use Playwright for JS-rendered sites (needed for storefronts that hide pricing until cart, e.g. some Shopify sites).
- Each adapter's output should conform to a shared intermediate schema before hitting the normalizer/validator, so the rest of the pipeline doesn't need to know which source it came from.
- Start with 3-5 real source adapters, not the full registry, so the pipeline can be proven end-to-end before scaling out.

---

## Phase 4: Reserve-Item Prioritization

- Build a `scrape_priority` view/query that joins `reserve_components` (the `is_reserve_item = TRUE` subset) against `property_component_instances`, and buckets each component into `high` (replacement due within 2 years), `medium` (within 5 years), `low` (beyond 5, up to 20) based on the *nearest* `expected_replace_date` across all instances.
- Wire the scrape scheduler to run `high` tier weekly, `medium` monthly, `low` quarterly — not a flat cadence.
- Build a "data gap" report: any reserve-item component with zero valid observations in the trailing 12 months. This should be a standing query/report I can run anytime, not something discovered only when a budget is being built.

---

## Phase 5: Forecasting Output

- A view/query that, for each `property_component_instances` row, computes:
  - current validated median price (from valid, non-stale observations)
  - forecasted replacement cost = current median compounded forward at `annual_inflation_pct` to `expected_replace_date`
- Support both straight-line (age-based `expected_replace_date`) and condition-adjusted (`remaining_useful_life_years` override) forecasting, selectable per query.
- Output should be exportable to CSV/Excel for a given property, filtered to reserve items, sorted by nearest replacement date — this is the actual deliverable for a capital/reserve plan.

---

## General instructions for you (Claude Code)

- Work in phases, in order. Confirm each phase runs and passes its tests before starting the next.
- Use Python 3.11+, PostgreSQL, SQLAlchemy or raw SQL migrations (your preference, just be consistent), pytest for tests.
- Prefer explicit, readable code over cleverness — this needs to be maintainable by me, not just you.
- Do not scrape any real website until Phase 2's validation tests pass.
- Before adding any source to the registry, verify and note its robots.txt/ToS status in the PR or commit message.
- Ask me before making assumptions about inflation rates, staleness windows, or trust-score weighting — these are business decisions, not technical ones.
- If you get to a natural checkpoint and aren't sure whether to proceed or check in, check in.
