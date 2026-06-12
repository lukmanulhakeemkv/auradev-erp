import { apiFetch } from './api'

export interface ApiSearchHit {
  type: 'PRODUCT' | 'BILL' | 'CATEGORY'
  id: string
  label: string
  subtitle: string
  query: string
}

export interface ApiSearchResponse {
  results: ApiSearchHit[]
}

export async function fetchGlobalSearch(q: string, limit = 12): Promise<ApiSearchHit[]> {
  const data = await apiFetch<ApiSearchResponse>(
    `/api/v1/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  )
  return data.results
}
