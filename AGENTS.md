<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zonelark — agent guide

**App:** Next.js 16, App Router, TypeScript, Tailwind v4. Hosted on Railway. Commands run from the repo root.

Postgres (Railway) and Auth.js (credentials + JWT) are the persistence and authentication stack. Do not reintroduce Supabase, SQLite, IP allowlists, or session-IP gates.

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
| `npm run db:generate`  | Generate a Drizzle migration from `lib/db/schema.ts`                    |
| `npm run db:migrate`   | Apply Drizzle migrations to `DATABASE_URL`                              |

## Repo layout

```
app/
  globals.css                        # theme tokens (light/dark/ops-dark) in @theme inline
  layout.tsx                         # root shell + Auth.js SessionProvider
  (auth)/login/page.tsx              # credentials sign-in
  (dashboard)/                       # route group — Home / Portfolio / Capture / Grid
    layout.tsx                       # DashboardProvider (shared useAssetSession/usePortfolio) + TopBar/TabBar
    page.tsx                         # Home — hero, KPI grid, twin modules
    portfolio/, capture/, grid/
  admin/                             # admin console UI (users, integrations)
  profile/page.tsx                   # profile (email, role, display name)
  api/
    auth/[...nextauth]/              # Auth.js handlers
    health/, assess/upload/, assess/manual/, job/[jobId]/, export/[jobId]/, import/xlsx/
    admin/users/, portfolios/, buildings/, profile/, integrations/, metrics/
proxy.ts                             # session gate (Next.js 16; replaces middleware.ts)
components/
  dashboard/                         # DashboardProvider, hero, KPI grid/tile, twin-module panels
  layout/   upload/   form/   assets/   ui/   auth/
hooks/
  useAssetSession.ts                 # assess / export / clear state
  usePortfolio.ts                    # portfolios + buildings via /api
  useServerHealth.ts                 # polls GET /api/health
  useImagePreprocess.ts              # canvas resize/contrast before upload
lib/
  schemas.ts, config.ts              # shared types + Uniformat/lifecycle registry
  formatters.ts                      # client-safe display helpers
  sampleAssets.ts                    # shared sample rows (demo + mock)
  workbook.ts                        # Excel builder (shared with mock script)
  portfolioMapper.ts                 # BuildingFormValues <-> row shape
  auth/                              # edge-safe Auth.js config, roles, password hashing, password min length
  db/                                # Drizzle client + schema
  integrations/                      # CmmsAdapter/CrmAdapter framework + mock adapter
  metrics/                           # draft operational metric indices — see header comments
  server/                            # server-only — never import from Client Components
    auth.ts                          # Auth.js (Node — credentials + Postgres)
    email.ts                         # isValidEmail
    enrichment.ts, llmPipeline.ts, spreadsheet.ts, jobStore.ts
    session.ts, persistAssessment.ts, portfolioAccess.ts
drizzle/                             # SQL migrations
scripts/mockData.ts                  # npm run mock
sample_outputs/Zonelark_SAMPLE.xlsx
```

## Architecture rules

1. **`lib/server/*`** — import `'server-only'` at top. Only used from `app/api/**/route.ts` and other server modules.
2. **Secrets** — `.env` only (never commit); never expose to the client.
3. **API paths** — client calls relative `/api/...` (same origin, no CORS).
4. **Persistence** — Railway Postgres via Drizzle (`lib/db`). Assess/export workbooks stay in the in-memory `jobStore` (single process) and asset rows persist when a `building_id` is sent. Do not add a local SQLite fallback.
5. **Auth** — Auth.js credentials provider. JWT session. `proxy.ts` redirects anonymous page requests to `/login` and returns 401 for anonymous API calls. `/login`, `/api/auth/*`, and `/api/health` are public. `/admin` and `/api/admin/*` require role `orgAdmin`. `isSiteAdmin` is a developer flag and is not used for those gates. Do not add an IP allowlist or a request-IP gate.
6. **Styling** — Tailwind v4 with CSS variables in `globals.css` (`light` / `dark` / `ops-dark` themes via `data-theme`); breakpoint `701px` for mobile/desktop layout; `.glass-card`/`.kpi-tile` utility classes for the ops-dark dashboard look.
7. **Icons** — `@tabler/icons-react` (not CDN webfont).
8. **Imports** — use `@/` path alias (`@/lib/schemas`, `@/components/...`).
9. **Shared dashboard state** — the four dashboard routes share one `useAssetSession()`/`usePortfolio()` instance via `DashboardProvider` (`components/dashboard/DashboardProvider.tsx`) at the `(dashboard)/layout.tsx` level. Don't call those hooks again inside an individual page — you'll get a disconnected copy of the state instead of the shared one.
10. **Edge vs Node** — `proxy.ts` may only import `lib/auth/config.ts` (JWT callbacks, no Postgres). Database access belongs in `lib/server/auth.ts` and other `lib/server/*` modules.

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
| Auth / session                      | `lib/server/auth.ts`, `lib/auth/config.ts`, `proxy.ts`, `lib/server/session.ts`                         |
| Database schema                     | `lib/db/schema.ts` then `npm run db:generate`                                                          |
| CMMS/CRM adapters                   | `lib/integrations/` — implement `CmmsAdapter`/`CrmAdapter`, register in `lib/integrations/pipeline.ts` |
| Operational metrics                 | `lib/metrics/` — every metric is flagged DRAFT, validate against real portfolio data before trusting   |

## Access control

- First sign-in against an empty `users` table creates an organization, an `orgAdmin`, and sets `isSiteAdmin` (developer) on that first user.
- Later accounts are created by an `orgAdmin` via `POST /api/admin/users` (email + password + role).
- Roles: `orgAdmin` | `regional` | `ownership` | `individual`.
- An `orgAdmin` cannot deactivate themselves.
- `GET /api/health` is public.

TODO: replace admin-chosen invite passwords with an email invite link. Admin enters email + role only. Server stores a pending invite (or user in a must-set-password state) and emails a one-time `/invite?token=…` link that expires. The recipient sets their own password; the token is burned. Do not put the password in the email. There is no mailer yet.

TODO: restore per-user UI preferences (`user_preferences` jsonb + `GET/PATCH /api/preferences` + autosave hook). Previous UI only saved `defaultTab` and nothing read it. Intended keys: theme, default landing tab, selected building, KPI order.

TODO: clean up `hooks/usePortfolio.ts`. It only uses the first portfolio from `GET /api/portfolios`, keeps the name in two pieces of state (`portfolio` and `name`), creates a portfolio as a side effect of typing a name or adding a building, PATCHes on every keystroke with no debounce, and applies optimistic building edits/deletes without reverting on failure. Load can also ignore a failed buildings fetch. Aim for one snapshot `{ portfolio, buildings }`, explicit create, and debounced saves.

TODO: take a serious look at refactoring `lib/server/jobStore.ts`. It is a process-local `Map` of Excel buffers + `AssetRecord[]` keyed by `jobId` (`GET /api/job/:id`, `GET /api/export/:id`). Restarts and extra Railway replicas lose jobs. Asset rows already persist to Postgres when a building is selected; the store is only the assess → review/download scratch pad. Revisit whether jobs belong in Postgres (or object storage), whether they should expire, and whether the `async` wrapper on a sync `Map` should stay.

## API contract

| Route                                   | Purpose                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `GET/POST /api/admin/users`             | List org users; create by email, password, and role                      |
| `GET/PATCH/DELETE /api/admin/users/:id` | Read / change role or display name / deactivate (not self)               |
| `GET/POST /api/portfolios`              | List org portfolios; create one                                          |
| `PATCH /api/portfolios/:id`             | Rename a portfolio                                                       |
| `GET/POST /api/buildings`               | List buildings (`?portfolio_id=`); create an empty building              |
| `PATCH/DELETE /api/buildings/:id`       | Update via `buildingFormToPayload` / delete                              |
| `GET/PATCH /api/profile`                | Current user email + profile; update display name                        |
| `GET/POST /api/integrations`            | List / create CMMS or CRM connections (`adapter_key` defaults to `mock`) |
| `POST /api/integrations/:id/sync`       | Run the adapter and persist normalized work orders / service requests    |
| `GET /api/integrations/last-synced`     | Latest `last_synced_at` for the TopBar badge (`null` if none)            |
| `GET /api/metrics`                      | Recent metric snapshots                                                  |
| `POST /api/metrics/compute`             | Recompute org metrics from assets via `lib/metrics/`                     |

Still live: `/api/health`, `/api/auth/*`, `/api/assess/upload`, `/api/assess/manual`, `/api/job/:id`, `/api/export/:id`, `/api/import/xlsx`.

Integrations and metrics routes are still stubs (empty collections or `501`) — they are not in the Postgres schema yet.

## Dev workflow

```
cp .env.example .env   # then fill DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run dev            # http://localhost:3000
```

`ANTHROPIC_API_KEY` is optional — only needed for the AI assessment step. Demo mode (no photo) and manual asset entry work without it.

## Before committing

1. `npm run format`
2. `npm run lint`
3. `npm run build` for non-trivial changes

Do **not** commit `.env`, `node_modules/`, or `.next/`. Never commit secret values.
