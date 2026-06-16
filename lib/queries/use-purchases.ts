import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPurchase,
  fetchPurchases,
  fetchSuppliers,
} from '@/lib/purchases-api'

export function useSuppliersQuery() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
    staleTime: 5 * 60_000,
  })
}

export function usePurchasesQuery(
  q: string,
  statusApi: string,
  supplierId: string,
  page: number,
) {
  return useQuery({
    queryKey: ['purchases', q, statusApi, supplierId, page],
    queryFn: () => fetchPurchases(q, statusApi, supplierId, page),
    placeholderData: prev => prev,
  })
}

export function usePurchaseKpisQuery() {
  return useQuery({
    queryKey: ['purchases-kpis'],
    queryFn: () => fetchPurchases('', 'all', '', 0, 500),
    staleTime: 60_000,
  })
}

export function usePurchaseQuery(id: string | null) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: () => fetchPurchase(id!),
    enabled: Boolean(id),
  })
}

export function useInvalidatePurchases() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['purchases'] })
    void qc.invalidateQueries({ queryKey: ['purchase'] })
    void qc.invalidateQueries({ queryKey: ['purchases-kpis'] })
  }
}

export function useInvalidateSuppliers() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ['suppliers'] })
}
