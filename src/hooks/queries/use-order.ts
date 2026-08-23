import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'
import type { CustomerContact } from './use-customers'
import type { OrderListLine } from './use-orders'

export interface OrderDetailLine {
  id: number
  warrantyType: 'kbh' | 'bhf' | 'days'
  warrantyUntil: string | null
  warrantyDays: number | null
  price: number
  replaceAllowed: boolean
  currentAccount: {
    id: number
    type: 'netflix' | 'gpt_plus'
    email: string
    password: string
    twoFactorSecret: string | null
    expiryDate: string
    status: 'available' | 'sold'
  } | null
  assignments: {
    id: number
    assignedAt: string
    replacedAt: string | null
    account: NonNullable<OrderListLine['currentAccount']>
  }[]
}

export interface OrderDetail {
  id: number
  createdAt: string
  notes: string | null
  totalPrice: number
  customer: { id: number; name: string; contacts: CustomerContact[] }
  lines: OrderDetailLine[]
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: keys.orders.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<OrderDetail>(`/api/orders/${id}`),
  })
}

export function useDeleteOrder(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/orders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.orders.all() })
      qc.invalidateQueries({ queryKey: keys.customers.all() })
      qc.invalidateQueries({ queryKey: keys.accounts.all() })
    },
  })
}

export function useReplaceOrderLine(orderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lineId, accountId }: { lineId: number; accountId: number }) =>
      api<OrderDetail>(`/api/orders/${orderId}/lines/${lineId}/replace`, {
        method: 'POST',
        body: { accountId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.orders.all() })
      qc.invalidateQueries({ queryKey: keys.orders.detail(orderId) })
      qc.invalidateQueries({ queryKey: keys.accounts.all() })
    },
  })
}

export function useCopyOrderText(orderId: number) {
  return useMutation({
    mutationFn: (ids?: number[]) =>
      api<{ text: string }>(`/api/orders/${orderId}/copy-text`, {
        method: 'POST',
        body: ids ? { ids } : {},
      }),
  })
}
