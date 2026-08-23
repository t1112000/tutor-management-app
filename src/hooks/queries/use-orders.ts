import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export interface OrderListLine {
  id: number
  warrantyType: 'kbh' | 'bhf' | 'days'
  warrantyUntil: string | null
  warrantyDays: number | null
  price: number
  currentAccount: {
    id: number
    type: 'netflix' | 'gpt_plus'
    email: string
    expiryDate: string
    status: 'available' | 'sold'
  } | null
}

export interface OrderListItem {
  id: number
  createdAt: string
  notes: string | null
  totalPrice: number
  customer: { id: number; name: string }
  lines: OrderListLine[]
}

export interface OrderCreateInput {
  customerId?: number
  customer?: { name: string; notes?: string; contacts?: { type: 'facebook'|'zalo'|'discord'|'telegram'; value: string }[] }
  notes?: string
  lines: { accountId: number; warrantyType: 'kbh'|'bhf'|'days'; warrantyDays?: number; price: number }[]
}

export function useOrders(customerId = '') {
  return useQuery({
    queryKey: keys.orders.list(customerId),
    queryFn: () =>
      api<OrderListItem[]>(
        customerId ? `/api/orders?customerId=${encodeURIComponent(customerId)}` : '/api/orders'
      ),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: OrderCreateInput) =>
      api<OrderListItem>('/api/orders', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.orders.all() })
      qc.invalidateQueries({ queryKey: keys.customers.all() })
      qc.invalidateQueries({ queryKey: keys.accounts.all() })
    },
  })
}
