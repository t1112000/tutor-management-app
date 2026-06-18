# React Query Integration Design

**Date:** 2026-06-18  
**Scope:** Full coverage — all client components  
**Cache behavior:** Stale-while-revalidate (React Query defaults)  
**Mutations:** `useMutation` with automatic query invalidation  

---

## Problem

Every Client component manages fetching manually with `useEffect` + `useState` + `fetch()`. There is no caching: navigating away and back re-fetches everything from scratch. The Dashboard fetches `/api/students` even though the Students page also fetches it independently. Mutations call a `load()` function to manually refetch, which is fragile.

---

## Approach: Custom Hook Layer

A `src/hooks/queries/` directory holds one file per entity. Each file exports `useQuery`-backed read hooks and `useMutation`-backed write hooks. Components consume hooks only — no raw `fetch`, no query keys, no `useEffect` for data loading.

---

## File Structure

```
src/
  lib/
    query-keys.ts                    ← Single source of truth for all query keys
  components/
    providers/
      QueryProvider.tsx              ← QueryClientProvider wrapper, added to app/layout.tsx
  hooks/
    queries/
      use-students.ts               ← useStudents(q?), useCreateStudent, useUpdateStudent, useDeleteStudent
      use-student.ts                ← useStudent(id), useAddSchedule, useRemoveSchedule, useEditSchedule
      use-bill.ts                   ← useBill(id), usePayBill, useUpdateSession, useDeleteBill
      use-calendar.ts               ← useCalendar(weekStart)
      use-report.ts                 ← useReport(month)
```

---

## Query Keys (`src/lib/query-keys.ts`)

```ts
export const keys = {
  students: {
    all:    ()          => ['students'] as const,
    list:   (q = '')    => ['students', 'list', q] as const,
    detail: (id: number) => ['students', id] as const,
  },
  bills: {
    detail: (id: number) => ['bills', id] as const,
  },
  calendar: {
    week: (weekStart: string) => ['calendar', weekStart] as const,
  },
  report: {
    month: (month: string) => ['report', month] as const,
  },
}
```

Invalidating `keys.students.all()` clears both the list and all detail entries because React Query matches by prefix.

---

## QueryProvider

```tsx
// src/components/providers/QueryProvider.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

Added to `src/app/layout.tsx` wrapping the body content. One `QueryClient` per browser session.

---

## Component Migration

### DashboardContent

Replace single `Promise.all` → 3 separate queries. Stats are derived inline:

```ts
const { data: students, isLoading: l1 } = useStudents()
const { data: report,   isLoading: l2 } = useReport(currentMonth)
const { data: sessions, isLoading: l3 } = useCalendar(weekStart)
const loading = l1 || l2 || l3
```

No `stats` state needed — values read directly from `students`, `report`, `sessions`.

### StudentsClient

```ts
const [q, setQ] = useState('')
const { data: students = [], isLoading } = useStudents(q)
const { mutate: create } = useCreateStudent()
```

Search: user types → debounced `setQ` after 300 ms → React Query fetches `/api/students?q=...`. `useStudents` uses `keepPreviousData: true` so the list doesn't blank while typing.

After `create` succeeds → `invalidateQueries(keys.students.all())` → list refreshes automatically.

### StudentDetailClient

```ts
const { data: student } = useStudent(studentId)
const { mutate: save, isPending: saving } = useUpdateStudent(studentId)
const { mutate: remove } = useDeleteStudent(studentId)
const { mutate: addSched } = useAddSchedule(studentId)
const { mutate: removeSched } = useRemoveSchedule(studentId)
const { mutate: editSched } = useEditSchedule(studentId)
```

Remove `load()` callback, remove `saving` useState. `isPending` from `useMutation` replaces it.

Schedule mutations invalidate `keys.students.detail(id)` and `{ queryKey: ['calendar'], exact: false }` (prefix match clears all cached weeks since schedule changes affect all future weeks).

### BillDetailClient

```ts
const { data: bill } = useBill(billId)
const { mutate: pay } = usePayBill(billId)
const { mutate: updateSession } = useUpdateSession(billId)
```

`usePayBill` onSuccess invalidates `keys.bills.detail(id)` and `keys.report.month('*')` (wildcard).

### CalendarClient

```ts
const [weekStart, setWeekStart] = useState(getWeekStart())
const { data: sessions = [] } = useCalendar(weekStart)
```

Navigating to a previous week: React Query returns cached data instantly (if visited before). Navigating to a new week: fetch happens, previous week stays cached for back-navigation.

### ReportClient

```ts
const [month, setMonth] = useState(currentMonth)
const { data: report, isLoading } = useReport(month)
```

### SettingsClient

Single read query for notification settings, no mutations needed beyond existing fetch calls (push subscription is fire-and-forget, not a React Query concern).

---

## Mutation Pattern (standard)

```ts
export function useUpdateStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: StudentForm) =>
      fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(id) })
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}
```

`toast.error` / `toast.success` calls stay in the component's `onError` / `onSuccess` callbacks passed to `mutate()` — keeps UI feedback in the UI layer.

---

## Invalidation Map

| Mutation | Invalidates |
|---|---|
| createStudent | `students.all()` |
| updateStudent(id) | `students.detail(id)`, `students.all()` |
| deleteStudent(id) | `students.all()` |
| addSchedule(studentId) | `students.detail(studentId)`, `['calendar']` prefix |
| removeSchedule(studentId) | `students.detail(studentId)`, `['calendar']` prefix |
| editSchedule(studentId) | `students.detail(studentId)`, `['calendar']` prefix |
| updateSession(billId) | `bills.detail(billId)`, `['calendar']` prefix |
| payBill(billId) | `bills.detail(billId)`, `['report']` prefix |
| deleteBill(billId) | `students.detail(studentId)`, `students.all()` |

---

## Dependencies

- Install: `@tanstack/react-query` (latest v5, compatible with React 19)
- No dev tooling (`@tanstack/react-query-devtools`) needed for production app

---

## Out of Scope

- Server-side prefetching / `HydrationBoundary` — not needed for single-user app
- Optimistic updates — adds complexity without clear benefit here
- Infinite queries / pagination — app has no pagination
