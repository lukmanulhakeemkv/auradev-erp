'use client'

import { useState, useEffect } from 'react'
import { Icon, Button, Badge, KpiCard, Card, Select, Drawer, IconTile, useToast } from './ui'
import { PURCHASES, SUPPLIERS, money, money2, type Purchase } from '@/lib/erp-data'

const PUR_STATUS = {
  billed:  { tone: 'info',    label: 'Billed' },
  paid:    { tone: 'success', label: 'Paid' },
  pending: { tone: 'warning', label: 'Pending GRN' },
  draft:   { tone: 'neutral', label: 'Draft' },
} as const

function PurchaseDrawer({ bill, onClose }: { bill: Purchase; onClose: () => void }) {
  const toast = useToast()
  const total = bill.sub + bill.gst
  const sup = SUPPLIERS.find(s => s.name === bill.sup)
  const sb = PUR_STATUS[bill.status]

  return (
    <Drawer title={bill.no} sub={bill.sup} onClose={onClose}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Badge tone={sb.tone} dot>{sb.label}</Badge>
        <span className="td-sub">Billed {bill.date} · Due {bill.due}</span>
      </div>

      <div className="row gap12" style={{ marginBottom: 16 }}>
        <div className="kpi" style={{ flex: 1, padding: 12, gap: 4 }}>
          <div className="kpi-label">Bill total</div>
          <div className="kpi-val tnum" style={{ fontSize: 22 }}>{money(total)}</div>
        </div>
        <div className="kpi" style={{ flex: 1, padding: 12, gap: 4 }}>
          <div className="kpi-label">Line items</div>
          <div className="kpi-val tnum" style={{ fontSize: 22 }}>{bill.items}</div>
        </div>
      </div>

      {sup && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 16, fontSize: 12.5 }}>
          <div className="row" style={{ justifyContent: 'space-between', padding: '3px 0' }}><span className="muted">GSTIN</span><span className="mono">{sup.gstin}</span></div>
          <div className="row" style={{ justifyContent: 'space-between', padding: '3px 0' }}><span className="muted">Phone</span><span>{sup.phone}</span></div>
          <div className="row" style={{ justifyContent: 'space-between', padding: '3px 0' }}><span className="muted">Category</span><span>{sup.cat}</span></div>
        </div>
      )}

      <div className="menu-label" style={{ padding: '0 0 8px' }}>Items received</div>
      <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
        <table className="tbl">
          <thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {bill.lines.map((l, i) => (
              <tr key={i}>
                <td className="td-strong">{l[0]}</td>
                <td className="num tnum">{l[1]}</td>
                <td className="num tnum muted">{money(l[2])}</td>
                <td className="num tnum td-strong">{money(l[1] * l[2])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13.5 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Subtotal</span><span className="tnum">{money2(bill.sub)}</span></div>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">GST</span><span className="tnum">{money2(bill.gst)}</span></div>
        <div className="divider" style={{ margin: '6px 0' }} />
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, fontSize: 17 }}>
          <span>Total</span><span className="tnum">{money2(total)}</span>
        </div>
      </div>

      <div className="row gap8" style={{ marginTop: 20 }}>
        <Button variant="outline" icon="download" onClick={() => toast('Purchase bill PDF downloaded')}>Download</Button>
        {bill.status === 'billed' && (
          <Button variant="primary" className="block" icon="check" style={{ flex: 1 }} onClick={() => { toast(`Marked ${bill.no} as paid`, { icon: 'badge-check' }); onClose() }}>
            Mark as paid
          </Button>
        )}
      </div>
    </Drawer>
  )
}

export function Purchases({
  prefillQuery,
  prefillKey,
  onPrefillConsumed,
}: {
  prefillQuery?: string
  prefillKey?: number
  onPrefillConsumed?: () => void
} = {}) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [sup, setSup] = useState('all')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState<Purchase | null>(null)

  useEffect(() => {
    if (!prefillQuery || prefillKey == null) return
    setQ(prefillQuery)
    onPrefillConsumed?.()
  }, [prefillKey, prefillQuery, onPrefillConsumed])

  const all = PURCHASES.map(p => ({ ...p, total: p.sub + p.gst }))
  const billedCount = all.filter(p => p.status === 'billed').length
  const billedSum = all.filter(p => p.status === 'billed').reduce((s, p) => s + p.total, 0)
  const monthSum = all.reduce((s, p) => s + p.total, 0)
  const paidSum = all.filter(p => p.status === 'paid').reduce((s, p) => s + p.total, 0)

  const counts = {
    all: all.length,
    billed: billedCount,
    paid: all.filter(p => p.status === 'paid').length,
    pending: all.filter(p => p.status === 'pending').length,
    draft: all.filter(p => p.status === 'draft').length,
  }

  const rows = all.filter(p => {
    if (q && !(p.no.toLowerCase().includes(q.toLowerCase()) || p.sup.toLowerCase().includes(q.toLowerCase()))) return false
    if (sup !== 'all' && p.sup !== sup) return false
    if (status !== 'all' && p.status !== status) return false
    return true
  })

  const statusChips: [string, string][] = [['all', 'All'], ['billed', 'Billed'], ['paid', 'Paid'], ['pending', 'Pending'], ['draft', 'Draft']]

  return (
    <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1480, margin: '0 auto' }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="section-title">Purchases</div>
          <div className="section-sub">Supplier purchase bills · {SUPPLIERS.length} suppliers</div>
        </div>
        <div className="row gap8">
          <Button size="sm" icon="download" onClick={() => toast(`Exported ${rows.length} purchase bills`)}>Export</Button>
          <Button size="sm" variant="primary" icon="plus" onClick={() => toast('Record purchase — opens a new bill', { icon: 'file-plus' })}>Record Purchase</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Purchased (June)" value={money(monthSum)} icon="shopping-bag" tone="tile-primary" />
        <KpiCard label="Awaiting payment" value={money(billedSum)} icon="hourglass" tone="tile-warning" vs={`${billedCount} billed`} />
        <KpiCard label="Paid this month" value={money(paidSum)} icon="badge-check" tone="tile-success" />
        <KpiCard label="Active suppliers" value={SUPPLIERS.length} icon="truck" tone="tile-info" />
      </div>

      <Card noBody>
        <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          <div className="input sm" style={{ width: 260 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search bill no. or supplier" />
          </div>
          <Select size="sm" width={230} value={sup} onChange={setSup}
            options={[{ value: 'all', label: 'All suppliers' }, ...SUPPLIERS.map(s => ({ value: s.name, label: s.name }))]} />
          <div style={{ flex: 1 }} />
          <div className="chips">
            {statusChips.map(([v, l]) => (
              <button key={v} className={'chip' + (status === v ? ' on' : '')} onClick={() => setStatus(v)}>
                {l}<span className="ct">{counts[v as keyof typeof counts]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Bill No.</th><th>Supplier</th><th>Bill date</th>
                <th className="num">Items</th><th className="num">Amount</th>
                <th>Due date</th><th>Status</th><th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const sb = PUR_STATUS[p.status]
                return (
                  <tr key={p.no} style={{ cursor: 'pointer' }} onClick={() => setOpen(p)}>
                    <td className="mono td-strong" style={{ fontSize: 12.5 }}>{p.no}</td>
                    <td>
                      <div className="row gap10">
                        <IconTile tone="tile-info" size={30} icon="truck" />
                        <span className="td-strong">{p.sup}</span>
                      </div>
                    </td>
                    <td className="muted tnum">{p.date}</td>
                    <td className="num tnum">{p.items}</td>
                    <td className="num tnum td-strong">{money(p.total)}</td>
                    <td className="muted tnum">{p.due}</td>
                    <td><Badge tone={sb.tone} dot>{sb.label}</Badge></td>
                    <td>
                      <Button size="sm" variant="ghost" iconRight="chevron-right" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(p) }}>View</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty">
              <div className="ei"><Icon name="search-x" size={22} /></div>
              <div style={{ fontWeight: 600, color: 'var(--fg)' }}>No purchase bills match</div>
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span className="muted" style={{ fontSize: 12.5 }}>{rows.length} of {all.length} bills</span>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Total shown · <b style={{ color: 'var(--fg)' }}>{money(rows.reduce((s, p) => s + p.total, 0))}</b>
          </span>
        </div>
      </Card>

      {open && <PurchaseDrawer bill={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
