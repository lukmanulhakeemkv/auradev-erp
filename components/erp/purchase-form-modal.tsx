'use client'

import { useEffect, useState } from 'react'
import { Icon, Button, Modal, Select, TextInput, Field } from './ui'
import { money2, type Product } from '@/lib/erp-data'
import { fetchProducts } from '@/lib/inventory-api'
import type { Supplier } from '@/lib/purchases-api'
import { createPurchase } from '@/lib/purchases-api'

function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type DraftLine = { productId: string; quantity: string; rate: string }

export function PurchaseFormModal({
  suppliers,
  onClose,
  onCreated,
  onAddSupplier,
}: {
  suppliers: Supplier[]
  onClose: () => void
  onCreated: (id: string) => void
  onAddSupplier?: () => void
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [billDate, setBillDate] = useState(localIsoDate())
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '1', rate: '' }])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchProducts()
      .then(setProducts)
      .catch(() => setError('Could not load products'))
      .finally(() => setLoadingProducts(false))
  }, [])

  const productOptions = [
    { value: '', label: 'Select product…' },
    ...products.map(p => ({ value: p.id, label: p.name, sub: p.sku })),
  ]

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const setLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
  }

  const onProductPick = (idx: number, productId: string) => {
    const p = products.find(x => x.id === productId)
    setLine(idx, {
      productId,
      rate: p ? String(p.cost ?? p.price) : '',
    })
  }

  const addLine = () => setLines(prev => [...prev, { productId: '', quantity: '1', rate: '' }])
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const submit = async () => {
    setError(null)
    if (!supplierId) {
      setError('Select a supplier')
      return
    }
    const items = lines
      .filter(l => l.productId)
      .map(l => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        rate: Number(l.rate),
      }))
      .filter(l => l.quantity > 0 && l.rate > 0)

    if (items.length === 0) {
      setError('Add at least one product line')
      return
    }

    setBusy(true)
    try {
      const created = await createPurchase({
        supplierId,
        billDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        items,
      })
      onCreated(created.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create purchase')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Record purchase"
      sub="Create a draft purchase bill from your supplier"
      icon="truck"
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" icon="plus" onClick={() => void submit()} disabled={busy || loadingProducts}>
            {busy ? 'Saving…' : 'Create draft'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="alert-banner danger" style={{ marginBottom: 14 }}>
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="row gap12" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Field label="Supplier">
            <div className="row gap8" style={{ alignItems: 'stretch' }}>
              <div style={{ flex: 1 }}>
                <Select value={supplierId} onChange={setSupplierId} options={supplierOptions} />
              </div>
              {onAddSupplier && (
                <Button size="sm" variant="outline" icon="plus" onClick={onAddSupplier} title="Add supplier" />
              )}
            </div>
          </Field>
        </div>
        <div style={{ width: 148 }}>
          <Field label="Bill date">
            <TextInput type="date" value={billDate} onChange={setBillDate} />
          </Field>
        </div>
        <div style={{ width: 148 }}>
          <Field label="Due date">
            <TextInput type="date" value={dueDate} onChange={setDueDate} />
          </Field>
        </div>
      </div>

      <div className="menu-label" style={{ padding: '0 0 8px' }}>Line items</div>
      {loadingProducts ? (
        <div className="muted" style={{ fontSize: 13, padding: '12px 0' }}>Loading products…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {lines.map((line, idx) => (
            <div key={idx} className="row gap8" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <Select
                  value={line.productId}
                  onChange={v => onProductPick(idx, v)}
                  options={productOptions}
                  placeholder="Product"
                />
              </div>
              <div style={{ width: 88 }}>
                <TextInput
                  size="sm"
                  type="number"
                  min={0}
                  value={line.quantity}
                  onChange={v => setLine(idx, { quantity: v })}
                  placeholder="Qty"
                />
              </div>
              <div style={{ width: 100 }}>
                <TextInput
                  size="sm"
                  type="number"
                  min={0}
                  value={line.rate}
                  onChange={v => setLine(idx, { rate: v })}
                  placeholder="Rate ₹"
                />
              </div>
              {lines.length > 1 && (
                <Button size="sm" variant="ghost" icon="x" onClick={() => removeLine(idx)} />
              )}
            </div>
          ))}
          <Button size="sm" variant="outline" icon="plus" onClick={addLine}>Add line</Button>
        </div>
      )}

      <Field label="Notes" hint="Optional reference or delivery note">
        <TextInput value={notes} onChange={setNotes} placeholder="Supplier invoice ref, lorry no., etc." />
      </Field>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        After creating, open the purchase and use <b>Receive GRN</b> when goods arrive — stock will increase automatically.
        Need many bills? Use <b>Bulk record</b> — pick the supplier first, then upload lines for that vendor only.
      </p>
    </Modal>
  )
}
