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
    queryFn: async () => {
      const res = await fetch(`/api/report?month=${month}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Report>
    },
  })
}
