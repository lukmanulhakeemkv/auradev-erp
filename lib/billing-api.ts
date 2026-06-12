import { apiFetch } from './api'

export interface ApiCustomer {
  id: string
  name: string
  phone: string | null
  type: 'walkin' | 'b2c' | 'b2b'
  loyaltyPoints: number
  creditBalance: number
}

export interface BillLine {
  productId: string
  name: string
  sku: string
  unitLabel: string
  quantity: number
  unitPrice: number
  gstRate: number
  lineTotal: number
}

export interface SavedBill {
  id: string
  billNo: string
  customerName: string
  cashierName: string
  subtotal: number
  billDiscount: number
  cgstTotal: number
  sgstTotal: number
  grandTotal: number
  paymentStatus: string
  paymentMethod: string
  tendered: number | null
  changeDue: number | null
  createdAt: string
  lines: BillLine[]
}

export interface CreateBillPayload {
  customerId: string
  discountMode: 'AMOUNT' | 'PERCENT'
  billDiscount: number
  items: { productId: string; quantity: number; lineDiscount?: number }[]
  payment: {
    method: 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
    tendered?: number
    splitCashAmount?: number
  }
}

function mapBill(b: Record<string, unknown>): SavedBill {
  const lines = (b.lines as Record<string, unknown>[]).map(l => ({
    productId: String(l.productId),
    name: String(l.name),
    sku: String(l.sku),
    unitLabel: String(l.unitLabel),
    quantity: Number(l.quantity),
    unitPrice: Number(l.unitPrice),
    gstRate: Number(l.gstRate),
    lineTotal: Number(l.lineTotal),
  }))
  return {
    id: String(b.id),
    billNo: String(b.billNo),
    customerName: String(b.customerName),
    cashierName: String(b.cashierName),
    subtotal: Number(b.subtotal),
    billDiscount: Number(b.billDiscount),
    cgstTotal: Number(b.cgstTotal),
    sgstTotal: Number(b.sgstTotal),
    grandTotal: Number(b.grandTotal),
    paymentStatus: String(b.paymentStatus),
    paymentMethod: String(b.paymentMethod),
    tendered: b.tendered != null ? Number(b.tendered) : null,
    changeDue: b.changeDue != null ? Number(b.changeDue) : null,
    createdAt: String(b.createdAt),
    lines,
  }
}

export async function fetchCustomers(): Promise<ApiCustomer[]> {
  return apiFetch<ApiCustomer[]>('/api/v1/customers')
}

export async function createBill(payload: CreateBillPayload): Promise<SavedBill> {
  const data = await apiFetch<Record<string, unknown>>('/api/v1/bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapBill(data)
}
