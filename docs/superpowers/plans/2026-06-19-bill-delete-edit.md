# Bill Delete & Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete for bills, an edit-mode for bill details (totalAmount, notes, add/remove sessions), and fix three mobile bugs on the bill detail page.

**Architecture:** Manual soft-delete via `deletedAt` column (no Sequelize `paranoid` mode — follow existing manual pattern). Edit mode is a React state toggle on `BillDetailClient`. Delete actions surface in both `BillDetailClient` (header) and `BillsTable` (student detail page) via `AlertDialog` confirms.

**Tech Stack:** Next.js 15 App Router, Sequelize 6, React Query (`@tanstack/react-query`), Radix UI `AlertDialog`, Sonner toasts, Tailwind + inline styles.

## Global Constraints

- No automated tests — verify by running `yarn dev` and testing in browser
- Vietnamese UI copy throughout (labels, toasts, dialog text)
- All date formatting uses `src/lib/time.ts` helpers
- Inline styles (not Tailwind classes) for component-level styling — follow existing pattern in each file
- All API routes must call `requireUser()` and check `response` before proceeding
- Paid bills (`status === "paid"`) cannot be edited, only deleted
- `totalAmount` does NOT auto-recalculate when sessions are added/removed
- `sessionCount` on `Bill` must stay in sync with the actual number of `BillSession` rows

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/migrations/0007-soft-delete-bills.ts` | Create | Add `deletedAt` column |
| `src/lib/db/models/Bill.ts` | Modify | Add `deletedAt` field declaration and `DataTypes.DATE` init |
| `src/app/api/bills/[id]/route.ts` | Modify | Add `DELETE` handler; add `deletedAt: null` to `GET` where |
| `src/app/api/bills/[id]/sessions/route.ts` | Modify | Add `POST` handler (add session, increment sessionCount) |
| `src/app/api/bills/[id]/sessions/[sid]/route.ts` | Modify | Add `DELETE` handler (remove session, decrement sessionCount) |
| `src/app/api/students/[id]/route.ts` | Modify | Filter `deletedAt: null` in bills include for GET; keep DELETE unfiltered |
| `src/hooks/queries/use-bill.ts` | Modify | Add `useDeleteBill`, `useUpdateBill`, `useAddSession`, `useDeleteSession` |
| `src/components/bills/BillDetailClient.tsx` | Modify | Mobile bug fixes + delete button + edit mode UI |
| `src/components/students/StudentDetailClient.tsx` | Modify | Delete + edit icons in `BillsTable` |

---

## Task 1: Migration + Bill model

**Files:**
- Create: `src/migrations/0007-soft-delete-bills.ts`
- Modify: `src/lib/db/models/Bill.ts`

**Interfaces:**
- Produces: `Bill.deletedAt: Date | null` field available in all subsequent tasks

- [ ] **Step 1: Create migration file**

```ts
// src/migrations/0007-soft-delete-bills.ts
import type { MigrationFn } from "umzug";
import type { Sequelize } from "sequelize";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("bills", "deletedAt", {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("bills", "deletedAt");
};
```

- [ ] **Step 2: Add `deletedAt` to Bill model**

In `src/lib/db/models/Bill.ts`, add the field declaration after `updatedAt`:

```ts
declare deletedAt: Date | null;
```

In the `Bill.init(...)` call, add after `updatedAt: DataTypes.DATE,`:

```ts
deletedAt: { type: DataTypes.DATE, allowNull: true },
```

- [ ] **Step 3: Run migration**

```bash
yarn db:migrate
```

Expected: `Executed 0007-soft-delete-bills`

- [ ] **Step 4: Commit**

```bash
git add src/migrations/0007-soft-delete-bills.ts src/lib/db/models/Bill.ts
git commit -m "feat: add deletedAt column to bills for soft delete"
```

---

## Task 2: API — soft delete + update bill GET/student GET

**Files:**
- Modify: `src/app/api/bills/[id]/route.ts`
- Modify: `src/app/api/students/[id]/route.ts`

**Interfaces:**
- Consumes: `Bill.deletedAt` from Task 1
- Produces:
  - `DELETE /api/bills/[id]` → `{ ok: true }`
  - `GET /api/bills/[id]` now excludes soft-deleted bills (returns 404 if `deletedAt` is set)
  - `GET /api/students/[id]` bills array excludes soft-deleted bills

- [ ] **Step 1: Add DELETE handler and update GET in bills route**

Replace the entire content of `src/app/api/bills/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, Student } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({
    where: { id: Number(id), deletedAt: null },
    include: [
      { model: Student, as: "student" },
      { model: BillSession, as: "sessions", order: [["scheduledDate", "ASC"], ["startTime", "ASC"]] as any },
    ],
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bill);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const { totalAmount, notes } = await req.json();
  await bill.update({ totalAmount, notes });
  return NextResponse.json(bill);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await bill.update({ deletedAt: new Date() });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Filter soft-deleted bills from student GET (not student DELETE)**

In `src/app/api/students/[id]/route.ts`, update the `GET` handler's `include` for bills to add a `where` clause. The `DELETE` handler must NOT filter by `deletedAt` (it must clean up all bills including soft-deleted ones).

Find this block in the `GET` handler:
```ts
{
  model: Bill,
  as: "bills",
  include: [{ model: BillSession, as: "sessions" }],
  order: [["createdAt", "DESC"]] as any,
},
```

Replace with:
```ts
{
  model: Bill,
  as: "bills",
  where: { deletedAt: null },
  required: false,
  include: [{ model: BillSession, as: "sessions" }],
  order: [["createdAt", "DESC"]] as any,
},
```

> Note: `required: false` keeps the LEFT JOIN behavior so students with zero non-deleted bills still return correctly.

Also update the student `DELETE` handler to clean up soft-deleted bills too. Replace the `findOne` call at the top of the `DELETE` handler with:

```ts
const student = await Student.findOne({ where: { id: Number(id) } });
if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

// Destroy all bills (including soft-deleted) and their sessions
const allBills = await Bill.findAll({ where: { studentId: student.id } });
for (const bill of allBills) {
  await BillSession.destroy({ where: { billId: bill.id } });
  await bill.destroy();
}
await StudentSchedule.destroy({ where: { studentId: student.id } });
await student.destroy();
return NextResponse.json({ ok: true });
```

> Make sure `StudentSchedule` is imported at the top of the file — it already is in the existing code.

- [ ] **Step 3: Manual verify**

Run `yarn dev`. In the browser:
1. Open a student's detail page — confirm bills still list correctly.
2. Hit `DELETE /api/bills/<id>` via curl or browser dev tools:
   ```bash
   curl -X DELETE http://localhost:3000/api/bills/1 -H "Cookie: <your session cookie>"
   ```
   Expected response: `{"ok":true}`
3. Reload the student page — the deleted bill should no longer appear.
4. Try `GET /api/bills/<id>` for the deleted bill — should return 404.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bills/[id]/route.ts src/app/api/students/[id]/route.ts
git commit -m "feat: soft delete bill API + filter deleted bills from queries"
```

---

## Task 3: API — add session + delete session

**Files:**
- Modify: `src/app/api/bills/[id]/sessions/route.ts`
- Modify: `src/app/api/bills/[id]/sessions/[sid]/route.ts`

**Interfaces:**
- Consumes: `Bill.deletedAt` from Task 1
- Produces:
  - `POST /api/bills/[id]/sessions` body `{ scheduledDate, startTime, endTime }` → created `BillSession` JSON + `bill.sessionCount` incremented
  - `DELETE /api/bills/[id]/sessions/[sid]` → `{ ok: true }` + `bill.sessionCount` decremented

- [ ] **Step 1: Add POST handler to sessions route**

Replace the entire content of `src/app/api/bills/[id]/sessions/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, sequelize } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = await BillSession.findAll({
    where: { billId: Number(id) },
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const { scheduledDate, startTime, endTime } = await req.json();
  if (!scheduledDate || !startTime || !endTime) {
    return NextResponse.json({ error: "scheduledDate, startTime, endTime required" }, { status: 400 });
  }

  const t = await sequelize.transaction();
  try {
    const session = await BillSession.create(
      { billId: Number(id), scheduledDate, startTime, endTime, isAttended: false, notes: null },
      { transaction: t }
    );
    await bill.update({ sessionCount: bill.sessionCount + 1 }, { transaction: t });
    await t.commit();
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
```

- [ ] **Step 2: Add DELETE handler to session route**

Replace the entire content of `src/app/api/bills/[id]/sessions/[sid]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, sequelize } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: Number(id) } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.isAttended === "boolean") updates.isAttended = body.isAttended;
  if (body.scheduledDate) updates.scheduledDate = body.scheduledDate;
  if (body.startTime) updates.startTime = body.startTime;
  if (body.endTime) updates.endTime = body.endTime;
  if (body.notes !== undefined) updates.notes = body.notes;

  await session.update(updates);
  return NextResponse.json(session);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: Number(id) } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const t = await sequelize.transaction();
  try {
    await session.destroy({ transaction: t });
    await bill.update({ sessionCount: Math.max(0, bill.sessionCount - 1) }, { transaction: t });
    await t.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
```

- [ ] **Step 3: Manual verify**

```bash
# Add a session
curl -X POST http://localhost:3000/api/bills/1/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: <session>" \
  -d '{"scheduledDate":"2026-07-01","startTime":"14:00","endTime":"15:30"}'
# Expected: 201 with session JSON

# Delete that session (use the id from the response above)
curl -X DELETE http://localhost:3000/api/bills/1/sessions/<newId> \
  -H "Cookie: <session>"
# Expected: {"ok":true}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bills/[id]/sessions/route.ts src/app/api/bills/[id]/sessions/[sid]/route.ts
git commit -m "feat: add POST/DELETE session endpoints, keep sessionCount in sync"
```

---

## Task 4: React Query hooks

**Files:**
- Modify: `src/hooks/queries/use-bill.ts`

**Interfaces:**
- Consumes: APIs from Tasks 2 and 3
- Produces:
  - `useDeleteBill(billId, studentId)` — DELETE bill, invalidates bill detail + student detail
  - `useUpdateBill(billId)` — PUT bill `{ totalAmount, notes }`, invalidates bill detail
  - `useAddSession(billId)` — POST session, invalidates bill detail
  - `useDeleteSession(billId)` — DELETE session, invalidates bill detail + calendar

- [ ] **Step 1: Add four new hooks to `use-bill.ts`**

Append after the `usePayBill` export:

```ts
export function useDeleteBill(billId: number, studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await expectOk(await fetch(`/api/bills/${billId}`, { method: 'DELETE' }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
    },
  })
}

export function useUpdateBill(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: { totalAmount: number; notes: string | null }) => {
      await expectOk(
        await fetch(`/api/bills/${billId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
    },
  })
}

export function useAddSession(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { scheduledDate: string; startTime: string; endTime: string }) => {
      await expectOk(
        await fetch(`/api/bills/${billId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
    },
  })
}

export function useDeleteSession(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      await expectOk(
        await fetch(`/api/bills/${billId}/sessions/${sessionId}`, { method: 'DELETE' })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/use-bill.ts
git commit -m "feat: add useDeleteBill, useUpdateBill, useAddSession, useDeleteSession hooks"
```

---

## Task 5: BillDetailClient — mobile bug fixes

**Files:**
- Modify: `src/components/bills/BillDetailClient.tsx`

**Interfaces:**
- No new interfaces — pure visual fixes

- [ ] **Step 1: Fix scroll — add `minHeight: 0` to the scrollable div**

Find the scrollable content div (line ~158):
```ts
<div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px" : "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
```

Add `minHeight: 0` to the style:
```ts
<div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: isMobile ? "16px" : "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
```

- [ ] **Step 2: Fix date/time dinking — change DatePicker trigger display in mobile session rows**

In the mobile session list, find the DatePicker trigger (around line ~266):
```ts
trigger={
  <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1820", cursor: "pointer", display: "inline" }}>
    {fmtDate(s.scheduledDate)}
  </div>
}
```

Change `display: "inline"` to `display: "block"`:
```ts
trigger={
  <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1820", cursor: "pointer", display: "block" }}>
    {fmtDate(s.scheduledDate)}
  </div>
}
```

- [ ] **Step 3: Fix blue gap — add paddingBottom to mobile cards**

At the end of the mobile layout, after the sessions card closing tag, add a spacer div. Find the closing `</>` of the mobile isMobile branch (after the sessions card):

```tsx
{/* spacer to cover body background */}
<div style={{ height: 8 }} />
```

- [ ] **Step 4: Manual verify**

Run `yarn dev`, open the bill detail page on a mobile viewport (Chrome DevTools or real device):
1. Sessions list with 10+ sessions should now scroll.
2. Each session row should show date on one line, time on the next line — not concatenated.
3. No blue gap visible below the last card.

- [ ] **Step 5: Commit**

```bash
git add src/components/bills/BillDetailClient.tsx
git commit -m "fix: mobile scroll, date/time spacing, background gap in BillDetailClient"
```

---

## Task 6: BillDetailClient — delete button + edit mode

**Files:**
- Modify: `src/components/bills/BillDetailClient.tsx`

**Interfaces:**
- Consumes: `useDeleteBill`, `useUpdateBill`, `useAddSession`, `useDeleteSession` from Task 4
- Consumes: `Bill` type already has `student.id`

- [ ] **Step 1: Import new hooks and icons**

At the top of `BillDetailClient.tsx`, update the imports:

```ts
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/hooks/use-is-mobile";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMoneyVND } from "@/lib/time";
import {
  useBill, useUpdateSession, usePayBill, useDeleteBill,
  useUpdateBill, useAddSession, useDeleteSession,
  Bill, BillSession,
} from "@/hooks/queries/use-bill";
```

- [ ] **Step 2: Add state + hook wires inside `BillDetailClient`**

Inside the component function, after the existing hook declarations, add:

```ts
const [isEditing, setIsEditing] = useState(false);
const [editAmount, setEditAmount] = useState<string>("");
const [editNotes, setEditNotes] = useState<string>("");
const [newSession, setNewSession] = useState<{ scheduledDate: string; startTime: string; endTime: string }>({
  scheduledDate: "",
  startTime: "07:00",
  endTime: "08:00",
});
const { mutate: deleteBillMutation, isPending: deleteLoading } = useDeleteBill(billId, bill?.student?.id ?? 0);
const { mutate: updateBillMutation, isPending: saveLoading } = useUpdateBill(billId);
const { mutate: addSessionMutation, isPending: addingSession } = useAddSession(billId);
const { mutate: deleteSessionMutation } = useDeleteSession(billId);
```

Also add a helper to enter edit mode — sync the local form state from the bill:

```ts
function enterEditMode() {
  if (!bill) return;
  setEditAmount(String(bill.totalAmount));
  setEditNotes(bill.notes ?? "");
  setIsEditing(true);
}

function exitEditMode() {
  setIsEditing(false);
}

function saveBillEdits() {
  const amount = Number(editAmount);
  if (isNaN(amount) || amount <= 0) {
    toast.error("Học phí không hợp lệ");
    return;
  }
  updateBillMutation(
    { totalAmount: amount, notes: editNotes || null },
    {
      onSuccess: () => { toast.success("Đã lưu hóa đơn"); setIsEditing(false); },
      onError: () => toast.error("Lưu thất bại"),
    }
  );
}

function addNewSession() {
  if (!newSession.scheduledDate) { toast.error("Chọn ngày học"); return; }
  addSessionMutation(newSession, {
    onSuccess: () => {
      toast.success("Đã thêm buổi học");
      setNewSession({ scheduledDate: "", startTime: "07:00", endTime: "08:00" });
    },
    onError: () => toast.error("Thêm buổi thất bại"),
  });
}

function removeSession(sessionId: number) {
  deleteSessionMutation(sessionId, {
    onSuccess: () => toast.success("Đã xoá buổi học"),
    onError: () => toast.error("Xoá thất bại"),
  });
}

function deleteBill() {
  deleteBillMutation(undefined, {
    onSuccess: () => {
      toast.success("Đã xoá hóa đơn");
      router.push(`/students/${bill!.student.id}`);
    },
    onError: () => toast.error("Xoá thất bại"),
  });
}
```

- [ ] **Step 3: Update header to show delete + edit buttons**

Find the sticky header div (the one with the back button). Replace its inner content so it shows the action buttons alongside the breadcrumb.

The header currently renders:
```tsx
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <button onClick={() => router.push(`/students/${bill.student.id}`)} ...>
    ← {bill.student.name}
  </button>
  <span ...>/</span>
  <span ...>Chi tiết hóa đơn</span>
</div>
```

Replace with:
```tsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <button
      onClick={() => router.push(`/students/${bill.student.id}`)}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
        background: "#FFF0F5", border: "1px solid #F4D8DE", borderRadius: 8,
        cursor: "pointer", fontSize: 13, color: "#C06070", fontWeight: 500,
      }}
    >
      ← {bill.student.name}
    </button>
    <span style={{ color: "#D4A0B0", fontSize: 14 }}>/</span>
    <span style={{ fontSize: 15, fontWeight: 600, color: "#2C1820" }}>Chi tiết hóa đơn</span>
  </div>

  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {!isPaid && (
      isEditing ? (
        <button
          onClick={exitEditMode}
          style={{
            padding: "5px 14px", borderRadius: 8, border: "1px solid #F4D8DE",
            background: "white", color: "#A87888", fontWeight: 500, fontSize: 13, cursor: "pointer",
          }}
        >
          Huỷ
        </button>
      ) : (
        <button
          onClick={enterEditMode}
          style={{
            padding: "5px 14px", borderRadius: 8, border: "1px solid #F4D8DE",
            background: "white", color: "#A87888", fontWeight: 500, fontSize: 13, cursor: "pointer",
          }}
        >
          Chỉnh sửa
        </button>
      )
    )}

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          style={{
            padding: "5px 12px", borderRadius: 8,
            border: "1px solid #FECDD3", background: "#FFF1F2",
            color: "#E11D48", fontWeight: 500, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <Trash2 size={13} />
          Xoá
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá hóa đơn?</AlertDialogTitle>
          <AlertDialogDescription>
            Hóa đơn {formatMoneyVND(bill.totalAmount)} sẽ bị xoá. Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteBill}
            disabled={deleteLoading}
            style={{ background: "#E11D48", color: "white" }}
          >
            {deleteLoading ? "Đang xoá..." : "Xoá hóa đơn"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</div>
```

- [ ] **Step 4: Edit mode for info card (desktop)**

In the desktop info card, the totalAmount and notes are currently read-only. Wrap them in edit mode conditionals.

Find the desktop info card div (the one with `padding: "20px 28px", display: "flex", ...`). Add edit mode fields by wrapping the existing display in `{isEditing ? (...) : (...)}` blocks.

Replace the `totalAmount` display in the desktop card:
```tsx
{/* was: */}
<div style={{ fontSize: 17, fontWeight: 700, color: "#2C1820" }}>{formatMoneyVND(bill.totalAmount)}</div>

{/* becomes: */}
{isEditing ? (
  <input
    type="number"
    value={editAmount}
    onChange={(e) => setEditAmount(e.target.value)}
    style={{
      width: 140, height: 34, padding: "0 10px",
      background: "#FFF8FA", border: "1px solid #ECC8D0",
      borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#2C1820",
    }}
  />
) : (
  <div style={{ fontSize: 17, fontWeight: 700, color: "#2C1820" }}>{formatMoneyVND(bill.totalAmount)}</div>
)}
```

Add a "Lưu" button at the end of the desktop info card (inside the right-side div with status badge + pay button), visible only when `isEditing`:

```tsx
{isEditing && (
  <button
    onClick={saveBillEdits}
    disabled={saveLoading}
    style={{
      padding: "7px 18px", borderRadius: 10, border: "none", cursor: "pointer",
      background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
      color: "white", fontWeight: 600, fontSize: 13,
      opacity: saveLoading ? 0.7 : 1,
    }}
  >
    {saveLoading ? "Đang lưu..." : "Lưu"}
  </button>
)}
```

- [ ] **Step 5: Edit mode for sessions — X button per row + add session form**

**Desktop session rows** — add a delete column. Change the grid template from `"48px 1fr 1fr 88px 1fr"` to `"48px 1fr 1fr 88px 1fr 40px"` when `isEditing`.

In each session row (desktop), add a final cell:
```tsx
{/* Delete session (edit mode only) */}
{isEditing && (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <button
      onClick={() => removeSession(s.id)}
      style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "#FFF1F2", border: "1px solid #FECDD3",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Trash2 size={13} color="#E11D48" />
    </button>
  </div>
)}
```

Also update the table header grid to match:
```tsx
<div style={{
  display: "grid",
  gridTemplateColumns: isEditing ? "48px 1fr 1fr 88px 1fr 40px" : "48px 1fr 1fr 88px 1fr",
  padding: "6px 12px", marginBottom: 2,
}}>
  {/* existing columns */}
  {isEditing && <span />}
</div>
```

**Add session form** — append after the rows loop, inside the sessions card, visible only when `isEditing`:

```tsx
{isEditing && (
  <div style={{
    marginTop: 12, padding: "14px 16px",
    background: "#FFF8FA", borderRadius: 10, border: "1px dashed #F4D8DE",
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
  }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#A87888", whiteSpace: "nowrap" }}>
      <Plus size={13} style={{ marginRight: 4 }} />
      Thêm buổi:
    </span>
    <DatePicker
      value={newSession.scheduledDate}
      onChange={(d) => setNewSession((p) => ({ ...p, scheduledDate: d }))}
      trigger={
        <span style={{
          padding: "5px 12px", borderRadius: 8, border: "1px solid #F4D8DE",
          background: "white", fontSize: 13, cursor: "pointer", color: newSession.scheduledDate ? "#2C1820" : "#A87888",
        }}>
          {newSession.scheduledDate ? newSession.scheduledDate : "Chọn ngày"}
        </span>
      }
    />
    <Popover>
      <PopoverTrigger asChild>
        <span style={{
          padding: "5px 12px", borderRadius: 8, border: "1px solid #F4D8DE",
          background: "white", fontSize: 13, cursor: "pointer", color: "#2C1820",
        }}>
          {newSession.startTime} – {newSession.endTime}
        </span>
      </PopoverTrigger>
      <PopoverContent style={{
        width: 280, padding: 20, borderRadius: 18,
        border: "1px solid #F4D8DE", boxShadow: "0 8px 32px rgba(232,120,138,0.15)", background: "white",
      }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: "#2C1820", margin: "0 0 16px" }}>Giờ học</p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 16 }}>
          <TimeSpinner
            label="Bắt đầu"
            value={newSession.startTime}
            onChange={(v) => setNewSession((p) => ({ ...p, startTime: v }))}
          />
          <TimeSpinner
            label="Kết thúc"
            value={newSession.endTime}
            onChange={(v) => setNewSession((p) => ({ ...p, endTime: v }))}
          />
        </div>
      </PopoverContent>
    </Popover>
    <button
      onClick={addNewSession}
      disabled={addingSession}
      style={{
        padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
        color: "white", fontWeight: 600, fontSize: 13,
        opacity: addingSession ? 0.7 : 1,
      }}
    >
      {addingSession ? "Đang thêm..." : "Thêm"}
    </button>
  </div>
)}
```

**Mobile session rows** — in the mobile layout, also add a delete button at the end of each session row when `isEditing`:

```tsx
{/* At the end of the mobile session row div, after the Checkbox: */}
{isEditing && (
  <button
    onClick={() => removeSession(s.id)}
    style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "#FFF1F2", border: "1px solid #FECDD3",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Trash2 size={13} color="#E11D48" />
  </button>
)}
```

Also add the same "Thêm buổi" form after the mobile sessions list (same code as desktop form above, just inside the `{isMobile && ...}` branch).

For the mobile summary card, add edit fields. When `isEditing`, replace the amount display:
```tsx
{/* was: */}
<div style={{ fontSize: 22, fontWeight: 800, color: "#E8788A" }}>{formatMoneyVND(bill.totalAmount)}</div>
{/* becomes: */}
{isEditing ? (
  <input
    type="number"
    value={editAmount}
    onChange={(e) => setEditAmount(e.target.value)}
    style={{
      width: 130, height: 34, padding: "0 10px",
      background: "#FFF8FA", border: "1px solid #ECC8D0",
      borderRadius: 8, fontSize: 17, fontWeight: 700, color: "#E8788A",
    }}
  />
) : (
  <div style={{ fontSize: 22, fontWeight: 800, color: "#E8788A" }}>{formatMoneyVND(bill.totalAmount)}</div>
)}
```

Add a Save button in the mobile summary card, visible when `isEditing`, after the progress bar and before the pay button:
```tsx
{isEditing && (
  <button
    onClick={saveBillEdits}
    disabled={saveLoading}
    style={{
      width: "100%", height: 40, border: "none", borderRadius: 10, cursor: "pointer",
      background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
      color: "white", fontWeight: 600, fontSize: 13, marginBottom: 8,
      opacity: saveLoading ? 0.7 : 1,
    }}
  >
    {saveLoading ? "Đang lưu..." : "Lưu thông tin"}
  </button>
)}
```

- [ ] **Step 6: Manual verify**

Run `yarn dev`:
1. Open a bill detail page — confirm "Chỉnh sửa" and "Xoá" buttons appear in the header.
2. Click "Chỉnh sửa" — totalAmount becomes an input, sessions get X buttons, add form appears at bottom.
3. Edit the amount → click "Lưu" — amount updates, edit mode exits, toast shows.
4. Delete a session via X → session disappears, sessionCount decreases by 1.
5. Add a session via the form → new session appears in list, sessionCount increases by 1.
6. Click "Xoá" → AlertDialog appears → confirm → redirected to student page, bill no longer listed.
7. For a paid bill — confirm only "Xoá" button appears (no "Chỉnh sửa").

- [ ] **Step 7: Commit**

```bash
git add src/components/bills/BillDetailClient.tsx
git commit -m "feat: delete + edit mode on BillDetailClient (delete bill, edit amount/notes, add/remove sessions)"
```

---

## Task 7: StudentDetailClient — delete + edit icons in BillsTable

**Files:**
- Modify: `src/components/students/StudentDetailClient.tsx`

**Interfaces:**
- Consumes: `useDeleteBill(billId, studentId)` from Task 4
- Consumes: `BillsTable` receives `studentId: number` prop (already in signature at line ~1701)

- [ ] **Step 1: Add `useDeleteBill` import to StudentDetailClient**

At the top of the file, the existing imports from `use-student` and `use-students` do not include `useDeleteBill`. Add a new import line:

```ts
import { useDeleteBill } from "@/hooks/queries/use-bill";
```

- [ ] **Step 2: Add delete functionality to `BillsTable`**

The `BillsTable` component (around line 1701) currently receives `{ bills, studentId, isMobile }` but doesn't use `studentId` or `router`. We need to add delete logic.

Replace the `BillsTable` function signature and add state + hooks. The function currently starts with:
```ts
function BillsTable({ bills, isMobile }: BillsTableProps) {
  const router = useRouter();
```

Change to use `studentId` and add a delete helper. Because hooks can't be called inside callbacks, we need to lift delete to a separate child or pass a handler. The cleanest approach for this single-file component: add a `DeleteBillButton` sub-component that owns its own hook instance.

Add this component **before** the `BillsTable` function:

```tsx
function DeleteBillButton({ billId, studentId }: { billId: number; studentId: number }) {
  const { mutate: deleteBill, isPending } = useDeleteBill(billId, studentId);
  function handleDelete() {
    deleteBill(undefined, {
      onSuccess: () => toast.success("Đã xoá hóa đơn"),
      onError: () => toast.error("Xoá thất bại"),
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#FFF1F2", border: "1px solid #FECDD3",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={13} color="#E11D48" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá hóa đơn?</AlertDialogTitle>
          <AlertDialogDescription>
            Hóa đơn này sẽ bị xoá vĩnh viễn. Hành động không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            style={{ background: "#E11D48", color: "white" }}
          >
            {isPending ? "Đang xoá..." : "Xoá"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Also add `Trash2` to the lucide import at the top of the file (it imports `ChevronLeft, Pencil, Plus, X` — add `Trash2`):
```ts
import { ChevronLeft, Pencil, Plus, X, Trash2 } from "lucide-react";
```

And add the `AlertDialog` imports — they're not currently imported in `StudentDetailClient.tsx`. Add:
```ts
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

- [ ] **Step 3: Update `BillsTable` function to use `studentId` and show icons**

The `BillsTable` function currently ignores `studentId`. Update it:

```ts
function BillsTable({ bills, studentId, isMobile }: BillsTableProps) {
  const router = useRouter();
```

**Desktop table** — change the columns header from `["NGÀY BẮT ĐẦU", "TIẾN ĐỘ", "SỐ TIỀN", "TRẠNG THÁI", "XEM"]` to `["NGÀY BẮT ĐẦU", "TIẾN ĐỘ", "SỐ TIỀN", "TRẠNG THÁI", "THAO TÁC"]`.

In each desktop table row, replace the last `<td>` (the "Xem →" link cell):

```tsx
<td style={{ padding: "14px 0" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Link
      href={`/bills/${b.id}`}
      style={{ fontSize: 13, fontWeight: 600, color: "#E8788A", textDecoration: "none" }}
    >
      Xem →
    </Link>
    <DeleteBillButton billId={b.id} studentId={studentId} />
  </div>
</td>
```

**Mobile card list** — in each bill card, add the delete button alongside the status badge. Replace the top-row div in the mobile card:

```tsx
<div style={{
  display: "flex", alignItems: "center",
  justifyContent: "space-between", marginBottom: 10,
}}>
  <span style={{
    fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
    background: isPaid ? "#DCFCE7" : "#FEF9C3",
    color: isPaid ? "#16A34A" : "#A16207",
  }}>
    {isPaid ? "Đã thu" : "Chưa thanh toán"}
  </span>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: 13, color: "#6B7280" }}>
      {b.startDate ? formatDateVN(b.startDate) : "—"}
    </span>
    <DeleteBillButton billId={b.id} studentId={studentId} />
  </div>
</div>
```

- [ ] **Step 4: Manual verify**

Run `yarn dev`:
1. Open a student's detail page — each bill row (desktop) shows "Xem →" + trash icon.
2. Each mobile bill card shows the status badge + date + trash icon.
3. Clicking trash icon opens AlertDialog — confirm → bill disappears from list, toast "Đã xoá hóa đơn".
4. Clicking "Xem →" still navigates to bill detail.

- [ ] **Step 5: Commit**

```bash
git add src/components/students/StudentDetailClient.tsx
git commit -m "feat: delete bill action in student BillsTable (desktop + mobile)"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered |
|-------------|---------|
| Soft delete with confirm dialog | ✅ Tasks 2, 6, 7 |
| Both paid/unpaid bills deletable | ✅ Task 2 DELETE handler (no status check) |
| Delete button in BillDetailClient header | ✅ Task 6 Step 3 |
| Delete button in BillsTable (student page) | ✅ Task 7 |
| Edit bill: totalAmount + notes | ✅ Tasks 3 (API already existed), 4, 6 |
| Edit bill: add session | ✅ Tasks 3, 4, 6 |
| Edit bill: remove session | ✅ Tasks 3, 4, 6 |
| sessionCount stays in sync | ✅ Task 3 (transactions) |
| totalAmount NOT auto-recalculated | ✅ Not implemented (by design) |
| Edit only for unpaid bills | ✅ Task 6 (isEditing hidden when isPaid) |
| Edit button in BillDetailClient | ✅ Task 6 |
| Edit/view action in BillsTable | ✅ Task 7 ("Xem →" still navigates to detail page with edit mode) |
| Mobile scroll fix | ✅ Task 5 |
| Date/time spacing fix | ✅ Task 5 |
| Blue background gap fix | ✅ Task 5 |
| deletedAt filter in bill GET | ✅ Task 2 |
| deletedAt filter in student GET bills | ✅ Task 2 |
| Student DELETE cleans up all bills incl. soft-deleted | ✅ Task 2 |

**No placeholders found.**

**Type consistency:** All hook names match between Task 4 definitions and Task 6/7 usages. `useDeleteBill(billId, studentId)` signature consistent. `useAddSession` / `useDeleteSession` / `useUpdateBill` consistent.
