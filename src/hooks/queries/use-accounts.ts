import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export interface InventoryAccount {
  id: number
  type: 'netflix' | 'gpt_plus'
  email: string
  password: string
  twoFactorSecret: string | null
  expiryDate: string
  quotaPercent: number | null
  status: 'available' | 'sold'
  notes: string | null
  createdAt: string
}

export interface CreateAccountInput {
  type: 'netflix' | 'gpt_plus'
  email: string
  password: string
  twoFactorSecret?: string
  expiryDate: string
  quotaPercent?: number
  notes?: string
}

export interface ImportAccountsInput {
  type: 'netflix' | 'gpt_plus'
  text: string
}

export function useAccounts(status = 'available', type = '') {
  return useQuery({
    queryKey: keys.accounts.list(status, type),
    queryFn: () => {
      const params = new URLSearchParams({ status, ...(type ? { type } : {}) })
      return api<InventoryAccount[]>(`/api/accounts?${params.toString()}`)
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAccountInput) =>
      api<InventoryAccount>('/api/accounts', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}

export function useImportAccounts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ImportAccountsInput) =>
      api<{ created: number }>('/api/accounts/import', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts.all() }),
  })
}
