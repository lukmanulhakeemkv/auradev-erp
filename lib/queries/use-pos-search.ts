'use client'

import { useQuery } from '@tanstack/react-query'
import { searchProducts } from '@/lib/inventory-api'
import { useAuth } from '@/lib/auth-context'
import { queryKeys } from './keys'

const POS_SEARCH_STALE_MS = 30_000

export function usePosSearchQuery(q: string) {
  const { user } = useAuth()
  const trimmed = q.trim()
  return useQuery({
    queryKey: queryKeys.posSearch(trimmed),
    queryFn: () => searchProducts(trimmed, 12),
    enabled: Boolean(user) && trimmed.length >= 2,
    staleTime: POS_SEARCH_STALE_MS,
  })
}
