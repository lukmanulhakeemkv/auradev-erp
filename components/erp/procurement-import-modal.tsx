'use client'

import { useRef, useState } from 'react'
import { Icon, Button, Modal, Select, Field } from './ui'
import { ApiError } from '@/lib/api'
import type { Supplier } from '@/lib/purchases-api'
import {
  downloadPurchaseImportTemplate,
  downloadSupplierImportTemplate,
  uploadPurchaseImport,
  uploadSupplierImport,
  type PurchaseImportResult,
  type SupplierImportResult,
} from '@/lib/procurement-import-api'

export function ProcurementImportModal({
  kind,
  suppliers = [],
  onClose,
  onComplete,
  onAddSupplier,
}: {
  kind: 'suppliers' | 'purchases'
  suppliers?: Supplier[]
  onClose: () => void
  onComplete: () => void
  onAddSupplier?: () => void
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [templateBusy, setTemplateBusy] = useState(false)
  const [supplierResult, setSupplierResult] = useState<SupplierImportResult | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isSuppliers = kind === 'suppliers'
  const result = isSuppliers ? supplierResult : purchaseResult
  const selectedSupplier = suppliers.find(s => s.id === supplierId)
  const canUploadPurchases = Boolean(supplierId && file)

  function reset() {
    setFile(null)
    setSupplierResult(null)
    setPurchaseResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleTemplate() {
    setError(null)
    setTemplateBusy(true)
    try {
      if (isSuppliers) await downloadSupplierImportTemplate()
      else await downloadPurchaseImportTemplate()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not download template')
    } finally {
      setTemplateBusy(false)
    }
  }

  async function handleUpload() {
    if (!file) return
    if (!isSuppliers && !supplierId) {
      setError('Select a supplier first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (isSuppliers) {
        const r = await uploadSupplierImport(file)
        setSupplierResult(r)
        if (r.imported > 0) onComplete()
      } else {
        const r = await uploadPurchaseImport(file, supplierId)
        setPurchaseResult(r)
        if (r.purchasesCreated > 0) onComplete()
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isSuppliers ? 'Bulk import suppliers' : 'Bulk record purchases'}
      sub={isSuppliers
        ? 'Add many vendors from Excel'
        : 'Pick one supplier, then upload many bills/lines for that vendor only'}
      icon="upload"
      wide
      onClose={handleClose}
      footer={
        result ? (
          <Button variant="primary" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              icon="upload"
              disabled={isSuppliers ? !file || busy : !canUploadPurchases || busy}
              onClick={handleUpload}
            >
              {busy ? 'Importing…' : isSuppliers ? 'Upload' : 'Create drafts'}
            </Button>
          </>
        )
      }
    >
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isSuppliers && (
            <Field label="Supplier" required>
              <div className="row gap8" style={{ alignItems: 'stretch' }}>
                <div style={{ flex: 1 }}>
                  {suppliers.length === 0 ? (
                    <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
                      No suppliers yet — add one first.
                    </div>
                  ) : (
                    <Select
                      value={supplierId}
                      onChange={setSupplierId}
                      options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    />
                  )}
                </div>
                {onAddSupplier && (
                  <Button size="sm" variant="outline" icon="plus" onClick={onAddSupplier} title="Add supplier" />
                )}
              </div>
              {selectedSupplier && (
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  All rows in the sheet will be recorded for <b>{selectedSupplier.name}</b> only.
                </div>
              )}
            </Field>
          )}

          <div className="import-steps">
            <div className="import-step">
              <span className="import-step-n">1</span>
              <div>
                <div className="import-step-title">Download template</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {isSuppliers
                    ? 'Columns: name, contact_person, phone, email, gstin, address'
                    : 'purchase_ref, bill_date, due_date, notes, sku, quantity, rate — SKUs must match Inventory'}
                </div>
              </div>
              <Button size="sm" variant="outline" icon="download" disabled={templateBusy} onClick={handleTemplate}>
                {templateBusy ? '…' : 'Template'}
              </Button>
            </div>
            <div className="import-step">
              <span className="import-step-n">2</span>
              <div style={{ flex: 1 }}>
                <div className="import-step-title">Upload filled sheet</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {isSuppliers
                    ? 'Duplicate names are skipped.'
                    : 'Template includes real SKUs from your inventory. Edit qty/rate, then upload.'}
                </div>
              </div>
            </div>
          </div>

          <label
            className={'import-drop' + (file ? ' has-file' : '')}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) setFile(f)
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <Icon name={file ? 'file-spreadsheet' : 'upload-cloud'} size={28} />
            {file ? (
              <>
                <span className="import-file-name">{file.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{(file.size / 1024).toFixed(1)} KB</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 600 }}>Drop .xlsx here or click to browse</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {isSuppliers ? 'supplier-import-template.xlsx' : 'purchase-import-template.xlsx'}
                </span>
              </>
            )}
          </label>

          {error && (
            <div className="alert-banner danger" style={{ margin: 0 }}>
              <Icon name="alert-circle" size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : isSuppliers && supplierResult ? (
        <ImportResultSummary
          summary={`Processed ${supplierResult.totalRows} rows · ${supplierResult.imported} suppliers added`}
          kpis={[
            { label: 'Imported', value: supplierResult.imported, tone: 'var(--success)' },
            { label: 'Duplicates', value: supplierResult.skippedDuplicates },
            { label: 'Invalid', value: supplierResult.skippedInvalid },
          ]}
          issues={supplierResult.issues}
        />
      ) : purchaseResult ? (
        <ImportResultSummary
          summary={`${selectedSupplier?.name ?? 'Supplier'} · ${purchaseResult.purchasesCreated} draft bill${purchaseResult.purchasesCreated === 1 ? '' : 's'} from ${purchaseResult.totalRows} lines`}
          kpis={[
            { label: 'Bills created', value: purchaseResult.purchasesCreated, tone: 'var(--success)' },
            { label: 'Lines processed', value: purchaseResult.totalRows },
            { label: 'Invalid rows', value: purchaseResult.skippedInvalid },
          ]}
          issues={purchaseResult.issues}
        />
      ) : null}
    </Modal>
  )
}

function ImportResultSummary({
  summary,
  kpis,
  issues,
}: {
  summary: string
  kpis: { label: string; value: number; tone?: string }[]
  issues: { row: number; sku: string; reason: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi" style={{ padding: 12 }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val tnum" style={k.tone ? { color: k.tone } : undefined}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12.5 }}>{summary}</div>
      {issues.length > 0 && (
        <div className="tbl-wrap" style={{ maxHeight: 220, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 48 }}>Row</th>
                <th style={{ width: 120 }}>Ref</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {issues.slice(0, 50).map((issue, i) => (
                <tr key={i}>
                  <td className="tnum muted">{issue.row}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{issue.sku || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{issue.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
