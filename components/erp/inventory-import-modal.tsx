'use client'

import { useState, useRef } from 'react'
import { Icon, Button, Modal } from './ui'
import {
  downloadInventoryImportTemplate,
  downloadInventoryStockAdjustmentSample,
  uploadInventoryImport,
  type InventoryImportResult,
} from '@/lib/inventory-import-api'
import { ApiError } from '@/lib/api'

export function InventoryImportModal({
  onClose,
  onComplete,
}: {
  onClose: () => void
  onComplete: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [templateBusy, setTemplateBusy] = useState(false)
  const [stockSampleBusy, setStockSampleBusy] = useState(false)
  const [result, setResult] = useState<InventoryImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null)
    setResult(null)
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
      await downloadInventoryImportTemplate()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not download template')
    } finally {
      setTemplateBusy(false)
    }
  }

  async function handleStockSample() {
    setError(null)
    setStockSampleBusy(true)
    try {
      await downloadInventoryStockAdjustmentSample()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not download stock sample')
    } finally {
      setStockSampleBusy(false)
    }
  }

  async function handleUpload() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const r = await uploadInventoryImport(file)
      setResult(r)
      if (r.imported > 0 || r.stockAdjusted > 0) onComplete()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Bulk import"
      sub="New products or bulk stock adjustments from Excel"
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
              disabled={!file || busy}
              onClick={handleUpload}
            >
              {busy ? 'Importing…' : 'Upload'}
            </Button>
          </>
        )
      }
    >
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="import-steps">
            <div className="import-step">
              <span className="import-step-n">1</span>
              <div>
                <div className="import-step-title">Download template</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Product template for new items. Stock sample for add/remove adjustments.
                </div>
              </div>
              <div className="row gap8">
                <Button size="sm" variant="outline" icon="download" disabled={templateBusy} onClick={handleTemplate}>
                  {templateBusy ? '…' : 'Template'}
                </Button>
                <Button size="sm" variant="outline" icon="package-plus" disabled={stockSampleBusy} onClick={handleStockSample}>
                  {stockSampleBusy ? '…' : 'Stock sample'}
                </Button>
              </div>
            </div>
            <div className="import-step">
              <span className="import-step-n">2</span>
              <div style={{ flex: 1 }}>
                <div className="import-step-title">Upload filled sheet</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Stock sheet: sku, adjustment (add/remove), quantity, reason, notes — same as Quick adjust.
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
                <span className="muted" style={{ fontSize: 12 }}>inventory-import-template.xlsx</span>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="kpi" style={{ padding: 12 }}>
              <div className="kpi-label">Imported</div>
              <div className="kpi-val tnum" style={{ color: 'var(--success)' }}>{result.imported}</div>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <div className="kpi-label">Stock adjusted</div>
              <div className="kpi-val tnum" style={{ color: 'var(--primary)' }}>{result.stockAdjusted ?? 0}</div>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <div className="kpi-label">Skipped</div>
              <div className="kpi-val tnum">{result.skippedDuplicates}</div>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <div className="kpi-label">Invalid rows</div>
              <div className="kpi-val tnum">{result.skippedInvalid}</div>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <div className="kpi-label">Categories added</div>
              <div className="kpi-val tnum">{result.categoriesCreated}</div>
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12.5 }}>
            Processed {result.totalRows} rows · {result.imported} new products · {result.stockAdjusted ?? 0} stock adjustments
          </div>

          {result.issues.length > 0 && (
            <div className="tbl-wrap" style={{ maxHeight: 220, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>Row</th>
                    <th style={{ width: 120 }}>SKU</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.issues.slice(0, 50).map((issue, i) => (
                    <tr key={i}>
                      <td className="tnum muted">{issue.row}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{issue.sku || '—'}</td>
                      <td style={{ fontSize: 12.5 }}>{issue.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.issues.length > 50 && (
                <div className="muted" style={{ padding: '8px 12px', fontSize: 12 }}>
                  +{result.issues.length - 50} more issues
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
