# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (Next.js)
yarn build        # Production build
yarn lint         # ESLint (flat config in eslint.config.mjs)
yarn typecheck    # tsc --noEmit
yarn test         # Vitest

yarn db:migrate         # Run pending migrations
yarn db:migrate:undo    # Undo last migration
yarn set-password <email> <password> [name]   # Set a user's password (argv-based)
```

CI runs `typecheck → lint → test → build` before deploying (`.github/workflows/deploy.yml`).

Tests cover the pure logic only — `src/lib/time.ts`, `generateSessions.ts`, `report.ts`, and the zod
schemas in `validations.ts`. There is no component or route test harness.

## Architecture

**MyClass** is a private tutoring management app built with Next.js 15 App Router. It is Vietnamese-language, single-user by design (a tutor manages their own students). Required `.env` values are validated at boot by `src/lib/env.ts` (called from `instrumentation.ts`); see `.env.example`.

`NEXT_PUBLIC_*` variables are inlined at **build** time and `.env` is excluded from the Docker build context, so they are passed as build args in `docker-compose.yml` → `Dockerfile`. Adding a new one means editing all three places, or it silently ships as `undefined`.

### Auth

NextAuth v5 with credentials provider (email + bcrypt password). Auth lives in `auth.ts` (full config) and `auth.config.ts` (edge-safe subset used by middleware). Sessions are JWT-based. `src/middleware.ts` must stay under `src/` — Next.js ignores a root-level `middleware.ts` when the app lives in `src/app`. Its matcher excludes `/api` (those answer 401 JSON) and any path with a file extension (static assets and `/sw.js`).

Every API route starts with `requireUser()` from `src/lib/auth-helpers.ts`, then reaches data **only** through `findOwnedStudent()` / `findOwnedBill()` from the same file — never a bare `findByPk`. Both scope by `createdBy` and filter `deletedAt`. Mutating routes parse their body with `parseBody(req, schema)`, and every error response is `{ error: string }` via `jsonError()`.

### Page pattern

Server Component pages in `src/app/(dashboard)/` do a minimal auth check, then render a `*Client` component (e.g. `StudentsPage` → `StudentsClient`). Client components fetch **only** through the TanStack Query hooks in `src/hooks/queries/`, which go through `api()` in `src/lib/api-client.ts` — raw `fetch()` in a component skips cache invalidation and error unwrapping.

### Database

PostgreSQL via Sequelize (v6). Models are in `src/lib/db/models/`. The `src/lib/db/index.ts` initializes all models and associations on first import, guarded against HMR double-initialization. Migrations use `umzug` and live in `src/migrations/` — add new migration files with incrementing numeric prefix.

Data model:
- `User` owns `Student`s (via `createdBy` FK)
- `Student` → `StudentSchedule` (recurring weekly slots: `dayOfWeek`, `startTime`/`endTime` as `HH:MM` strings)
- `Student` → `Bill` → `BillSession` (generated sessions from `generateSessions()`)
- `Bill.status`: `"unpaid"` | `"paid"`

`Student` and `Bill` are soft-deleted (`deletedAt`) and neither model is `paranoid`, so **every** query must filter `deletedAt: null` itself — the ownership helpers do this for you.

Invoices are attributed to exactly one month (`billMonth()` in `src/lib/report.ts`: start date, else earliest session), so an invoice spanning two months is not counted twice. Monthly report: `GET /api/report?month=YYYY-MM`. All-time totals + bill list + chart series: `GET /api/report?scope=all` via `computeAllTimeReport()`. Report charts use pinned `@tanstack/charts` (client-only components under `src/components/report/charts/`).

### Timezones

All date logic uses Vietnam time (`Asia/Ho_Chi_Minh`). Use helpers from `src/lib/time.ts` (`todayVN()`, `hourVN()`, `weekStartStr()`, `formatDateVN()`, `VN_DAY_NAMES`, etc.) — on both server and client. `new Date().toISOString()` is UTC and resolves to *yesterday* between 00:00 and 07:00 Vietnam time. Money is displayed via `formatMoneyVND()` from the same file.

### Cron / Push Notifications

`src/instrumentation.node.ts` starts a `node-cron` job at 07:00 VN time that calls `runDailyReminders()`. This runs inside the Next.js process — **the app must run as a single replica** to avoid duplicate reminders (the sign-in rate limiter in `auth.ts` also assumes this). Web push uses VAPID keys; the subscription is stored as JSONB on `User.pushSubscription` and is cleared automatically when web-push returns 404/410.

`public/sw.js` handles push *and* offline caching, and is registered on every visit by `ServiceWorkerRegistrar` in the root layout. It must never cache `/api/` responses.

### UI

Radix UI primitives with Tailwind CSS and `shadcn/ui`-style components in `src/components/ui/`. Custom components: `TimePicker` (popover, `HH:MM` string), `DatePicker` (wraps `react-day-picker`). Toast notifications via `sonner`. Form validation with `react-hook-form` + `zod` schemas from `src/lib/validations.ts`.
