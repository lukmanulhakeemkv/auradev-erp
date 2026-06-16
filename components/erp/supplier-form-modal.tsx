'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon, Button, Modal, TextInput, Field } from './ui'
import type { Supplier } from '@/lib/purchases-api'
import { createSupplier, updateSupplier } from '@/lib/purchases-api'

function payloadFromFields(fields: {
  name: string
  contactPerson: string
  phone: string
  email: string
  gstin: string
  address: string
}) {
  return {
    name: fields.name.trim(),
    contactPerson: fields.contactPerson.trim() || undefined,
    phone: fields.phone.trim() || undefined,
    email: fields.email.trim() || undefined,
    gstin: fields.gstin.trim() || undefined,
    address: fields.address.trim() || undefined,
  }
}

export function SupplierFormModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier?: Supplier | null
  onClose: () => void
  onSaved: () => void
}) {
  const editing = Boolean(supplier)
  const [name, setName] = useState(supplier?.name ?? '')
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [email, setEmail] = useState(supplier?.email ?? '')
  const [gstin, setGstin] = useState(supplier?.gstin ?? '')
  const [address, setAddress] = useState(supplier?.address ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(supplier?.name ?? '')
    setContactPerson(supplier?.contactPerson ?? '')
    setPhone(supplier?.phone ?? '')
    setEmail(supplier?.email ?? '')
    setGstin(supplier?.gstin ?? '')
    setAddress(supplier?.address ?? '')
    setError(null)
  }, [supplier])

  const submit = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Supplier name is required')
      return
    }
    setBusy(true)
    try {
      const payload = payloadFromFields({ name, contactPerson, phone, email, gstin, address })
      if (editing && supplier) {
        await updateSupplier(supplier.id, payload)
      } else {
        await createSupplier(payload)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : editing ? 'Failed to update supplier' : 'Failed to add supplier')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit supplier' : 'Add supplier'}
      sub={editing ? 'Update vendor details used on purchase bills' : 'Register a new vendor for purchase bills'}
      icon="truck"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" icon={editing ? 'check' : 'plus'} onClick={() => void submit()} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="alert-banner" style={{ marginBottom: 14 }}>
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name" required>
          <TextInput value={name} onChange={setName} placeholder="e.g. Sri Venkateshwara Distributors" />
        </Field>
        <div className="row gap12" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label="Contact person" optional>
              <TextInput value={contactPerson} onChange={setContactPerson} placeholder="Ramesh" />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Phone" optional>
              <TextInput value={phone} onChange={setPhone} placeholder="9448123456" />
            </Field>
          </div>
        </div>
        <Field label="Email" optional>
          <TextInput value={email} onChange={setEmail} placeholder="orders@supplier.in" />
        </Field>
        <Field label="GSTIN" optional>
          <TextInput value={gstin} onChange={setGstin} placeholder="29AABCS1234F1Z5" />
        </Field>
        <Field label="Address" optional>
          <TextInput value={address} onChange={setAddress} placeholder="City, district" />
        </Field>
      </div>
    </Modal>
  )
}
