import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export type CustomerContactType = 'facebook' | 'zalo' | 'discord' | 'telegram'

export interface CustomerContact {
  id: number
  type: CustomerContactType
  value: string
}

export interface CustomerListItem {
  id: number
  name: string
  notes: string | null
  contacts: CustomerContact[]
}

export interface CustomerInput {
  name: string
  notes?: string
  contacts?: { type: CustomerContactType; value: string }[]
}

export function useCustomers(q = '') {
  return useQuery({
    queryKey: keys.customers.list(q),
    queryFn: () =>
      api<CustomerListItem[]>(q ? `/api/customers?q=${encodeURIComponent(q)}` : '/api/customers'),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      api<CustomerListItem>('/api/customers', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customers.all() }),
  })
}
