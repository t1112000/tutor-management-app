# Reseller Orders & Customers — Design Spec

**Date:** 2026-08-23
**Status:** Approved
**Depends on:** Sub-project 2 inventory (`docs/superpowers/specs/2026-08-23-reseller-inventory-design.md`), shipped on `feat/reseller-inventory`

---

## Overview

Sub-project 3 of the multi-tenant/reseller rollout. Replaces the `/customers` and `/orders` ComingSoon placeholders with the daily sell loop:

1. Customer messages on Facebook/Zalo (outside the app).
2. Reseller opens the app, checks inventory, creates an **order** that attaches a **customer** and one or more **inventory accounts**.
3. Submit marks those accounts `sold` and lands on the order detail page.
4. Reseller copies credentials (per line or whole order) and pastes them into chat.

Warranty is **per account line**, not per order:

| Type | UI label | Meaning | Swap when acc dies? |
|------|----------|---------|---------------------|
| `kbh` | Không bảo hành | No warranty | No |
| `bhf` | BHF (đến hạn acc) | Warranty until the **first** assigned account's `expiryDate` | Yes, until that frozen date |
| `days` | Theo ngày | Warranty until order-create date (VN) + N days | Yes, until that frozen date |

Swap does **not** reset `warrantyUntil`. Old account stays `sold` (not resold). New account becomes `sold`. History is an assignment log on the line.

Price is stored per line (VND). No paid/unpaid status — money stays in chat/bank. Reseller `/report` is **out of scope** (SP4).

Credentials: list endpoints (inventory and orders) **do not** return `password` / `twoFactorSecret`. Plaintext exists only on detail GETs and on dedicated copy-text endpoints (server-side `buildAccountCopyText`). This tightens SP2's inventory list, which currently returns plaintext on every fetch.

---

## Daily loop (binding)

After **Tạo đơn** (customer + ≥1 account selected): selected accounts become `sold`; navigate to order detail; user copies from that page (no auto-clipboard). Inbox remains outside the app.

---

## Data model

Independent of `Student`/`Bill`. Same `createdBy` + soft-delete pattern.

### Customer (`customers`)

```
id
name            STRING, NOT NULL
notes           TEXT, NULL
createdBy       FK -> users.id, RESTRICT
deletedAt       DATE, NULL
createdAt / updatedAt
```

Index: `["createdBy"]`.

### CustomerContact (`customer_contacts`)

```
id
customerId      FK -> customers.id, CASCADE
type            ENUM("facebook", "zalo", "discord", "telegram")
value           STRING, NOT NULL
createdAt / updatedAt
```

- At most **one row per `(customerId, type)`** (unique constraint).
- Contacts are optional: a customer with only `name` is valid.
- `value` meaning: `facebook` = profile/message link; `zalo` = phone; `discord` / `telegram` = username. Store as given (trim); no URL-scheme enforcement on facebook (shops paste mixed formats).
- No `deletedAt` on contacts — edit by replace/upsert per type; remove = delete row.

### Order (`orders`)

```
id
customerId      FK -> customers.id, RESTRICT
notes           TEXT, NULL
createdBy       FK -> users.id, RESTRICT
deletedAt       DATE, NULL
createdAt / updatedAt
```

Index: `["createdBy"]`, `["customerId"]`.
No `status`, no `totalAmount` column — total is `SUM(order_lines.price)` for non-deleted orders.

### OrderLine (`order_lines`)

```
id
orderId         FK -> orders.id, CASCADE
warrantyType    ENUM("kbh", "bhf", "days")
warrantyUntil   DATEONLY, NULL          -- null iff kbh; FROZEN at line creation
warrantyDays    INTEGER, NULL           -- set iff days; the N the user picked (display only)
price           DECIMAL(15, 0), NOT NULL
createdAt / updatedAt
```

`warrantyUntil` never changes on swap. `warrantyDays` is the original N, not remaining days.

### OrderLineAssignment (`order_line_assignments`)

```
id
orderLineId     FK -> order_lines.id, CASCADE
accountId       FK -> accounts.id, RESTRICT
assignedAt      DATE, NOT NULL
replacedAt      DATE, NULL              -- null = current assignment
```

Current assignment = `replacedAt IS NULL`. Application rule (enforced in the service, not a partial unique index unless cheap in this Postgres/Sequelize setup): an `accountId` may have at most one current assignment whose parent order has `deletedAt IS NULL`.

On **swap**: set `replacedAt = now` on the current row; insert a new row with `replacedAt NULL`. Old account `status` stays `"sold"`. New account `status` → `"sold"`.

On **order soft-delete**: for each line's current assignment, set `replacedAt = now` (unassign, no successor) and set that account `status` → `"available"`. Assignments that already have `replacedAt` are left alone; those accounts stay `"sold"`.

---

## Warranty helpers (pure, unit-tested)

`src/lib/orderWarranty.ts`:

```ts
export type WarrantyType = "kbh" | "bhf" | "days";

export function computeWarrantyUntil(args: {
  type: WarrantyType;
  days: number | null;
  accountExpiryDate: string; // YYYY-MM-DD of the FIRST assigned account
  orderDate: string;         // YYYY-MM-DD Vietnam today at create
}): string | null
// kbh  -> null
// bhf  -> accountExpiryDate
// days -> orderDate + days (calendar, VN). days must be integer >= 1.

export function isReplaceAllowed(args: {
  type: WarrantyType;
  warrantyUntil: string | null;
  today: string; // YYYY-MM-DD VN
}): boolean
// kbh -> false
// bhf | days -> warrantyUntil != null && today <= warrantyUntil
```

Date arithmetic uses existing `src/lib/time.ts` VN helpers — never UTC `Date` midnight.

---

## Validation (`src/lib/validations.ts`)

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
  contacts: z.array(customerContactSchema).optional(), // if present, replaces the full set
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
  customer: customerSchema.optional(), // inline create
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
  ids: z.array(z.number().int().positive()).optional(), // omit = all current accounts on the order
});
```

---

## API

All routes: `requireAccountType("reseller")` then ownership helpers. Errors `{ error: string }` via `jsonError()`. Mutating routes `parseBody`.

### Customers — `/api/customers`

- **GET** `?q=` — `createdBy`, `deletedAt: null`. Optional `q` ilike on `name`. Include `contacts`. No order list (keep list cheap).
- **POST** — `customerSchema`. Unique type already in schema.
- **GET `/api/customers/[id]`** — `findOwnedCustomer`; include contacts + non-deleted orders (id, createdAt, line count, sum price).
- **PATCH `/api/customers/[id]`** — `customerUpdateSchema`. If `contacts` is present, replace the full set (delete missing types, upsert provided).
- **DELETE `/api/customers/[id]`** — 409 if the customer has any non-deleted order; otherwise soft-delete. Do not cascade-delete orders.

`findOwnedCustomer(userId, id)` mirrors `findOwnedStudent` (`createdBy` + `deletedAt: null`).

### Orders — `/api/orders`

- **GET** `?customerId=` — scoped `createdBy`, `deletedAt: null`. Include customer name, lines with **current** assignment's account **list shape** (no secrets): `id, type, email, expiryDate, status`. Include `warrantyType`, `warrantyUntil`, `price`. Computed `totalPrice`.
- **POST** — `orderCreateSchema`, **one transaction**:
  1. Resolve customer: existing `findOwnedCustomer` or `Customer.create` + contacts (`createdBy: user.id`).
  2. Load each account via `findOwnedAccount`; each must be `status === "available"` and `deletedAt: null` and have no current assignment on a live order.
  3. `Order.create`; for each line: `computeWarrantyUntil` (bhf uses **that line's first account** `expiryDate`; days uses `todayVN()`); `OrderLine.create`; `OrderLineAssignment.create` (`replacedAt: null`); `account.status = "sold"; account.save()`.
  4. Return the same shape as GET by id (detail, with secrets on **current** accounts only). HTTP 201.
  Duplicate/invalid account → 400 with a Vietnamese message, nothing committed.

- **GET `/api/orders/[id]`** — `findOwnedOrder`. Detail: customer + contacts; each line with current account **decrypted**; `assignments` oldest-first (account list shape for history rows — **no** secrets on replaced accounts; current row may omit nested secrets because they live on `currentAccount`). `replaceAllowed` boolean per line from `isReplaceAllowed`.

- **DELETE `/api/orders/[id]`** — transaction: unassign current assignments (`replacedAt = now`), set those accounts `available`, then `order.deletedAt = now`. Already-replaced accounts stay `sold`.

No general PATCH on orders in v0.5 (notes/price edits deferred).

### Replace — `POST /api/orders/[id]/lines/[lineId]/replace`

Body: `orderReplaceSchema`.

- 404 if order/line not owned or line not on that order.
- 400 if `!isReplaceAllowed` (KBH or expired): `"Dòng này không còn bảo hành"`.
- New account: owned, `available`, not currently assigned, not the same as the current account.
- Transaction: `replacedAt = now` on current assignment; insert new assignment; new account `sold`; old account stays `sold`. `warrantyUntil` unchanged.
- Return updated order detail.

### Copy text

Reuse `buildAccountCopyText` on the server. Decrypt inside the handler; never log plaintext.

- **POST `/api/orders/[id]/copy-text`** body `orderCopyTextSchema`. `ids` are **account ids** of **current** assignments on this order. Omit `ids` → all current accounts on the order. 400 if any id is not a current account on this order.
- **POST `/api/accounts/copy-text`** body `{ ids: number[] }` — owned, not deleted. Used by inventory bulk-copy and single copy so the list no longer needs secrets.

Response: `{ text: string }` (same formatter output as today's clipboard).

### Inventory tightening (SP2 retrofit)

- **GET `/api/accounts`** (list): stop mapping `password` / `twoFactorSecret`. Return the rest of `toAccountResponse` minus those two fields (new `toAccountListResponse` in `src/lib/accountResponse.ts`).
- **GET `/api/accounts/[id]`**: unchanged full decrypt (detail + edit form still need it).
- **PATCH `/api/accounts/[id]`**: reject `status` — remove it from `accountUpdateSchema`. Status changes only via order create / replace / delete. Account detail UI: status is a **read-only** badge; remove the SP2 sold/available toggle.
- Inventory bulk-copy and detail Copy buttons call the copy-text endpoint, then `navigator.clipboard.writeText(text)`.

---

## React Query hooks

Mirror `use-students` / `use-account`:

```
useCustomers(q?)
useCustomer(id)
useCreateCustomer()
useUpdateCustomer(id)
useDeleteCustomer(id)

useOrders(customerId?)
useOrder(id)
useCreateOrder()          // invalidates orders, customers, accounts lists
useDeleteOrder(id)        // same
useReplaceOrderLine(orderId)
useCopyOrderText(orderId)
useCopyAccountsText()     // inventory + generic
```

Create/replace/delete invalidate `["accounts"]` and `["account", id]` for every account whose status changed.

---

## UI

Vietnamese copy, existing pink palette, `StudentsClient` / `BillDetailClient` / `InventoryClient` patterns (inline styles, shadcn Dialog/AlertDialog, DatePicker unused here, sonner, TanStack Query via `api()`).

### `/customers`

Replace ComingSoon with `CustomersClient`:

- Search by name.
- Rows: name, contact chips (type + truncated value), order count (optional; skip if it requires an extra query — name + chips is enough for v0.5).
- "+ Thêm khách" dialog: name, notes, up to four contact slots (Facebook / Zalo / Discord / Telegram) each optional.
- Row click → `/customers/[id]`.

### `/customers/[id]`

- Edit name/notes/contacts (one field per type, empty = no row).
- List this customer's non-deleted orders (date, total, line count) linking to `/orders/[id]`.
- Delete: AlertDialog; API 409 surfaces as toast "Không xóa được — khách còn đơn".

### `/orders`

Replace ComingSoon with `OrdersClient`:

- Optional customer filter (select).
- Rows: date, customer name, account emails (current, comma-separated or count + first), total VND, warranty chips per line (KBH / BHF đến YYYY-MM-DD / còn hạn|hết hạn).
- "+ Tạo đơn" → `/orders/new` (full page, not a cramped dialog — N accounts + per-line warranty/price).

### `/orders/new`

- Customer: searchable select of existing + "Khách mới" inline fields (same as add-customer: name required, contacts optional).
- Accounts: multi-select from **available** inventory (type badge, email, expiry). Each chosen account becomes a line editor: warranty type toggle (Không BH / BHF / Theo ngày), days input if Theo ngày, price input (VND integer).
- Submit → `useCreateOrder` → toast → `router.push(/orders/{id})`.

### `/orders/[id]`

- Customer header (name + contact chips) linking to customer.
- Each line:
  - Current account: type, email, expiry; password/2FA masked with Hiện (from detail payload).
  - Warranty label + `warrantyUntil` (or "Không bảo hành").
  - Price.
  - **Copy dòng** → `POST copy-text` with that account id.
  - **Đổi tài khoản** if `replaceAllowed`; else hidden (KBH) or disabled with reason (hết hạn).
  - History: previous assignments (email, assignedAt, replacedAt). No secrets.
- **Copy cả đơn** → copy-text without ids.
- **Xóa đơn** AlertDialog → unassign current accs back to available.

Replace dialog: list available accounts (same picker as create), confirm. Success refreshes order detail.

### Inventory retrofit UI

- `InventoryClient`: bulk copy uses `POST /api/accounts/copy-text` with selected ids (selection still works; list rows no longer contain passwords).
- `AccountDetailClient`: Copy uses the same endpoint with `[id]`. Status badge read-only; remove edit toggle for status.

---

## Testing

Pure logic only (repo has no component/route harness):

- `src/lib/orderWarranty.test.ts` — kbh → null; bhf → expiry; days + N; replace allowed/denied on today==until, today>until, kbh; days missing N is a schema concern not this helper.
- `src/lib/validations.test.ts` — customer unique contact types; orderCreate requires customer xor inline; days requires warrantyDays; duplicate accountId in lines; `copyTextSchema` ids min 1; `orderCopyTextSchema` allows omitted ids.
- Existing `accountCopyText` tests unchanged.

API/UI: curl + browser, same as SP2. Create order → assert accounts sold; replace → old stays sold, new sold, warrantyUntil unchanged; delete order → current acc available; GET `/api/accounts` body has no `password` key; copy-text returns formatter text; tutor session 403 on all new routes.

---

## File checklist

| File | Change |
|------|--------|
| `src/migrations/0011-create-customers.ts` | `customers` + `customer_contacts` + unique `(customer_id, type)` |
| `src/migrations/0012-create-orders.ts` | `orders`, `order_lines`, `order_line_assignments` |
| `src/lib/db/models/Customer.ts` | New |
| `src/lib/db/models/CustomerContact.ts` | New |
| `src/lib/db/models/Order.ts` | New |
| `src/lib/db/models/OrderLine.ts` | New |
| `src/lib/db/models/OrderLineAssignment.ts` | New |
| `src/lib/db/index.ts` | Init + associations |
| `src/lib/auth-helpers.ts` | `findOwnedCustomer`, `findOwnedOrder` |
| `src/lib/orderWarranty.ts` | New helpers |
| `src/lib/orderWarranty.test.ts` | New |
| `src/lib/validations.ts` | Customer/order/copy schemas; drop `status` from `accountUpdateSchema` |
| `src/lib/validations.test.ts` | New describes; drop status-update cases if any |
| `src/lib/accountResponse.ts` | Add `toAccountListResponse` (no secrets) |
| `src/app/api/customers/route.ts` | GET, POST |
| `src/app/api/customers/[id]/route.ts` | GET, PATCH, DELETE |
| `src/app/api/orders/route.ts` | GET, POST |
| `src/app/api/orders/[id]/route.ts` | GET, DELETE |
| `src/app/api/orders/[id]/copy-text/route.ts` | POST |
| `src/app/api/orders/[id]/lines/[lineId]/replace/route.ts` | POST |
| `src/app/api/accounts/copy-text/route.ts` | POST |
| `src/app/api/accounts/route.ts` | List omits secrets |
| `src/app/api/accounts/[id]/route.ts` | PATCH no longer accepts `status` |
| `src/hooks/queries/use-customers.ts` | New |
| `src/hooks/queries/use-customer.ts` | New |
| `src/hooks/queries/use-orders.ts` | New |
| `src/hooks/queries/use-order.ts` | New |
| `src/hooks/queries/use-accounts.ts` | Copy mutation; list type without secrets |
| `src/components/customers/CustomersClient.tsx` | New |
| `src/components/customers/CustomerDetailClient.tsx` | New |
| `src/components/orders/OrdersClient.tsx` | New |
| `src/components/orders/OrderCreateClient.tsx` | New |
| `src/components/orders/OrderDetailClient.tsx` | New |
| `src/app/(dashboard)/customers/page.tsx` | Replace ComingSoon |
| `src/app/(dashboard)/customers/[id]/page.tsx` | New |
| `src/app/(dashboard)/orders/page.tsx` | Replace ComingSoon |
| `src/app/(dashboard)/orders/new/page.tsx` | New |
| `src/app/(dashboard)/orders/[id]/page.tsx` | New |
| `src/components/inventory/InventoryClient.tsx` | Bulk copy via endpoint |
| `src/components/inventory/AccountDetailClient.tsx` | Copy via endpoint; status read-only |
| `CHANGELOG.md` | v0.5.0 notes when implementing |

---

## Out of scope

- Reseller `/report` (price exists so a later report can SUM; no UI now)
- Paid/unpaid, invoices, VAT, online payment
- Public customer portal
- Zalo/Facebook inbox sync
- PATCH order notes/price after create
- Adding lines to an existing order (create a new order)
- Extra contact kinds (`other`, TikTok)
- Restoring a soft-deleted order
- Manual inventory status toggle (removed)
- Multi-staff shops

---

## Locked decisions (from brainstorm)

1. Status quo / target loop: inbox outside app → check kho → tạo đơn (khách + nhiều acc) → detail → copy tay vào chat.
2. After create: mark sold, open order, copy on page (no auto clipboard).
3. KBH = không bảo hành (not "kèm bảo hành"). BHF = bảo hành đến hạn acc. BH theo ngày = chọn N ngày tự do.
4. Die → đổi acc + log acc cũ. KBH has no swap.
5. Warranty per line, not per order. Mix types on one order is allowed.
6. Replaced acc stays sold. New acc sold. Warranty until frozen on the line (BHF from **first** acc expiry; days from create date).
7. Customer: pick existing or inline create. Name required. Contacts optional. Types facebook/zalo/discord/telegram, **max one per type**.
8. Price per line, no paid flag.
9. v0.5 is full: customers + orders + warranty + swap. Report later.
10. Secrets only on detail GET + copy-text endpoints; inventory list tightened in this sub-project.
11. Delete order: current accs return to available; previously replaced accs stay sold.
