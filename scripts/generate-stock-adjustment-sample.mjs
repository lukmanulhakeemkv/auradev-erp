/**
 * Generates inventory-stock-adjustment-sample.xlsx (bulk stock updates).
 * Run: node scripts/generate-stock-adjustment-sample.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const root = dirname(fileURLToPath(import.meta.url))
const headers = ['sku', 'adjustment', 'quantity', 'reason', 'notes']

const rows = [
  ['GRN-RICE-25', 'add', 50, 'grn', 'Morning delivery - rice sacks'],
  ['GRN-TOOR-01', 'add', 30, 'grn', 'Dal restock'],
  ['DRY-MILK-05', 'add', 48, 'grn', 'Dairy truck'],
  ['BEV-COK-75', 'add', 24, 'grn', ''],
  ['SNK-PRLG-01', 'remove', 5, 'damage', 'Broken packets'],
  ['PC-SOAP-12', 'add', 36, 'count', 'Monthly stock count correction'],
]

const instructions = [
  ['Bulk stock adjustments — same as Quick adjust in Inventory.'],
  ['Required: sku, adjustment, quantity, reason'],
  ['adjustment: add | remove'],
  ['quantity: positive number'],
  ['reason: grn | damage | return | count'],
  ['notes: optional — shown in movement history'],
  ['grn = goods received, damage = wastage, return = customer return, count = stock correction'],
  ['Each SKU must already exist in your catalogue.'],
]

const wb = XLSX.utils.book_new()
const data = [headers, ...rows]
const ws = XLSX.utils.aoa_to_sheet(data)
ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 36 }]
XLSX.utils.book_append_sheet(wb, ws, 'Stock adjustments')

const help = XLSX.utils.aoa_to_sheet(instructions)
XLSX.utils.book_append_sheet(wb, help, 'Instructions')

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
const outPaths = [
  join(root, '..', 'public', 'samples', 'inventory-stock-adjustment-sample.xlsx'),
  join(root, '..', '..', 'auradev-erp-backend', 'src', 'main', 'resources', 'samples', 'inventory-stock-adjustment-sample.xlsx'),
]

for (const p of outPaths) {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, buf)
  console.log('Wrote', p)
}
