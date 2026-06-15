/**
 * Generates inventory-import-sample-100.xlsx from erp-data product catalogue.
 * Run: node scripts/generate-import-sample.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const HEADERS = [
  'name', 'sku', 'barcode', 'category', 'unit_type', 'unit_label',
  'mrp', 'selling_price', 'cost_price', 'tax_rate_pct', 'initial_stock', 'reorder_level',
]

/** Mirrors lib/erp-data.ts PRODUCTS (30 items) */
const BASE = [
  ['Sona Masoori Rice', 'Grains', 'kg', 78, 68, 58, 5, 320, 80],
  ['Toor Dal (Arhar)', 'Grains', 'kg', 145, 132, 118, 5, 64, 70],
  ['Whole Wheat Atta', 'Grains', 'kg', 56, 49, 42, 5, 210, 60],
  ['Sunflower Oil', 'Grains', 'pcs', 165, 149, 132, 5, 96, 40],
  ['Idli Rava', 'Grains', 'kg', 62, 54, 46, 5, 38, 40],
  ['Chana Dal', 'Grains', 'kg', 98, 88, 76, 5, 55, 50],
  ['MTR Rava Idli Mix', 'Grains', 'pcs', 72, 66, 56, 12, 29, 30],
  ['Nandini Toned Milk 500ml', 'Dairy', 'pcs', 26, 25, 23, 0, 142, 60],
  ['Amul Butter 100g', 'Dairy', 'pcs', 58, 56, 50, 12, 44, 30],
  ['Curd 400g', 'Dairy', 'pcs', 40, 36, 30, 5, 58, 40],
  ['Paneer 200g', 'Dairy', 'pcs', 89, 82, 71, 5, 22, 25],
  ['Ghee 500ml', 'Dairy', 'pcs', 320, 298, 268, 12, 36, 20],
  ['Eggs (Tray of 30)', 'Dairy', 'pcs', 210, 195, 172, 0, 18, 20],
  ['Tata Tea Gold 250g', 'Beverages', 'pcs', 145, 138, 122, 5, 72, 40],
  ['Bru Coffee 100g', 'Beverages', 'pcs', 195, 182, 160, 18, 41, 30],
  ['Coca-Cola 750ml', 'Beverages', 'pcs', 45, 42, 35, 18, 128, 60],
  ['Bisleri Water 1L', 'Beverages', 'pcs', 20, 19, 14, 18, 240, 100],
  ['Real Mixed Fruit 1L', 'Beverages', 'pcs', 120, 110, 94, 12, 14, 30],
  ['Horlicks 500g', 'Beverages', 'pcs', 285, 264, 232, 18, 33, 25],
  ['Lifebuoy Soap 125g', 'Personal Care', 'pcs', 38, 34, 28, 18, 186, 80],
  ['Colgate Strong 200g', 'Personal Care', 'pcs', 112, 104, 90, 18, 53, 40],
  ['Clinic Plus Shampoo', 'Personal Care', 'pcs', 165, 152, 132, 18, 8, 30],
  ['Dettol Handwash 200ml', 'Personal Care', 'pcs', 99, 89, 74, 18, 61, 30],
  ['Parle-G Biscuits', 'Snacks', 'pcs', 10, 10, 8, 18, 412, 150],
  ['Lays Classic 52g', 'Snacks', 'pcs', 20, 20, 15, 18, 168, 80],
  ['Haldiram Bhujia 200g', 'Snacks', 'pcs', 62, 56, 47, 12, 47, 40],
  ['Britannia Cake 60g', 'Snacks', 'pcs', 30, 28, 22, 18, 3, 30],
  ['Cadbury Dairy Milk 50g', 'Snacks', 'pcs', 45, 42, 34, 18, 94, 50],
  ['Maggi Noodles 4-pack', 'Snacks', 'pcs', 56, 52, 44, 18, 132, 60],
  ['Good Day Cookies', 'Snacks', 'pcs', 35, 32, 26, 18, 76, 50],
]

const CAT_CODE = {
  Grains: 'GRN',
  Dairy: 'DRY',
  Beverages: 'BEV',
  'Personal Care': 'PC',
  Snacks: 'SNK',
}

const SUFFIXES = ['', ' Premium', ' Family Pack', ' Economy', ' Value Pack']

function unitType(label) {
  return label === 'kg' ? 'weight_kg' : 'unit'
}

function buildRows() {
  const rows = []
  for (let i = 0; i < 100; i++) {
    const base = BASE[i % BASE.length]
    const cycle = Math.floor(i / BASE.length)
    const [name, cat, unit, mrp, price, cost, tax, stock, reorder] = base
    const code = CAT_CODE[cat]
    const sku = `BLK-${code}-${String(i + 1).padStart(3, '0')}`
    const barcode = `89012347${String(i + 1).padStart(5, '0')}`
    const displayName = cycle === 0 ? name : `${name}${SUFFIXES[cycle % SUFFIXES.length]}`
    const stockAdj = Math.max(5, stock - cycle * 3)

    rows.push([
      displayName,
      sku,
      barcode,
      cat,
      unitType(unit),
      unit,
      mrp,
      price,
      cost,
      tax,
      stockAdj,
      reorder,
    ])
  }
  return rows
}

const data = [HEADERS, ...buildRows()]
const ws = XLSX.utils.aoa_to_sheet(data)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Products')

const instructions = [
  ['Bulk import sample — 100 products based on Nenjankod catalogue'],
  ['Categories: Grains, Dairy, Beverages, Personal Care, Snacks'],
  ['SKUs use BLK- prefix so they do not clash with seeded products'],
  ['Upload via Inventory → Bulk import'],
]
const ws2 = XLSX.utils.aoa_to_sheet(instructions)
XLSX.utils.book_append_sheet(wb, ws2, 'Instructions')

const outPaths = [
  join(root, 'public', 'samples', 'inventory-import-sample-100.xlsx'),
  join(root, '..', 'auradev-erp-backend', 'src', 'main', 'resources', 'samples', 'inventory-import-sample-100.xlsx'),
]

for (const p of outPaths) {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  console.log('Wrote', p)
}
