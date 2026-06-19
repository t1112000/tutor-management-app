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
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}

export function useDeleteBill(billId: number, studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await expectOk(await fetch(`/api/bills/${billId}`, { method: 'DELETE' }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
    },
  })
}

export function useUpdateBill(billId: number, studentId: number) {
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
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
    },
  })
}

export function useAddSession(billId: number, studentId: number) {
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
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useDeleteSession(billId: number, studentId: number) {
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
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
    },
  })
}
