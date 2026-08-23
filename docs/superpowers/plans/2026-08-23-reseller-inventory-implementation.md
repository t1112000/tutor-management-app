# Reseller Inventory Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reseller "Kho tài khoản" (account inventory) module — a new `Account` model for subscription accounts (Netflix, ChatGPT Plus) with encrypted credentials, full CRUD, bulk paste-import, and clipboard-copy (single or multi-select), replacing the `/inventory` placeholder from Sub-project 1.

**Architecture:** New, independent `Account` Sequelize model (own migration, own ownership-scoped API routes under `/api/accounts`) — no changes to `Student`/`Bill`. Credentials (password, 2FA secret) are AES-256-GCM encrypted at rest and decrypted server-side on every read. Two pure, unit-tested modules carry the interesting logic: `accountImport.ts` (paste-format parser) and `accountCopyText.ts` (clipboard formatter, reused later by Order in Sub-project 3). UI follows the existing `StudentsClient`/`AddStudentDialog`/`BillDetailClient` patterns exactly (inline styles, shadcn `Dialog`/`AlertDialog`/`Checkbox`/`DatePicker`, `sonner` toasts, TanStack Query hooks through `api()`).

**Tech Stack:** Next.js 15 App Router, Sequelize v6 (Postgres), Zod, TanStack Query, shadcn/ui (Radix), Vitest, Node `crypto` (AES-256-GCM).

**Spec:** `docs/superpowers/specs/2026-08-23-reseller-inventory-design.md`

## Global Constraints

- Every API route starts with `requireUser()`, then reaches data only through an ownership-scoped helper (`findOwnedAccount`, mirroring `findOwnedStudent`/`findOwnedBill` in `src/lib/auth-helpers.ts`) — never a bare `findByPk`.
- Every mutating route parses its body with `parseBody(req, schema)`; every error response is `{ error: string }` via `jsonError()`.
- Soft delete only (`deletedAt`), never a hard `DELETE FROM` — matches `Student`/`Bill`.
- All dates are `YYYY-MM-DD` strings validated by the existing `dateStr` zod validator in `src/lib/validations.ts` — never construct `Date` objects for `expiryDate`.
- Migration files go in `src/migrations/`, numbered sequentially; next is `0010-create-accounts.ts` (last existing is `0008-soft-delete-students.ts`; `0009-add-user-account-type.ts` already exists from Sub-project 1).
- Client components fetch only through TanStack Query hooks in `src/hooks/queries/`, which go through `api()` in `src/lib/api-client.ts`.
- No component/route test harness exists in this repo — only pure logic is unit-tested (`src/lib/*.test.ts`). Verify API routes and UI manually (curl + dev server), not with new test infrastructure.
- Vietnamese UI copy throughout, matching existing tone (e.g. "Đang lưu...", "Đã thêm...", toasts via `sonner`).
- Colors/styling: `#E8788A`/`#F0A0B0` (primary gradient), `#FFF8FA` (input bg), `#F4D8DE` (border), `#2C1820` (text), `#6B4858` (label), `#A87888` (muted) — copied verbatim from `AddStudentDialog.tsx`/`StudentsClient.tsx`.

---

### Task 1: Credential encryption (`crypto.ts`) + env wiring

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `src/lib/crypto.test.ts`
- Modify: `src/lib/env.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing (leaf module)
- Produces: `encrypt(plain: string): string`, `decrypt(stored: string): string` — used by Task 6 (create), Task 8 (read/update) API routes.

- [ ] **Step 1: Write the failing test**

Create `src/lib/crypto.test.ts`:
```ts
import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  // Fixed 32-byte (64 hex char) test key — encrypt/decrypt read process.env fresh
  // on every call, so setting it here (before any import runs) is sufficient.
  process.env.CREDENTIALS_ENCRYPTION_KEY = "0".repeat(64);
});

describe("encrypt/decrypt", () => {
  it("round-trips a plain string", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const plain = "Sup3rSecret!123";
    const stored = encrypt(plain);
    expect(decrypt(stored)).toBe(plain);
  });

  it("produces a different ciphertext each call (random IV)", async () => {
    const { encrypt } = await import("./crypto");
    expect(encrypt("same input")).not.toBe(encrypt("same input"));
  });

  it("round-trips strings containing unicode", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const plain = "mật khẩu có dấu 🔒";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/lib/crypto.test.ts`
Expected: FAIL — `Failed to resolve import "./crypto"` (module doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/crypto.ts`:
```ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex) throw new Error("CREDENTIALS_ENCRYPTION_KEY is not set");
  return Buffer.from(hex, "hex");
}

/** Encrypts a plaintext string. Stored format: "iv:authTag:ciphertext", all hex. */
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

/** Reverses encrypt(). Throws if the stored value was tampered with (auth tag mismatch). */
export function decrypt(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return plain.toString("utf8");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/lib/crypto.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the required env var**

In `src/lib/env.ts`, add to `envSchema` (after `VAPID_EMAIL`):
```ts
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, "CREDENTIALS_ENCRYPTION_KEY phải là chuỗi hex 64 ký tự (32 byte)"),
```

In `.env.example`, add (near the other secrets):
```
# 32-byte hex key used to encrypt reseller account credentials at rest.
# Generate with: openssl rand -hex 32
CREDENTIALS_ENCRYPTION_KEY=
```

Then generate a real key for your local `.env` (not committed):
```bash
openssl rand -hex 32
```
Append the output as `CREDENTIALS_ENCRYPTION_KEY=<generated value>` to your local `.env`.

- [ ] **Step 6: Verify typecheck passes**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/crypto.ts src/lib/crypto.test.ts src/lib/env.ts .env.example
git commit -m "feat(inventory): add AES-256-GCM credential encryption"
```

---

### Task 2: `Account` model + migration + ownership helper

**Files:**
- Create: `src/migrations/0010-create-accounts.ts`
- Create: `src/lib/db/models/Account.ts`
- Modify: `src/lib/db/index.ts`
- Modify: `src/lib/auth-helpers.ts`

**Interfaces:**
- Consumes: `AccountType` pattern is unrelated to `User.AccountType` (Sub-project 1) — this task's `Account` is a different concept (an inventory row), name collision avoided by not exporting a type called `AccountType` here.
- Produces: `Account` model (exported from `src/lib/db/index.ts`) with fields `id, createdBy, type ("netflix"|"gpt_plus"), email, passwordEncrypted, twoFactorSecretEncrypted, expiryDate, quotaPercent, status ("available"|"sold"), notes, deletedAt, createdAt, updatedAt`. `findOwnedAccount(userId, id, options)` — used by Tasks 6-8.

- [ ] **Step 1: Write the migration**

Create `src/migrations/0010-create-accounts.ts`:
```ts
import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

/**
 * Inventory of subscription accounts (Netflix, ChatGPT Plus) a reseller
 * account is selling. Independent of Student/Bill — a different business
 * entirely, sharing only the createdBy ownership pattern.
 */
export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("accounts", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: {
      type: DataTypes.ENUM("netflix", "gpt_plus"),
      allowNull: false,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    passwordEncrypted: { type: DataTypes.TEXT, allowNull: false },
    twoFactorSecretEncrypted: { type: DataTypes.TEXT, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
    quotaPercent: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("available", "sold"),
      allowNull: false,
      defaultValue: "available",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.addIndex("accounts", ["createdBy"]);
  await qi.addIndex("accounts", ["status"]);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("accounts");
};
```

- [ ] **Step 2: Write the model**

Create `src/lib/db/models/Account.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { User } from "./User";

export type InventoryAccountType = "netflix" | "gpt_plus";
export type InventoryAccountStatus = "available" | "sold";

export class Account extends Model<
  InferAttributes<Account>,
  InferCreationAttributes<Account>
> {
  declare id: CreationOptional<number>;
  declare type: InventoryAccountType;
  declare email: string;
  declare passwordEncrypted: string;
  declare twoFactorSecretEncrypted: string | null;
  declare expiryDate: string; // DATEONLY
  declare quotaPercent: number | null;
  declare status: CreationOptional<InventoryAccountStatus>;
  declare notes: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare creator?: NonAttribute<User>;
}

export function initAccount(sequelize: Sequelize) {
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      type: { type: DataTypes.ENUM("netflix", "gpt_plus"), allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      passwordEncrypted: { type: DataTypes.TEXT, allowNull: false },
      twoFactorSecretEncrypted: { type: DataTypes.TEXT, allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
      quotaPercent: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM("available", "sold"),
        allowNull: false,
        defaultValue: "available",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "accounts" }
  );
}
```

- [ ] **Step 3: Wire into `src/lib/db/index.ts`**

Modify `src/lib/db/index.ts` — add the import, init call, association, and export:
```ts
import { sequelize } from "./sequelize";
import { User, initUser } from "./models/User";
import { Student, initStudent } from "./models/Student";
import { StudentSchedule, initStudentSchedule } from "./models/StudentSchedule";
import { Bill, initBill } from "./models/Bill";
import { BillSession, initBillSession } from "./models/BillSession";
import { Account, initAccount } from "./models/Account";

if (!(User as any).sequelize) {
  initUser(sequelize);
  initStudent(sequelize);
  initStudentSchedule(sequelize);
  initBill(sequelize);
  initBillSession(sequelize);
  initAccount(sequelize);

  try {
    User.hasMany(Student, { foreignKey: "createdBy", as: "students" });
    Student.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    Student.hasMany(StudentSchedule, { foreignKey: "studentId", as: "schedules" });
    StudentSchedule.belongsTo(Student, { foreignKey: "studentId", as: "student" });

    Student.hasMany(Bill, { foreignKey: "studentId", as: "bills" });
    Bill.belongsTo(Student, { foreignKey: "studentId", as: "student" });
    Bill.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    Bill.hasMany(BillSession, { foreignKey: "billId", as: "sessions" });
    BillSession.belongsTo(Bill, { foreignKey: "billId", as: "bill" });

    User.hasMany(Account, { foreignKey: "createdBy", as: "accounts" });
    Account.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
  } catch {
    // already associated (HMR reload) — safe to ignore
  }
}

export { sequelize, User, Student, StudentSchedule, Bill, BillSession, Account };
```

- [ ] **Step 4: Add `findOwnedAccount` to `src/lib/auth-helpers.ts`**

Modify the import line and add the helper (after `findOwnedBill`):
```ts
import { Bill, Student, Account } from "@/lib/db/index";
```
```ts
export async function findOwnedAccount(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const accountId = asId(id);
  if (accountId === null) return null;
  return Account.findOne({
    ...rest,
    where: {
      id: accountId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}
```

- [ ] **Step 5: Run the migration and verify the table exists**

Run: `yarn db:migrate`
Expected output includes:
```
{ event: 'migrating', name: '0010-create-accounts.ts' }
{ event: 'migrated', name: '0010-create-accounts.ts', ... }
```

Verify:
```bash
psql "$DATABASE_URL" -c "\d accounts"
```
Expected: table description listing all 13 columns (`id, type, email, passwordEncrypted, twoFactorSecretEncrypted, expiryDate, quotaPercent, status, notes, createdBy, createdAt, updatedAt, deletedAt`).

- [ ] **Step 6: Verify typecheck passes**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/migrations/0010-create-accounts.ts src/lib/db/models/Account.ts src/lib/db/index.ts src/lib/auth-helpers.ts
git commit -m "feat(inventory): add Account model, migration, and ownership helper"
```

---

### Task 3: Pure bulk-import parser (`accountImport.ts`)

**Files:**
- Create: `src/lib/accountImport.ts`
- Create: `src/lib/accountImport.test.ts`

**Interfaces:**
- Consumes: `dateStr` from `src/lib/validations.ts` (already exists)
- Produces: `parseAccountImportText(text: string): { ok: true; accounts: ParsedAccountLine[] } | { ok: false; errors: string[] }`, `interface ParsedAccountLine { email: string; password: string; twoFactorSecret: string | null; expiryDate: string }` — used by Task 7 (import API route).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/accountImport.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseAccountImportText } from "./accountImport";

describe("parseAccountImportText", () => {
  it("parses valid multi-line input", () => {
    const text = [
      "user1@gmail.com|Pass123|ABCD1234|2027-01-15",
      "user2@gmail.com|Pass456||2027-02-20",
    ].join("\n");
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.accounts).toEqual([
      { email: "user1@gmail.com", password: "Pass123", twoFactorSecret: "ABCD1234", expiryDate: "2027-01-15" },
      { email: "user2@gmail.com", password: "Pass456", twoFactorSecret: null, expiryDate: "2027-02-20" },
    ]);
  });

  it("skips blank lines", () => {
    const text = "user1@gmail.com|Pass123|ABCD1234|2027-01-15\n\n\n";
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.accounts).toHaveLength(1);
  });

  it("rejects a line with the wrong number of fields", () => {
    const result = parseAccountImportText("user1@gmail.com|Pass123|2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("Dòng 1");
  });

  it("rejects an invalid email", () => {
    const result = parseAccountImportText("not-an-email|Pass123||2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("email không hợp lệ");
  });

  it("rejects a missing password", () => {
    const result = parseAccountImportText("user1@gmail.com||ABCD1234|2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("thiếu mật khẩu");
  });

  it("rejects an invalid expiry date", () => {
    const result = parseAccountImportText("user1@gmail.com|Pass123||2027-13-99");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("ngày hết hạn không hợp lệ");
  });

  it("reports every bad line, not just the first", () => {
    const text = [
      "not-an-email|Pass123||2027-01-15",
      "user2@gmail.com||ABCD1234|2027-01-15",
    ].join("\n");
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Dòng 1");
    expect(result.errors[1]).toContain("Dòng 2");
  });

  it("rejects empty input", () => {
    const result = parseAccountImportText("   \n  \n");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/lib/accountImport.test.ts`
Expected: FAIL — `Failed to resolve import "./accountImport"`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/accountImport.ts`:
```ts
import { z } from "zod";
import { dateStr } from "./validations";

export interface ParsedAccountLine {
  email: string;
  password: string;
  twoFactorSecret: string | null;
  expiryDate: string;
}

export type ParseAccountImportResult =
  | { ok: true; accounts: ParsedAccountLine[] }
  | { ok: false; errors: string[] };

const emailField = z.string().email();

export function parseAccountImportText(text: string): ParseAccountImportResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, errors: ["Danh sách không được trống"] };

  const errors: string[] = [];
  const accounts: ParsedAccountLine[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const parts = line.split("|");
    if (parts.length !== 4) {
      errors.push(`Dòng ${lineNumber}: phải có đúng 4 phần cách nhau bởi "|" (email|password|2fa|ngày hết hạn)`);
      return;
    }

    const [email, password, twoFactorSecretRaw, expiryDate] = parts.map((p) => p.trim());
    const lineErrors: string[] = [];
    if (!emailField.safeParse(email).success) lineErrors.push("email không hợp lệ");
    if (!password) lineErrors.push("thiếu mật khẩu");
    if (!dateStr.safeParse(expiryDate).success) lineErrors.push("ngày hết hạn không hợp lệ (YYYY-MM-DD)");

    if (lineErrors.length > 0) {
      errors.push(`Dòng ${lineNumber}: ${lineErrors.join(", ")}`);
      return;
    }

    accounts.push({
      email,
      password,
      twoFactorSecret: twoFactorSecretRaw || null,
      expiryDate,
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, accounts };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/lib/accountImport.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/accountImport.ts src/lib/accountImport.test.ts
git commit -m "feat(inventory): add bulk-import paste-format parser"
```

---

### Task 4: Pure clipboard formatter (`accountCopyText.ts`)

**Files:**
- Create: `src/lib/accountCopyText.ts`
- Create: `src/lib/accountCopyText.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `buildAccountCopyText(accounts: CopyableAccount[]): string`, `interface CopyableAccount { type: "netflix" | "gpt_plus"; email: string; password: string; twoFactorSecret: string | null; expiryDate: string }` — used by Task 10 (list bulk-copy) and Task 12 (detail single-copy). Also intended for reuse by Order in Sub-project 3.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/accountCopyText.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildAccountCopyText } from "./accountCopyText";

describe("buildAccountCopyText", () => {
  it("formats a single account with 2FA", () => {
    const text = buildAccountCopyText([
      { type: "netflix", email: "user1@gmail.com", password: "Pass123", twoFactorSecret: "ABCD1234", expiryDate: "2027-01-15" },
    ]);
    expect(text).toBe(
      "Email: user1@gmail.com\nMật khẩu: Pass123\n2FA: ABCD1234\nHạn dùng: 2027-01-15"
    );
  });

  it("omits the 2FA line when null", () => {
    const text = buildAccountCopyText([
      { type: "gpt_plus", email: "user2@gmail.com", password: "Pass456", twoFactorSecret: null, expiryDate: "2027-02-20" },
    ]);
    expect(text).toBe("Email: user2@gmail.com\nMật khẩu: Pass456\nHạn dùng: 2027-02-20");
  });

  it("joins multiple accounts with a separator", () => {
    const text = buildAccountCopyText([
      { type: "netflix", email: "a@gmail.com", password: "p1", twoFactorSecret: null, expiryDate: "2027-01-01" },
      { type: "netflix", email: "b@gmail.com", password: "p2", twoFactorSecret: null, expiryDate: "2027-02-01" },
    ]);
    expect(text).toBe(
      "Email: a@gmail.com\nMật khẩu: p1\nHạn dùng: 2027-01-01\n---\nEmail: b@gmail.com\nMật khẩu: p2\nHạn dùng: 2027-02-01"
    );
  });

  it("returns an empty string for an empty list", () => {
    expect(buildAccountCopyText([])).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/lib/accountCopyText.test.ts`
Expected: FAIL — `Failed to resolve import "./accountCopyText"`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/accountCopyText.ts`:
```ts
export interface CopyableAccount {
  type: "netflix" | "gpt_plus";
  email: string;
  password: string;
  twoFactorSecret: string | null;
  expiryDate: string;
}

function formatOne(account: CopyableAccount): string {
  const lines = [
    `Email: ${account.email}`,
    `Mật khẩu: ${account.password}`,
  ];
  if (account.twoFactorSecret) lines.push(`2FA: ${account.twoFactorSecret}`);
  lines.push(`Hạn dùng: ${account.expiryDate}`);
  return lines.join("\n");
}

export function buildAccountCopyText(accounts: CopyableAccount[]): string {
  return accounts.map(formatOne).join("\n---\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/lib/accountCopyText.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/accountCopyText.ts src/lib/accountCopyText.test.ts
git commit -m "feat(inventory): add clipboard-copy text formatter"
```

---

### Task 5: Validation schemas

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/lib/validations.test.ts`

**Interfaces:**
- Consumes: `dateStr` (existing, same file)
- Produces: `accountSchema`, `accountUpdateSchema`, `accountImportSchema` (zod) — used by Tasks 6-7 (API routes).

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/validations.test.ts` (add `accountSchema, accountUpdateSchema, accountImportSchema` to the existing import block at the top, then add these `describe` blocks near the other schema tests):
```ts
describe("accountSchema", () => {
  const valid = {
    type: "netflix" as const,
    email: "user@gmail.com",
    password: "Pass123",
    expiryDate: "2027-01-15",
  };

  it("accepts a minimal valid netflix account", () => {
    expect(accountSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a gpt_plus account with quotaPercent and 2FA", () => {
    const gpt = { ...valid, type: "gpt_plus" as const, twoFactorSecret: "ABCD1234", quotaPercent: 80 };
    expect(accountSchema.safeParse(gpt).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(accountSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(accountSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
  });

  it("rejects quotaPercent outside 0-100", () => {
    expect(accountSchema.safeParse({ ...valid, quotaPercent: 150 }).success).toBe(false);
    expect(accountSchema.safeParse({ ...valid, quotaPercent: -1 }).success).toBe(false);
  });

  it("rejects a type outside the fixed set", () => {
    expect(accountSchema.safeParse({ ...valid, type: "hulu" }).success).toBe(false);
  });
});

describe("accountUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(accountUpdateSchema.safeParse({ status: "sold" }).success).toBe(true);
  });

  it("accepts clearing twoFactorSecret with null", () => {
    expect(accountUpdateSchema.safeParse({ twoFactorSecret: null }).success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    expect(accountUpdateSchema.safeParse({ status: "reserved" }).success).toBe(false);
  });
});

describe("accountImportSchema", () => {
  it("accepts a type and non-empty text", () => {
    expect(accountImportSchema.safeParse({ type: "netflix", text: "a@b.com|p|2fa|2027-01-01" }).success).toBe(true);
  });

  it("rejects empty text", () => {
    expect(accountImportSchema.safeParse({ type: "netflix", text: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/lib/validations.test.ts`
Expected: FAIL — `accountSchema is not defined` (and similarly for the other two)

- [ ] **Step 3: Add the schemas**

In `src/lib/validations.ts`, add (near `billSchema`, before `pushSubscriptionSchema`):
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
  email: z.string().email("Email không hợp lệ").optional(),
  password: z.string().min(1, "Mật khẩu không được trống").optional(),
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/lib/validations.test.ts`
Expected: PASS (all tests, including the new ones)

- [ ] **Step 5: Run the full test suite**

Run: `yarn test`
Expected: all test files pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/validations.ts src/lib/validations.test.ts
git commit -m "feat(inventory): add account validation schemas"
```

---

### Task 6: API routes — list + create (`/api/accounts`)

**Files:**
- Create: `src/app/api/accounts/route.ts`

**Interfaces:**
- Consumes: `requireUser`, `parseBody`, `jsonError` (`src/lib/auth-helpers.ts`); `Account` (`src/lib/db/index.ts`); `accountSchema` (`src/lib/validations.ts`); `encrypt`, `decrypt` (`src/lib/crypto.ts`)
- Produces: `GET /api/accounts?status=&type=` → `AccountResponse[]`; `POST /api/accounts` → `AccountResponse` (201). `AccountResponse` shape consumed by Task 9's hooks: `{ id, type, email, password, twoFactorSecret, expiryDate, quotaPercent, status, notes, createdAt }`.

- [ ] **Step 1: Write the route**

Create `src/app/api/accounts/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { Account } from "@/lib/db/index";
import { accountSchema } from "@/lib/validations";
import { encrypt, decrypt } from "@/lib/crypto";
import type { WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toResponse(account: Account) {
  return {
    id: account.id,
    type: account.type,
    email: account.email,
    password: decrypt(account.passwordEncrypted),
    twoFactorSecret: account.twoFactorSecretEncrypted ? decrypt(account.twoFactorSecretEncrypted) : null,
    expiryDate: account.expiryDate,
    quotaPercent: account.quotaPercent,
    status: account.status,
    notes: account.notes,
    createdAt: account.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const status = req.nextUrl.searchParams.get("status") ?? "available";
  const type = req.nextUrl.searchParams.get("type");

  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    ...(status !== "all" ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const accounts = await Account.findAll({ where, order: [["createdAt", "DESC"]] });
  return NextResponse.json(accounts.map(toResponse));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, accountSchema);
  if (badBody) return badBody;

  const account = await Account.create({
    type: value.type,
    email: value.email,
    passwordEncrypted: encrypt(value.password),
    twoFactorSecretEncrypted: value.twoFactorSecret ? encrypt(value.twoFactorSecret) : null,
    expiryDate: value.expiryDate,
    quotaPercent: value.quotaPercent ?? null,
    notes: value.notes ?? null,
    createdBy: user.id,
  });

  return NextResponse.json(toResponse(account), { status: 201 });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 3: Manually verify via curl**

Start the dev server (`yarn dev`), sign in as a reseller test account (reuse the curl-based signin flow: `POST /api/auth/csrf` → `POST /api/auth/callback/credentials`), then:
```bash
curl -s -i -b cookies.txt -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"type":"netflix","email":"test@gmail.com","password":"Pass123","expiryDate":"2027-01-15"}'
```
Expected: `201`, body includes `"password":"Pass123"` (decrypted back out correctly) and no `passwordEncrypted` field.

```bash
curl -s -b cookies.txt "http://localhost:3000/api/accounts?status=all"
```
Expected: `200`, array containing the created account.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/accounts/route.ts
git commit -m "feat(inventory): add GET/POST /api/accounts"
```

---

### Task 7: API route — bulk import (`/api/accounts/import`)

**Files:**
- Create: `src/app/api/accounts/import/route.ts`

**Interfaces:**
- Consumes: `requireUser`, `parseBody`, `jsonError`; `Account`, `sequelize` (`src/lib/db/index.ts`); `accountImportSchema`; `parseAccountImportText` (`src/lib/accountImport.ts`); `encrypt`
- Produces: `POST /api/accounts/import` → `{ created: number }` (201) on success, `{ error: string }` (400) listing every bad line on failure.

- [ ] **Step 1: Write the route**

Create `src/app/api/accounts/import/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError } from "@/lib/auth-helpers";
import { Account, sequelize } from "@/lib/db/index";
import { accountImportSchema } from "@/lib/validations";
import { parseAccountImportText } from "@/lib/accountImport";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, accountImportSchema);
  if (badBody) return badBody;

  const parsed = parseAccountImportText(value.text);
  if (!parsed.ok) return jsonError(400, parsed.errors.join("; "));

  await sequelize.transaction(async (t) => {
    await Account.bulkCreate(
      parsed.accounts.map((line) => ({
        type: value.type,
        email: line.email,
        passwordEncrypted: encrypt(line.password),
        twoFactorSecretEncrypted: line.twoFactorSecret ? encrypt(line.twoFactorSecret) : null,
        expiryDate: line.expiryDate,
        quotaPercent: null,
        status: "available" as const,
        notes: null,
        createdBy: user.id,
      })),
      { transaction: t }
    );
  });

  return NextResponse.json({ created: parsed.accounts.length }, { status: 201 });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 3: Manually verify via curl**

```bash
curl -s -i -b cookies.txt -X POST http://localhost:3000/api/accounts/import \
  -H "Content-Type: application/json" \
  -d '{"type":"gpt_plus","text":"a@gmail.com|Pass1|ABCD|2027-03-01\nb@gmail.com|Pass2||2027-04-01"}'
```
Expected: `201`, `{"created":2}`.

```bash
curl -s -i -b cookies.txt -X POST http://localhost:3000/api/accounts/import \
  -H "Content-Type: application/json" \
  -d '{"type":"netflix","text":"bad-line-only-two-fields|x"}'
```
Expected: `400`, `{"error":"Dòng 1: ..."}`.

Then confirm the bad import created nothing:
```bash
curl -s -b cookies.txt "http://localhost:3000/api/accounts?status=all" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
```
Expected: still `2` (only the successful import's rows), not 3.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/accounts/import/route.ts
git commit -m "feat(inventory): add bulk-import API route"
```

---

### Task 8: API routes — detail, update, soft-delete (`/api/accounts/[id]`)

**Files:**
- Create: `src/app/api/accounts/[id]/route.ts`

**Interfaces:**
- Consumes: `requireUser`, `parseBody`, `findOwnedAccount` (Task 2); `accountUpdateSchema`; `encrypt`, `decrypt`
- Produces: `GET/PATCH /api/accounts/[id]` → `AccountResponse` (same shape as Task 6); `DELETE /api/accounts/[id]` → `{ ok: true }`.

- [ ] **Step 1: Write the route**

Create `src/app/api/accounts/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, findOwnedAccount, jsonError } from "@/lib/auth-helpers";
import { accountUpdateSchema } from "@/lib/validations";
import { encrypt, decrypt } from "@/lib/crypto";
import type { Account } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toResponse(account: Account) {
  return {
    id: account.id,
    type: account.type,
    email: account.email,
    password: decrypt(account.passwordEncrypted),
    twoFactorSecret: account.twoFactorSecretEncrypted ? decrypt(account.twoFactorSecretEncrypted) : null,
    expiryDate: account.expiryDate,
    quotaPercent: account.quotaPercent,
    status: account.status,
    notes: account.notes,
    createdAt: account.createdAt,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  return NextResponse.json(toResponse(account));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  const { value, response: badBody } = await parseBody(req, accountUpdateSchema);
  if (badBody) return badBody;

  if (value.email !== undefined) account.email = value.email;
  if (value.password !== undefined) account.passwordEncrypted = encrypt(value.password);
  if (value.twoFactorSecret !== undefined) {
    account.twoFactorSecretEncrypted = value.twoFactorSecret ? encrypt(value.twoFactorSecret) : null;
  }
  if (value.expiryDate !== undefined) account.expiryDate = value.expiryDate;
  if (value.quotaPercent !== undefined) account.quotaPercent = value.quotaPercent;
  if (value.status !== undefined) account.status = value.status;
  if (value.notes !== undefined) account.notes = value.notes;

  await account.save();
  return NextResponse.json(toResponse(account));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  account.deletedAt = new Date();
  await account.save();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 3: Manually verify via curl**

Using an account id created in Task 6/7 (say `1`):
```bash
curl -s -b cookies.txt http://localhost:3000/api/accounts/1
curl -s -i -b cookies.txt -X PATCH http://localhost:3000/api/accounts/1 -H "Content-Type: application/json" -d '{"status":"sold"}'
curl -s -b cookies.txt "http://localhost:3000/api/accounts?status=available" # the now-sold account should be absent
curl -s -i -b cookies.txt -X DELETE http://localhost:3000/api/accounts/1
curl -s -i -b cookies.txt http://localhost:3000/api/accounts/1 # expect 404 after soft-delete
```
Expected: each matches the comment above it.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/accounts/[id]/route.ts"
git commit -m "feat(inventory): add GET/PATCH/DELETE /api/accounts/[id]"
```

---

### Task 9: React Query hooks

**Files:**
- Create: `src/hooks/queries/use-accounts.ts`
- Create: `src/hooks/queries/use-account.ts`
- Modify: `src/lib/query-keys.ts`

**Interfaces:**
- Consumes: `api()` (`src/lib/api-client.ts`), `keys` (`src/lib/query-keys.ts`)
- Produces: `useAccounts(status?, type?)`, `useAccount(id)`, `useCreateAccount()`, `useImportAccounts()`, `useUpdateAccount(id)`, `useDeleteAccount(id)`, plus the `InventoryAccount` type — used by Tasks 10-12 (UI).

- [ ] **Step 1: Add query keys**

In `src/lib/query-keys.ts`, add an `accounts` entry to the `keys` object:
```ts
  accounts: {
    all:    ()           => ['accounts'] as const,
    list:   (status = 'available', type = '') => ['accounts', 'list', status, type] as const,
    detail: (id: number) => ['accounts', id] as const,
  },
```

- [ ] **Step 2: Write the list hook + mutations**

Create `src/hooks/queries/use-accounts.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export interface InventoryAccount {
  id: number
  type: 'netflix' | 'gpt_plus'
  email: string
  password: string
  twoFactorSecret: string | null
  expiryDate: string
  quotaPercent: number | null
  status: 'available' | 'sold'
  notes: string | null
  createdAt: string
}

export interface CreateAccountInput {
  type: 'netflix' | 'gpt_plus'
  email: string
  password: string
  twoFactorSecret?: string
  expiryDate: string
  quotaPercent?: number
  notes?: string
}

export interface ImportAccountsInput {
  type: 'netflix' | 'gpt_plus'
  text: string
}

export function useAccounts(status = 'available', type = '') {
  return useQuery({
    queryKey: keys.accounts.list(status, type),
    queryFn: () => {
      const params = new URLSearchParams({ status, ...(type ? { type } : {}) })
      return api<InventoryAccount[]>(`/api/accounts?${params.toString()}`)
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAccountInput) =>
      api<InventoryAccount>('/api/accounts', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}

export function useImportAccounts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ImportAccountsInput) =>
      api<{ created: number }>('/api/accounts/import', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}
```

- [ ] **Step 3: Write the single-account hook + mutations**

Create `src/hooks/queries/use-account.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'
import type { InventoryAccount } from './use-accounts'

export interface UpdateAccountInput {
  email?: string
  password?: string
  twoFactorSecret?: string | null
  expiryDate?: string
  quotaPercent?: number | null
  status?: 'available' | 'sold'
  notes?: string | null
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: keys.accounts.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<InventoryAccount>(`/api/accounts/${id}`),
  })
}

export function useUpdateAccount(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAccountInput) =>
      api<InventoryAccount>(`/api/accounts/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts.detail(id) })
      qc.invalidateQueries({ queryKey: keys.accounts.all() })
    },
  })
}

export function useDeleteAccount(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}
```

- [ ] **Step 4: Verify typecheck and lint pass**

Run: `yarn typecheck && yarn lint`
Expected: no errors (pre-existing warnings elsewhere are fine)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/use-accounts.ts src/hooks/queries/use-account.ts src/lib/query-keys.ts
git commit -m "feat(inventory): add accounts React Query hooks"
```

---

### Task 10: `InventoryClient` — list, filters, bulk-select + copy

**Files:**
- Create: `src/components/inventory/InventoryClient.tsx`
- Modify: `src/app/(dashboard)/inventory/page.tsx`

**Interfaces:**
- Consumes: `useAccounts` (Task 9), `buildAccountCopyText` (Task 4), `Checkbox`, `QueryErrorState`, `useIsMobile`
- Produces: renders the inventory list; leaves two `TODO`-free hooks for Task 11 to fill in (`showAdd`/`showImport` state + a spot to mount the dialogs) — Task 11 modifies this file to wire in `AddAccountDialog`/`ImportAccountsDialog` rather than introducing a new file boundary, since the list and its own "add" trigger are one reviewable unit together with the forms it opens.

- [ ] **Step 1: Write the component**

Create `src/components/inventory/InventoryClient.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { QueryErrorState } from "@/components/ui/query-error";
import useIsMobile from "@/hooks/use-is-mobile";
import { useAccounts, type InventoryAccount } from "@/hooks/queries/use-accounts";
import { buildAccountCopyText } from "@/lib/accountCopyText";

const TYPE_LABELS: Record<InventoryAccount["type"], string> = {
  netflix: "Netflix",
  gpt_plus: "GPT Plus",
};

const STATUS_LABELS: Record<InventoryAccount["status"], string> = {
  available: "Còn hàng",
  sold: "Đã bán",
};

function TypeBadge({ type }: { type: InventoryAccount["type"] }) {
  const color = type === "netflix" ? "#E11D48" : "#16A34A";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function StatusBadge({ status }: { status: InventoryAccount["status"] }) {
  const color = status === "available" ? "#2E7D32" : "#A87888";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function InventoryClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<"available" | "sold" | "all">("available");
  const [type, setType] = useState<"" | "netflix" | "gpt_plus">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: accounts = [], isLoading: loading, isError, refetch } = useAccounts(status, type);

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function copySelected() {
    const chosen = accounts.filter((a) => selected.has(a.id));
    if (chosen.length === 0) return;
    await navigator.clipboard.writeText(buildAccountCopyText(chosen));
    toast.success(`Đã copy ${chosen.length} tài khoản`);
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", margin: 0 }}>Kho tài khoản</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            Import hàng loạt
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            + Thêm tài khoản
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {(["available", "sold", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", cursor: "pointer",
                ...(status === s
                  ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                  : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
              }}
            >
              {s === "available" ? "Còn hàng" : s === "sold" ? "Đã bán" : "Tất cả"}
            </button>
          ))}
          <span style={{ width: "1px", background: "#F4D8DE", margin: "0 4px" }} />
          {(["", "netflix", "gpt_plus"] as const).map((t) => (
            <button
              key={t || "all-types"}
              onClick={() => setType(t)}
              style={{
                padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", cursor: "pointer",
                ...(type === t
                  ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                  : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
              }}
            >
              {t === "" ? "Tất cả loại" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "10px 16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#6B4858" }}>Đã chọn {selected.size} tài khoản</span>
            <button
              onClick={copySelected}
              style={{ background: "#E8788A", color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              Copy đã chọn ({selected.size})
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
        ) : isError ? (
          <QueryErrorState message="Không tải được kho tài khoản" onRetry={() => refetch()} compact />
        ) : !accounts.length ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có tài khoản nào</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((a) => (
              <div
                key={a.id}
                style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelected(a.id)} onClick={(e) => e.stopPropagation()} />
                <div
                  onClick={() => router.push(`/inventory/${a.id}`)}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <TypeBadge type={a.type} />
                      <StatusBadge status={a.status} />
                      <span style={{ fontSize: "12px", color: "#A87888" }}>Hết hạn {a.expiryDate}</span>
                      {a.type === "gpt_plus" && a.quotaPercent !== null && (
                        <span style={{ fontSize: "12px", color: "#A87888" }}>Quota {a.quotaPercent}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AddAccountDialog / ImportAccountsDialog mounted by Task 11 */}
      <div data-testid="inventory-dialogs-slot" hidden>
        {String(showAdd)}
        {String(showImport)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the placeholder page to the real client**

Modify `src/app/(dashboard)/inventory/page.tsx` — replace its entire contents:
```tsx
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import InventoryClient from "@/components/inventory/InventoryClient";

export const metadata: Metadata = { title: "Kho tài khoản | MyClass" };

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <InventoryClient />;
}
```

- [ ] **Step 3: Verify typecheck and lint pass**

Run: `yarn typecheck && yarn lint`
Expected: no errors (the `hidden` placeholder div is intentional scaffolding removed in Task 11 — not a lint violation)

- [ ] **Step 4: Manually verify in the browser**

Start `yarn dev`, sign in as a reseller account, navigate to `/inventory`. Expected:
- List renders the accounts created via curl in Tasks 6-7 (filtered to "Còn hàng" by default).
- Clicking "Đã bán" / "Tất cả" filter buttons changes the list.
- Clicking "Netflix" / "GPT Plus" filters by type.
- Checking a row's checkbox shows the bulk-action bar; clicking "Copy đã chọn" pastes into clipboard (verify by pasting into another field) and shows a toast.

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/InventoryClient.tsx "src/app/(dashboard)/inventory/page.tsx"
git commit -m "feat(inventory): add InventoryClient list with filters and bulk-copy"
```

---

### Task 11: Create + import dialogs

**Files:**
- Create: `src/components/inventory/AddAccountDialog.tsx`
- Create: `src/components/inventory/ImportAccountsDialog.tsx`
- Modify: `src/components/inventory/InventoryClient.tsx`

**Interfaces:**
- Consumes: `useCreateAccount`, `useImportAccounts` (Task 9); `Dialog` family, `DatePicker`, `Textarea` (existing `src/components/ui/`)
- Produces: nothing consumed by later tasks — this closes out the list-side feature set.

- [ ] **Step 1: Write the create dialog**

Create `src/components/inventory/AddAccountDialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateAccount } from "@/hooks/queries/use-accounts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "12px", padding: "9px 12px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

export default function AddAccountDialog({ open, onOpenChange, onCreated }: Props) {
  const [type, setType] = useState<"netflix" | "gpt_plus">("netflix");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quotaPercent, setQuotaPercent] = useState("");
  const [notes, setNotes] = useState("");
  const { mutate: createAccount, isPending: saving } = useCreateAccount();

  function reset() {
    setType("netflix"); setEmail(""); setPassword(""); setTwoFactorSecret("");
    setExpiryDate(""); setQuotaPercent(""); setNotes("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email không được trống"); return; }
    if (!password.trim()) { toast.error("Mật khẩu không được trống"); return; }
    if (!expiryDate) { toast.error("Chọn ngày hết hạn"); return; }

    createAccount(
      {
        type, email: email.trim(), password,
        twoFactorSecret: twoFactorSecret.trim() || undefined,
        expiryDate,
        quotaPercent: type === "gpt_plus" && quotaPercent ? Number(quotaPercent) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => { toast.success("Đã thêm tài khoản"); reset(); onCreated(); },
        onError: () => toast.error("Thêm tài khoản thất bại"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm tài khoản mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Loại tài khoản</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["netflix", "gpt_plus"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                    ...(type === t
                      ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
                  }}
                >
                  {t === "netflix" ? "Netflix" : "GPT Plus"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="email" placeholder="user@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Mật khẩu <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="text" placeholder="Mật khẩu tài khoản" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Mã 2FA (tuỳ chọn)</label>
            <input style={inputStyle} type="text" placeholder="ABCD1234" value={twoFactorSecret} onChange={(e) => setTwoFactorSecret(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Ngày hết hạn <span style={{ color: "#dc2626" }}>*</span></label>
            <DatePicker value={expiryDate} onChange={setExpiryDate} />
          </div>

          {type === "gpt_plus" && (
            <div>
              <label style={labelStyle}>Quota (%)</label>
              <input style={inputStyle} type="number" min={0} max={100} placeholder="100" value={quotaPercent} onChange={(e) => setQuotaPercent(e.target.value)} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Ghi chú</label>
            <input style={inputStyle} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => onOpenChange(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Thêm tài khoản"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Write the import dialog**

Create `src/components/inventory/ImportAccountsDialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useImportAccounts } from "@/hooks/queries/use-accounts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

export default function ImportAccountsDialog({ open, onOpenChange, onImported }: Props) {
  const [type, setType] = useState<"netflix" | "gpt_plus">("netflix");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { mutate: importAccounts, isPending: saving } = useImportAccounts();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    if (!text.trim()) { toast.error("Danh sách không được trống"); return; }

    importAccounts(
      { type, text },
      {
        onSuccess: (res) => {
          toast.success(`Đã import ${res.created} tài khoản`);
          setText("");
          onImported();
        },
        onError: (err) => setErrors(err.message.split("; ")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import hàng loạt</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Loại tài khoản</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["netflix", "gpt_plus"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                    ...(type === t
                      ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
                  }}
                >
                  {t === "netflix" ? "Netflix" : "GPT Plus"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Danh sách (mỗi dòng: email|mật khẩu|2fa|ngày hết hạn)
            </label>
            <p style={{ fontSize: "11px", color: "#A87888", marginBottom: "6px", fontFamily: "monospace" }}>
              user1@gmail.com|Pass123|ABCD1234|2027-01-15
            </p>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"user1@gmail.com|Pass123|ABCD1234|2027-01-15\nuser2@gmail.com|Pass456||2027-02-20"}
              style={{ fontFamily: "monospace", fontSize: "13px" }}
            />
          </div>

          {errors.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 12px" }}>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#dc2626" }}>{err}</div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => onOpenChange(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang import..." : "Import"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Wire both dialogs into `InventoryClient`**

Modify `src/components/inventory/InventoryClient.tsx`:
- Add imports: `import AddAccountDialog from "./AddAccountDialog";` and `import ImportAccountsDialog from "./ImportAccountsDialog";`
- Replace the placeholder scaffolding block at the end of the component:
```tsx
      {/* AddAccountDialog / ImportAccountsDialog mounted by Task 11 */}
      <div data-testid="inventory-dialogs-slot" hidden>
        {String(showAdd)}
        {String(showImport)}
      </div>
```
with:
```tsx
      <AddAccountDialog open={showAdd} onOpenChange={setShowAdd} onCreated={() => setShowAdd(false)} />
      <ImportAccountsDialog open={showImport} onOpenChange={setShowImport} onImported={() => setShowImport(false)} />
```

- [ ] **Step 4: Verify typecheck and lint pass**

Run: `yarn typecheck && yarn lint`
Expected: no errors

- [ ] **Step 5: Manually verify in the browser**

At `/inventory`:
- "+ Thêm tài khoản" opens the create dialog; submitting a valid Netflix account adds it to the list (after closing the dialog).
- Selecting "GPT Plus" in the create dialog reveals the Quota field.
- "Import hàng loạt" opens the import dialog; pasting 2 valid lines imports both; pasting a malformed line shows the inline error block without closing the dialog.

- [ ] **Step 6: Commit**

```bash
git add src/components/inventory/AddAccountDialog.tsx src/components/inventory/ImportAccountsDialog.tsx src/components/inventory/InventoryClient.tsx
git commit -m "feat(inventory): add create and bulk-import dialogs"
```

---

### Task 12: Account detail page — view, edit, copy, delete

**Files:**
- Create: `src/components/inventory/AccountDetailClient.tsx`
- Create: `src/app/(dashboard)/inventory/[id]/page.tsx`

**Interfaces:**
- Consumes: `useAccount`, `useUpdateAccount`, `useDeleteAccount` (Task 9); `buildAccountCopyText` (Task 4); `AlertDialog` family, `DatePicker`
- Produces: nothing consumed by later tasks — closes out the module (Sub-project 3's Order feature will independently import `buildAccountCopyText` directly, not this component).

- [ ] **Step 1: Write the detail/edit component**

Create `src/components/inventory/AccountDetailClient.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QueryErrorState } from "@/components/ui/query-error";
import { useAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/queries/use-account";
import { buildAccountCopyText } from "@/lib/accountCopyText";

const TYPE_LABELS = { netflix: "Netflix", gpt_plus: "GPT Plus" } as const;

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "10px", padding: "8px 10px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

interface Props {
  accountId: number;
}

export default function AccountDetailClient({ accountId }: Props) {
  const router = useRouter();
  const { data: account, isLoading, isError, refetch } = useAccount(accountId);
  const { mutate: updateAccount, isPending: saving } = useUpdateAccount(accountId);
  const { mutate: deleteAccount, isPending: deleting } = useDeleteAccount(accountId);

  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", twoFactorSecret: "", expiryDate: "", quotaPercent: "", notes: "" });

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: "#A87888" }}>Đang tải...</div>;
  if (isError || !account) return <QueryErrorState message="Không tải được tài khoản" onRetry={() => refetch()} />;

  function startEdit() {
    if (!account) return;
    setForm({
      email: account.email,
      password: account.password,
      twoFactorSecret: account.twoFactorSecret ?? "",
      expiryDate: account.expiryDate,
      quotaPercent: account.quotaPercent !== null ? String(account.quotaPercent) : "",
      notes: account.notes ?? "",
    });
    setEditing(true);
  }

  function save() {
    updateAccount(
      {
        email: form.email.trim(),
        password: form.password,
        twoFactorSecret: form.twoFactorSecret.trim() || null,
        expiryDate: form.expiryDate,
        quotaPercent: account?.type === "gpt_plus" && form.quotaPercent ? Number(form.quotaPercent) : null,
        notes: form.notes.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Đã lưu"); setEditing(false); },
        onError: () => toast.error("Lưu thất bại"),
      }
    );
  }

  async function copy() {
    await navigator.clipboard.writeText(buildAccountCopyText([account]));
    toast.success("Đã copy tài khoản");
  }

  function remove() {
    deleteAccount(undefined, {
      onSuccess: () => { toast.success("Đã xoá tài khoản"); router.push("/inventory"); },
      onError: () => toast.error("Xoá thất bại"),
    });
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: "560px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={() => router.push("/inventory")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#6B4858", cursor: "pointer", fontSize: "14px" }}>
          <ChevronLeft size={16} /> Kho tài khoản
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#6B4858", cursor: "pointer" }}>
            <Copy size={13} /> Copy
          </button>
          {!editing && (
            <button onClick={startEdit} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#6B4858", cursor: "pointer" }}>
              <Pencil size={13} /> Chỉnh sửa
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#dc2626", cursor: "pointer" }}>
                <Trash2 size={13} /> Xoá
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tài khoản {account.email} sẽ bị xoá. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting} style={{ background: "#E11D48", color: "white" }}>
                  {deleting ? "Đang xoá..." : "Xoá tài khoản"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Loại</div>
          <div style={{ fontSize: "14px", color: "#2C1820" }}>{TYPE_LABELS[account.type]}</div>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Email</div>
          {editing ? (
            <input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.email}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Mật khẩu</div>
          {editing ? (
            <input style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#2C1820", fontFamily: "monospace" }}>
                {revealed ? account.password : "••••••••"}
              </span>
              <button onClick={() => setRevealed((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A87888" }}>
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Mã 2FA</div>
          {editing ? (
            <input style={inputStyle} value={form.twoFactorSecret} onChange={(e) => setForm({ ...form, twoFactorSecret: e.target.value })} placeholder="Không có" />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820", fontFamily: "monospace" }}>{account.twoFactorSecret ?? "—"}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Ngày hết hạn</div>
          {editing ? (
            <DatePicker value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.expiryDate}</div>
          )}
        </div>

        {account.type === "gpt_plus" && (
          <div>
            <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Quota còn lại (%)</div>
            {editing ? (
              <input style={inputStyle} type="number" min={0} max={100} value={form.quotaPercent} onChange={(e) => setForm({ ...form, quotaPercent: e.target.value })} />
            ) : (
              <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.quotaPercent ?? "—"}</div>
            )}
          </div>
        )}

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Ghi chú</div>
          {editing ? (
            <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.notes ?? "—"}</div>
          )}
        </div>

        {editing && (
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Huỷ
            </button>
            <button type="button" onClick={save} disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the detail page**

Create `src/app/(dashboard)/inventory/[id]/page.tsx`:
```tsx
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import AccountDetailClient from "@/components/inventory/AccountDetailClient";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <AccountDetailClient accountId={Number(id)} />;
}
```

- [ ] **Step 3: Verify typecheck and lint pass**

Run: `yarn typecheck && yarn lint`
Expected: no errors

- [ ] **Step 4: Manually verify in the browser**

From `/inventory`, click an account row → lands on `/inventory/[id]`. Expected:
- All fields render; password is masked with a working show/hide toggle.
- "Copy" copies this single account's info (paste elsewhere to confirm) and shows a toast.
- "Chỉnh sửa" switches fields to editable inputs; "Lưu" persists and returns to view mode; the list page reflects the change on going back.
- "Xoá" opens the confirm dialog; confirming navigates back to `/inventory` and the account no longer appears (still visible under the "Tất cả" status filter is not expected — it's soft-deleted, i.e. excluded from every filter).

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/AccountDetailClient.tsx "src/app/(dashboard)/inventory/[id]/page.tsx"
git commit -m "feat(inventory): add account detail/edit/copy/delete page"
```

---

### Task 13: Final verification + version bump

**Files:**
- Modify: `package.json` (version bump)
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything from Tasks 1-12
- Produces: nothing (terminal task)

- [ ] **Step 1: Run the full CI suite**

Run: `yarn typecheck && yarn lint && yarn test && yarn build`
Expected: all four pass; `test` shows the new test files (`crypto.test.ts`, `accountImport.test.ts`, `accountCopyText.test.ts`, plus the added `validations.test.ts` cases) alongside the existing ones; `build`'s route table lists `GET|POST /api/accounts`, `POST /api/accounts/import`, `GET|PATCH|DELETE /api/accounts/[id]`, and the `/inventory`/`/inventory/[id]` pages as dynamic (`ƒ`).

- [ ] **Step 2: End-to-end manual pass**

With `yarn dev` running and a reseller test session (via curl signup+signin, same as Sub-project 1's verification): walk through create → import → filter → bulk-copy → edit → single-copy → soft-delete in the browser, confirming each against the design spec's UI section. Then delete the curl-created test data (`DELETE /api/accounts/[id]` for anything left, or via the UI).

- [ ] **Step 3: Bump version and update the changelog**

In `package.json`, bump `"version"` from `0.3.0` to `0.4.0` (new feature, additive, no breaking changes — same rule as the `0.2.0 → 0.3.0` bump).

In `CHANGELOG.md`, add above the `[0.3.0]` entry:
```markdown
## [0.4.0] - <today's date, YYYY-MM-DD>

### Added

- Reseller account inventory ("Kho tài khoản"): `Account` model for subscription accounts (Netflix, ChatGPT Plus) with AES-256-GCM-encrypted credentials
- Full CRUD for inventory accounts, plus bulk paste-import (`email|password|2fa|expiry` per line, all-or-nothing validation)
- Clipboard-copy action for a single account or multiple selected accounts, ready for reuse by the upcoming Order feature

### Notes

- Second step of the multi-tenant/reseller rollout (after v0.3.0's accountType/signup foundation); Order/Customer (warranty tracking, KBH/BHF) is the remaining planned sub-project
```

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): bump to v0.4.0"
```

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-23-reseller-inventory-design.md` maps to a task — Data Model → Task 2, Encryption → Task 1, Bulk Import → Tasks 3 & 7, Validation → Task 5, API → Tasks 6-8, Clipboard Copy → Tasks 4, 10, 12, Hooks → Task 9, UI → Tasks 10-12, Testing → Tasks 1, 3, 4, 5.
- **Type consistency checked:** `InventoryAccount` (Task 9) fields match `toResponse()`'s output shape (Tasks 6, 8) exactly; `CreateAccountInput`/`UpdateAccountInput` field names match `accountSchema`/`accountUpdateSchema`; `CopyableAccount` (Task 4) fields are a strict subset of `InventoryAccount`, so passing `InventoryAccount[]` to `buildAccountCopyText` (Tasks 10, 12) type-checks without adapting.
- **No placeholders:** every step ships real, complete code; the one intentional exception is Task 10's `hidden` scaffolding div, which Task 11 explicitly replaces in its own step — not a TBD, a named handoff between two adjacent tasks.
