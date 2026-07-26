import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

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

export interface CreateBillInput {
  studentId: number
  sessionCount: number
  totalAmount: number
  startDate: string
  notes?: string
  sessions: Array<{ scheduledDate: string; startTime: string; endTime: string }>
}

export function useBill(id: number) {
  return useQuery({
    queryKey: keys.bills.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<Bill>(`/api/bills/${id}`),
  })
}

export function useCreateBill(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBillInput) =>
      api<{ id: number }>('/api/bills', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: keys.students.all() })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useUpdateSession(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: number; updates: Record<string, unknown> }) =>
      api(`/api/bills/${billId}/sessions/${sessionId}`, { method: 'PUT', body: updates }),

    // Attendance is the core daily interaction: it must feel instant, and a
    // failure must roll back visibly instead of silently keeping the old value.
    onMutate: async ({ sessionId, updates }) => {
      const key = keys.bills.detail(billId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Bill>(key)
      if (previous) {
        qc.setQueryData<Bill>(key, {
          ...previous,
          sessions: previous.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.bills.detail(billId), context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function usePayBill(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/bills/${billId}/pay`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
      qc.invalidateQueries({ queryKey: keys.students.all() })
    },
  })
}

export function useUnpayBill(billId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/bills/${billId}/unpay`, { method: 'POST' }),
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
    mutationFn: () => api(`/api/bills/${billId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useUpdateBill(billId: number, studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: { totalAmount: number; notes: string | null }) =>
      api(`/api/bills/${billId}`, { method: 'PUT', body: updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
    },
  })
}

export function useAddSession(billId: number, studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { scheduledDate: string; startTime: string; endTime: string }) =>
      api(`/api/bills/${billId}/sessions`, { method: 'POST', body: input }),
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
    mutationFn: (sessionId: number) =>
      api(`/api/bills/${billId}/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bills.detail(billId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
    },
  })
}
