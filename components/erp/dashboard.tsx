'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Icon, Button, Badge, KpiCard, Card, Segmented, IconTile, useToast,
} from './ui'
import { money } from '@/lib/erp-data'
import { fetchDashboard, greetingFor, type DashboardData } from '@/lib/dashboard-api'
import { useAuth } from '@/lib/auth-context'

function LineChart({ data }: { data: { d: string; cur: number; prev: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="empty" style={{ padding: '48px 20px' }}>
        <div className="ei"><Icon name="bar-chart-3" size={22} /></div>
        <div style={{ fontWeight: 600, color: 'var(--fg)' }}>No sales data yet</div>
        <div>Bills completed today will appear here.</div>
      </div>
    )
  }

  const W = 720, H = 230, padL = 46, padR = 14, padT = 14, padB = 28
  const max = Math.max(...data.flatMap(d => [d.cur, d.prev]), 1)
  const niceMax = Math.ceil(max / 20000) * 20000 || 20000
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(data.length - 1, 1)
  const y = (v: number) => padT + (1 - v / niceMax) * (H - padT - padB)
  const line = (key: 'cur' | 'prev') =>
    data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')
  const area =
    data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.cur).toFixed(1)}`).join(' ') +
    ` L${x(data.length - 1)},${H - padB} L${x(0)},${H - padB} Z`
  const ticks = [0, niceMax / 2, niceMax]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">
            {'₹' + t / 1000 + 'k'}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#areaG)" />
      <path d={line('prev')} fill="none" stroke="var(--fg-subtle)" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" opacity="0.7" />
      <path d={line('cur')} fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.cur)} r="3.4" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />)}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fontSize="11" fill="var(--fg-subtle)">{d.d}</text>
      ))}
    </svg>
  )
}

function TopProductsChart({ data }: { data: DashboardData['topProducts'] }) {
  if (data.length === 0) {
    return (
      <div className="empty" style={{ padding: '32px 12px' }}>
        <div className="ei"><Icon name="package" size={22} /></div>
        <div style={{ fontWeight: 600, color: 'var(--fg)' }}>No sales today</div>
        <div className="muted" style={{ fontSize: 13 }}>Top sellers will show after the first bill.</div>
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.rev), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 550 }}>{d.name}</span>
            <span className="tnum mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {money(d.rev)} · {d.qty}u
            </span>
          </div>
          <div className="bar">
            <i style={{
              width: (d.rev / max * 100) + '%',
              background: i === 0 ? 'var(--primary)' : `color-mix(in oklab, var(--primary) ${78 - i * 13}%, var(--surface-3))`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard({ setView }: { setView: (v: string) => void }) {
  const { user } = useAuth()
  const toast = useToast()
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadSeq = useRef(0)

  const load = useCallback(async (r: 'today' | 'week' | 'month') => {
    const seq = ++loadSeq.current
    setLoading(true)
    setError(null)
    try {
      const next = await fetchDashboard(r)
      if (seq !== loadSeq.current) return
      setData(next)
    } catch (e) {
      if (seq !== loadSeq.current) return
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      if (seq === loadSeq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    load(range)
  }, [user, range, load])

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
  const greeting = data ? greetingFor(data.userName) : (user ? greetingFor(user.name) : 'Welcome')
  const tenant = data?.tenantName ?? 'Your store'

  if (!data) {
    return (
      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1480, margin: '0 auto' }}>
        <div className="empty" style={{ padding: '80px 0' }}>
          {error ? (
            <>
              <div className="ei"><Icon name="alert-circle" size={22} /></div>
              <div style={{ fontWeight: 600, color: 'var(--danger-fg)', marginBottom: 8 }}>{error}</div>
              <div className="muted" style={{ fontSize: 13, maxWidth: 420, margin: '0 auto 12px' }}>
                Ensure the backend is running with the latest code on port 8080, then retry.
              </div>
              <Button size="sm" variant="outline" icon="refresh-cw" onClick={() => load(range)}>Retry</Button>
            </>
          ) : (
            <>
              <Icon name="loader-2" size={24} />
              <div style={{ marginTop: 12, fontWeight: 600 }}>Loading dashboard…</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const d = data
  const lowStock = d.lowStock ?? []

  return (
    <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1480, margin: '0 auto' }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="section-title">{greeting} 👋</div>
          <div className="section-sub">{tenant} · Counter activity for today, {today}</div>
        </div>
        <div className="row gap8">
          <Button size="sm" icon="refresh-cw" onClick={() => load(range)} disabled={loading}>Refresh</Button>
          <Button size="sm" icon="package-plus" onClick={() => setView('inventory')}>Stock Adjustment</Button>
          <Button size="sm" icon="plus" onClick={() => setView('inventory')}>Add Product</Button>
          <Button size="sm" variant="primary" icon="scan-line" onClick={() => setView('pos')}>New Bill</Button>
        </div>
      </div>

      {error && (
        <div className="alert-banner" style={{ borderColor: 'color-mix(in oklab, var(--danger) 35%, transparent)' }}>
          <Icon name="alert-circle" size={18} />
          <span>{error}</span>
          <div style={{ flex: 1 }} />
          <Button size="sm" variant="outline" onClick={() => load(range)}>Retry</Button>
        </div>
      )}

      <div className="ai-banner">
        <div className="ai-ic"><Icon name="sparkles" size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, fontSize: 13.5, color: 'var(--primary-soft-fg)' }}>AuraDev AI · Daily brief</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>{d.aiBrief}</div>
          {lowStock.length > 0 && (
            <div className="row gap8" style={{ marginTop: 9, flexWrap: 'wrap' }}>
              <span className="ai-chip"><Icon name="package" size={14} />{lowStock.length} items need reorder attention</span>
            </div>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Today's Sales"
          value={money(d.kpis.todaySales)}
          icon="indian-rupee"
          tone="tile-primary"
          trend={d.kpis.salesTrend.value}
          trendDir={d.kpis.salesTrend.dir}
          vs={d.kpis.salesTrend.vs}
        />
        <KpiCard
          label="Bills Today"
          value={String(d.kpis.billsToday)}
          icon="receipt"
          tone="tile-info"
          trend={d.kpis.billsTrend.value}
          trendDir={d.kpis.billsTrend.dir}
          vs={d.kpis.billsTrend.vs}
        />
        <KpiCard
          label="Items Sold"
          value={String(d.kpis.itemsSoldToday)}
          icon="shopping-basket"
          tone="tile-success"
          trend={d.kpis.itemsTrend.value}
          trendDir={d.kpis.itemsTrend.dir}
          vs={d.kpis.itemsTrend.vs}
        />
        <KpiCard
          label="Low Stock Alerts"
          value={String(d.kpis.lowStockCount)}
          icon="alert-triangle"
          tone="tile-warning"
          vs="active alerts"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>
        <Card
          title="Sales trend"
          sub={range === 'today' ? 'Today vs yesterday' : range === 'month' ? 'Last 30 days vs prior period' : 'Last 7 days vs previous 7 days'}
          action={
            <Segmented
              value={range}
              onChange={v => setRange(v as 'today' | 'week' | 'month')}
              options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
            />
          }
        >
          <div className="row gap16" style={{ marginBottom: 10, fontSize: 12 }}>
            <span className="row gap6"><span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--primary)' }} />Current</span>
            <span className="row gap6"><span style={{ width: 14, height: 0, borderTop: '2px dashed var(--fg-subtle)' }} />Previous</span>
          </div>
          <LineChart data={d.salesTrend} />
        </Card>
        <Card title="Top products today" sub="By revenue">
          <TopProductsChart data={d.topProducts} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card
          title="Recent bills"
          sub="Last 10 transactions"
          action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => setView('pos')}>New bill</Button>}
          noBody
        >
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bill No.</th><th>Customer</th><th>Cashier</th>
                  <th className="num">Items</th><th className="num">Total</th>
                  <th>Payment</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {d.recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-subtle)', fontSize: 13 }}>
                      No bills yet. Complete a sale from Billing / POS.
                    </td>
                  </tr>
                ) : d.recentBills.map(b => (
                  <tr key={b.no}>
                    <td className="mono td-strong" style={{ fontSize: 12.5 }}>{b.no}</td>
                    <td>{b.cust}</td>
                    <td className="muted">{b.cashier}</td>
                    <td className="num tnum">{b.items}</td>
                    <td className="num td-strong tnum">{money(b.total)}</td>
                    <td><Badge tone={b.pay === 'Credit' ? 'warning' : 'neutral'}>{b.pay}</Badge></td>
                    <td className="muted tnum">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Low stock" sub="Below reorder level" action={<Badge tone="warning" dot>{lowStock.length}</Badge>}>
            {lowStock.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, padding: '8px 4px' }}>All products are above reorder level.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {lowStock.map(p => (
                  <div key={p.id} className="row" style={{ justifyContent: 'space-between', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div className="td-sub">
                        {p.status === 'out' ? 'Out of stock' : `${p.stock} ${p.unit} left`} · reorder {p.reorder}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setView('inventory')}>Reorder</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Activity" sub="Latest store events" noBody>
            <div style={{ padding: '6px 14px 12px' }}>
              {d.activity.length === 0 ? (
                <div className="muted" style={{ fontSize: 13, padding: '12px 0' }}>No stock movements recorded yet.</div>
              ) : d.activity.map((a, i) => (
                <div key={i} className="row gap10" style={{ padding: '9px 0', borderBottom: i < d.activity.length - 1 ? '1px solid var(--border)' : 0, alignItems: 'flex-start' }}>
                  <IconTile tone={`tile-${a.tone}`} size={28} icon={a.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}><b>{a.who}</b> <span className="muted">{a.act}</span></div>
                    <div className="td-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.detail}</div>
                  </div>
                  <span className="td-sub" style={{ whiteSpace: 'nowrap' }}>{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
