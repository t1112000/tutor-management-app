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
