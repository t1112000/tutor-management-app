import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'
import type { CustomerContact, CustomerInput } from './use-customers'

export interface CustomerOrderSummary {
  id: number
  createdAt: string
  lineCount: number
  totalPrice: number
}

export interface CustomerDetail {
  id: number
  name: string
  notes: string | null
  createdAt: string
  contacts: CustomerContact[]
  orders: CustomerOrderSummary[]
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: keys.customers.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<CustomerDetail>(`/api/customers/${id}`),
  })
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      api<CustomerDetail>(`/api/customers/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.customers.detail(id) })
      qc.invalidateQueries({ queryKey: keys.customers.all() })
    },
  })
}

export function useDeleteCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customers.all() }),
  })
}
