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
