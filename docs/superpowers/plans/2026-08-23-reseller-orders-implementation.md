# Reseller Orders & Customers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/customers` and `/orders` placeholders with the reseller sell loop — customers (name + optional social contacts), orders that attach a customer and one or more inventory accounts with per-line warranty (KBH / BHF / N days) and price, mark those accounts sold, copy credentials from the order page, and swap a dead account (with history) while the line is still under warranty.

**Architecture:** New `Customer` / `CustomerContact` / `Order` / `OrderLine` / `OrderLineAssignment` models (own migrations, ownership-scoped API under `/api/customers` and `/api/orders`). Independent of `Student`/`Bill`. Order create/replace/delete run in one Sequelize transaction and are the only writers of `Account.status`. Pure helpers: `orderWarranty.ts` (until-date + replace eligibility). Credentials leave the server only on account/order **detail** GET and on `POST .../copy-text` (server `buildAccountCopyText`); inventory **list** is tightened to drop secrets. UI follows `StudentsClient` / `InventoryClient` / `BillDetailClient` (inline styles, shadcn Dialog/AlertDialog, `sonner`, TanStack Query via `api()`).

**Tech Stack:** Next.js 15 App Router, Sequelize v6 (Postgres), Zod, TanStack Query, shadcn/ui (Radix), Vitest, existing `src/lib/time.ts` + `src/lib/crypto.ts` + `src/lib/accountCopyText.ts`.

**Spec:** `docs/superpowers/specs/2026-08-23-reseller-orders-design.md`

## Global Constraints

- Every new `/api/customers` and `/api/orders` (and `/api/accounts/copy-text`) route starts with `requireAccountType("reseller")`, then reaches data only through `findOwnedCustomer` / `findOwnedOrder` / `findOwnedAccount` — never a bare `findByPk`.
- Every mutating route parses its body with `parseBody(req, schema)`; every error response is `{ error: string }` via `jsonError()`.
- Soft delete only (`deletedAt`) on `Customer` and `Order`. Contacts and assignments are hard-deleted/updated as specified (contacts have no `deletedAt`; assignments use `replacedAt`).
- Dates that are calendar days are `YYYY-MM-DD` strings. Warranty math uses `addDaysStr` / `todayVN` from `src/lib/time.ts` — never UTC `toISOString().slice(0, 10)`.
- Migration files go in `src/migrations/`, numbered sequentially; next is `0011-create-customers.ts` (last on this branch is `0010-create-accounts.ts`).
- Client components fetch only through TanStack Query hooks in `src/hooks/queries/`, which go through `api()` in `src/lib/api-client.ts`.
- No component/route test harness — only pure logic is unit-tested (`src/lib/*.test.ts`). Verify API/UI with curl + browser.
- Vietnamese UI copy, matching existing tone. Colors: `#E8788A`/`#F0A0B0` (primary gradient), `#FFF8FA` (input bg), `#F4D8DE` (border), `#2C1820` (text), `#6B4858` (label), `#A87888` (muted).
- Do not modify `Student` / `Bill` / tutor routes.
- `Account.status` is not client-writable after Task 5: drop it from `accountUpdateSchema`. Status changes only via order create / replace / delete.

---

### Task 1: Warranty helpers (`orderWarranty.ts`)

**Files:**
- Create: `src/lib/orderWarranty.ts`
- Create: `src/lib/orderWarranty.test.ts`

**Interfaces:**
- Consumes: `addDaysStr` from `src/lib/time.ts`
- Produces: `WarrantyType`, `computeWarrantyUntil`, `isReplaceAllowed` — used by Task 10 (create) and Task 11 (replace + detail `replaceAllowed`)

- [ ] **Step 1: Write the failing test**

Create `src/lib/orderWarranty.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeWarrantyUntil, isReplaceAllowed } from "./orderWarranty";

describe("computeWarrantyUntil", () => {
  it("returns null for kbh", () => {
    expect(
      computeWarrantyUntil({
        type: "kbh",
        days: null,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBeNull();
  });

  it("returns the first account expiry for bhf", () => {
    expect(
      computeWarrantyUntil({
        type: "bhf",
        days: null,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2027-01-15");
  });

  it("adds N calendar days to the order date for days", () => {
    expect(
      computeWarrantyUntil({
        type: "days",
        days: 30,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2026-09-22");
  });

  it("treats days=1 as tomorrow", () => {
    expect(
      computeWarrantyUntil({
        type: "days",
        days: 1,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2026-08-24");
  });
});

describe("isReplaceAllowed", () => {
  it("is false for kbh even with a until date", () => {
    expect(isReplaceAllowed({ type: "kbh", warrantyUntil: "2026-09-01", today: "2026-08-23" })).toBe(false);
  });

  it("is false for kbh with null until", () => {
    expect(isReplaceAllowed({ type: "kbh", warrantyUntil: null, today: "2026-08-23" })).toBe(false);
  });

  it("is true for bhf when today equals warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "bhf", warrantyUntil: "2026-08-23", today: "2026-08-23" })).toBe(true);
  });

  it("is false for bhf when today is after warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "bhf", warrantyUntil: "2026-08-22", today: "2026-08-23" })).toBe(false);
  });

  it("is true for days when today is before warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "days", warrantyUntil: "2026-09-22", today: "2026-08-23" })).toBe(true);
  });

  it("is false for days/bhf when warrantyUntil is null", () => {
    expect(isReplaceAllowed({ type: "days", warrantyUntil: null, today: "2026-08-23" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/lib/orderWarranty.test.ts`
Expected: FAIL — `Failed to resolve import "./orderWarranty"`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/orderWarranty.ts`:
```ts
import { addDaysStr } from "@/lib/time";

export type WarrantyType = "kbh" | "bhf" | "days";

export function computeWarrantyUntil(args: {
  type: WarrantyType;
  days: number | null;
  accountExpiryDate: string;
  orderDate: string;
}): string | null {
  if (args.type === "kbh") return null;
  if (args.type === "bhf") return args.accountExpiryDate;
  const n = args.days;
  if (n == null || n < 1) {
    throw new Error("warrantyDays must be >= 1 for type days");
  }
  return addDaysStr(args.orderDate, n);
}

export function isReplaceAllowed(args: {
  type: WarrantyType;
  warrantyUntil: string | null;
  today: string;
}): boolean {
  if (args.type === "kbh") return false;
  if (args.warrantyUntil == null) return false;
  return args.today <= args.warrantyUntil;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/lib/orderWarranty.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/orderWarranty.ts src/lib/orderWarranty.test.ts
git commit -m "feat(orders): add warranty until and replace-eligibility helpers"
```

---

### Task 2: Zod schemas for customers, orders, copy-text; drop account status from PATCH

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/lib/validations.test.ts`

**Interfaces:**
- Consumes: existing `z` import in `validations.ts` (no `dateStr` needed for these schemas)
- Produces: `customerContactType`, `customerContactSchema`, `customerSchema`, `customerUpdateSchema`, `orderLineInputSchema`, `orderCreateSchema`, `orderReplaceSchema`, `copyTextSchema`, `orderCopyTextSchema`. `accountUpdateSchema` no longer has `status`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/validations.test.ts`, change the `accountUpdateSchema` describe to:

```ts
describe("accountUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(accountUpdateSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("accepts clearing twoFactorSecret with null", () => {
    expect(accountUpdateSchema.safeParse({ twoFactorSecret: null }).success).toBe(true);
  });

  it("strips status (status is not client-writable)", () => {
    const parsed = accountUpdateSchema.parse({ status: "sold", email: "a@b.com" });
    expect(parsed).toEqual({ email: "a@b.com" });
  });
});
```

Append these describes at the end of the file (add the new schema names to the existing import from `./validations`):

```ts
describe("customerSchema", () => {
  it("accepts name only", () => {
    expect(customerSchema.safeParse({ name: "An" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(customerSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects two contacts of the same type", () => {
    expect(
      customerSchema.safeParse({
        name: "An",
        contacts: [
          { type: "zalo", value: "0901" },
          { type: "zalo", value: "0902" },
        ],
      }).success
    ).toBe(false);
  });

  it("accepts one of each contact type", () => {
    expect(
      customerSchema.safeParse({
        name: "An",
        contacts: [
          { type: "facebook", value: "https://facebook.com/an" },
          { type: "zalo", value: "0901234567" },
          { type: "discord", value: "an#1234" },
          { type: "telegram", value: "@an" },
        ],
      }).success
    ).toBe(true);
  });
});

describe("orderCreateSchema", () => {
  const line = { accountId: 1, warrantyType: "kbh" as const, price: 50000 };

  it("requires customerId or customer", () => {
    expect(orderCreateSchema.safeParse({ lines: [line] }).success).toBe(false);
  });

  it("rejects both customerId and customer", () => {
    expect(
      orderCreateSchema.safeParse({ customerId: 1, customer: { name: "An" }, lines: [line] }).success
    ).toBe(false);
  });

  it("accepts existing customerId", () => {
    expect(orderCreateSchema.safeParse({ customerId: 1, lines: [line] }).success).toBe(true);
  });

  it("accepts inline customer", () => {
    expect(orderCreateSchema.safeParse({ customer: { name: "An" }, lines: [line] }).success).toBe(true);
  });

  it("requires warrantyDays for type days", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [{ accountId: 1, warrantyType: "days", price: 0 }],
      }).success
    ).toBe(false);
  });

  it("rejects warrantyDays unless type is days", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [{ accountId: 1, warrantyType: "kbh", warrantyDays: 7, price: 0 }],
      }).success
    ).toBe(false);
  });

  it("rejects duplicate accountId in lines", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [line, { ...line }],
      }).success
    ).toBe(false);
  });

  it("rejects empty lines", () => {
    expect(orderCreateSchema.safeParse({ customerId: 1, lines: [] }).success).toBe(false);
  });
});

describe("copyTextSchema", () => {
  it("requires at least one id", () => {
    expect(copyTextSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(copyTextSchema.safeParse({ ids: [1] }).success).toBe(true);
  });
});

describe("orderCopyTextSchema", () => {
  it("allows omitted ids", () => {
    expect(orderCopyTextSchema.safeParse({}).success).toBe(true);
  });

  it("allows a list of ids", () => {
    expect(orderCopyTextSchema.safeParse({ ids: [1, 2] }).success).toBe(true);
  });
});
```

Update the import at the top of `validations.test.ts` to also import `customerSchema, orderCreateSchema, copyTextSchema, orderCopyTextSchema`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/lib/validations.test.ts`
Expected: FAIL on the new names / status-strip assertion

- [ ] **Step 3: Implement schemas**

In `src/lib/validations.ts`, **remove** `status: z.enum(["available", "sold"]).optional()` from `accountUpdateSchema`.

Append (after `accountImportSchema`):
```ts
export const customerContactType = z.enum(["facebook", "zalo", "discord", "telegram"]);

export const customerContactSchema = z.object({
  type: customerContactType,
  value: z.string().trim().min(1, "Thông tin liên hệ không được trống"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Tên khách không được trống"),
  notes: z.string().optional(),
  contacts: z.array(customerContactSchema).optional(),
}).superRefine((val, ctx) => {
  const types = (val.contacts ?? []).map((c) => c.type);
  if (new Set(types).size !== types.length) {
    ctx.addIssue({ code: "custom", message: "Mỗi loại liên hệ chỉ được một", path: ["contacts"] });
  }
});

export const customerUpdateSchema = customerSchema.partial().extend({
  contacts: z.array(customerContactSchema).optional(),
});

export const orderLineInputSchema = z.object({
  accountId: z.number().int().positive(),
  warrantyType: z.enum(["kbh", "bhf", "days"]),
  warrantyDays: z.number().int().min(1).optional(),
  price: z.number().int().min(0),
}).superRefine((val, ctx) => {
  if (val.warrantyType === "days" && val.warrantyDays == null) {
    ctx.addIssue({ code: "custom", message: "Chọn số ngày bảo hành", path: ["warrantyDays"] });
  }
  if (val.warrantyType !== "days" && val.warrantyDays != null) {
    ctx.addIssue({ code: "custom", message: "Số ngày chỉ dùng với loại Theo ngày", path: ["warrantyDays"] });
  }
});

export const orderCreateSchema = z.object({
  customerId: z.number().int().positive().optional(),
  customer: customerSchema.optional(),
  notes: z.string().optional(),
  lines: z.array(orderLineInputSchema).min(1, "Chọn ít nhất một tài khoản"),
}).superRefine((val, ctx) => {
  if (!val.customerId && !val.customer) {
    ctx.addIssue({ code: "custom", message: "Chọn khách hoặc tạo khách mới", path: ["customerId"] });
  }
  if (val.customerId && val.customer) {
    ctx.addIssue({ code: "custom", message: "Chỉ chọn khách có sẵn hoặc tạo mới, không gửi cả hai", path: ["customer"] });
  }
  const ids = val.lines.map((l) => l.accountId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", message: "Trùng tài khoản trong một đơn", path: ["lines"] });
  }
});

export const orderReplaceSchema = z.object({
  accountId: z.number().int().positive(),
});

export const copyTextSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

export const orderCopyTextSchema = z.object({
  ids: z.array(z.number().int().positive()).optional(),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/lib/validations.test.ts`
Expected: PASS (existing + new)

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations.ts src/lib/validations.test.ts
git commit -m "feat(orders): add customer/order/copy zod schemas; drop account status from PATCH"
```

---

### Task 3: Customer + CustomerContact model, migration, ownership helper

**Files:**
- Create: `src/migrations/0011-create-customers.ts`
- Create: `src/lib/db/models/Customer.ts`
- Create: `src/lib/db/models/CustomerContact.ts`
- Modify: `src/lib/db/index.ts`
- Modify: `src/lib/auth-helpers.ts`

**Interfaces:**
- Consumes: nothing from Tasks 1–2 (models don't import zod)
- Produces: `Customer`, `CustomerContact`, `findOwnedCustomer(userId, id, options)` — used by Tasks 7, 10

- [ ] **Step 1: Write the migration**

Create `src/migrations/0011-create-customers.ts`:
```ts
import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("customers", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
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
  await qi.addIndex("customers", ["createdBy"]);

  await qi.createTable("customer_contacts", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("facebook", "zalo", "discord", "telegram"),
      allowNull: false,
    },
    value: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await qi.addIndex("customer_contacts", ["customerId", "type"], {
    unique: true,
    name: "customer_contacts_customer_id_type",
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("customer_contacts");
  await qi.dropTable("customers");
};
```

- [ ] **Step 2: Write the models**

Create `src/lib/db/models/Customer.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { User } from "./User";
import type { CustomerContact } from "./CustomerContact";
import type { Order } from "./Order";

export class Customer extends Model<
  InferAttributes<Customer>,
  InferCreationAttributes<Customer>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare notes: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare creator?: NonAttribute<User>;
  declare contacts?: NonAttribute<CustomerContact[]>;
  declare orders?: NonAttribute<Order[]>;
}

export function initCustomer(sequelize: Sequelize) {
  Customer.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "customers" }
  );
}
```

Create `src/lib/db/models/CustomerContact.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Customer } from "./Customer";

export type CustomerContactType = "facebook" | "zalo" | "discord" | "telegram";

export class CustomerContact extends Model<
  InferAttributes<CustomerContact>,
  InferCreationAttributes<CustomerContact>
> {
  declare id: CreationOptional<number>;
  declare customerId: ForeignKey<Customer["id"]>;
  declare type: CustomerContactType;
  declare value: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare customer?: NonAttribute<Customer>;
}

export function initCustomerContact(sequelize: Sequelize) {
  CustomerContact.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      type: {
        type: DataTypes.ENUM("facebook", "zalo", "discord", "telegram"),
        allowNull: false,
      },
      value: { type: DataTypes.STRING, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "customer_contacts" }
  );
}
```

`Order` is created in Task 4 — `Customer.ts` may `import type { Order }` only (erased at compile time). If tsc complains about a cycle, drop the `orders` NonAttribute until Task 4, then add it back.

- [ ] **Step 3: Wire init + associations + helper**

In `src/lib/db/index.ts`:
- import `Customer, initCustomer` and `CustomerContact, initCustomerContact`
- call `initCustomer(sequelize)` and `initCustomerContact(sequelize)` inside the existing `if (!(User as any).sequelize)` block (after `initAccount`)
- inside the try/associations:
```ts
    User.hasMany(Customer, { foreignKey: "createdBy", as: "customers" });
    Customer.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    Customer.hasMany(CustomerContact, { foreignKey: "customerId", as: "contacts" });
    CustomerContact.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
```
- add `Customer, CustomerContact` to the file's `export { ... }`

In `src/lib/auth-helpers.ts`:
- import `Customer` from `@/lib/db/index`
- add `findOwnedCustomer` identical to `findOwnedAccount` but querying `Customer`

- [ ] **Step 4: Migrate locally and typecheck**

Run: `yarn db:migrate && yarn typecheck`
Expected: migration `0011-create-customers` applied; tsc clean

- [ ] **Step 5: Commit**

```bash
git add src/migrations/0011-create-customers.ts src/lib/db/models/Customer.ts src/lib/db/models/CustomerContact.ts src/lib/db/index.ts src/lib/auth-helpers.ts
git commit -m "feat(orders): add Customer model, contacts, and ownership helper"
```

---

### Task 4: Order + OrderLine + OrderLineAssignment model, migration, ownership helper

**Files:**
- Create: `src/migrations/0012-create-orders.ts`
- Create: `src/lib/db/models/Order.ts`
- Create: `src/lib/db/models/OrderLine.ts`
- Create: `src/lib/db/models/OrderLineAssignment.ts`
- Modify: `src/lib/db/index.ts`
- Modify: `src/lib/auth-helpers.ts`

**Interfaces:**
- Consumes: `Customer` (FK), `Account` (FK)
- Produces: `Order`, `OrderLine`, `OrderLineAssignment`, `findOwnedOrder` — used by Tasks 10–11

- [ ] **Step 1: Write the migration**

Create `src/migrations/0012-create-orders.ts`:
```ts
import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("orders", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
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
  await qi.addIndex("orders", ["createdBy"]);
  await qi.addIndex("orders", ["customerId"]);

  await qi.createTable("order_lines", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    warrantyType: {
      type: DataTypes.ENUM("kbh", "bhf", "days"),
      allowNull: false,
    },
    warrantyUntil: { type: DataTypes.DATEONLY, allowNull: true },
    warrantyDays: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await qi.addIndex("order_lines", ["orderId"]);

  await qi.createTable("order_line_assignments", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderLineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "order_lines", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "accounts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    assignedAt: { type: DataTypes.DATE, allowNull: false },
    replacedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex("order_line_assignments", ["orderLineId"]);
  await qi.addIndex("order_line_assignments", ["accountId"]);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("order_line_assignments");
  await qi.dropTable("order_lines");
  await qi.dropTable("orders");
};
```

- [ ] **Step 2: Write the models**

Create `src/lib/db/models/Order.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { User } from "./User";
import type { Customer } from "./Customer";
import type { OrderLine } from "./OrderLine";

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare id: CreationOptional<number>;
  declare customerId: ForeignKey<Customer["id"]>;
  declare notes: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare creator?: NonAttribute<User>;
  declare customer?: NonAttribute<Customer>;
  declare lines?: NonAttribute<OrderLine[]>;
}

export function initOrder(sequelize: Sequelize) {
  Order.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "orders" }
  );
}
```

Create `src/lib/db/models/OrderLine.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Order } from "./Order";
import type { OrderLineAssignment } from "./OrderLineAssignment";
import type { WarrantyType } from "@/lib/orderWarranty";

export class OrderLine extends Model<
  InferAttributes<OrderLine>,
  InferCreationAttributes<OrderLine>
> {
  declare id: CreationOptional<number>;
  declare orderId: ForeignKey<Order["id"]>;
  declare warrantyType: WarrantyType;
  declare warrantyUntil: string | null;
  declare warrantyDays: number | null;
  declare price: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare order?: NonAttribute<Order>;
  declare assignments?: NonAttribute<OrderLineAssignment[]>;
}

export function initOrderLine(sequelize: Sequelize) {
  OrderLine.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      warrantyType: { type: DataTypes.ENUM("kbh", "bhf", "days"), allowNull: false },
      warrantyUntil: { type: DataTypes.DATEONLY, allowNull: true },
      warrantyDays: { type: DataTypes.INTEGER, allowNull: true },
      price: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "order_lines" }
  );
}
```

Create `src/lib/db/models/OrderLineAssignment.ts`:
```ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { OrderLine } from "./OrderLine";
import type { Account } from "./Account";

export class OrderLineAssignment extends Model<
  InferAttributes<OrderLineAssignment>,
  InferCreationAttributes<OrderLineAssignment>
> {
  declare id: CreationOptional<number>;
  declare orderLineId: ForeignKey<OrderLine["id"]>;
  declare accountId: ForeignKey<Account["id"]>;
  declare assignedAt: Date;
  declare replacedAt: Date | null;
  declare line?: NonAttribute<OrderLine>;
  declare account?: NonAttribute<Account>;
}

export function initOrderLineAssignment(sequelize: Sequelize) {
  OrderLineAssignment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderLineId: { type: DataTypes.INTEGER, allowNull: false },
      accountId: { type: DataTypes.INTEGER, allowNull: false },
      assignedAt: { type: DataTypes.DATE, allowNull: false },
      replacedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "order_line_assignments", timestamps: false }
  );
}
```

- [ ] **Step 3: Wire init + associations + helper**

In `src/lib/db/index.ts` init the three models. Associations (inside the existing try):
```ts
    Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });
    Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
    Order.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    Order.hasMany(OrderLine, { foreignKey: "orderId", as: "lines" });
    OrderLine.belongsTo(Order, { foreignKey: "orderId", as: "order" });
    OrderLine.hasMany(OrderLineAssignment, { foreignKey: "orderLineId", as: "assignments" });
    OrderLineAssignment.belongsTo(OrderLine, { foreignKey: "orderLineId", as: "line" });
    OrderLineAssignment.belongsTo(Account, { foreignKey: "accountId", as: "account" });
```
Export the three models.

Add `findOwnedOrder` in `auth-helpers.ts` (same shape as `findOwnedAccount`, query `Order`). Import `Order`.

- [ ] **Step 4: Migrate and typecheck**

Run: `yarn db:migrate && yarn typecheck`
Expected: `0012-create-orders` applied; tsc clean

- [ ] **Step 5: Commit**

```bash
git add src/migrations/0012-create-orders.ts src/lib/db/models/Order.ts src/lib/db/models/OrderLine.ts src/lib/db/models/OrderLineAssignment.ts src/lib/db/index.ts src/lib/auth-helpers.ts
git commit -m "feat(orders): add Order, OrderLine, Assignment models"
```

---

### Task 5: Inventory list without secrets + `POST /api/accounts/copy-text`

**Files:**
- Modify: `src/lib/accountResponse.ts`
- Modify: `src/app/api/accounts/route.ts`
- Create: `src/app/api/accounts/copy-text/route.ts`
- Modify: `src/hooks/queries/use-accounts.ts`
- Modify: `src/lib/query-keys.ts` (only if you add a key; not required)

**Interfaces:**
- Consumes: `toAccountResponse`, `decrypt`/`safeDecrypt`, `buildAccountCopyText`, `copyTextSchema`, `findOwnedAccount`, `requireAccountType`
- Produces: `AccountListResponse` / `toAccountListResponse`; `POST /api/accounts/copy-text` → `{ text: string }`; list GET no longer includes `password`/`twoFactorSecret`

- [ ] **Step 1: Add list mapper**

In `src/lib/accountResponse.ts` add:
```ts
export type AccountListResponse = Omit<AccountResponse, "password" | "twoFactorSecret">;

export function toAccountListResponse(account: Account): AccountListResponse {
  const { password: _p, twoFactorSecret: _t, ...rest } = toAccountResponse(account);
  return rest;
}
```

- [ ] **Step 2: Switch list GET**

In `src/app/api/accounts/route.ts`, import `toAccountListResponse` and change GET to:
```ts
  return NextResponse.json(accounts.map(toAccountListResponse));
```
POST create may still return `toAccountResponse` (201 of a single new account is a detail).

- [ ] **Step 3: Copy-text route**

Create `src/app/api/accounts/copy-text/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAccountType, parseBody, findOwnedAccount, jsonError } from "@/lib/auth-helpers";
import { copyTextSchema } from "@/lib/validations";
import { toAccountResponse } from "@/lib/accountResponse";
import { buildAccountCopyText } from "@/lib/accountCopyText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, copyTextSchema);
  if (badBody) return badBody;

  const accounts = [];
  for (const id of value.ids) {
    const account = await findOwnedAccount(user.id, id);
    if (!account) return jsonError(404, "Không tìm thấy tài khoản");
    accounts.push(toAccountResponse(account));
  }
  return NextResponse.json({ text: buildAccountCopyText(accounts) });
}
```

Preserve request order of `ids` in the output (loop in array order, not `findAll`).

- [ ] **Step 4: Split the client list type**

In `src/hooks/queries/use-accounts.ts`:
- Rename current `InventoryAccount` fields: keep full type as `InventoryAccount` (still has password) for detail/create response.
- Add `InventoryAccountListItem = Omit<InventoryAccount, "password" | "twoFactorSecret">`
- `useAccounts` queryFn return type: `InventoryAccountListItem[]`
- Add:
```ts
export function useCopyAccountsText() {
  return useMutation({
    mutationFn: (ids: number[]) =>
      api<{ text: string }>("/api/accounts/copy-text", { method: "POST", body: { ids } }),
  });
}
```

- [ ] **Step 5: Typecheck**

Run: `yarn typecheck`
Expected: errors only in `InventoryClient` / `AccountDetailClient` if they still read `account.password` from the **list** (fix in Task 6). `useAccount` still returns full `InventoryAccount`. If typecheck is clean because those files still type the list as full InventoryAccount, **change `useAccounts` generic now** so Task 6 is forced to stop using list passwords.

- [ ] **Step 6: Commit**

```bash
git add src/lib/accountResponse.ts src/app/api/accounts/route.ts src/app/api/accounts/copy-text/route.ts src/hooks/queries/use-accounts.ts
git commit -m "feat(inventory): omit secrets from account list; add copy-text endpoint"
```

---

### Task 6: Inventory UI retrofit — copy via endpoint, status read-only

**Files:**
- Modify: `src/components/inventory/InventoryClient.tsx`
- Modify: `src/components/inventory/AccountDetailClient.tsx`
- Modify: `src/hooks/queries/use-account.ts`
- Modify: `src/app/api/accounts/[id]/route.ts` (only if PATCH still forwards `value.status` — stop writing it)

**Interfaces:**
- Consumes: `useCopyAccountsText` from Task 5; `accountUpdateSchema` without `status` from Task 2
- Produces: list bulk-copy and detail Copy both go through the endpoint; detail status is a badge only

- [ ] **Step 1: Inventory list copy**

In `InventoryClient.tsx`:
- Remove `import { buildAccountCopyText } from "@/lib/accountCopyText"`
- `const copyAccounts = useCopyAccountsText()`
- Replace `copySelected`:
```ts
  async function copySelected() {
    const ids = accounts.filter((a) => selected.has(a.id)).map((a) => a.id);
    if (ids.length === 0) return;
    try {
      const { text } = await copyAccounts.mutateAsync(ids);
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${ids.length} tài khoản`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Copy thất bại");
    }
  }
```

- [ ] **Step 2: Detail copy + drop status editor**

In `AccountDetailClient.tsx`:
- Import `useCopyAccountsText`
- `copy()` becomes: `const { text } = await copyAccounts.mutateAsync([accountId]); await navigator.clipboard.writeText(text);`
- Remove `status` from `form` state, from `startEdit()`, from `save()` payload
- Status block: always the view-mode badge (`STATUS_LABELS[account.status]`), never the two-button toggle (editing or not)

In `use-account.ts`, remove `status?: 'available' | 'sold'` from `UpdateAccountInput`.

In `src/app/api/accounts/[id]/route.ts`, delete the line `if (value.status !== undefined) account.status = value.status;` if present.

- [ ] **Step 3: Typecheck**

Run: `yarn typecheck`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add src/components/inventory/InventoryClient.tsx src/components/inventory/AccountDetailClient.tsx src/hooks/queries/use-account.ts src/app/api/accounts/[id]/route.ts
git commit -m "fix(inventory): copy via endpoint; make account status read-only"
```

---

### Task 7: Customer API — list, create, get, patch, delete

**Files:**
- Create: `src/app/api/customers/route.ts`
- Create: `src/app/api/customers/[id]/route.ts`

**Interfaces:**
- Consumes: `Customer`, `CustomerContact`, `Order`, `OrderLine`, `findOwnedCustomer`, `customerSchema`, `customerUpdateSchema`, `requireAccountType`, `parseBody`, `jsonError`, `sequelize`
- Produces: REST as spec

- [ ] **Step 1: List + create**

Create `src/app/api/customers/route.ts` with `runtime = "nodejs"` and `dynamic = "force-dynamic"`.

GET: `requireAccountType("reseller")`. `q` = trimmed search param. `where`: `createdBy: user.id`, `deletedAt: null`, and if `q` then `name: { [Op.iLike]: %q% }`. `include: [{ model: CustomerContact, as: "contacts" }]`. `order: [["name", "ASC"]]`. Return JSON array.

POST: parse `customerSchema`. `sequelize.transaction`: `Customer.create({ name, notes: notes ?? null, createdBy: user.id })`; if `contacts?.length`, `CustomerContact.bulkCreate` with `customerId`. Reload with contacts. Return 201.

- [ ] **Step 2: Get / patch / delete by id**

Create `src/app/api/customers/[id]/route.ts`. Params are `Promise<{ id: string }>` (same as accounts/[id]).

GET: `findOwnedCustomer`; 404 `"Không tìm thấy khách hàng"`. Include `contacts` and `orders` where `deletedAt: null` with `lines` (`attributes: ["id", "price"]`). Map each order to `{ id, createdAt, lineCount, totalPrice }` where `totalPrice` is the sum of `Number(line.price)`. Return `{ ...customer.toJSON(), orders: mapped }` (do not leak `deletedAt` of others). Easier: build a plain object:
```ts
return NextResponse.json({
  id: customer.id,
  name: customer.name,
  notes: customer.notes,
  createdAt: customer.createdAt,
  contacts: customer.contacts ?? [],
  orders: (customer.orders ?? []).map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    lineCount: o.lines?.length ?? 0,
    totalPrice: (o.lines ?? []).reduce((s, l) => s + Number(l.price), 0),
  })),
});
```

PATCH: parse `customerUpdateSchema`. Update name/notes when present. If `value.contacts` is `!== undefined`: in a transaction, `CustomerContact.destroy({ where: { customerId: customer.id } })` then bulkCreate the new set (empty array clears all). Return the same GET shape (reload).

DELETE: count non-deleted orders for this customer (`Order.count({ where: { customerId, createdBy: user.id, deletedAt: null } })`). If `> 0` return `jsonError(409, "Không xóa được — khách còn đơn")`. Else `customer.deletedAt = new Date(); await customer.save();` return `{ ok: true }`.

- [ ] **Step 3: Typecheck**

Run: `yarn typecheck`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add src/app/api/customers
git commit -m "feat(orders): add customer CRUD API"
```

---

### Task 8: Customer React Query hooks + query keys

**Files:**
- Modify: `src/lib/query-keys.ts`
- Create: `src/hooks/queries/use-customers.ts`
- Create: `src/hooks/queries/use-customer.ts`

**Interfaces:**
- Consumes: `/api/customers` from Task 7
- Produces: hooks listed below

- [ ] **Step 1: Keys**

In `src/lib/query-keys.ts` add:
```ts
  customers: {
    all:    ()           => ['customers'] as const,
    list:   (q = '')     => ['customers', 'list', q] as const,
    detail: (id: number) => ['customers', id] as const,
  },
```

- [ ] **Step 2: List/create hook file**

Create `src/hooks/queries/use-customers.ts` (follow `use-students.ts` quote style — single quotes are fine, that file already uses them):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export type CustomerContactType = 'facebook' | 'zalo' | 'discord' | 'telegram'

export interface CustomerContact {
  id: number
  type: CustomerContactType
  value: string
}

export interface CustomerListItem {
  id: number
  name: string
  notes: string | null
  contacts: CustomerContact[]
}

export interface CustomerInput {
  name: string
  notes?: string
  contacts?: { type: CustomerContactType; value: string }[]
}

export function useCustomers(q = '') {
  return useQuery({
    queryKey: keys.customers.list(q),
    queryFn: () =>
      api<CustomerListItem[]>(q ? `/api/customers?q=${encodeURIComponent(q)}` : '/api/customers'),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      api<CustomerListItem>('/api/customers', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customers.all() }),
  })
}
```

- [ ] **Step 3: Detail hook file**

Create `src/hooks/queries/use-customer.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'
import type { CustomerContact, CustomerInput } from './use-customers'

export interface CustomerOrderSummary {
  id: number
  createdAt: string
  lineCount: number
  totalPrice: number
}

export interface CustomerDetail {
  id: number
  name: string
  notes: string | null
  createdAt: string
  contacts: CustomerContact[]
  orders: CustomerOrderSummary[]
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: keys.customers.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<CustomerDetail>(`/api/customers/${id}`),
  })
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      api<CustomerDetail>(`/api/customers/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.customers.detail(id) })
      qc.invalidateQueries({ queryKey: keys.customers.all() })
    },
  })
}

export function useDeleteCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customers.all() }),
  })
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
yarn typecheck
git add src/lib/query-keys.ts src/hooks/queries/use-customers.ts src/hooks/queries/use-customer.ts
git commit -m "feat(orders): add customer React Query hooks"
```

---

### Task 9: Customers UI — list, create dialog, detail, pages

**Files:**
- Create: `src/components/customers/CustomersClient.tsx`
- Create: `src/components/customers/AddCustomerDialog.tsx`
- Create: `src/components/customers/CustomerDetailClient.tsx`
- Modify: `src/app/(dashboard)/customers/page.tsx`
- Create: `src/app/(dashboard)/customers/[id]/page.tsx`

**Interfaces:**
- Consumes: hooks from Task 8
- Produces: working `/customers` and `/customers/[id]`

Reuse the contact field UI as a small inner helper in both dialog and detail (do **not** extract a shared module unless it saves duplication you can see — two copies of four optional inputs is OK).

Contact types and labels:
```ts
const CONTACT_TYPES = [
  { type: "facebook" as const, label: "Facebook" },
  { type: "zalo" as const, label: "Zalo" },
  { type: "discord" as const, label: "Discord" },
  { type: "telegram" as const, label: "Telegram" },
];
```
Empty string value = omit that type from the payload.

- [ ] **Step 1: AddCustomerDialog**

New file, shadcn `Dialog` like `AddAccountDialog.tsx`. Props: `{ open, onOpenChange }`. Fields: name (required), notes, four contact inputs. Submit `useCreateCustomer` with contacts filtered to `value.trim() !== ""`. Toast `"Đã thêm khách"` / error message. Close on success.

- [ ] **Step 2: CustomersClient**

Follow `InventoryClient` header (64px sticky bar, title "Khách hàng", button "+ Thêm khách"). Search input bound to `q` state (debounce not required). `useCustomers(q)`. Desktop table: Tên, Liên hệ (chips `label: truncated value`), click row → `router.push(/customers/${id})`. Mobile cards same fields. Empty: "Chưa có khách hàng". Loading / `QueryErrorState` like inventory.

Chip style: 11px, `#A87888` text, `#FFF8FA` bg, `#F4D8DE` border, radius 9999.

- [ ] **Step 3: CustomerDetailClient**

Load `useCustomer(id)`. Edit mode toggle like `AccountDetailClient` (name, notes, four contacts). Save via `useUpdateCustomer` sending full `contacts` array (only non-empty). Delete `AlertDialog`; on 409 toast the API message (api-client already unwraps `error`). Back button to `/customers`. Below the card: "Đơn hàng" list — each row date (`formatDateVN`), `formatMoneyVND(totalPrice)`, `${lineCount} tài khoản`, link to `/orders/${id}` (page may 404 until Task 15 — that's fine).

- [ ] **Step 4: Pages**

`src/app/(dashboard)/customers/page.tsx`:
```ts
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import CustomersClient from "@/components/customers/CustomersClient";

export const metadata: Metadata = { title: "Khách hàng | MyClass" };

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <CustomersClient />;
}
```

`src/app/(dashboard)/customers/[id]/page.tsx`:
```ts
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import CustomerDetailClient from "@/components/customers/CustomerDetailClient";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <CustomerDetailClient customerId={Number(id)} />;
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
yarn typecheck
git add src/components/customers src/app/\(dashboard\)/customers
git commit -m "feat(orders): add customers list and detail UI"
```

---

### Task 10: Order list + create API + response mapper + live-assignment check

**Files:**
- Create: `src/lib/orderAssignments.ts`
- Create: `src/lib/orderResponse.ts`
- Create: `src/app/api/orders/route.ts`

**Interfaces:**
- Consumes: models from Tasks 3–4, `computeWarrantyUntil`, `todayVN`, `isReplaceAllowed`, `toAccountListResponse`, `toAccountResponse`, `orderCreateSchema`
- Produces: `accountHasLiveAssignment`, `toOrderListItem`, `toOrderDetail`, `GET/POST /api/orders`

- [ ] **Step 1: Live assignment helper**

Create `src/lib/orderAssignments.ts`:
```ts
import type { Transaction } from "sequelize";
import { Order, OrderLine, OrderLineAssignment } from "@/lib/db/index";

export async function accountHasLiveAssignment(
  accountId: number,
  transaction?: Transaction
): Promise<boolean> {
  const row = await OrderLineAssignment.findOne({
    where: { accountId, replacedAt: null },
    include: [{
      model: OrderLine,
      as: "line",
      required: true,
      include: [{ model: Order, as: "order", required: true, where: { deletedAt: null } }],
    }],
    transaction,
  });
  return row != null;
}
```

- [ ] **Step 2: Response mapper**

Create `src/lib/orderResponse.ts`. Export:

```ts
export async function loadOrderForUser(userId: number, orderId: string | number, opts?: { withSecrets: boolean })
```
Uses `findOwnedOrder` with include:
- `customer` + nested `contacts`
- `lines` + nested `assignments` (order `assignedAt ASC`) + nested `account`

Then map:

**List item** (`withSecrets` unused / false):
```
{
  id, createdAt, notes, totalPrice,
  customer: { id, name },
  lines: [{
    id, warrantyType, warrantyUntil, warrantyDays, price,
    currentAccount: toAccountListResponse(account) | null
  }]
}
```
`currentAccount` = the assignment with `replacedAt == null`. `totalPrice` = sum of `Number(line.price)`.

**Detail** (`withSecrets: true`):
```
{
  id, createdAt, notes, totalPrice,
  customer: { id, name, contacts },
  lines: [{
    id, warrantyType, warrantyUntil, warrantyDays, price,
    replaceAllowed: isReplaceAllowed({ type: warrantyType, warrantyUntil, today: todayVN() }),
    currentAccount: toAccountResponse(account) | null,  // decrypted
    assignments: assignments.map(a => ({
      id, assignedAt, replacedAt,
      account: toAccountListResponse(a.account)  // never secrets
    }))
  }]
}
```

If a line has no current assignment (should not happen on a live order), `currentAccount` is `null`.

- [ ] **Step 3: GET + POST route**

Create `src/app/api/orders/route.ts`.

GET: `requireAccountType("reseller")`. Optional `customerId` query (integer). `Order.findAll` where `createdBy`, `deletedAt: null`, plus `customerId` if valid. Include customer (id, name), lines + current assignment + account. Order `createdAt DESC`. Map through list mapper (or `load` each — prefer one findAll + a `toOrderListItem(order)` that uses already-included data, no N+1).

POST: parse `orderCreateSchema`. `sequelize.transaction(async (t) => { ... })`:
1. Customer: if `customerId`, `findOwnedCustomer` (404 if missing). If `customer`, `Customer.create` + contacts with `{ transaction: t, createdBy: user.id }`.
2. For each line: `findOwnedAccount(user.id, line.accountId, { transaction: t })`. 400 `"Không tìm thấy tài khoản"` if missing. 400 `"Tài khoản không còn hàng"` if `status !== "available"`. 400 `"Tài khoản đang gắn vào đơn khác"` if `await accountHasLiveAssignment(account.id, t)`.
3. `Order.create({ customerId, notes: notes ?? null, createdBy: user.id }, { transaction: t })`.
4. For each line, in order: `warrantyUntil = computeWarrantyUntil({ type: warrantyType, days: warrantyDays ?? null, accountExpiryDate: account.expiryDate, orderDate: todayVN() })`. `OrderLine.create({ orderId, warrantyType, warrantyUntil, warrantyDays: warrantyType === "days" ? warrantyDays! : null, price }, { transaction: t })`. `OrderLineAssignment.create({ orderLineId, accountId, assignedAt: new Date(), replacedAt: null }, { transaction: t })`. `account.status = "sold"; await account.save({ transaction: t })`.
5. After commit, `return NextResponse.json(await loadOrderForUser(user.id, order.id, { withSecrets: true }), { status: 201 })`.

On any 400 inside the transaction, throw after you have a message — easiest pattern: collect checks **before** `Order.create`, still inside the transaction so locks apply, `return jsonError` is not possible mid-callback; **throw** a small `class OrderCreateError extends Error { status = 400 }` and catch outside:

```ts
class OrderCreateError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

try {
  const createdId = await sequelize.transaction(async (t) => { ... throw new OrderCreateError(400, "..."); return order.id; });
  const detail = await loadOrderForUser(user.id, createdId, { withSecrets: true });
  return NextResponse.json(detail, { status: 201 });
} catch (e) {
  if (e instanceof OrderCreateError) return jsonError(e.status, e.message);
  throw e;
}
```

Keep `OrderCreateError` in this route file (do not export).

- [ ] **Step 4: Typecheck + commit**

```bash
yarn typecheck
git add src/lib/orderAssignments.ts src/lib/orderResponse.ts src/app/api/orders/route.ts
git commit -m "feat(orders): add order list and create API"
```

---

### Task 11: Order detail, delete, replace, copy-text API

**Files:**
- Create: `src/app/api/orders/[id]/route.ts`
- Create: `src/app/api/orders/[id]/copy-text/route.ts`
- Create: `src/app/api/orders/[id]/lines/[lineId]/replace/route.ts`

**Interfaces:**
- Consumes: `loadOrderForUser`, `accountHasLiveAssignment`, `isReplaceAllowed`, `todayVN`, `orderReplaceSchema`, `orderCopyTextSchema`, `buildAccountCopyText`, `toAccountResponse`

- [ ] **Step 1: GET + DELETE**

`src/app/api/orders/[id]/route.ts`:

GET: `loadOrderForUser(user.id, id, { withSecrets: true })`; 404 `"Không tìm thấy đơn hàng"`.

DELETE: `findOwnedOrder`; 404. Transaction:
```
for each line's current assignment (replacedAt null):
  assignment.replacedAt = new Date(); await save
  account.status = "available"; await save
order.deletedAt = new Date(); await save
```
Do **not** touch assignments that already have `replacedAt`. Return `{ ok: true }`.

Load current assignments via include or `OrderLineAssignment.findAll({ where: { orderLineId: lineIds, replacedAt: null } })` inside the transaction.

- [ ] **Step 2: Copy-text**

`POST` `src/app/api/orders/[id]/copy-text/route.ts`: parse `orderCopyTextSchema`. Load order with lines/current accounts. Build the list of **current** accounts. If `value.ids` is provided, every id must be in that current set — else 400 `"Tài khoản không thuộc đơn này"`. If omitted, use all current. Map through `toAccountResponse` then `buildAccountCopyText`. Return `{ text }`.

- [ ] **Step 3: Replace**

`POST` `src/app/api/orders/[id]/lines/[lineId]/replace/route.ts`. Params `id` and `lineId`. Parse `orderReplaceSchema`.

404 if order not owned or line's `orderId !== order.id`. 400 `"Dòng này không còn bảo hành"` if `!isReplaceAllowed({ type: line.warrantyType, warrantyUntil: line.warrantyUntil, today: todayVN() })`.

New account: `findOwnedAccount`; 400 missing / not available / `accountHasLiveAssignment` / `newId === currentAccountId` (`"Tài khoản trùng với tài khoản hiện tại"`).

Transaction: current assignment `replacedAt = now`; insert new assignment (`replacedAt null`); new account `sold`; old account stays `sold`. **Do not** change `warrantyUntil`.

Return `loadOrderForUser(..., { withSecrets: true })`.

- [ ] **Step 4: Typecheck + commit**

```bash
yarn typecheck
git add src/app/api/orders
git commit -m "feat(orders): add order detail, delete, replace, and copy-text APIs"
```

---

### Task 12: Order React Query hooks

**Files:**
- Modify: `src/lib/query-keys.ts`
- Create: `src/hooks/queries/use-orders.ts`
- Create: `src/hooks/queries/use-order.ts`

**Interfaces:**
- Consumes: Task 10–11 routes
- Produces: `useOrders`, `useCreateOrder`, `useOrder`, `useDeleteOrder`, `useReplaceOrderLine`, `useCopyOrderText`

- [ ] **Step 1: Keys**

```ts
  orders: {
    all:    ()           => ['orders'] as const,
    list:   (customerId = '') => ['orders', 'list', customerId] as const,
    detail: (id: number) => ['orders', id] as const,
  },
```

- [ ] **Step 2: Types + list/create**

`use-orders.ts` — types matching list JSON:
```ts
export interface OrderListLine {
  id: number
  warrantyType: 'kbh' | 'bhf' | 'days'
  warrantyUntil: string | null
  warrantyDays: number | null
  price: number
  currentAccount: {
    id: number
    type: 'netflix' | 'gpt_plus'
    email: string
    expiryDate: string
    status: 'available' | 'sold'
  } | null
}

export interface OrderListItem {
  id: number
  createdAt: string
  notes: string | null
  totalPrice: number
  customer: { id: number; name: string }
  lines: OrderListLine[]
}

export interface OrderCreateInput {
  customerId?: number
  customer?: { name: string; notes?: string; contacts?: { type: 'facebook'|'zalo'|'discord'|'telegram'; value: string }[] }
  notes?: string
  lines: { accountId: number; warrantyType: 'kbh'|'bhf'|'days'; warrantyDays?: number; price: number }[]
}
```

`useCreateOrder` invalidates `keys.orders.all()`, `keys.customers.all()`, `keys.accounts.all()`.

- [ ] **Step 3: Detail hooks**

`use-order.ts` — detail type: list line plus `replaceAllowed: boolean`, `currentAccount` includes `password` + `twoFactorSecret` (reuse `InventoryAccount` minus quota/notes if easier: inline the decrypted fields), `assignments: { id, assignedAt, replacedAt, account: list shape }[]`.

`useDeleteOrder(id)` invalidates orders, customers, accounts.

`useReplaceOrderLine(orderId)` `mutationFn: ({ lineId, accountId }) => api(/api/orders/${orderId}/lines/${lineId}/replace, { method: 'POST', body: { accountId } })` invalidates that order detail + accounts.

`useCopyOrderText(orderId)` `mutationFn: (ids?: number[]) => api<{text:string}>(/api/orders/${orderId}/copy-text, { method: 'POST', body: ids ? { ids } : {} })`.

- [ ] **Step 4: Typecheck + commit**

```bash
yarn typecheck
git add src/lib/query-keys.ts src/hooks/queries/use-orders.ts src/hooks/queries/use-order.ts
git commit -m "feat(orders): add order React Query hooks"
```

---

### Task 13: Orders list UI + page

**Files:**
- Create: `src/components/orders/OrdersClient.tsx`
- Modify: `src/app/(dashboard)/orders/page.tsx`

**Interfaces:**
- Consumes: `useOrders`, `useCustomers` (filter select)

- [ ] **Step 1: OrdersClient**

Header: title "Đơn hàng", button "+ Tạo đơn" → `router.push("/orders/new")`.

Optional customer `<select>`: first option "Tất cả khách", then `useCustomers()` names. Pass selected id into `useOrders(customerId)`.

Table/cards: date `formatDateVN(createdAt.slice(0,10))`, customer name, current emails joined by `, ` (or `"N tài khoản"` if >2 plus first email), `formatMoneyVND(totalPrice)`, warranty chips per line:
- `kbh` → "KBH"
- else if `warrantyUntil >= todayVN()` → `Còn hạn`
- else → `Hết hạn`

Row click → `/orders/${id}`. Empty: "Chưa có đơn hàng".

- [ ] **Step 2: Page**

Replace ComingSoon in `orders/page.tsx` with `<OrdersClient />`, title `Đơn hàng | MyClass`.

- [ ] **Step 3: Typecheck + commit**

```bash
yarn typecheck
git add src/components/orders/OrdersClient.tsx src/app/\(dashboard\)/orders/page.tsx
git commit -m "feat(orders): add orders list UI"
```

---

### Task 14: Create-order page

**Files:**
- Create: `src/components/orders/OrderCreateClient.tsx`
- Create: `src/app/(dashboard)/orders/new/page.tsx`

**Interfaces:**
- Consumes: `useCustomers`, `useCreateCustomer` not required if inline customer is sent in `useCreateOrder`; `useAccounts("available")` for picker; `useCreateOrder`

- [ ] **Step 1: OrderCreateClient**

Max width ~720px, padding 24px 32px.

**Customer block:** radio or two buttons "Khách có sẵn" / "Khách mới".
- Existing: `<select>` of `useCustomers()`.
- New: name + notes + four contact inputs (same as AddCustomerDialog). Name required to submit.

**Accounts block:** list of available inventory from `useAccounts("available")` with checkbox (email, type badge, expiry). Selected accounts appear below as **line editors**:
- warranty toggle three buttons: "Không BH" (`kbh`), "BHF" (`bhf`), "Theo ngày" (`days`)
- if days: number input min 1
- price number input min 0 (integer VND)

Submit disabled if no customer (no selected id and empty new name) or `selected.length === 0`. `useCreateOrder.mutateAsync` body:
- existing: `{ customerId, lines }`
- new: `{ customer: { name, notes, contacts }, lines }`

`lines` from selected: `{ accountId, warrantyType, warrantyDays: type==="days" ? N : undefined, price }`.

On success: toast `"Đã tạo đơn"`; `router.push(/orders/${created.id})` (create API returns detail with `id`).

- [ ] **Step 2: Page**

`orders/new/page.tsx`: auth + `<OrderCreateClient />`. Title `Tạo đơn | MyClass`. Put this file **next to** `[id]` — in App Router `new` is a static segment and does not collide with `[id]`.

- [ ] **Step 3: Typecheck + commit**

```bash
yarn typecheck
git add src/components/orders/OrderCreateClient.tsx src/app/\(dashboard\)/orders/new/page.tsx
git commit -m "feat(orders): add create-order page"
```

---

### Task 15: Order detail — copy, replace, delete

**Files:**
- Create: `src/components/orders/OrderDetailClient.tsx`
- Create: `src/app/(dashboard)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: `useOrder`, `useCopyOrderText`, `useReplaceOrderLine`, `useDeleteOrder`, `useAccounts("available")`

- [ ] **Step 1: OrderDetailClient**

Back to `/orders`. Header: customer name as link to `/customers/${id}`, contact chips, `formatMoneyVND(totalPrice)`, date.

Buttons: "Copy cả đơn" (`useCopyOrderText` with no ids), "Xóa đơn" `AlertDialog` (copy: xóa đơn sẽ trả tài khoản đang gắn về Còn hàng; acc đã đổi giữ Đã bán).

Each line card:
- current email, type badge, expiry; password/2FA masked with Hiện (from `currentAccount`)
- warranty: KBH or `BHF đến {formatDateVN(until)}` or `{warrantyDays} ngày (đến {formatDateVN(until)})`
- price
- "Copy dòng" → copy-text `{ ids: [currentAccount.id] }`
- "Đổi tài khoản": **hidden** when `warrantyType === "kbh"`; **disabled** with title/tooltip `"Hết hạn bảo hành"` when `!replaceAllowed && warrantyType !== "kbh"`; else opens dialog
- History: if `assignments.filter(a => a.replacedAt)` length > 0, list email + `formatDateVN` of assignedAt / replacedAt

Replace dialog: pick from `useAccounts("available")` excluding current id; confirm calls `useReplaceOrderLine`.

- [ ] **Step 2: Page**

`orders/[id]/page.tsx` like inventory detail: `<OrderDetailClient orderId={Number(id)} />`.

- [ ] **Step 3: Typecheck + commit**

```bash
yarn typecheck
git add src/components/orders/OrderDetailClient.tsx src/app/\(dashboard\)/orders/\[id\]
git commit -m "feat(orders): add order detail with copy, replace, and delete"
```

---

### Task 16: Changelog, docs, version, manual verification

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `package.json` (`version`: `0.4.0` → `0.5.0`)
- Modify: `CLAUDE.md` (data model + auth sentence)
- Modify: `docs/superpowers/specs/2026-08-23-reseller-orders-design.md` (Status: Draft → Approved)

**Interfaces:**
- Consumes: all previous tasks
- Produces: v0.5.0 notes; green typecheck/lint/test; curl + browser walkthrough

- [ ] **Step 1: CHANGELOG**

Under `## [Unreleased]` insert:

```md
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
```

Also edit the v0.4.0 Notes sentence that says Order/Customer is the remaining sub-project — change to "completed in 0.5.0" or delete that clause.

- [ ] **Step 2: package.json + CLAUDE.md + spec status**

`package.json` `"version": "0.5.0"`.

`CLAUDE.md` data model: add bullets that User owns Customers; Customer has contacts; Order → OrderLine → OrderLineAssignment → Account; warranty types; `Account.status` is written by orders. Mention copy-text endpoints and that list GETs omit secrets. Auth paragraph still says most tutor routes use `requireUser`; add that reseller inventory/customer/order routes use `requireAccountType("reseller")`.

Spec: `**Status:** Approved`.

- [ ] **Step 3: Automated checks**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: 0 tsc errors; 0 lint errors (warnings OK if pre-existing); all vitest tests pass including new warranty + schema tests.

- [ ] **Step 4: Manual curl + browser**

With `yarn dev` and a reseller session (same csrf+credentials flow as SP2):

1. `GET /api/accounts?status=available` — JSON array items have **no** `password` key.
2. `POST /api/customers` `{ "name": "Test KH" }` → 201.
3. `POST /api/orders` with that `customerId` and one available `accountId`, `warrantyType: "days", "warrantyDays": 7, "price": 50000` → 201; that account's GET detail `status` is `"sold"`; `warrantyUntil` is todayVN+7.
4. `POST /api/orders/:id/copy-text` `{}` → `{ text }` contains the email.
5. `POST .../lines/:lineId/replace` with a second available account → 200; first account still `"sold"`; second `"sold"`; `warrantyUntil` unchanged.
6. `POST` replace on a `kbh` line → 400 `"Dòng này không còn bảo hành"`.
7. `DELETE /api/orders/:id` → current (second) account `"available"`; first stays `"sold"`.
8. Tutor session on `GET /api/orders` → 403.
9. Browser: `/customers` create + edit contacts; `/orders/new` inline customer + two nicks mixed KBH/BHF; land on detail; copy; swap BHF line; delete.

Then delete curl/browser test data (DELETE orders then customers; leftover sold-from-replace accs can be left or soft-deleted via inventory).

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md package.json CLAUDE.md docs/superpowers/specs/2026-08-23-reseller-orders-design.md
git commit -m "chore(release): bump to v0.5.0"
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| Daily loop | 14, 15 |
| Customer + contacts model | 3 |
| Order / line / assignment model | 4 |
| Warranty helpers | 1 |
| Validation | 2 |
| Customer API | 7 |
| Order list/create | 10 |
| Order GET/DELETE | 11 |
| Replace | 11 |
| Copy-text (orders + accounts) | 5, 11 |
| Inventory list secrets + read-only status | 5, 6 |
| Hooks | 8, 12 |
| `/customers` UI | 9 |
| `/orders` UI | 13–15 |
| Testing (pure) | 1, 2 |
| Testing (curl/browser) | 16 |
| Changelog | 16 |
| Out of scope (report, paid, portal, PATCH order, extra contact kinds) | not tasked |

## Type names (lock)

- `WarrantyType` = `"kbh" | "bhf" | "days"`
- `CustomerContactType` = `"facebook" | "zalo" | "discord" | "telegram"`
- `computeWarrantyUntil` / `isReplaceAllowed` — Task 1 signatures
- `toAccountListResponse` / `AccountListResponse` — Task 5
- `accountHasLiveAssignment(accountId, transaction?)` — Task 10
- `loadOrderForUser(userId, orderId, { withSecrets })` — Task 10
