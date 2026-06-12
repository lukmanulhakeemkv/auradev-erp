import type { SavedBill } from './billing-api'

export interface ReceiptMeta {
  storeName?: string
  storePhone?: string
  logoUrl?: string
}

export const DEFAULT_RECEIPT_META: ReceiptMeta = {
  storeName: 'Nenjankod Supermarket',
  storePhone: '0820 256 7711',
  logoUrl: '/logo.jpeg',
}

function money(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function receiptLines(bill: SavedBill, meta: ReceiptMeta): string[] {
  const lines: string[] = [
    meta.storeName ?? DEFAULT_RECEIPT_META.storeName!,
    meta.storePhone ?? DEFAULT_RECEIPT_META.storePhone!,
    '--------------------------------',
    `Bill  ${bill.billNo}`,
    formatDate(bill.createdAt),
    `Customer: ${bill.customerName}`,
    `Cashier: ${bill.cashierName}`,
    '--------------------------------',
  ]
  for (const line of bill.lines) {
    lines.push(line.name)
    lines.push(`  ${line.quantity} ${line.unitLabel} x ${money(line.unitPrice)}  ${money(line.lineTotal)}`)
  }
  lines.push('--------------------------------')
  lines.push(`Subtotal${' '.repeat(18)}${money(bill.subtotal)}`)
  if (bill.billDiscount > 0) {
    lines.push(`Discount${' '.repeat(18)}-${money(bill.billDiscount)}`)
  }
  lines.push(`CGST${' '.repeat(20)}${money(bill.cgstTotal)}`)
  lines.push(`SGST${' '.repeat(20)}${money(bill.sgstTotal)}`)
  lines.push(`TOTAL${' '.repeat(19)}${money(bill.grandTotal)}`)
  lines.push(`Paid via ${bill.paymentMethod}`)
  if (bill.tendered != null) {
    lines.push(`Tendered${' '.repeat(17)}${money(bill.tendered)}`)
  }
  if (bill.changeDue != null && bill.changeDue > 0) {
    lines.push(`Change${' '.repeat(19)}${money(bill.changeDue)}`)
  }
  lines.push('--------------------------------')
  lines.push('Thank you! Visit again.')
  return lines
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load receipt logo: ${src}`))
    img.src = src
  })
}

async function renderCanvas(bill: SavedBill, meta: ReceiptMeta): Promise<HTMLCanvasElement> {
  const lines = receiptLines(bill, meta)
  const width = 320
  const lineHeight = 18
  const padding = 16
  const logoUrl = meta.logoUrl ?? DEFAULT_RECEIPT_META.logoUrl!

  let logoBlock = 0
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await loadImage(logoUrl)
    const maxLogoWidth = width - padding * 2
    const scale = Math.min(1, maxLogoWidth / logoImg.width)
    logoBlock = logoImg.height * scale + 12
  } catch {
    logoImg = null
  }

  const height = padding * 2 + logoBlock + lines.length * lineHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#111111'

  if (logoImg) {
    const maxLogoWidth = width - padding * 2
    const scale = Math.min(1, maxLogoWidth / logoImg.width)
    const drawWidth = logoImg.width * scale
    const drawHeight = logoImg.height * scale
    ctx.drawImage(logoImg, (width - drawWidth) / 2, padding, drawWidth, drawHeight)
  }

  const textTop = padding + logoBlock
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? 'bold 14px sans-serif' : '13px monospace'
    ctx.fillText(line, padding, textTop + (i + 1) * lineHeight - 4)
  })
  return canvas
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function saveReceiptPng(bill: SavedBill, meta: ReceiptMeta = DEFAULT_RECEIPT_META) {
  const canvas = await renderCanvas(bill, meta)
  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, `${bill.billNo}.png`)
  }, 'image/png')
}

export async function saveReceiptPdf(bill: SavedBill, meta: ReceiptMeta = DEFAULT_RECEIPT_META) {
  const canvas = await renderCanvas(bill, meta)
  const imgData = canvas.toDataURL('image/png')
  const { jsPDF } = await import('jspdf')
  const widthMm = 80
  const heightMm = (canvas.height / canvas.width) * widthMm
  const pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation: 'portrait' })
  pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm)
  pdf.save(`${bill.billNo}.pdf`)
}
