import { apiFetch } from './api'
import type { Product } from './erp-data'

// ── Backend DTOs ──────────────────────────────────────────────────────────────
// Adjust field names here if your Spring Boot DTOs differ.

interface ApiProduct {
  id: string
  name: string
  sku: string
  barcode: string | null
  category: string | { id: string; name: string }
  unit: 'kg' | 'pcs'
  mrp: number
  price: number
  cost: number
  taxRate: number
  stock: number
  reorderLevel: number
}

interface ApiCategory {
  id: string
  name: string
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode ?? '—',
    cat: typeof p.category === 'string' ? p.category : (p.category as { name: string }).name,
    unit: p.unit,
    mrp: p.mrp,
    price: p.price,
    cost: p.cost ?? 0,
    tax: p.taxRate ?? 0,
    stock: p.stock ?? 0,
    reorder: p.reorderLevel ?? 0,
  }
}

// ── Form type ─────────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string
  sku: string
  barcode: string
  cat: string
  unit: string
  mrp: string
  price: string
  cost: string
  tax: string
  reorder: string
  stock: string
}

function toApiBody(f: ProductFormData) {
  return {
    name: f.name,
    sku: f.sku,
    barcode: f.barcode || null,
    category: f.cat,
    unit: f.unit,
    mrp: +f.mrp,
    price: +f.price,
    cost: +f.cost || 0,
    taxRate: +f.tax,
    stock: +f.stock || 0,
    reorderLevel: +f.reorder || 0,
  }
}

// ── Products CRUD ─────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const data = await apiFetch<Page<ApiProduct>>('/api/v1/products?size=1000&sort=name,asc')
  return data.content.map(mapProduct)
}

export async function createProduct(f: ProductFormData): Promise<Product> {
  const created = await apiFetch<ApiProduct>('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(toApiBody(f)),
  })
  return mapProduct(created)
}

export async function updateProduct(id: string, f: ProductFormData): Promise<Product> {
  const updated = await apiFetch<ApiProduct>(`/api/v1/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(f)),
  })
  return mapProduct(updated)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/v1/products/${id}`, { method: 'DELETE' })
}

// ── Stock adjust ──────────────────────────────────────────────────────────────

export async function adjustStock(
  id: string,
  delta: number,
  reason: string,
  notes: string,
): Promise<Product> {
  const updated = await apiFetch<ApiProduct>(`/api/v1/products/${id}/stock-adjust`, {
    method: 'POST',
    body: JSON.stringify({ quantity: delta, reason, notes: notes || null }),
  })
  return mapProduct(updated)
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<string[]> {
  const data = await apiFetch<ApiCategory[]>('/api/v1/categories')
  return data.map(c => c.name)
}
