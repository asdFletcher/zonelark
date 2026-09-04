<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zonelark — agent guide

**Active app:** `zone-lark/` (Next.js 16, App Router, TypeScript, Tailwind v4).
**App architecture:** `../Plan.md` at repo root (structure, API contract, testing).

All app commands below assume `cd zone-lark` first.

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

A **pre-commit hook** (Lefthook) runs Prettier on staged `zone-lark` files automatically. Config: `lefthook.yml` at the repo root. After clone, run `npm install` once in `zone-lark/` to activate hooks. If the hook fails, run `npm run format` and re-stage.

## Repo layout (`zone-lark/`)

```
app/
  globals.css                        # theme tokens (light/dark/ops-dark) in @theme inline
  layout.tsx                         # root shell, wraps <Providers>
  (auth)/login/page.tsx              # public sign-in
  (dashboard)/                       # route group — was Dashboard.tsx's 4 tabs, now real routes
    layout.tsx                       # DashboardProvider (shared useAssetSession/usePortfolio) + TopBar/TabBar
    page.tsx                         # Home — hero, KPI grid, twin modules
    portfolio/, capture/, grid/      # Build Your Portfolio / Asset Capture / Asset Grid
  admin/                             # admin console (users, integrations) — role="admin" only
  profile/page.tsx                   # per-user profile + autosaved preferences
  api/                                # Route Handlers (REST API)
    health/, assess/upload/, assess/manual/, job/[jobId]/, export/[jobId]/, import/xlsx/
    admin/users/, portfolios/, buildings/, preferences/, profile/, integrations/, metrics/
components/
  dashboard/                         # DashboardProvider, hero, KPI grid/tile, twin-module panels
  layout/   upload/   form/   assets/   ui/   auth/
hooks/
  useAssetSession.ts                 # assess / export / clear state
  usePortfolio.ts                    # persisted portfolio/buildings CRUD (Supabase-backed)
  useAutosavePreferences.ts          # debounced PATCH /api/preferences
  useServerHealth.ts                 # polls GET /api/health
  useImagePreprocess.ts              # canvas resize/contrast before upload
lib/
  schemas.ts, config.ts              # shared types + Uniformat/lifecycle registry
  formatters.ts, demoData.ts         # client-safe display helpers
  sampleAssets.ts                    # shared sample rows (demo + mock)
  workbook.ts                        # Excel builder (shared with mock script)
  portfolioMapper.ts                 # BuildingFormValues <-> buildings table row
  supabase/                          # server.ts, browser.ts, middleware.ts, database.types.ts
  integrations/                      # CmmsAdapter/CrmAdapter framework + mock adapter (Phase 3)
  metrics/                           # draft operational metric indices (Phase 4) — see header comments
  server/                            # server-only — never import from Client Components
    enrichment.ts, llmPipeline.ts, spreadsheet.ts, jobStore.ts (Supabase-backed)
    requireUser.ts, adminGuard.ts, adminApi.ts, orgBootstrap.ts, assessmentContext.ts
    db/assetMapper.ts, metrics/snapshotWriter.ts
proxy.ts                             # IP allowlist + Supabase session/route auth
supabase/migrations/                 # schema + RLS (organizations/profiles/portfolios/buildings/
                                      # assessments/assets/jobs/user_preferences/
                                      # integration_connections/metric_snapshots/cmms/crm tables)
src/mockData.ts                      # npm run mock
sample_outputs/Zonelark_SAMPLE.xlsx
```

## Architecture rules

1. **`lib/server/*`** — import `'server-only'` at top. Only used from `app/api/**/route.ts`.
2. **Secrets** — `.env` only (never commit); never expose to the client. `SUPABASE_SERVICE_ROLE_KEY` is server-only — it bypasses RLS, so it must never reach a Client Component.
3. **API paths** — client calls relative `/api/...` (same origin, no CORS).
4. **Persistence** — Supabase (Postgres + Auth + Realtime). `jobStore`/assets/portfolios/buildings all live in Postgres now (`supabase/migrations/`), not in-memory. Local dev needs either `supabase start` (Docker) or a hosted project's credentials in `.env`; without either, the app still runs (demo/asset-capture-in-memory-only mode) — see "Dev workflow" below.
5. **Auth/RLS** — four roles (`admin`/`regional`/`ownership`/`individual`) on `profiles.role`, enforced by Postgres RLS policies, not just app code. `proxy.ts` gates routes by session + admin-only paths; `lib/server/adminGuard.ts`'s `requireAdmin()` re-checks inside every `app/api/admin/**` route (proxy alone isn't a substitute for in-route checks — see Next's Data Security guide).
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
| DB schema / RLS                     | `supabase/migrations/` (new migration per change, never edit old ones)                                 |
| Admin console (users, integrations) | `app/admin/**` + `app/api/admin/**`, `lib/server/adminGuard.ts`                                        |
| CMMS/CRM adapters                   | `lib/integrations/` — implement `CmmsAdapter`/`CrmAdapter`, register in `lib/integrations/pipeline.ts` |
| Operational metrics                 | `lib/metrics/` — every metric is flagged DRAFT, validate against real portfolio data before trusting   |

## Access control

Four roles on `profiles.role`: `admin`, `regional`, `ownership`, `individual` — see
`supabase/migrations/*_rls_policies.sql` for exactly what each can read/write. Admins
invite/manage users from `/admin/users` (`app/api/admin/users/**`, using the Supabase
service-role key server-side — never exposed to the client). `proxy.ts` still optionally
restricts access by client IP first: set `IP_ALLOWLIST` (comma-separated) in `.env` to
allow only those IPs through; leave it unset to allow everyone. `GET /api/health` and
`/login` are always exempt from the auth gate.

## Dev workflow

```
npm run dev  →  http://localhost:3000
```

Requires a Supabase project for auth/persistence/admin/CMMS-CRM features:
`npx supabase start` for local Docker-backed Postgres/Auth, or a hosted project's
`SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` (+ `NEXT_PUBLIC_` client
variants) in `.env` — see `.env.example`. **Without either configured**, `proxy.ts` and
`lib/server/requireUser.ts` deliberately skip the auth gate rather than locking everyone
out, but every persisted feature (portfolios, buildings, admin console, autosaved
preferences, integrations) is then unauthenticated and empty — only the original
in-memory asset-capture/demo flow works. `ANTHROPIC_API_KEY` is separately optional —
only needed for the AI assessment step.

## Before committing

1. `npm run format` (or rely on pre-commit hook)
2. `npm run lint`
3. `npm run build` for non-trivial changes

Do **not** commit `.env`, `node_modules/`, or `.next/`. Never commit secret values.

API contract: `../Plan.md` §3.
