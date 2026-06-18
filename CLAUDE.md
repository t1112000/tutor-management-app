# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (Next.js)
yarn build        # Production build
yarn lint         # ESLint

yarn db:migrate         # Run pending migrations
yarn db:migrate:undo    # Undo last migration
yarn set-password       # Set a user's password (interactive CLI script)
```

There are no automated tests in this project.

## Architecture

**MyClass** is a private tutoring management app built with Next.js 15 App Router. It is Vietnamese-language, single-user by design (a tutor manages their own students). The app requires `DATABASE_URL`, `AUTH_SECRET`, and VAPID keys for push notifications in `.env`.

### Auth

NextAuth v5 with credentials provider (email + bcrypt password). Auth lives in `auth.ts` (full config) and `auth.config.ts` (edge-safe subset used by middleware). Sessions are JWT-based. All API routes call `requireUser()` from `src/lib/auth-helpers.ts` which returns `{ user, response }` — check `response` before proceeding. Dashboard pages double-check auth via `await auth()` and redirect to `/signin`.

### Page pattern

Server Component pages in `src/app/(dashboard)/` do a minimal auth check, then render a `*Client` component (e.g. `StudentsPage` → `StudentsClient`). All data fetching and state lives in the Client components via `fetch()` calls to the API routes.

### Database

PostgreSQL via Sequelize (v6). Models are in `src/lib/db/models/`. The `src/lib/db/index.ts` initializes all models and associations on first import, guarded against HMR double-initialization. Migrations use `umzug` and live in `src/migrations/` — add new migration files with incrementing numeric prefix.

Data model:
- `User` owns `Student`s (via `createdBy` FK)
- `Student` → `StudentSchedule` (recurring weekly slots: `dayOfWeek`, `startTime`/`endTime` as `HH:MM` strings)
- `Student` → `Bill` → `BillSession` (generated sessions from `generateSessions()`)
- `Bill.status`: `"unpaid"` | `"paid"`

### Timezones

All date logic uses Vietnam time (`Asia/Ho_Chi_Minh`). Use helpers from `src/lib/time.ts` (`todayVN()`, `formatDateVN()`, `VN_DAY_NAMES`, etc.) rather than raw `Date` operations. Money is displayed via `formatMoneyVND()` from the same file.

### Cron / Push Notifications

`src/instrumentation.node.ts` starts a `node-cron` job at 07:00 VN time that calls `runDailyReminders()`. This runs inside the Next.js process — **the app must run as a single replica** to avoid duplicate reminders. Web push uses VAPID keys; the subscription is stored as JSONB on `User.pushSubscription`.

### UI

Radix UI primitives with Tailwind CSS and `shadcn/ui`-style components in `src/components/ui/`. Custom components: `TimePicker` (popover, `HH:MM` string), `DatePicker` (wraps `react-day-picker`). Toast notifications via `sonner`. Form validation with `react-hook-form` + `zod` schemas from `src/lib/validations.ts`.
