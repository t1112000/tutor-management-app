import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'
import type { InventoryAccount } from './use-accounts'

export interface UpdateAccountInput {
  email?: string
  password?: string
  twoFactorSecret?: string | null
  expiryDate?: string
  quotaPercent?: number | null
  status?: 'available' | 'sold'
  notes?: string | null
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: keys.accounts.detail(id),
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => api<InventoryAccount>(`/api/accounts/${id}`),
  })
}

export function useUpdateAccount(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAccountInput) =>
      api<InventoryAccount>(`/api/accounts/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts.detail(id) })
      qc.invalidateQueries({ queryKey: keys.accounts.all() })
    },
  })
}

export function useDeleteAccount(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/api/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}
