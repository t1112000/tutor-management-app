# Bill Delete & Edit — Design Spec

**Date:** 2026-06-19  
**Status:** Approved

---

## Overview

Two new features for the bill management system, plus three mobile bug fixes on the bill detail page.

---

## Bug Fixes — BillDetailClient Mobile

### 1. Cannot scroll sessions list
**Root cause:** The inner scrollable div (`flex: 1, overflow: auto`) is missing `minHeight: 0`. Flex children default to `min-height: auto`, preventing them from shrinking below content size and making `overflow: auto` ineffective.  
**Fix:** Add `minHeight: 0` to the scrollable content div in `BillDetailClient`.

### 2. Date and time shown on same line
**Root cause:** The `DatePicker` trigger for mobile sessions uses `display: "inline"`, causing the time div to appear on the same line as the date.  
**Fix:** Change trigger `display: "inline"` → `display: "block"`.

### 3. Blue gap below content on mobile
**Root cause:** `body` uses `bg-mobile.png` (light blue). When the sessions card doesn't fill the full viewport height, the body background shows through below it.  
**Fix:** Add `paddingBottom: 16` at the end of the scrollable content area.

---

## Feature 1 — Soft Delete Bill

### Constraints
- Both `unpaid` and `paid` bills can be deleted.
- Requires confirm dialog before deleting.
- Soft delete: set `deletedAt` timestamp rather than hard-removing rows.

### Database
Migration `0007-soft-delete-bills.ts`:
- Add column `deletedAt TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL` to `bills` table.
- Add to `Bill` model: `declare deletedAt: Date | null`.

All queries that fetch bills must add `where: { deletedAt: null }`:
- `GET /api/bills/[id]`
- `GET /api/students/[id]` (the student detail includes `bills` association)

### API
`DELETE /api/bills/[id]`
- Auth: `requireUser()`
- Ownership check: bill's `createdBy` must match the logged-in user
- Sets `bill.deletedAt = new Date()`
- Returns `{ ok: true }`
- No restriction on `paid` status

### React Query Hook
`useDeleteBill(billId: number, studentId: number)` in `src/hooks/queries/use-bill.ts`:
- `DELETE /api/bills/${billId}`
- On success: invalidate `keys.bills.detail(billId)` and `keys.students.detail(studentId)`

### UI

**BillDetailClient header:**
- Add "Xoá hoá đơn" button (red outline, small) next to the back button area.
- Clicking opens an `AlertDialog` with Vietnamese confirmation text.
- On confirm: call `useDeleteBill`, then `router.push(`/students/${bill.student.id}`)`.
- Visible for both `paid` and `unpaid` bills.

**BillsTable in StudentDetailClient:**
- Desktop table: add a trash icon button in each row (next to existing "Xem →" link).
- Mobile card list: add a small trash icon in the top-right of each bill card.
- Both trigger an `AlertDialog` inline. On confirm: call `useDeleteBill`, the student query auto-refreshes.
- `studentId` is already available in `BillsTable` props.

---

## Feature 2 — Edit Bill

### Constraints
- Only `unpaid` bills can be edited (paid bills show only the delete button, not edit).
- `totalAmount` and `notes` can be changed via the existing `PUT /api/bills/[id]`.
- Sessions can be added or removed; `sessionCount` updates accordingly.
- `totalAmount` does NOT auto-recalculate when sessions are added/removed — user adjusts manually.

### New API Endpoints

**`POST /api/bills/[id]/sessions`**
- Body: `{ scheduledDate: string, startTime: string, endTime: string }`
- Creates a new `BillSession` record.
- Atomically increments `bill.sessionCount += 1` (in a transaction).
- Returns the created session.
- Rejects if bill is `paid` or `deletedAt` is set.

**`DELETE /api/bills/[id]/sessions/[sid]`**
- Finds `BillSession` by `id` and `billId`.
- Atomically decrements `bill.sessionCount -= 1` (in a transaction).
- Returns `{ ok: true }`.
- Rejects if bill is `paid`.

**`PUT /api/bills/[id]`** (already exists — no change needed):
- Accepts `{ totalAmount, notes }`.
- Already rejects paid bills.

### New React Query Hooks in `use-bill.ts`

```
useUpdateBill(billId)   — PUT /api/bills/[id]  { totalAmount, notes }
useAddSession(billId)   — POST /api/bills/[id]/sessions
useDeleteSession(billId) — DELETE /api/bills/[id]/sessions/[sid]
```

All three invalidate `keys.bills.detail(billId)` on success.

### UI — BillDetailClient

**Header (when `unpaid`):**
- Add "Chỉnh sửa" button (secondary style) next to the back button.
- Clicking sets `isEditing = true` state.
- When `isEditing`, the button changes to "Huỷ" (cancel edit mode).

**Info card in edit mode:**
- `totalAmount` displays as `<input type="number">` pre-filled with current value.
- `notes` displays as `<input>` pre-filled with current value.
- A "Lưu" button calls `useUpdateBill` then sets `isEditing = false`.

**Session rows in edit mode:**
- Each session row shows an X (delete) button on the right.
- Clicking X calls `useDeleteSession` for that session.
- Attended checkbox and existing date/time edits remain functional.

**Add session form (bottom of sessions list, edit mode only):**
- Inline form: DatePicker + TimeSpinner (start) + TimeSpinner (end) + "Thêm" button.
- "Thêm" calls `useAddSession` with the picked values.
- Form resets after successful add.

**Paid bills:** No "Chỉnh sửa" button. Only "Xoá hoá đơn" is visible.

### UI — BillsTable in StudentDetailClient

**Desktop table:**
- Rename column "XEM" → "THAO TÁC".
- Each row: "Xem →" link (existing) + pencil icon button (navigates to `/bills/[id]`) + trash icon button (AlertDialog).

**Mobile card list:**
- Each bill card: add pencil icon (navigate to detail) and trash icon (AlertDialog) in the top-right corner, alongside the existing status badge.

---

## File Checklist

| File | Change |
|------|--------|
| `src/migrations/0007-soft-delete-bills.ts` | New — add `deletedAt` column |
| `src/lib/db/models/Bill.ts` | Add `deletedAt` field |
| `src/app/api/bills/[id]/route.ts` | Add `DELETE` handler; add `deletedAt: null` to `GET` where clause |
| `src/app/api/bills/[id]/sessions/route.ts` | Add `POST` handler |
| `src/app/api/bills/[id]/sessions/[sid]/route.ts` | Add `DELETE` handler |
| `src/app/api/students/[id]/route.ts` | Add `deletedAt: null` to bills where clause |
| `src/hooks/queries/use-bill.ts` | Add `useDeleteBill`, `useUpdateBill`, `useAddSession`, `useDeleteSession` |
| `src/components/bills/BillDetailClient.tsx` | Edit mode UI + delete button + mobile bug fixes |
| `src/components/students/StudentDetailClient.tsx` | Delete + edit icons in BillsTable |
