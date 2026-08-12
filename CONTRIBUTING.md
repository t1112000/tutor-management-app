# Contributing to MyClass

Thanks for helping improve this project. MyClass is a **single-tutor**, self-hosted app; keep changes focused and avoid multi-tenant scope creep unless discussed first.

## Development setup

1. Fork and clone the repo.
2. Copy env and install:

   ```bash
   cp .env.example .env
   yarn install
   ```

3. Run Postgres (Docker `db` service or your own), set `DATABASE_URL`, then:

   ```bash
   yarn db:migrate
   yarn set-password you@example.com 'password' 'Your Name'
   yarn dev
   ```

## Before you open a PR

Run the same checks as CI:

```bash
yarn typecheck
yarn lint
yarn test
yarn build
```

## Pull request guidelines

- Prefer small, reviewable PRs.
- Use [Conventional Commits](https://www.conventionalcommits.org/) when practical, e.g. `fix(bills): ...`, `docs: ...`, `chore: ...`.
- Do **not** commit `.env`, secrets, or database dumps under `backups/`.
- Match existing TypeScript / React / App Router patterns.
- For time and money: use `src/lib/time.ts` helpers; keep times as `HH:MM` strings where the product already does.
- For data access in API routes: use `requireUser()` and ownership helpers — never bare `findByPk` without ownership + soft-delete filters.
- Update docs when you change setup, env vars, or user-facing behavior.
- UI changes: screenshots or a short description of what to click through help a lot.

## Good first contributions

- Documentation fixes (README, comments that drift from code)
- Accessibility improvements
- Vietnamese/English copy consistency
- Extra unit tests for pure logic (`src/lib/*.ts`)
- Docker / DX polish that does not change product rules

## Reporting bugs

Use a GitHub issue with:

- Steps to reproduce
- Expected vs actual behavior
- Environment (Docker vs local, browser, OS)
- Whether the issue involves billing, calendar dates, or auth (timezone-sensitive areas need extra care)

Security issues: see [SECURITY.md](./SECURITY.md) — do not open a public issue for vulnerabilities.

## Code of conduct

By participating, you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
