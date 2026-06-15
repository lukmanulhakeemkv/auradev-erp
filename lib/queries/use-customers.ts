'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCustomers } from '@/lib/billing-api'
import { useAuth } from '@/lib/auth-context'
import { queryKeys } from './keys'

const CUSTOMERS_STALE_MS = 10 * 60_000

export function useCustomersQuery() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: fetchCustomers,
    enabled: Boolean(user),
    staleTime: CUSTOMERS_STALE_MS,
  })
}
