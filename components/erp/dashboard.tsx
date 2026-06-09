'use client'

import { useState } from 'react'
import {
  Icon, Button, Badge, KpiCard, Card, Segmented, IconTile, useToast,
} from './ui'
import {
  PRODUCTS, BILLS, SALES_7D, TOP_PRODUCTS, ACTIVITY,
  stockStatus, money, money2,
} from '@/lib/erp-data'

function LineChart({ data }: { data: typeof SALES_7D }) {
  const W = 720, H = 230, padL = 46, padR = 14, padT = 14, padB = 28
  const max = Math.max(...data.map(d => Math.max(d.cur, d.prev)))
  const niceMax = Math.ceil(max / 20000) * 20000
  const x = (i: number) => padL + (i * (W - padL - padR)) / (data.length - 1)
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

function TopProductsChart({ data }: { data: typeof TOP_PRODUCTS }) {
  const max = Math.max(...data.map(d => d.rev))
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
  const toast = useToast()
  const [range, setRange] = useState('week')
  const lowStock = PRODUCTS.filter(p => stockStatus(p) !== 'in').sort((a, b) => a.stock - b.stock).slice(0, 6)
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })

  return (
    <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1480, margin: '0 auto' }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="section-title">Good evening, Anitha 👋</div>
          <div className="section-sub">Nenjankod Supermarket · Counter activity for today, {today}</div>
        </div>
        <div className="row gap8">
          <Button size="sm" icon="package-plus" onClick={() => setView('inventory')}>Stock Adjustment</Button>
          <Button size="sm" icon="plus" onClick={() => setView('inventory')}>Add Product</Button>
          <Button size="sm" variant="primary" icon="scan-line" onClick={() => setView('pos')}>New Bill</Button>
        </div>
      </div>

      {/* AI insight strip */}
      <div className="ai-banner">
        <div className="ai-ic"><Icon name="sparkles" size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, fontSize: 13.5, color: 'var(--primary-soft-fg)' }}>AuraDev AI · Daily brief</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
            Sales are pacing <b style={{ color: 'var(--success-fg)' }}>+9.4%</b> vs last week. Weekend rush expected — 4 fast movers are below reorder level.
          </div>
          <div className="row gap8" style={{ marginTop: 9, flexWrap: 'wrap' }}>
            <span className="ai-chip"><Icon name="trending-up" size={14} />Saturday is your peak — staff up Counter 2</span>
            <span className="ai-chip"><Icon name="package" size={14} />Reorder Toor Dal &amp; Shampoo before Fri</span>
            <span className="ai-chip"><Icon name="banknote" size={14} />₹13.5k credit outstanding from 2 B2B</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Today's Sales" value="₹72,480" icon="indian-rupee" tone="tile-primary" trend="9.4%" trendDir="up" vs="vs yesterday" />
        <KpiCard label="Bills Today" value="148" icon="receipt" tone="tile-info" trend="12" trendDir="up" vs="vs yesterday" />
        <KpiCard label="Items Sold" value="1,026" icon="shopping-basket" tone="tile-success" trend="6.1%" trendDir="up" vs="vs yesterday" />
        <KpiCard label="Low Stock Alerts" value="4" icon="alert-triangle" tone="tile-warning" trend="2" trendDir="down" vs="since morning" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>
        <Card
          title="Sales trend"
          sub="Last 7 days vs previous 7 days"
          action={
            <Segmented
              value={range}
              onChange={setRange}
              options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
            />
          }
        >
          <div className="row gap16" style={{ marginBottom: 10, fontSize: 12 }}>
            <span className="row gap6"><span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--primary)' }} />This week</span>
            <span className="row gap6"><span style={{ width: 14, height: 0, borderTop: '2px dashed var(--fg-subtle)' }} />Previous</span>
          </div>
          <LineChart data={SALES_7D} />
        </Card>
        <Card title="Top products today" sub="By revenue">
          <TopProductsChart data={TOP_PRODUCTS} />
        </Card>
      </div>

      {/* Bottom: bills + side rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card
          title="Recent bills"
          sub="Last 10 transactions"
          action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => toast('Bills view — Phase 2', { icon: 'sparkles', tone: '' })}>View all</Button>}
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
                {BILLS.map(b => (
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lowStock.map(p => {
                const st = stockStatus(p)
                return (
                  <div key={p.id} className="row" style={{ justifyContent: 'space-between', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div className="td-sub">{st === 'out' ? 'Out of stock' : `${p.stock} ${p.unit} left`} · reorder {p.reorder}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast('Reorder draft created for ' + p.name)}>Reorder</Button>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title="Activity" sub="Latest store events" noBody>
            <div style={{ padding: '6px 14px 12px' }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} className="row gap10" style={{ padding: '9px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--border)' : 0, alignItems: 'flex-start' }}>
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
