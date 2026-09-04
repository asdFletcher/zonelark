<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zonelark — agent guide

**App:** Next.js 16, App Router, TypeScript, Tailwind v4. Commands run from the repo root.

Auth and persistence are being rewritten onto Railway (Postgres + a new auth provider). Do not reintroduce Supabase, SQLite, IP allowlists, or session gates. Until that rewrite lands, treat login/admin/profile/integrations API routes as placeholders and keep the assess/export path working with the in-memory job store.

## Quick commands

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run dev`          | Dev server — webpack (port 3000); use `npm run dev:turbo` for Turbopack |
| `npm run mock`         | Regenerate `sample_outputs/Zonelark_SAMPLE.xlsx`                        |
| `npm run build`        | Production build + typecheck                                            |
| `npm run lint`         | ESLint                                                                  |
| `npm run format`       | Prettier write (run before committing)                                  |
| `npm run format:check` | Prettier check (CI-friendly)                                            |
| `npm run test`         | Vitest                                                                  |

## Repo layout

```
app/
  globals.css                        # theme tokens (light/dark/ops-dark) in @theme inline
  layout.tsx                         # root shell
  (auth)/login/page.tsx              # sign-in UI (auth provider not wired yet)
  (dashboard)/                       # route group — Home / Portfolio / Capture / Grid
    layout.tsx                       # DashboardProvider (shared useAssetSession/usePortfolio) + TopBar/TabBar
    page.tsx                         # Home — hero, KPI grid, twin modules
    portfolio/, capture/, grid/
  admin/                             # admin console UI (users, integrations)
  profile/page.tsx                   # profile + preferences UI
  api/                                # Route Handlers (REST API)
    health/, assess/upload/, assess/manual/, job/[jobId]/, export/[jobId]/, import/xlsx/
    admin/users/, portfolios/, buildings/, preferences/, profile/, integrations/, metrics/
components/
  dashboard/                         # DashboardProvider, hero, KPI grid/tile, twin-module panels
  layout/   upload/   form/   assets/   ui/   auth/
hooks/
  useAssetSession.ts                 # assess / export / clear state
  usePortfolio.ts                    # session-local portfolio/buildings (not persisted yet)
  useAutosavePreferences.ts          # debounced PATCH /api/preferences (stub)
  useServerHealth.ts                 # polls GET /api/health
  useImagePreprocess.ts              # canvas resize/contrast before upload
lib/
  schemas.ts, config.ts              # shared types + Uniformat/lifecycle registry
  formatters.ts                      # client-safe display helpers
  sampleAssets.ts                    # shared sample rows (demo + mock)
  workbook.ts                        # Excel builder (shared with mock script)
  portfolioMapper.ts                 # BuildingFormValues <-> row shape
  integrations/                      # CmmsAdapter/CrmAdapter framework + mock adapter
  metrics/                           # draft operational metric indices — see header comments
  server/                            # server-only — never import from Client Components
    enrichment.ts, llmPipeline.ts, spreadsheet.ts, jobStore.ts (in-memory)
scripts/mockData.ts                  # npm run mock
sample_outputs/Zonelark_SAMPLE.xlsx
```

## Architecture rules

1. **`lib/server/*`** — import `'server-only'` at top. Only used from `app/api/**/route.ts`.
2. **Secrets** — `.env` only (never commit); never expose to the client.
3. **API paths** — client calls relative `/api/...` (same origin, no CORS).
4. **Persistence** — remote Postgres on Railway is the intended store. It is not wired yet. Assess/export uses an in-memory `jobStore` (single process). Portfolio/buildings live in React state for the session. Do not add a local SQLite fallback.
5. **Auth** — not wired. `/login` and admin user APIs are placeholders. Do not add an IP allowlist or a request-IP gate.
6. **Styling** — Tailwind v4 with CSS variables in `globals.css` (`light` / `dark` / `ops-dark` themes via `data-theme`); breakpoint `701px` for mobile/desktop layout; `.glass-card`/`.kpi-tile` utility classes for the ops-dark dashboard look.
7. **Icons** — `@tabler/icons-react` (not CDN webfont).
8. **Imports** — use `@/` path alias (`@/lib/schemas`, `@/components/...`).
9. **Shared dashboard state** — the four dashboard routes share one `useAssetSession()`/`usePortfolio()` instance via `DashboardProvider` (`components/dashboard/DashboardProvider.tsx`) at the `(dashboard)/layout.tsx` level. Don't call those hooks again inside an individual page — you'll get a disconnected copy of the state instead of the shared one.

## Where to change what

| Task                                | Look in                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Dashboard UI / layout               | `app/(dashboard)/**` + `components/dashboard/`                                                         |
| New API endpoint                    | `app/api/<path>/route.ts` + `lib/server/`                                                              |
| Asset types / validation            | `lib/schemas.ts`                                                                                       |
| Lifecycle costs / Uniformat         | `lib/config.ts`                                                                                        |
| Excel export columns                | `lib/server/spreadsheet.ts` + `lib/config.ts` `COLUMNS_SCHEMA`                                         |
| LLM prompts / vision                | `lib/server/llmPipeline.ts`                                                                            |
| Demo / mock sample data             | `lib/sampleAssets.ts` — `npm run mock` for xlsx                                                        |
| Post-assess field overrides         | `components/form/ExtractedAssetForm.tsx`                                                               |
| Admin console (users, integrations) | `app/admin/**` + `app/api/admin/**`                                                                    |
| CMMS/CRM adapters                   | `lib/integrations/` — implement `CmmsAdapter`/`CrmAdapter`, register in `lib/integrations/pipeline.ts` |
| Operational metrics                 | `lib/metrics/` — every metric is flagged DRAFT, validate against real portfolio data before trusting   |

## Access control

Auth is being rewritten. Until then the app does not gate routes. `GET /api/health` is public.

## API contract (stubbed routes)

These handlers still exist so the UI has somewhere to call. They return empty collections or `501`. Each file's header comment is the contract to re-implement against — do not restore the old Supabase clients.

| Route                                   | Purpose                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `GET/POST /api/admin/users`             | List org users; invite by email and assign a role                        |
| `GET/PATCH/DELETE /api/admin/users/:id` | Read / change role or display name / deactivate (not self)               |
| `GET/POST /api/portfolios`              | List org portfolios; create one (first create also bootstraps the org)   |
| `PATCH /api/portfolios/:id`             | Rename a portfolio                                                       |
| `GET/POST /api/buildings`               | List buildings (`?portfolio_id=`); create an empty building              |
| `PATCH/DELETE /api/buildings/:id`       | Update via `buildingFormToPayload` / delete                              |
| `GET/PATCH /api/profile`                | Current user email + profile; update display name                        |
| `GET/PATCH /api/preferences`            | Autosaved UI JSON blob                                                   |
| `GET/POST /api/integrations`            | List / create CMMS or CRM connections (`adapter_key` defaults to `mock`) |
| `POST /api/integrations/:id/sync`       | Run the adapter and persist normalized work orders / service requests    |
| `GET /api/integrations/last-synced`     | Latest `last_synced_at` for the TopBar badge (`null` if none)            |
| `GET /api/metrics`                      | Recent metric snapshots                                                  |
| `POST /api/metrics/compute`             | Recompute org metrics from assets via `lib/metrics/`                     |

Still live (not stubs): `/api/health`, `/api/assess/upload`, `/api/assess/manual`, `/api/job/:id`, `/api/export/:id`, `/api/import/xlsx`.

## Dev workflow

```
npm run dev  →  http://localhost:3000
```

No local database. Copy `.env.example` to `.env`. `ANTHROPIC_API_KEY` is optional — only needed for the AI assessment step. Demo mode (no photo) and manual asset entry work without it.

## Before committing

1. `npm run format`
2. `npm run lint`
3. `npm run build` for non-trivial changes

Do **not** commit `.env`, `node_modules/`, or `.next/`. Never commit secret values.
