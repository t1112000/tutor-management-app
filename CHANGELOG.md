# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) where practical.

## [Unreleased]

## [0.5.0] - 2026-08-23

### Added

- Reseller customers ("Khách hàng"): name plus optional Facebook / Zalo / Discord / Telegram (one per type)
- Reseller orders ("Đơn hàng"): attach a customer and one or more inventory accounts, per-line price and warranty (KBH = no warranty, BHF = until first account expiry, or N days from create)
- Swap a dead account on a still-warranted line; previous accounts stay sold and are logged on the line
- Server `POST /api/accounts/copy-text` and `POST /api/orders/:id/copy-text` for clipboard blocks

### Changed

- `GET /api/accounts` no longer returns `password` / `twoFactorSecret` (use detail or copy-text)
- Inventory account status is read-only in the UI; sold/available is driven by orders

### Notes

- Third step of the multi-tenant/reseller rollout. Reseller `/report` remains the tutor report (deferred).

## [0.4.0] - 2026-08-23

### Added

- Reseller account inventory ("Kho tài khoản"): `Account` model for subscription accounts (Netflix, ChatGPT Plus) with AES-256-GCM-encrypted credentials
- Full CRUD for inventory accounts, plus bulk paste-import (`email|password|2fa|expiry` per line, all-or-nothing validation)
- Clipboard-copy action for a single account or multiple selected accounts, ready for reuse by the upcoming Order feature

### Upgrading

- New required env var: `CREDENTIALS_ENCRYPTION_KEY` (32-byte hex, used to encrypt reseller account credentials at rest). Existing deployments must add it to `.env` **before** restarting — the app now fails to boot without it (`assertEnv()` in `src/lib/env.ts`). Generate one with:

  ```bash
  openssl rand -hex 32
  ```

  Losing or changing this key after accounts have been created makes every stored credential permanently unrecoverable.

### Notes

- Second step of the multi-tenant/reseller rollout (after v0.3.0's accountType/signup foundation); Order/Customer (warranty tracking, KBH/BHF) completed in 0.5.0

## [0.3.0] - 2026-08-23

### Added

- Public sign-up (`/signup`, `POST /api/auth/signup`): email/password/name plus a permanent account-type choice (**Dạy học** / **Bán hàng**)
- `User.accountType` (`tutor` | `reseller`), defaulting existing accounts to `tutor`
- Account-type-aware navigation: reseller accounts see Kho tài khoản / Khách hàng / Đơn hàng in place of Học sinh / Lịch dạy (placeholder pages for now; full reseller workflow lands in a follow-up release)
- Route-level account-type guard enforced in middleware (`auth.config.ts`), so a tutor and a reseller account can never reach each other's pages

### Changed

- `auth.ts` no longer duplicates the `jwt`/`session` callbacks — they now live in the shared, edge-safe `auth.config.ts` so both the Node auth instance and the edge middleware instance stay in sync on session shape

### Notes

- First step of a larger multi-tenant rollout: a reseller module (subscription-account inventory, customers, warranty-tracked orders) is planned as follow-up work on top of this foundation

## [0.2.0] - 2026-08-12

### Added

- All-time income report (`scope=all`): grand totals (paid / unpaid / total), bill count, and full invoice list with links to bill detail
- Monthly series (`byMonth`) for charting and pure-function aggregation in `computeAllTimeReport`
- Report UI toggle **Theo tháng | Toàn bộ** on `/report`
- TanStack Charts (`@tanstack/charts@0.11.1`, pinned): paid vs unpaid bars, monthly revenue trend, top students chart
- Unit tests for all-time report logic

### Changed

- Report query keys include an explicit `month` segment; all-time uses `['report', 'all']` (still invalidated by existing `['report']` prefixes)

## [0.1.0] - 2026-07-26

Initial public baseline of **MyClass** (tutor-management-app):

### Features

- Student management with schedules and soft-delete
- Bills and bill sessions (create, pay/unpay, edit, soft-delete)
- Calendar session view and fixed weekly schedule view
- Monthly report with Vietnam-time invoice attribution
- Profile and notification settings; web push (VAPID)
- Credentials auth (email/password) with rate limiting
- Docker Compose (app + Postgres + nightly backups)
- CI: typecheck, lint, test, build; deploy workflow for production host

### Notes

- Single-tutor ownership model (`createdBy`)
- Daily reminder cron requires a single app replica

### OSS packaging (included from Unreleased prep)

- MIT license, CONTRIBUTING, SECURITY, Code of Conduct, issue/PR templates, accurate README
- OSS scorecard gap docs, release notes for `v0.1.0`, good-first-issue templates
