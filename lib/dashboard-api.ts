import { apiFetch } from './api'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

interface DashboardKpis {
  todaySales: number
  yesterdaySales: number
  billsToday: number
  billsYesterday: number
  itemsSoldToday: number
  itemsSoldYesterday: number
  lowStockCount: number
}

interface SalesDayPoint {
  day: string
  current: number
  previous: number
}

interface TopProductPoint {
  name: string
  quantity: number
  revenue: number
}

interface RecentBillRow {
  billNo: string
  customer: string
  cashier: string
  items: number
  total: number
  payment: string
  status: string
  createdAt: string
}

interface LowStockRow {
  id: string
  name: string
  sku: string
  category: string
  unitLabel: string
  stock: number
  reorder: number
  status: 'LOW' | 'OUT'
}

interface ActivityRow {
  who: string
  action: string
  detail: string
  icon: string
  tone: string
  createdAt: string
}

interface DashboardApiResponse {
  tenantName: string
  userName: string
  kpis: DashboardKpis
  salesTrend: SalesDayPoint[]
  topProducts: TopProductPoint[]
  recentBills: RecentBillRow[]
  lowStock: LowStockRow[]
  activity: ActivityRow[]
  aiBrief: string
}

// ── View models ───────────────────────────────────────────────────────────────

export interface DashboardData {
  tenantName: string
  userName: string
  kpis: {
    todaySales: number
    billsToday: number
    itemsSoldToday: number
    lowStockCount: number
    salesTrend: { value: string; dir: 'up' | 'down'; vs: string }
    billsTrend: { value: string; dir: 'up' | 'down'; vs: string }
    itemsTrend: { value: string; dir: 'up' | 'down'; vs: string }
  }
  salesTrend: { d: string; cur: number; prev: number }[]
  topProducts: { name: string; qty: number; rev: number }[]
  recentBills: {
    no: string
    cust: string
    cashier: string
    items: number
    total: number
    pay: string
    status: string
    time: string
  }[]
  lowStock: {
    id: string
    name: string
    stock: number
    unit: string
    reorder: number
    status: 'low' | 'out'
  }[]
  activity: {
    who: string
    act: string
    detail: string
    icon: string
    tone: string
    time: string
  }[]
  aiBrief: string
}

function trend(current: number, previous: number): { value: string; dir: 'up' | 'down'; vs: string } {
  if (previous === 0) {
    if (current > 0) return { value: 'New', dir: 'up', vs: 'vs yesterday' }
    return { value: '0%', dir: 'up', vs: 'vs yesterday' }
  }
  const pct = ((current - previous) / previous) * 100
  const dir: 'up' | 'down' = pct < 0 ? 'down' : 'up'
  const value = pct === 0
    ? '0%'
    : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
  return { value, dir, vs: 'vs yesterday' }
}

function trendCount(current: number, previous: number): { value: string; dir: 'up' | 'down'; vs: string } {
  const delta = current - previous
  const dir: 'up' | 'down' = delta < 0 ? 'down' : 'up'
  return {
    value: delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`,
    dir,
    vs: 'vs yesterday',
  }
}

function formatBillTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatActivityTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function mapUnitLabel(label: string): string {
  return label === 'kg' ? 'kg' : 'pcs'
}

function mapDashboard(raw: DashboardApiResponse): DashboardData {
  const k = raw.kpis ?? {
    todaySales: 0,
    yesterdaySales: 0,
    billsToday: 0,
    billsYesterday: 0,
    itemsSoldToday: 0,
    itemsSoldYesterday: 0,
    lowStockCount: 0,
  }

  return {
    tenantName: raw.tenantName ?? 'Your store',
    userName: raw.userName ?? 'there',
    kpis: {
      todaySales: Number(k.todaySales ?? 0),
      billsToday: Number(k.billsToday ?? 0),
      itemsSoldToday: Number(k.itemsSoldToday ?? 0),
      lowStockCount: Number(k.lowStockCount ?? 0),
      salesTrend: trend(Number(k.todaySales ?? 0), Number(k.yesterdaySales ?? 0)),
      billsTrend: trendCount(Number(k.billsToday ?? 0), Number(k.billsYesterday ?? 0)),
      itemsTrend: trend(Number(k.itemsSoldToday ?? 0), Number(k.itemsSoldYesterday ?? 0)),
    },
    salesTrend: (raw.salesTrend ?? []).map(p => ({
      d: p.day,
      cur: Number(p.current ?? 0),
      prev: Number(p.previous ?? 0),
    })),
    topProducts: (raw.topProducts ?? []).map(p => ({
      name: p.name,
      qty: Number(p.quantity ?? 0),
      rev: Number(p.revenue ?? 0),
    })),
    recentBills: (raw.recentBills ?? []).map(b => ({
      no: b.billNo,
      cust: b.customer,
      cashier: b.cashier,
      items: Number(b.items ?? 0),
      total: Number(b.total ?? 0),
      pay: b.payment ?? 'Cash',
      status: (b.status ?? 'paid').toLowerCase(),
      time: b.createdAt ? formatBillTime(b.createdAt) : '—',
    })),
    lowStock: (raw.lowStock ?? []).map(p => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock ?? 0),
      unit: mapUnitLabel(p.unitLabel ?? 'pcs'),
      reorder: Number(p.reorder ?? 0),
      status: p.status === 'OUT' ? 'out' : 'low',
    })),
    activity: (raw.activity ?? []).map(a => ({
      who: a.who ?? 'System',
      act: a.action ?? 'updated',
      detail: a.detail ?? '',
      icon: a.icon ?? 'package',
      tone: a.tone ?? 'neutral',
      time: a.createdAt ? formatActivityTime(a.createdAt) : '—',
    })),
    aiBrief: raw.aiBrief ?? 'Dashboard data loaded.',
  }
}

export async function fetchDashboard(range: 'today' | 'week' | 'month' = 'week'): Promise<DashboardData> {
  const data = await apiFetch<DashboardApiResponse>(`/api/v1/dashboard?range=${range}`)
  return mapDashboard(data)
}

export function greetingFor(name: string): string {
  const hour = new Date().getHours()
  const salute = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = name.split(' ')[0] || name
  return `${salute}, ${first}`
}
