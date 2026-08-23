# Reseller Inventory Module — Design Spec

**Date:** 2026-08-23
**Status:** Approved

---

## Overview

Sub-project 2 of the multi-tenant/reseller rollout (Sub-project 1: `docs/superpowers/specs/` — accountType, signup, nav — already shipped as v0.3.0). This adds the actual "Kho tài khoản" (account inventory) module for reseller accounts: a new `Account` model for subscription accounts being resold (Netflix, ChatGPT Plus), full CRUD, bulk paste-import, and a clipboard-copy action (single account or multiple selected) so the reseller can quickly hand credentials to a buyer.

The `/inventory` placeholder page from Sub-project 1 is replaced with the real module. `/customers` and `/orders` remain placeholders — Sub-project 3.

---

## Data Model

New model `Account` (`src/lib/db/models/Account.ts`), independent of `Student`/`Bill`:

```
id
createdBy      FK -> users.id, RESTRICT (same pattern as Student/Bill)
type           ENUM("netflix", "gpt_plus")
email          STRING, NOT NULL           -- the subscription account's login
passwordEncrypted       TEXT, NOT NULL     -- AES-256-GCM ciphertext, see Encryption
twoFactorSecretEncrypted TEXT, NULL        -- AES-256-GCM ciphertext, optional
expiryDate     DATEONLY, NOT NULL
quotaPercent   INTEGER, NULL              -- gpt_plus only; editable after creation, not set at import
status         ENUM("available", "sold"), default "available"
notes          TEXT, NULL
deletedAt      DATE, NULL                 -- soft delete, same pattern as Student/Bill
createdAt / updatedAt
```

Migration `src/migrations/0010-create-accounts.ts`: `createTable("accounts", ...)` + `addIndex("accounts", ["createdBy"])`, following `0001-init.ts`'s table-creation style.

`src/lib/db/index.ts`: init `Account`, associate `User.hasMany(Account, { foreignKey: "createdBy", as: "accounts" })` / `Account.belongsTo(User, ...)`.

`src/lib/auth-helpers.ts`: add `findOwnedAccount(userId, id, options)`, identical shape to `findOwnedStudent`/`findOwnedBill`.

---

## Encryption

Password and 2FA secret are sensitive real credentials for accounts actively being resold — encrypted at rest (this repo is public; the threat being mitigated is a DB dump/backup leak, not the shop owner's own access).

`src/lib/crypto.ts` — new module:
```ts
export function encrypt(plain: string): string   // AES-256-GCM, random 12-byte IV per call
export function decrypt(stored: string): string  // stored = "iv:authTag:ciphertext" (hex, ":"-joined)
```
Key comes from `process.env.CREDENTIALS_ENCRYPTION_KEY` (64 hex chars = 32 bytes), read fresh on each call (not cached at module load — matches `assertEnv()` being called from `instrumentation.register()`, not at import time).

`src/lib/env.ts`: add `CREDENTIALS_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/, "CREDENTIALS_ENCRYPTION_KEY phải là chuỗi hex 64 ký tự (32 byte)")` to `envSchema`.

`.env.example`: add `CREDENTIALS_ENCRYPTION_KEY=` with a comment: generate via `openssl rand -hex 32`. Server-only secret (not `NEXT_PUBLIC_*`) — no Dockerfile/build-arg changes needed, matches how `AUTH_SECRET` is already handled.

API responses decrypt server-side and expose plain `password`/`twoFactorSecret` field names to the client (this is a single-tenant-per-row, owner-only view — encryption protects the data at rest, not from the account's own owner). Internal `*Encrypted` column names never reach the client.

---

## Bulk Import

Paste format, one account per line: `email|password|2fa|YYYY-MM-DD` — 2FA left empty between pipes when absent (`user2@gmail.com|Pass456||2027-02-20`). Product type is chosen once for the whole paste (not per line) since a shop typically imports one product batch at a time.

Pure parser `src/lib/accountImport.ts`:
```ts
export interface ParsedAccountLine {
  email: string; password: string; twoFactorSecret: string | null; expiryDate: string;
}
export function parseAccountImportText(text: string):
  | { ok: true; accounts: ParsedAccountLine[] }
  | { ok: false; errors: string[] }  // one message per bad line, e.g. "Dòng 3: email không hợp lệ"
```
All-or-nothing: any invalid line rejects the whole import (returned as a list of per-line errors), nothing is created. Blank lines are skipped.

---

## Validation (`src/lib/validations.ts`)

```ts
export const accountSchema = z.object({
  type: z.enum(["netflix", "gpt_plus"]),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được trống"),
  twoFactorSecret: z.string().optional(),
  expiryDate: dateStr,
  quotaPercent: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const accountUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  twoFactorSecret: z.string().nullable().optional(),
  expiryDate: dateStr.optional(),
  quotaPercent: z.number().int().min(0).max(100).nullable().optional(),
  status: z.enum(["available", "sold"]).optional(),
  notes: z.string().nullable().optional(),
});

export const accountImportSchema = z.object({
  type: z.enum(["netflix", "gpt_plus"]),
  text: z.string().min(1, "Danh sách không được trống"),
});
```

---

## API (`src/app/api/accounts/`)

All routes: `requireUser()` first, then `findOwnedAccount()` for single-resource routes — same shape as `src/app/api/bills/`.

- **`GET /api/accounts?status=&type=`** — `status` defaults to `"available"` (`"all"` returns both); optional `type` filter. Scoped `createdBy: user.id, deletedAt: null`. Each item decrypted (password/twoFactorSecret included) — needed for the list's bulk-copy action.
- **`POST /api/accounts`** — `accountSchema`, encrypts password/2FA, `createdBy: user.id`.
- **`POST /api/accounts/import`** — `accountImportSchema`, runs `parseAccountImportText`; on parse errors returns 400 with the joined per-line messages; on success, encrypts each line and `bulkCreate`s inside a transaction (all rows get `status: "available"`, `quotaPercent: null`).
- **`GET /api/accounts/[id]`** — `findOwnedAccount`, decrypted.
- **`PATCH /api/accounts/[id]`** — `accountUpdateSchema`; re-encrypts `password`/`twoFactorSecret` only if present in the body.
- **`DELETE /api/accounts/[id]`** — soft delete (`deletedAt = new Date()`), same as `DELETE /api/bills/[id]`.

---

## Clipboard Copy

Pure formatter `src/lib/accountCopyText.ts` (reused later by Order in Sub-project 3, when an order's assigned account needs the same copy action):
```ts
export interface CopyableAccount {
  type: "netflix" | "gpt_plus"; email: string; password: string;
  twoFactorSecret: string | null; expiryDate: string;
}
export function buildAccountCopyText(accounts: CopyableAccount[]): string
```
Formats one or many accounts into a human-readable block (label lines: Email/Mật khẩu/2FA/Hạn dùng, `---` separator between accounts when more than one). Both call sites do `navigator.clipboard.writeText(buildAccountCopyText(...))` then `toast.success(...)` via the existing `sonner` usage.

---

## React Query Hooks

`src/hooks/queries/use-accounts.ts` (list) and `use-account.ts` (single), mirroring `use-students.ts`/`use-student.ts`:
```
useAccounts(status?, type?)   — GET /api/accounts
useAccount(id)                — GET /api/accounts/[id]
useCreateAccount()            — POST /api/accounts
useImportAccounts()           — POST /api/accounts/import
useUpdateAccount(id)          — PATCH /api/accounts/[id]
useDeleteAccount(id)          — DELETE /api/accounts/[id]
```
All mutations invalidate the accounts list query key on success; update/delete also invalidate the single-account key.

---

## UI

Replaces `src/app/(dashboard)/inventory/page.tsx`'s `<ComingSoon>` with `InventoryClient` (`src/components/inventory/InventoryClient.tsx`), following `StudentsClient`'s desktop-table/mobile-card split.

**List view:**
- Filter bar: status toggle (Còn hàng / Đã bán / Tất cả — defaults to "Còn hàng"), type filter (Tất cả / Netflix / GPT Plus).
- Row checkbox per account; a bulk-action bar appears once ≥1 is selected, with a "Copy đã chọn (N)" button (calls `buildAccountCopyText` + clipboard + toast).
- Columns/card fields: email, type badge, expiry date, quota% (gpt_plus rows only), status badge.
- "+ Thêm tài khoản" button opens a create form (type select, email, password, 2FA optional, expiry `DatePicker`, notes).
- "Import hàng loạt" button opens an import form: type select + textarea + format hint text; on submit, per-line errors (if any) render inline without closing the form.

**Detail page** `src/app/(dashboard)/inventory/[id]/page.tsx` + `AccountDetailClient`:
- Shows all fields; password/2FA masked by default with a "Hiện" toggle (plain show/hide, no extra fetch).
- "Copy" button (single-account `buildAccountCopyText`).
- "Chỉnh sửa" button → inline edit mode (same toggle pattern as `BillDetailClient`), "Lưu" calls `useUpdateAccount`.
- "Xoá" button → `AlertDialog` confirm → `useDeleteAccount`, then navigate back to `/inventory`.

---

## Testing

- `src/lib/accountImport.test.ts` — valid multi-line input, blank-line skipping, each bad-line-shape case (wrong field count, bad email, bad date, missing password), empty-2FA-between-pipes accepted as `null`.
- `src/lib/accountCopyText.test.ts` — single account, multiple accounts (separator present), 2FA `null` omitted from output.
- `src/lib/validations.test.ts` — add `describe` blocks for `accountSchema`, `accountUpdateSchema`, `accountImportSchema` (mirroring existing `billSchema`/`billUpdateSchema` tests).
- `src/lib/crypto.test.ts` — round-trip `encrypt`/`decrypt` returns the original string; set `process.env.CREDENTIALS_ENCRYPTION_KEY` to a fixed 64-hex-char test value at the top of the file (read fresh per call, no module-load caching to work around).

---

## File Checklist

| File | Change |
|------|--------|
| `src/migrations/0010-create-accounts.ts` | New — create `accounts` table |
| `src/lib/db/models/Account.ts` | New model |
| `src/lib/db/index.ts` | Init `Account`, add associations |
| `src/lib/auth-helpers.ts` | Add `findOwnedAccount` |
| `src/lib/crypto.ts` | New — `encrypt`/`decrypt` (AES-256-GCM) |
| `src/lib/env.ts` | Add `CREDENTIALS_ENCRYPTION_KEY` to `envSchema` |
| `.env.example` | Document `CREDENTIALS_ENCRYPTION_KEY` |
| `src/lib/accountImport.ts` | New — pure paste-format parser |
| `src/lib/accountCopyText.ts` | New — pure clipboard-text formatter |
| `src/lib/validations.ts` | Add `accountSchema`, `accountUpdateSchema`, `accountImportSchema` |
| `src/app/api/accounts/route.ts` | New — `GET` (list), `POST` (create) |
| `src/app/api/accounts/import/route.ts` | New — `POST` (bulk import) |
| `src/app/api/accounts/[id]/route.ts` | New — `GET`, `PATCH`, `DELETE` |
| `src/hooks/queries/use-accounts.ts` | New — list hook |
| `src/hooks/queries/use-account.ts` | New — single-account hook + mutations |
| `src/components/inventory/InventoryClient.tsx` | New — list, filters, bulk-copy, create/import forms |
| `src/components/inventory/AccountDetailClient.tsx` | New — detail/edit/copy/delete |
| `src/app/(dashboard)/inventory/page.tsx` | Replace `ComingSoon` with `InventoryClient` |
| `src/app/(dashboard)/inventory/[id]/page.tsx` | New — detail page |
| `src/lib/accountImport.test.ts` | New |
| `src/lib/accountCopyText.test.ts` | New |
| `src/lib/crypto.test.ts` | New |
| `src/lib/validations.test.ts` | Add new schema tests |
