'use client'

import { useState, useCallback, useEffect } from 'react'
import { Icon, Button, Badge, Field, TextInput, Select, Segmented, Modal, IconTile, useToast } from './ui'
import { CAT_TONE, CAT_ICON, stockStatus, money, money2, type Product } from '@/lib/erp-data'
import { fetchProducts, fetchProductByBarcode } from '@/lib/inventory-api'
import { fetchCustomers, createBill, type ApiCustomer, type SavedBill } from '@/lib/billing-api'
import { saveReceiptPng, saveReceiptPdf, DEFAULT_RECEIPT_META } from '@/lib/receipt-export'
import { useAuth } from '@/lib/auth-context'

interface CartItem { p: Product; qty: number; disc: number }

function ProductCard({ p, onAdd, dense }: { p: Product; onAdd: (p: Product) => void; dense: boolean }) {
  const st = stockStatus(p)
  const out = st === 'out'
  return (
    <button
      className="prod-card"
      disabled={out}
      onClick={() => onAdd(p)}
      style={out ? { opacity: .55, cursor: 'not-allowed' } : undefined}
    >
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <IconTile tone={CAT_TONE[p.cat] ?? 'tile-primary'} size={dense ? 26 : 30} icon={CAT_ICON[p.cat] ?? 'package'} iconSize={dense ? 14 : 16} />
        {st === 'low' && <Badge tone="warning">{p.stock}{p.unit === 'kg' ? 'kg' : ''}</Badge>}
        {out && <Badge tone="danger">Out</Badge>}
      </div>
      <div className="pc-name">{p.name}</div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
        <span className="pc-price tnum">{money(p.price)}<span className="pc-unit">/{p.unit}</span></span>
        <span className="pc-sku mono">{p.sku.split('-').slice(-1)[0]}</span>
      </div>
    </button>
  )
}

const PAY_ICON: Record<string, string> = { Cash: 'banknote', UPI: 'qr-code', Card: 'credit-card', Credit: 'notebook-pen', Split: 'split' }

function PaymentModal({ total, customer, onClose, onDone, busy }: {
  total: number
  customer: ApiCustomer | undefined
  onClose: () => void
  onDone: (method: string, tendered: number, splitCash: number) => void
  busy?: boolean
}) {
  const [method, setMethod] = useState('Cash')
  const [tendered, setTendered] = useState('')
  const [splitCash, setSplitCash] = useState('')

  const tend = parseFloat(tendered) || 0
  const change = Math.max(0, tend - total)
  const sCash = parseFloat(splitCash) || 0
  const sUpi = Math.max(0, total - sCash)
  const allowCredit = customer && customer.type !== 'walkin'
  const methods = ['Cash', 'UPI', 'Card', 'Credit', 'Split']
  const quick = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 2000]
    .filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 3)

  const canPay = method === 'Cash' ? tend >= total : method === 'Credit' ? Boolean(allowCredit) : true

  return (
    <Modal title="Take payment" sub={`Amount due · ${money2(total)}`} icon="wallet" wide onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={!canPay || busy} onClick={() => onDone(method, tend, sCash)}>
          {busy ? 'Saving…' : 'Confirm & save receipt'}
        </Button>
      </>}
    >
      <div className="seg" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 18 }}>
        {methods.map(m => (
          <button key={m} className={method === m ? 'on' : ''} onClick={() => setMethod(m)} style={{ justifyContent: 'center' }}>
            <Icon name={PAY_ICON[m]} size={14} />{m}
          </button>
        ))}
      </div>

      {method === 'Cash' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Amount tendered">
            <TextInput icon="indian-rupee" value={tendered} onChange={setTendered} placeholder="0" type="number" autoFocus />
          </Field>
          <div className="row gap8">
            {quick.map(q => <Button key={q} size="sm" variant="outline" onClick={() => setTendered(String(q))}>{money(q)}</Button>)}
            <Button size="sm" variant="outline" onClick={() => setTendered(String(total))}>Exact</Button>
          </div>
          <div className="pay-summary">
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Tendered</span><span className="tnum">{money2(tend)}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Due</span><span className="tnum">{money2(total)}</span></div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
              <span>Change</span><span className="tnum" style={{ color: 'var(--success-fg)' }}>{money2(change)}</span>
            </div>
          </div>
        </div>
      )}

      {method === 'UPI' && (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div className="upi-qr">
            <svg viewBox="0 0 100 100" width="132" height="132">
              {Array.from({ length: 100 }).map((_, i) => {
                const r = Math.floor(i / 10), c = i % 10
                const on = (r * 7 + c * 13 + r * c) % 3 === 0 || (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3)
                return on ? <rect key={i} x={c * 10 + 1} y={r * 10 + 1} width="8" height="8" rx="1.5" fill="var(--fg)" /> : null
              })}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Scan to pay {money2(total)}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>UPI ID: <span className="mono">nenjankod@okhdfc</span></div>
            <div className="row gap8" style={{ marginTop: 12, color: 'var(--fg-muted)', fontSize: 12.5 }}>
              <span className="live-dot" />Waiting for confirmation…
            </div>
          </div>
        </div>
      )}

      {method === 'Card' && (
        <div className="empty" style={{ padding: '28px 20px' }}>
          <div className="ei"><Icon name="credit-card" size={22} /></div>
          <div style={{ fontWeight: 600, color: 'var(--fg)' }}>Insert / tap card on terminal</div>
          <div>POS terminal TID 5512•••44 · {money2(total)}</div>
        </div>
      )}

      {method === 'Credit' && (
        allowCredit ? (
          <div className="pay-summary">
            <div className="row gap10" style={{ marginBottom: 10 }}>
              <span className="avatar sm">{customer!.name.split(' ').map(w => w[0]).join('').toUpperCase()}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{customer!.name}</div>
                <div className="td-sub">{customer!.phone ?? ''}</div>
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Current balance</span><span className="tnum">{money2(customer!.creditBalance)}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">This bill</span><span className="tnum">{money2(total)}</span></div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
              <span>New balance</span>
              <span className="tnum" style={{ color: 'var(--warning-fg)' }}>{money2(customer!.creditBalance + total)}</span>
            </div>
          </div>
        ) : (
          <div className="alert-banner">
            <Icon name="alert-triangle" size={18} />Credit sale requires a registered customer. Select one from the cart panel.
          </div>
        )
      )}

      {method === 'Split' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Cash portion">
            <TextInput icon="banknote" value={splitCash} onChange={setSplitCash} placeholder="0" type="number" />
          </Field>
          <div className="pay-summary">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="muted"><Icon name="banknote" size={13} style={{ verticalAlign: -2 }} /> Cash</span>
              <span className="tnum">{money2(sCash)}</span>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="muted"><Icon name="qr-code" size={13} style={{ verticalAlign: -2 }} /> UPI (balance)</span>
              <span className="tnum">{money2(sUpi)}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ReceiptModal({ bill, onClose }: { bill: SavedBill; onClose: () => void }) {
  return (
    <Modal title="Bill saved" sub={bill.billNo} icon="receipt" onClose={onClose}
      footer={<>
        <Button variant="outline" icon="image" onClick={() => saveReceiptPng(bill, DEFAULT_RECEIPT_META)}>Download PNG</Button>
        <Button variant="primary" icon="file-down" onClick={() => saveReceiptPdf(bill, DEFAULT_RECEIPT_META)}>Download PDF</Button>
      </>}
    >
      <div className="pay-summary" style={{ fontSize: 13 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Customer</span><span>{bill.customerName}</span></div>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Items</span><span>{bill.lines.length}</span></div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, marginTop: 8 }}>
          <span>Total paid</span><span className="tnum">{money2(bill.grandTotal)}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Stock has been updated. Receipt PNG/PDF downloads to your device — no printer required.
        </div>
      </div>
    </Modal>
  )
}

export function POS({
  prefillQuery,
  prefillKey,
  onPrefillConsumed,
}: {
  prefillQuery?: string
  prefillKey?: number
  onPrefillConsumed?: () => void
} = {}) {
  const { user } = useAuth()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [barcode, setBarcode] = useState('')
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [billDisc, setBillDisc] = useState(0)
  const [discMode, setDiscMode] = useState('₹')
  const [layout, setLayout] = useState('split')
  const [payOpen, setPayOpen] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [savedBill, setSavedBill] = useState<SavedBill | null>(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const [prods, custs] = await Promise.all([fetchProducts(), fetchCustomers()])
      setProducts(prods)
      setCustomers(custs)
      if (!customerId && custs.length) {
        const walkin = custs.find(c => c.type === 'walkin') ?? custs[0]
        setCustomerId(walkin.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadProducts()
  }, [user])

  useEffect(() => {
    if (!prefillQuery || prefillKey == null) return
    setQ(prefillQuery)
    setCat('All')
    onPrefillConsumed?.()
  }, [prefillKey, prefillQuery, onPrefillConsumed])

  const customer = customers.find(c => c.id === customerId)
  const cats = ['All', ...Array.from(new Set(products.map(p => p.cat)))]
  const filtered = products.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
  )

  const add = useCallback((p: Product) => {
    setCart(c => {
      const ex = c.find(x => x.p.id === p.id)
      if (ex) return c.map(x => x.p.id === p.id ? { ...x, qty: +(x.qty + (p.unit === 'kg' ? 0.5 : 1)).toFixed(2) } : x)
      return [...c, { p, qty: 1, disc: 0 }]
    })
  }, [])

  const setQty = (id: string, qty: number) =>
    setCart(c => c.map(x => x.p.id === id ? { ...x, qty: Math.max(0, +qty.toFixed(2)) } : x).filter(x => x.qty > 0))
  const remove = (id: string) => setCart(c => c.filter(x => x.p.id !== id))

  async function onBarcode(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const code = barcode.trim()
    if (!code) return
    setBarcode('')

    const local = products.find(x => x.barcode === code || x.sku.toLowerCase() === code.toLowerCase())
    if (local) {
      add(local)
      toast(local.name + ' added')
      return
    }

    try {
      const p = await fetchProductByBarcode(code)
      add(p)
      setProducts(ps => ps.some(x => x.id === p.id) ? ps : [...ps, p])
      toast(p.name + ' added')
    } catch {
      toast(`No product for "${code}"`, { icon: 'search-x', tone: '' })
    }
  }

  const subtotal = cart.reduce((s, x) => s + x.p.price * x.qty, 0)
  const gst = cart.reduce((s, x) => s + x.p.price * x.qty * x.p.tax / 100, 0)
  const discVal = discMode === '%' ? subtotal * (billDisc || 0) / 100 : (billDisc || 0)
  const grand = Math.max(0, subtotal - discVal + gst)

  async function completeSale(method: string, tendered: number, splitCash: number) {
    if (!customerId || !cart.length) return
    setPayBusy(true)
    try {
      const payMethod = (method === 'Split' ? 'CASH' : method.toUpperCase()) as 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
      const bill = await createBill({
        customerId,
        discountMode: discMode === '%' ? 'PERCENT' : 'AMOUNT',
        billDiscount: billDisc || 0,
        items: cart.map(x => ({
          productId: x.p.id,
          quantity: x.qty,
          lineDiscount: x.disc || 0,
        })),
        payment: {
          method: payMethod,
          tendered: method === 'Cash' ? tendered : undefined,
          splitCashAmount: method === 'Split' && splitCash > 0 ? splitCash : undefined,
        },
      })

      setProducts(ps => ps.map(p => {
        const sold = cart.find(x => x.p.id === p.id)
        return sold ? { ...p, stock: Math.max(0, +(p.stock - sold.qty).toFixed(3)) } : p
      }))

      const walkin = customers.find(c => c.type === 'walkin')
      setPayOpen(false)
      setCart([])
      setBillDisc(0)
      if (walkin) setCustomerId(walkin.id)
      setSavedBill(bill)
      void saveReceiptPng(bill, DEFAULT_RECEIPT_META)
      toast(`Bill ${bill.billNo} saved · stock updated`, { icon: 'receipt' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to complete sale'
      toast(msg, { icon: 'alert-circle' })
    } finally {
      setPayBusy(false)
    }
  }

  function holdBill() {
    if (!cart.length) return
    toast('Hold bill is not synced to server yet', { icon: 'pause' })
  }
  function clearBill() {
    setCart([])
    setBillDisc(0)
    const walkin = customers.find(c => c.type === 'walkin')
    if (walkin) setCustomerId(walkin.id)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'F8' && cart.length) { e.preventDefault(); setPayOpen(true) }
      if (e.key === 'F2') { e.preventDefault(); clearBill() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cart.length])

  const dense = layout === 'wide'
  const cartFirst = layout === 'cartLeft'

  const cartPanel = (
    <div className="pos-cart" style={{ order: cartFirst ? 0 : 2 }}>
      <div className="pos-cart-head">
        <Select
          width="100%"
          value={customerId}
          onChange={setCustomerId}
          icon="user-round"
          options={customers.map(c => ({
            value: c.id,
            label: c.name,
            sub: c.phone || (c.type === 'walkin' ? 'No profile needed' : ''),
            icon: c.type === 'b2b' ? 'building-2' : 'user-round',
          }))}
        />
      </div>
      <div className="pos-lines">
        {cart.length === 0 ? (
          <div className="empty" style={{ height: '100%' }}>
            <div className="ei"><Icon name="shopping-cart" size={22} /></div>
            <div style={{ fontWeight: 600, color: 'var(--fg)' }}>Cart is empty</div>
            <div>Scan a barcode or tap a product to begin</div>
          </div>
        ) : cart.map(x => (
          <div className="cart-line" key={x.p.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cl-name">{x.p.name}</div>
              <div className="td-sub tnum">{money(x.p.price)} × {x.qty}{x.p.unit === 'kg' ? ' kg' : ''} · GST {x.p.tax}%</div>
            </div>
            <div className="qty">
              <button onClick={() => setQty(x.p.id, x.qty - (x.p.unit === 'kg' ? 0.5 : 1))}><Icon name="minus" size={13} /></button>
              <span className="tnum">{x.qty}</span>
              <button onClick={() => setQty(x.p.id, x.qty + (x.p.unit === 'kg' ? 0.5 : 1))}><Icon name="plus" size={13} /></button>
            </div>
            <div className="cl-total tnum">{money(x.p.price * x.qty)}</div>
            <button className="cl-rm" onClick={() => remove(x.p.id)} aria-label="Remove"><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
      <div className="pos-totals">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Bill discount</span>
          <div className="row gap6">
            <div className="seg" style={{ padding: 2 }}>
              {['₹', '%'].map(m => (
                <button key={m} className={discMode === m ? 'on' : ''} style={{ padding: '3px 9px' }} onClick={() => setDiscMode(m)}>{m}</button>
              ))}
            </div>
            <div className="input sm" style={{ width: 84 }}>
              <input type="number" value={billDisc || ''} placeholder="0" onChange={e => setBillDisc(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        <div className="t-row"><span className="muted">Subtotal</span><span className="tnum">{money2(subtotal)}</span></div>
        {discVal > 0 && <div className="t-row"><span className="muted">Discount</span><span className="tnum" style={{ color: 'var(--success-fg)' }}>−{money2(discVal)}</span></div>}
        <div className="t-row"><span className="muted">GST</span><span className="tnum">{money2(gst)}</span></div>
        <div className="divider" style={{ margin: '6px 0' }} />
        <div className="t-row grand"><span>Total</span><span className="tnum">{money2(grand)}</span></div>
        <div className="row gap8" style={{ marginTop: 12 }}>
          <Button variant="outline" size="sm" icon="pause" onClick={holdBill}>Hold</Button>
          <Button variant="outline" size="sm" icon="trash-2" onClick={clearBill}>Clear</Button>
          <Button variant="primary" className="block" icon="wallet" disabled={!cart.length} onClick={() => setPayOpen(true)} style={{ flex: 1 }}>
            Pay {money(grand)} <span className="kbd" style={{ marginLeft: 4 }}>F8</span>
          </Button>
        </div>
      </div>
    </div>
  )

  const productPanel = (
    <div className="pos-products" style={{ order: 1 }}>
      <div className="pos-toolbar">
        <div className="input pill" style={{ flex: 1, maxWidth: 360 }}>
          <Icon name="scan-barcode" size={16} />
          <input value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={onBarcode} placeholder="Scan barcode / SKU, then Enter" />
        </div>
        <div className="input pill" style={{ flex: 1, maxWidth: 300 }}>
          <Icon name="search" size={16} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" />
        </div>
        <div style={{ flex: 1 }} />
        <Segmented
          value={layout}
          onChange={setLayout}
          options={[
            { value: 'split', icon: 'columns-2', label: '' },
            { value: 'cartLeft', icon: 'flip-horizontal-2', label: '' },
            { value: 'wide', icon: 'grid-2x2', label: '' },
          ]}
        />
      </div>
      <div className="chips" style={{ padding: '0 0 4px' }}>
        {cats.map(c => (
          <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="prod-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${dense ? 132 : 158}px, 1fr))` }}>
        {loading ? (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <Icon name="loader" size={22} />
            <div style={{ fontWeight: 600, color: 'var(--fg)', marginTop: 8 }}>Loading products…</div>
          </div>
        ) : error ? (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <div className="ei"><Icon name="alert-circle" size={22} /></div>
            <div style={{ fontWeight: 600, color: 'var(--danger-fg)' }}>{error}</div>
            <Button size="sm" variant="outline" icon="refresh-cw" onClick={loadProducts} style={{ marginTop: 10 }}>Retry</Button>
          </div>
        ) : (
          <>
            {filtered.map(p => <ProductCard key={p.id} p={p} onAdd={add} dense={dense} />)}
            {filtered.length === 0 && (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                <div className="ei"><Icon name="search-x" size={22} /></div>
                <div style={{ fontWeight: 600, color: 'var(--fg)' }}>No products found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="pos-root">
      {cartFirst ? <>{cartPanel}{productPanel}</> : <>{productPanel}{cartPanel}</>}
      {payOpen && (
        <PaymentModal
          total={grand}
          customer={customer}
          onClose={() => !payBusy && setPayOpen(false)}
          onDone={completeSale}
          busy={payBusy}
        />
      )}
      {savedBill && <ReceiptModal bill={savedBill} onClose={() => setSavedBill(null)} />}
    </div>
  )
}
