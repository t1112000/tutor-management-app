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
