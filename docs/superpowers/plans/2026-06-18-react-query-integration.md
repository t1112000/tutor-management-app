# React Query Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all manual `useEffect`/`useState`/`fetch()` data-fetching patterns with TanStack React Query v5, adding caching (stale-while-revalidate) and `useMutation`-based writes across every client component.

**Architecture:** A `src/lib/query-keys.ts` file is the single source of truth for all query keys. A `src/hooks/queries/` directory holds entity-scoped hook files that wrap `useQuery` and `useMutation`. Components import hooks only — no raw `fetch`, no `useEffect` for data loading, no manual loading state.

**Tech Stack:** `@tanstack/react-query` v5, Next.js 15 App Router, React 19, TypeScript

## Global Constraints

- No automated tests exist in this project — verification is TypeScript type-check (`yarn build`) + manual browser check
- App is Vietnamese-language; do not change any user-facing strings
- All fetch URLs must match existing API routes exactly: `/api/students`, `/api/students/[id]`, `/api/students/[id]/schedules`, `/api/bills/[id]`, `/api/bills/[id]/sessions/[sid]`, `/api/bills/[id]/pay`, `/api/calendar`, `/api/report`
- Use `@tanstack/react-query` — NOT the legacy `react-query` package
- `QueryClient` is created with `useState(() => new QueryClient())` inside the provider to prevent shared state between SSR requests
- `SettingsClient` has no data fetching and requires no changes

---

## File Map

| Status | Path | Responsibility |
|---|---|---|
| Create | `src/lib/query-keys.ts` | All query key factories |
| Create | `src/components/providers/QueryProvider.tsx` | `QueryClientProvider` wrapper |
| Modify | `src/app/layout.tsx` | Add `QueryProvider` around children |
| Create | `src/hooks/queries/use-students.ts` | `useStudents(q?)`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent` |
| Create | `src/hooks/queries/use-student.ts` | `useStudent(id)`, `useAddSchedule`, `useRemoveSchedule`, `useEditSchedule` |
| Create | `src/hooks/queries/use-bill.ts` | `useBill(id)`, `useUpdateSession`, `usePayBill` |
| Create | `src/hooks/queries/use-calendar.ts` | `useCalendar(weekStart)` |
| Create | `src/hooks/queries/use-report.ts` | `useReport(month)` |
| Modify | `src/components/dashboard/DashboardContent.tsx` | Use 3 query hooks, remove `stats` state |
| Modify | `src/components/students/StudentsClient.tsx` | Use `useStudents(q)`, remove `load()` |
| Modify | `src/components/students/AddStudentDialog.tsx` | Use `useCreateStudent` mutation |
| Modify | `src/components/students/StudentDetailClient.tsx` | Use `useStudent`, all schedule mutations |
| Modify | `src/components/bills/BillDetailClient.tsx` | Use `useBill`, `useUpdateSession`, `usePayBill` |
| Modify | `src/components/calendar/CalendarClient.tsx` | Use `useCalendar(weekStart)` |
| Modify | `src/components/report/ReportClient.tsx` | Use `useReport(month)` |

---

## Task 1: Install React Query and wire up infrastructure

**Files:**
- Create: `src/lib/query-keys.ts`
- Create: `src/components/providers/QueryProvider.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `keys` object (imported by all hooks), `QueryProvider` component (imported by layout)

- [ ] **Step 1: Install the package**

```bash
yarn add @tanstack/react-query
```

Expected: package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Create `src/lib/query-keys.ts`**

```ts
export const keys = {
  students: {
    all:    ()           => ['students'] as const,
    list:   (q = '')     => ['students', 'list', q] as const,
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
} as const
```

- [ ] **Step 3: Create `src/components/providers/QueryProvider.tsx`**

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

- [ ] **Step 4: Update `src/app/layout.tsx` to wrap children with `QueryProvider`**

Replace:
```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
```

With:
```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
```

Replace the body content:
```tsx
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
```
With:
```tsx
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
yarn build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/query-keys.ts src/components/providers/QueryProvider.tsx src/app/layout.tsx package.json yarn.lock
git commit -m "feat: install react-query and add QueryProvider"
```

---

## Task 2: Create student query hooks

**Files:**
- Create: `src/hooks/queries/use-students.ts`
- Create: `src/hooks/queries/use-student.ts`

**Interfaces:**
- Consumes: `keys` from `@/lib/query-keys`
- Produces:
  - `useStudents(q?: string)` → `UseQueryResult<Student[]>`
  - `useCreateStudent()` → `UseMutationResult<Student, Error, CreateStudentInput>`
  - `useUpdateStudent(id: number)` → `UseMutationResult<void, Error, StudentForm>`
  - `useDeleteStudent(id: number)` → `UseMutationResult<void, Error, void>`
  - `useStudent(id: number)` → `UseQueryResult<StudentDetail>`
  - `useAddSchedule(studentId: number)` → `UseMutationResult<void, Error, {dayOfWeek, startTime, endTime}>`
  - `useRemoveSchedule(studentId: number)` → `UseMutationResult<void, Error, number>`
  - `useEditSchedule(studentId: number)` → `UseMutationResult<void, Error, {scheduleId, startTime, endTime}>`

- [ ] **Step 1: Create `src/hooks/queries/use-students.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface Student {
  id: number
  name: string
  subject: 'english' | 'chinese'
  phone: string | null
  bills?: Array<{ id: number }>
}

export interface StudentForm {
  name: string
  phone: string
  birthday: string
  subject: 'english' | 'chinese'
  address: string
  notes: string
  color: string | null
  type: 'offline' | 'online'
}

export interface CreateStudentInput {
  name: string
  phone: string
  subject: string
  address: string
  type: string
  birthday: string
  notes: string
  parentName: string
  parentPhone: string
}

async function expectOk(res: Response) {
  if (!res.ok) throw new Error(await res.text())
  return res
}

export function useStudents(q = '') {
  return useQuery({
    queryKey: keys.students.list(q),
    queryFn: async () => {
      const url = q ? `/api/students?q=${encodeURIComponent(q)}` : '/api/students'
      const res = await expectOk(await fetch(url))
      return res.json() as Promise<Student[]>
    },
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const res = await expectOk(
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )
      return res.json() as Promise<Student>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}

export function useUpdateStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: StudentForm) => {
      await expectOk(
        await fetch(`/api/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(id) })
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}

export function useDeleteStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await expectOk(await fetch(`/api/students/${id}`, { method: 'DELETE' }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}
```

- [ ] **Step 2: Create `src/hooks/queries/use-student.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface Schedule {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface BillSummary {
  id: number
  startDate: string | null
  sessionCount: number
  totalAmount: number
  status: 'unpaid' | 'paid'
  sessions: Array<{ isAttended: boolean }>
}

export interface StudentDetail {
  id: number
  name: string
  phone: string | null
  birthday: string | null
  subject: 'english' | 'chinese'
  address: string | null
  notes: string | null
  parentName: string | null
  parentPhone: string | null
  color: string | null
  type: 'offline' | 'online'
  schedules: Schedule[]
  bills: BillSummary[]
}

async function expectOk(res: Response) {
  if (!res.ok) throw new Error(await res.text())
  return res
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: keys.students.detail(id),
    queryFn: async () => {
      const res = await expectOk(await fetch(`/api/students/${id}`))
      return res.json() as Promise<StudentDetail>
    },
  })
}

export function useAddSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { dayOfWeek: number; startTime: string; endTime: string }) => {
      await expectOk(
        await fetch(`/api/students/${studentId}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useRemoveSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (scheduleId: number) => {
      await expectOk(
        await fetch(`/api/students/${studentId}/schedules`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId }),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useEditSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { scheduleId: number; startTime: string; endTime: string }) => {
      await expectOk(
        await fetch(`/api/students/${studentId}/schedules`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/queries/use-students.ts src/hooks/queries/use-student.ts
git commit -m "feat: add student query and mutation hooks"
```

---

## Task 3: Create bill, calendar, and report query hooks

**Files:**
- Create: `src/hooks/queries/use-bill.ts`
- Create: `src/hooks/queries/use-calendar.ts`
- Create: `src/hooks/queries/use-report.ts`

**Interfaces:**
- Produces:
  - `useBill(id: number)` → `UseQueryResult<Bill>`
  - `useUpdateSession(billId: number)` → `UseMutationResult<void, Error, {sessionId: number, updates: Record<string, unknown>}>`
  - `usePayBill(billId: number)` → `UseMutationResult<void, Error, void>`
  - `useCalendar(weekStart: string)` → `UseQueryResult<CalendarSession[]>`
  - `useReport(month: string)` → `UseQueryResult<Report>`

- [ ] **Step 1: Create `src/hooks/queries/use-bill.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface BillSession {
  id: number
  scheduledDate: string
  startTime: string
  endTime: string
  isAttended: boolean
  notes: string | null
}

export interface Bill {
  id: number
  sessionCount: number
  totalAmount: number
  status: 'unpaid' | 'paid'
  paidAt: string | null
  notes: string | null
  student: { id: number; name: string; subject: 'english' | 'chinese' }
  sessions: BillSession[]
}

async function expectOk(res: Response) {
  if (!res.ok) throw new Error(await res.text())
  return res
}

export function useBill(id: number) {
  return useQuery({
    queryKey: keys.bills.detail(id),
    queryFn: async () => {
      const res = await expectOk(await fetch(`/api/bills/${id}`))
      return res.json() as Promise<Bill>
    },
  })
}

export function useUpdateSession(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: number
      updates: Record<string, unknown>
    }) => {
      await expectOk(
        await fetch(`/api/bills/${billId}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function usePayBill(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await expectOk(await fetch(`/api/bills/${billId}/pay`, { method: 'POST' }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
    },
  })
}
```

- [ ] **Step 2: Create `src/hooks/queries/use-calendar.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface CalendarSession {
  id: number
  scheduledDate: string
  startTime: string
  endTime: string
  isAttended: boolean
  bill: {
    id: number
    student: {
      name: string
      subject: 'english' | 'chinese'
      color: string | null
      type: 'offline' | 'online' | null
    }
  }
}

export function useCalendar(weekStart: string) {
  return useQuery({
    queryKey: keys.calendar.week(weekStart),
    queryFn: async () => {
      const res = await fetch(`/api/calendar?weekStart=${weekStart}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<CalendarSession[]>
    },
  })
}
```

- [ ] **Step 3: Create `src/hooks/queries/use-report.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

interface StudentReport {
  studentId: number
  name: string
  subject: 'english' | 'chinese'
  paid: number
  unpaid: number
  total: number
  sessionsCount: number
}

export interface Report {
  month: string
  paid: number
  unpaid: number
  unpaidBillCount: number
  total: number
  students: StudentReport[]
}

export function useReport(month: string) {
  return useQuery({
    queryKey: keys.report.month(month),
    queryFn: async () => {
      const res = await fetch(`/api/report?month=${month}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Report>
    },
  })
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
yarn build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/use-bill.ts src/hooks/queries/use-calendar.ts src/hooks/queries/use-report.ts
git commit -m "feat: add bill, calendar, and report query hooks"
```

---

## Task 4: Migrate DashboardContent

**Files:**
- Modify: `src/components/dashboard/DashboardContent.tsx`

**Interfaces:**
- Consumes: `useStudents` from `@/hooks/queries/use-students`, `useReport` from `@/hooks/queries/use-report`, `useCalendar` from `@/hooks/queries/use-calendar`

- [ ] **Step 1: Replace imports and remove state/effect**

At the top of `DashboardContent.tsx`, replace:
```tsx
import { useEffect, useState } from "react";
```
With:
```tsx
import { useState } from "react";
import { useStudents } from "@/hooks/queries/use-students";
import { useReport } from "@/hooks/queries/use-report";
import { useCalendar } from "@/hooks/queries/use-calendar";
```

- [ ] **Step 2: Replace component body**

Replace the entire `DashboardContent` function body — from `const isMobile = useIsMobile()` down to the closing of the stats derivation — with:

```tsx
export default function DashboardContent({ userId }: { userId: number }) {
  const isMobile = useIsMobile();

  const hdrStyle: React.CSSProperties = {
    height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center",
    borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const weekStart = getWeekStart();
  const today = new Date().toISOString().slice(0, 10);

  const { data: students, isLoading: l1 } = useStudents();
  const { data: report,   isLoading: l2 } = useReport(currentMonth);
  const { data: sessions, isLoading: l3 } = useCalendar(weekStart);

  const loading = l1 || l2 || l3;

  const activeStudents  = students?.length ?? 0;
  const unpaidBills     = report?.unpaidBillCount ?? 0;
  const unpaidTotal     = report?.unpaid ?? 0;
  const todaySessions   = (sessions ?? []).filter((s) => s.scheduledDate === today);
  const weekSessionCount = sessions?.length ?? 0;
```

Then update every reference to `stats?.activeStudents` → `activeStudents`, `stats?.unpaidBills` → `unpaidBills`, `stats?.unpaidTotal` → `unpaidTotal`, `stats?.todaySessions` → `todaySessions`, `stats?.weekSessionCount` → `weekSessionCount` in the JSX below.

The `getWeekStart` function stays as-is (it was already defined in the file). Remove the `load` function and the `useEffect(() => { load() }, [])` block. Remove `const [stats, setStats] = useState<Stats | null>(null)` and `const [loading, setLoading] = useState(true)`.

Also delete the `Stats` interface since it's no longer used.

- [ ] **Step 3: Verify and test manually**

```bash
yarn build
```

Expected: build succeeds.

Start dev server and navigate to `/` — dashboard should load and display data. Stats cards show numbers, today's schedule shows sessions.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/DashboardContent.tsx
git commit -m "feat: migrate DashboardContent to React Query"
```

---

## Task 5: Migrate StudentsClient and AddStudentDialog

**Files:**
- Modify: `src/components/students/StudentsClient.tsx`
- Modify: `src/components/students/AddStudentDialog.tsx`

**Interfaces:**
- Consumes: `useStudents`, `useCreateStudent` from `@/hooks/queries/use-students`

- [ ] **Step 1: Update `StudentsClient.tsx` imports**

Replace:
```tsx
import { useEffect, useState } from "react";
```
With:
```tsx
import { useState, useEffect } from "react";
import { useStudents } from "@/hooks/queries/use-students";
```

Remove the local `interface Student { ... }` block — it's now exported from `use-students.ts`.

- [ ] **Step 2: Replace the `StudentsClient` function body**

Replace from `const router = useRouter()` to the end of the hooks/state setup block. The new setup:

```tsx
export default function StudentsClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState("");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Debounce the search query 300ms
  useEffect(() => {
    const t = setTimeout(() => setQ(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data: students = [], isLoading: loading } = useStudents(q);
```

Remove the old `const [students, setStudents] = useState<Student[]>([])`, `const [search, setSearch] = useState("")`, `const [loading, setLoading] = useState(true)`, the `load()` function, `useEffect(() => { load(); }, [])`.

- [ ] **Step 3: Update search handler and AddStudentDialog callback**

Replace:
```tsx
function onSearch(q: string) {
  setSearch(q);
  const timer = setTimeout(() => load(q), 300);
  return () => clearTimeout(timer);
}
```
With:
```tsx
function onSearch(value: string) {
  setInputValue(value);
}
```

Replace `value={search}` with `value={inputValue}` on the search `<input>`.

Replace the `onCreated` prop:
```tsx
onCreated={() => { setShowAdd(false); load(search); }}
```
With:
```tsx
onCreated={() => setShowAdd(false)}
```

- [ ] **Step 4: Update `AddStudentDialog.tsx`**

Replace imports:
```tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
```
With:
```tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateStudent } from "@/hooks/queries/use-students";
```

Replace the entire `submit` function and `saving` state inside `AddStudentDialog`:

Remove `const [saving, setSaving] = useState(false)` and the old `submit` function. Add:

```tsx
const { mutate: createStudent, isPending: saving } = useCreateStudent();

async function submit(e: React.FormEvent) {
  e.preventDefault();
  if (!form.name.trim()) { toast.error("Tên học sinh không được trống"); return; }
  createStudent(
    { ...form, birthday: "", notes: "", parentName: "", parentPhone: "" },
    {
      onSuccess: (student) => {
        toast.success("Đã thêm học sinh");
        onCreated();
        router.push(`/students/${student.id}`);
      },
      onError: () => toast.error("Thêm học sinh thất bại"),
    }
  );
}
```

- [ ] **Step 5: Verify and test manually**

```bash
yarn build
```

Navigate to `/students` — list loads, search works with debounce (type something, wait 300ms, see results filter). Click "Thêm học sinh" — add a student, verify it appears in list automatically without page reload.

- [ ] **Step 6: Commit**

```bash
git add src/components/students/StudentsClient.tsx src/components/students/AddStudentDialog.tsx
git commit -m "feat: migrate StudentsClient and AddStudentDialog to React Query"
```

---

## Task 6: Migrate StudentDetailClient

**Files:**
- Modify: `src/components/students/StudentDetailClient.tsx`

**Interfaces:**
- Consumes: `useStudent`, `useAddSchedule`, `useRemoveSchedule`, `useEditSchedule` from `@/hooks/queries/use-student`; `useUpdateStudent`, `useDeleteStudent` from `@/hooks/queries/use-students`

- [ ] **Step 1: Update imports**

Replace:
```tsx
import { useEffect, useState, useCallback } from "react";
```
With:
```tsx
import { useEffect, useState } from "react";
import { useStudent, useAddSchedule, useRemoveSchedule, useEditSchedule } from "@/hooks/queries/use-student";
import { useUpdateStudent, useDeleteStudent } from "@/hooks/queries/use-students";
```

Remove the local `interface Schedule`, `interface BillSummary`, `interface Student` blocks — they're now exported from `use-student.ts`. Replace all local usages of `Student` type with `StudentDetail`.

- [ ] **Step 2: Replace state and data loading at the top of `StudentDetailClient`**

Remove:
- `const [student, setStudent] = useState<Student | null>(null)`
- `const [form, setForm] = useState<FormData | null>(null)`
- The `load` `useCallback`
- `useEffect(() => { load() }, [load])`

Add:

```tsx
const { data: student } = useStudent(studentId);
const { mutate: updateStudentMutation, isPending: saving } = useUpdateStudent(studentId);
const { mutate: deleteStudentMutation } = useDeleteStudent(studentId);
const { mutate: addScheduleMutation } = useAddSchedule(studentId);
const { mutate: removeScheduleMutation } = useRemoveSchedule(studentId);
const { mutate: editScheduleMutation } = useEditSchedule(studentId);

const [form, setForm] = useState<FormData | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [addPicker, setAddPicker] = useState<AddPicker | null>(null);
const [editPicker, setEditPicker] = useState<EditPicker | null>(null);

// Sync form when query data arrives or updates (but not while editing)
useEffect(() => {
  if (student && !isEditing) {
    setForm(studentToForm(student));
  }
}, [student, isEditing]);
```

Remove `const [saving, setSaving] = useState(false)` (now comes from `isPending`).

- [ ] **Step 3: Replace `saveStudent`**

Replace:
```tsx
async function saveStudent() {
  if (!form) return;
  setSaving(true);
  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Lưu thất bại");
      return;
    }
    toast.success("Đã lưu thông tin");
    load();
  } finally {
    setSaving(false);
  }
}
```
With:
```tsx
function saveStudent() {
  if (!form) return;
  updateStudentMutation(form, {
    onSuccess: () => {
      toast.success("Đã lưu thông tin");
      setIsEditing(false);
    },
    onError: () => toast.error("Lưu thất bại"),
  });
}
```

- [ ] **Step 4: Replace `pickColor`**

Replace:
```tsx
async function pickColor(hex: string) {
  if (!form) return;
  const newForm = { ...form, color: hex };
  setForm(newForm);
  const res = await fetch(`/api/students/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newForm),
  });
  if (!res.ok) {
    toast.error("Không thể lưu màu");
    return;
  }
  setStudent((s) => (s ? { ...s, color: hex } : s));
}
```
With:
```tsx
function pickColor(hex: string) {
  if (!form) return;
  const newForm = { ...form, color: hex };
  setForm(newForm);
  updateStudentMutation(newForm, {
    onError: () => toast.error("Không thể lưu màu"),
  });
}
```

- [ ] **Step 5: Replace `deleteStudent`**

Replace:
```tsx
async function deleteStudent() {
  if (!confirm("Xóa học sinh này? Hành động không thể hoàn tác.")) return;
  await fetch(`/api/students/${studentId}`, { method: "DELETE" });
  toast.success("Đã xóa học sinh");
  router.push("/students");
}
```
With:
```tsx
function deleteStudent() {
  if (!confirm("Xóa học sinh này? Hành động không thể hoàn tác.")) return;
  deleteStudentMutation(undefined, {
    onSuccess: () => {
      toast.success("Đã xóa học sinh");
      router.push("/students");
    },
  });
}
```

- [ ] **Step 6: Replace `removeSchedule`, `addSchedule`, `editSchedule`**

Replace:
```tsx
async function removeSchedule(scheduleId: number) {
  await fetch(`/api/students/${studentId}/schedules`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduleId }),
  });
  load();
}

async function addSchedule(dayOfWeek: number, startTime: string, endTime: string) {
  const res = await fetch(`/api/students/${studentId}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dayOfWeek, startTime, endTime }),
  });
  if (!res.ok) {
    toast.error("Thêm lịch thất bại");
    return;
  }
  toast.success("Đã thêm lịch");
  setAddPicker(null);
  load();
}

async function editSchedule(scheduleId: number, startTime: string, endTime: string) {
  const res = await fetch(`/api/students/${studentId}/schedules`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduleId, startTime, endTime }),
  });
  if (!res.ok) {
    toast.error("Cập nhật lịch thất bại");
    return;
  }
  toast.success("Đã cập nhật lịch");
  setEditPicker(null);
  load();
}
```
With:
```tsx
function removeSchedule(scheduleId: number) {
  removeScheduleMutation(scheduleId);
}

function addSchedule(dayOfWeek: number, startTime: string, endTime: string) {
  addScheduleMutation(
    { dayOfWeek, startTime, endTime },
    {
      onSuccess: () => {
        toast.success("Đã thêm lịch");
        setAddPicker(null);
      },
      onError: () => toast.error("Thêm lịch thất bại"),
    }
  );
}

function editSchedule(scheduleId: number, startTime: string, endTime: string) {
  editScheduleMutation(
    { scheduleId, startTime, endTime },
    {
      onSuccess: () => {
        toast.success("Đã cập nhật lịch");
        setEditPicker(null);
      },
      onError: () => toast.error("Cập nhật lịch thất bại"),
    }
  );
}
```

- [ ] **Step 7: Fix the loading/null guard**

The current guard at the top uses `!student || !form`. Keep it, but note that `student` now comes from `useStudent()` which returns `undefined` while loading (not `null`). The guard `!student || !form` still works since `undefined` is falsy.

- [ ] **Step 8: Verify and test manually**

```bash
yarn build
```

Navigate to a student's detail page. Verify:
- Page loads (shows student info)
- Edit info and save — toast shows, form resets to saved values
- Add/remove/edit a schedule — updates reflect immediately
- Pick a color — color saves
- Delete student — navigates back to `/students`

- [ ] **Step 9: Commit**

```bash
git add src/components/students/StudentDetailClient.tsx
git commit -m "feat: migrate StudentDetailClient to React Query"
```

---

## Task 7: Migrate BillDetailClient

**Files:**
- Modify: `src/components/bills/BillDetailClient.tsx`

**Interfaces:**
- Consumes: `useBill`, `useUpdateSession`, `usePayBill` from `@/hooks/queries/use-bill`

- [ ] **Step 1: Update imports**

Add after the existing imports:
```tsx
import { useBill, useUpdateSession, usePayBill } from "@/hooks/queries/use-bill";
```

Remove the local `interface BillSession` and `interface Bill` blocks.

- [ ] **Step 2: Replace state and load function inside `BillDetailClient`**

Remove:
- `const [bill, setBill] = useState<Bill | null>(null)`
- `const [payLoading, setPayLoading] = useState(false)`
- The `load` function
- `useEffect(() => { load(); }, [billId])`

Add:
```tsx
const { data: bill } = useBill(billId);
const { mutate: updateSessionMutation } = useUpdateSession(billId);
const { mutate: markPaidMutation, isPending: payLoading } = usePayBill(billId);
```

- [ ] **Step 3: Replace `saveSession` and `markPaid`**

Replace:
```tsx
async function saveSession(sessionId: number, updates: Record<string, unknown>) {
  await fetch(`/api/bills/${billId}/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  load();
}

async function markPaid() {
  setPayLoading(true);
  try {
    const res = await fetch(`/api/bills/${billId}/pay`, { method: "POST" });
    if (!res.ok) { toast.error("Thao tác thất bại"); return; }
    toast.success("Đã đánh dấu thanh toán");
    load();
  } finally {
    setPayLoading(false);
  }
}
```
With:
```tsx
function saveSession(sessionId: number, updates: Record<string, unknown>) {
  updateSessionMutation({ sessionId, updates });
}

function markPaid() {
  markPaidMutation(undefined, {
    onSuccess: () => toast.success("Đã đánh dấu thanh toán"),
    onError: () => toast.error("Thao tác thất bại"),
  });
}
```

The `toggleAttended` function remains unchanged — it already calls `saveSession`.

- [ ] **Step 4: Fix the null guard**

`bill` is now `undefined` while loading (not `null`). The guard `if (!bill) return (...)` still works correctly.

- [ ] **Step 5: Verify and test manually**

```bash
yarn build
```

Navigate to a bill's detail page. Verify:
- Bill loads with sessions
- Checking/unchecking attendance — updates immediately (no full reload flash)
- "Đánh dấu thanh toán" button — marks paid, toast shows, status updates

- [ ] **Step 6: Commit**

```bash
git add src/components/bills/BillDetailClient.tsx
git commit -m "feat: migrate BillDetailClient to React Query"
```

---

## Task 8: Migrate CalendarClient

**Files:**
- Modify: `src/components/calendar/CalendarClient.tsx`

**Interfaces:**
- Consumes: `useCalendar`, `CalendarSession` from `@/hooks/queries/use-calendar`

- [ ] **Step 1: Update imports**

Replace:
```tsx
import { useEffect, useState } from "react";
```
With:
```tsx
import { useState } from "react";
import { useCalendar } from "@/hooks/queries/use-calendar";
```

Remove the local `interface Session` block (use `CalendarSession` from the hook, or keep local if the component uses the type internally only — in that case just remove the import of the interface if unused).

- [ ] **Step 2: Replace state and effect in `CalendarClient`**

Remove these three lines:
```tsx
const [sessions, setSessions] = useState<Session[]>([]);
const [loading, setLoading] = useState(true);
```
And remove this `useEffect`:
```tsx
useEffect(() => {
  setLoading(true);
  fetch(`/api/calendar?weekStart=${weekStart}`)
    .then((r) => r.json())
    .then(setSessions)
    .finally(() => setLoading(false));
}, [weekStart]);
```

Add after the `weekStart` useState:
```tsx
const { data: sessions = [], isLoading: loading } = useCalendar(weekStart);
```

The `weekStart` useState initializer stays unchanged:
```tsx
const [weekStart, setWeekStart] = useState(() =>
  weekStartStr(new Date().toISOString().slice(0, 10)),
);
```

- [ ] **Step 3: Verify and test manually**

```bash
yarn build
```

Navigate to `/calendar`. Verify:
- Week loads with sessions
- Navigate to previous/next week — loads instantly on cached weeks, fetches on new weeks

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar/CalendarClient.tsx
git commit -m "feat: migrate CalendarClient to React Query"
```

---

## Task 9: Migrate ReportClient

**Files:**
- Modify: `src/components/report/ReportClient.tsx`

**Interfaces:**
- Consumes: `useReport`, `Report` from `@/hooks/queries/use-report`

- [ ] **Step 1: Update imports**

Replace:
```tsx
import { useEffect, useState } from "react";
```
With:
```tsx
import { useState } from "react";
import { useReport } from "@/hooks/queries/use-report";
```

- [ ] **Step 2: Replace state and effect**

Remove:
```tsx
const [report, setReport] = useState<Report | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  fetch(`/api/report?month=${month}`)
    .then((r) => r.json())
    .then(setReport)
    .finally(() => setLoading(false));
}, [month]);
```

Add:
```tsx
const { data: report, isLoading: loading } = useReport(month);
```

Also remove the local `interface StudentReport` and `interface Report` blocks — they're now in `use-report.ts`. Change `report?.total ?? 0` etc. to use the query data directly (same pattern, no change needed since `report` is now `Report | undefined` instead of `Report | null`, but `??` handles both).

- [ ] **Step 3: Verify and test manually**

```bash
yarn build
```

Navigate to `/report`. Verify:
- Report loads for current month
- Navigate to previous/next month — data updates

- [ ] **Step 4: Final end-to-end verification**

Run the dev server and do a complete walkthrough:

1. Open dashboard (`/`) — loads stats, today's schedule
2. Navigate to `/students` — list loads, search works
3. Open a student detail — info, schedules, bills load
4. Edit student info, save — form updates with saved data
5. Navigate back to `/students` — list is already cached (no loading spinner)
6. Navigate to `/calendar` — week view loads
7. Open a bill — sessions load, toggle attendance
8. Navigate to `/report` — monthly data loads
9. Navigate back to `/` — dashboard data is already cached (instant load)

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ReportClient.tsx
git commit -m "feat: migrate ReportClient to React Query"
```
