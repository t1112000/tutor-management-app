import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

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

export function useStudent(id: number) {
  return useQuery({
    queryKey: keys.students.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<StudentDetail>(`/api/students/${id}`),
  })
}

export function useAddSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { dayOfWeek: number; startTime: string; endTime: string }) =>
      api(`/api/students/${studentId}/schedules`, { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useRemoveSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scheduleId: number) =>
      api(`/api/students/${studentId}/schedules`, { method: 'DELETE', body: { scheduleId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useEditSchedule(studentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { scheduleId: number; startTime: string; endTime: string }) =>
      api(`/api/students/${studentId}/schedules`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(studentId) })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}
