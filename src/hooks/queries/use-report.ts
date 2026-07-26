import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

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
  totalBillCount: number
  unpaidBillCount: number
  total: number
  students: StudentReport[]
}

export function useReport(month: string) {
  return useQuery({
    queryKey: keys.report.month(month),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: () => api<Report>(`/api/report?month=${month}`),
  })
}
