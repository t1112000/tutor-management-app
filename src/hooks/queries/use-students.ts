import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export interface Student {
  id: number
  name: string
  subject: 'english' | 'chinese'
  phone: string | null
  deletedAt?: string | null
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

export function useStudents(q = '', deleted = false) {
  return useQuery({
    queryKey: keys.students.list(q, deleted),
    queryFn: () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (deleted) params.set('deleted', '1')
      const qs = params.toString()
      return api<Student[]>(qs ? `/api/students?${qs}` : '/api/students')
    },
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStudentInput) =>
      api<Student>('/api/students', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.all() })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useUpdateStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: StudentForm) => api(`/api/students/${id}`, { method: 'PUT', body: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.detail(id) })
      qc.invalidateQueries({ queryKey: keys.students.all() })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
    },
  })
}

export function useDeleteStudent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.students.all() })
      qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
      qc.invalidateQueries({ queryKey: ['report'], exact: false })
    },
  })
}

function invalidateAfterStudentChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.students.all() })
  qc.invalidateQueries({ queryKey: ['calendar'], exact: false })
  qc.invalidateQueries({ queryKey: ['report'], exact: false })
}

/** Soft-delete from the list, where the id is only known at call time. */
export function useDeleteStudentById() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAfterStudentChange(qc),
  })
}

export function useRestoreStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/students/${id}/restore`, { method: 'POST' }),
    onSuccess: () => invalidateAfterStudentChange(qc),
  })
}
