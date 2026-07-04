# Repository Guidelines

## Project Structure & Module Organization

`src/app/` holds Next.js routes and pages, including `(auth)` and `(dashboard)` route groups plus API routes in `src/app/api/`. UI components live in `src/components/`, shared helpers in `src/lib/`, and reusable hooks in `src/hooks/`. Database models are in `src/lib/db/models/`, with migrations in `src/migrations/`. Static or generated assets should stay near the feature that uses them.

## Build, Test, and Development Commands

- `yarn dev`: start the Next.js development server.
- `yarn build`: create a production build.
- `yarn lint`: run ESLint checks.
- `yarn db:migrate`: apply pending database migrations.
- `yarn db:migrate:undo`: roll back the last migration.
- `yarn set-password`: set a user password through the CLI.

There are no automated tests in this repository, so `yarn lint` and `yarn build` are the main validation steps before a change is shared.

## Coding Style & Naming Conventions

Use TypeScript, functional React components, and the existing Next.js App Router patterns. Keep files and directories descriptive and feature-based, such as `src/components/students/StudentsClient.tsx` or `src/app/(dashboard)/calendar/page.tsx`. Follow the repository’s ESLint rules and match the established formatting style in nearby code. Use `HH:MM` strings for time values and Vietnam time helpers from `src/lib/time.ts` instead of raw `Date` logic.

## Testing Guidelines

No test framework is configured. When changing behavior, verify the affected flow manually and run `yarn lint` plus `yarn build`. If you add tests later, place them near the feature or under a dedicated test directory and use clear names that describe the user-facing behavior.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commits with scopes, for example `feat(calendar): ...` and `fix(bills): ...`. Keep commit messages short, imperative, and scoped when useful. Pull requests should summarize the change, note any database or env updates, and include screenshots for UI changes when relevant.

## Security & Configuration Tips

Required environment values include `DATABASE_URL`, `AUTH_SECRET`, and VAPID keys for push notifications. The cron job in `src/instrumentation.node.ts` must run in a single replica to avoid duplicate reminders. Do not commit secrets or `.env` contents.
