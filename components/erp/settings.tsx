'use client'

import { useState } from 'react'
import { Icon, Button, Badge, Avatar, Field, TextInput, Select, Segmented, Switch, Modal, Card, IconTile, useToast } from './ui'
import { USERS, AUDIT } from '@/lib/erp-data'

const SETTINGS_NAV = [
  { id: 'store',    label: 'Store Profile',    icon: 'store' },
  { id: 'users',    label: 'User Management',  icon: 'users' },
  { id: 'tax',      label: 'Tax Settings',     icon: 'percent' },
  { id: 'payments', label: 'Payment Methods',  icon: 'wallet' },
  { id: 'printer',  label: 'Printer Settings', icon: 'printer' },
  { id: 'audit',    label: 'Audit Log',        icon: 'scroll-text' },
]

function SaveBar({ onSave, onReset }: { onSave: () => void; onReset: () => void }) {
  return (
    <div className="row gap10" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
      <Button variant="ghost" onClick={onReset}>Cancel</Button>
      <Button variant="primary" icon="check" onClick={onSave}>Save changes</Button>
    </div>
  )
}

function StoreProfile() {
  const toast = useToast()
  const [f, setF] = useState({
    name: 'Nenjankod Supermarket',
    phone: '0820 252 1100',
    gstin: '29ABCDE1234F1Z5',
    addr: '14 Market Road, Nenjankod, Udupi, Karnataka 576101',
    prefix: 'NJK',
    footer: 'Thank you for shopping! Goods once sold are not returnable.',
  })
  const set = (k: string) => (v: string) => setF(s => ({ ...s, [k]: v }))

  return (
    <Card title="Store Profile" sub="Appears on every printed bill and customer-facing surface">
      <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
        <div style={{ width: 88, height: 88, borderRadius: 'var(--r-lg)', border: '1.5px dashed var(--border-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--fg-subtle)', flexShrink: 0, cursor: 'pointer' }}>
          <Icon name="image-plus" size={20} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>Logo</span>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}><Field label="Store name" required><TextInput value={f.name} onChange={set('name')} /></Field></div>
          <Field label="Phone"><TextInput value={f.phone} onChange={set('phone')} icon="phone" /></Field>
          <Field label="GSTIN"><TextInput value={f.gstin} onChange={set('gstin')} /></Field>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Address">
            <div className="input" style={{ height: 'auto' }}>
              <textarea className="bare" value={f.addr} onChange={e => set('addr')(e.target.value)} />
            </div>
          </Field>
        </div>
        <Field label="Bill number prefix" hint="Bills format as NJK-2025-00001"><TextInput value={f.prefix} onChange={set('prefix')} /></Field>
        <Field label="Bill footer message"><TextInput value={f.footer} onChange={set('footer')} /></Field>
      </div>
      <SaveBar onSave={() => toast('Store profile saved')} onReset={() => toast('Changes discarded', { icon: 'undo-2', tone: '' })} />
    </Card>
  )
}

function AddUserModal({ onClose, onSave }: {
  onClose: () => void; onSave: (u: { name: string; email: string; role: string; status: string; last: string }) => void
}) {
  const [f, setF] = useState({ name: '', email: '', role: 'Cashier' })
  const set = (k: string) => (v: string) => setF(s => ({ ...s, [k]: v }))
  return (
    <Modal title="Add user" sub="Invite a team member to this store" icon="user-plus" onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="send" disabled={!f.name || !f.email} onClick={() => onSave({ ...f, status: 'active', last: 'Invite sent' })}>Send invite</Button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Full name" required><TextInput value={f.name} onChange={set('name')} placeholder="e.g. Ravi Shenoy" icon="user-round" /></Field>
        <Field label="Email" required><TextInput value={f.email} onChange={set('email')} placeholder="name@nenjankod.in" icon="mail" type="email" /></Field>
        <Field label="Role">
          <Select value={f.role} onChange={set('role')} options={['Tenant Admin', 'Manager', 'Cashier', 'Inventory Staff', 'Accountant'].map(r => ({ value: r, label: r }))} />
        </Field>
      </div>
    </Modal>
  )
}

function UserManagement() {
  const toast = useToast()
  const [users, setUsers] = useState(() => USERS.map(u => ({ ...u })))
  const [open, setOpen] = useState(false)
  const roleTone: Record<string, string> = { 'Tenant Admin': 'primary', Manager: 'info', Cashier: 'neutral', 'Inventory Staff': 'success' }

  return (
    <Card title="User Management" sub={`${users.length} team members`} action={<Button size="sm" variant="primary" icon="user-plus" onClick={() => setOpen(true)}>Add user</Button>} noBody>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last login</th><th style={{ width: 44 }}></th></tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td>
                  <div className="row gap10">
                    <Avatar name={u.name} size="sm" />
                    <div className="cell-stack"><span className="td-strong">{u.name}</span><span className="td-sub">{u.email}</span></div>
                  </div>
                </td>
                <td><Badge tone={roleTone[u.role] ?? 'neutral'}>{u.role}</Badge></td>
                <td><Badge tone={u.status === 'active' ? 'success' : 'neutral'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge></td>
                <td className="muted">{u.last}</td>
                <td>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => toast('Manage ' + u.name.split(' ')[0])}>
                    <Icon name="more-horizontal" size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <AddUserModal onClose={() => setOpen(false)} onSave={(u) => { setUsers(us => [...us, u]); setOpen(false); toast('Invited ' + u.name) }} />}
    </Card>
  )
}

function TaxSettings() {
  const toast = useToast()
  const [slabs, setSlabs] = useState({ 0: true, 5: true, 12: true, 18: true })
  const [def, setDef] = useState('5')
  const slabDesc: Record<number, string> = { 0: 'Exempt — milk, eggs, fresh produce', 5: 'Essentials — grains, edible oil', 12: 'Processed foods', 18: 'Standard rate' }

  return (
    <Card title="Tax Settings" sub="GST slabs available when creating products">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
        {([0, 5, 12, 18] as const).map(s => (
          <div key={s} className="row" style={{ justifyContent: 'space-between', padding: '11px 4px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>GST {s}%</div>
              <div className="td-sub">{slabDesc[s]}</div>
            </div>
            <Switch checked={slabs[s]} onChange={v => setSlabs(x => ({ ...x, [s]: v }))} />
          </div>
        ))}
      </div>
      <Field label="Default rate for new products">
        <div style={{ maxWidth: 220 }}>
          <Select value={def} onChange={setDef} options={['0', '5', '12', '18'].map(t => ({ value: t, label: `GST ${t}%` }))} />
        </div>
      </Field>
      <SaveBar onSave={() => toast('Tax settings saved')} onReset={() => toast('Changes discarded', { icon: 'undo-2', tone: '' })} />
    </Card>
  )
}

function PaymentMethods() {
  const toast = useToast()
  const [m, setM] = useState({ Cash: true, UPI: true, Card: true, Credit: true })
  const [upi, setUpi] = useState('nenjankod@okhdfc')
  const [tid, setTid] = useState('5512004400')
  const meta: Record<string, { icon: string; d: string }> = {
    Cash:   { icon: 'banknote',    d: 'Notes & coins, change calculator' },
    UPI:    { icon: 'qr-code',     d: 'QR & VPA collect' },
    Card:   { icon: 'credit-card', d: 'Debit / credit via terminal' },
    Credit: { icon: 'notebook-pen',d: 'Khata for registered B2B' },
  }

  return (
    <Card title="Payment Methods" sub="Methods offered at the billing counter">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {Object.keys(meta).map(k => (
          <div key={k} className="row gap12" style={{ padding: '11px 4px', borderBottom: '1px solid var(--border)' }}>
            <IconTile size={32} icon={meta[k].icon} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{k}</div>
              <div className="td-sub">{meta[k].d}</div>
            </div>
            <Switch checked={m[k as keyof typeof m]} onChange={v => setM(x => ({ ...x, [k]: v }))} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="UPI ID (VPA)"><TextInput value={upi} onChange={setUpi} icon="at-sign" /></Field>
        <Field label="Card terminal ID"><TextInput value={tid} onChange={setTid} icon="credit-card" /></Field>
      </div>
      <SaveBar onSave={() => toast('Payment methods saved')} onReset={() => toast('Changes discarded', { icon: 'undo-2', tone: '' })} />
    </Card>
  )
}

function PrinterSettings() {
  const toast = useToast()
  const [width, setWidth] = useState('80')
  const [auto, setAuto] = useState(true)
  const [copies, setCopies] = useState('1')

  return (
    <Card title="Printer Settings" sub="Receipt output configuration">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Receipt width">
          <Segmented value={width} onChange={setWidth} options={[{ value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }]} />
        </Field>
        <div className="row" style={{ justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Auto-print on bill completion</div>
            <div className="td-sub">Print the receipt the moment payment is confirmed</div>
          </div>
          <Switch checked={auto} onChange={setAuto} />
        </div>
        <Field label="Bill copies" hint="Number of copies printed per bill">
          <div style={{ maxWidth: 160 }}>
            <Select value={copies} onChange={setCopies} options={['1', '2', '3'].map(c => ({ value: c, label: c + (c === '1' ? ' copy' : ' copies') }))} />
          </div>
        </Field>
      </div>
      <SaveBar onSave={() => toast('Printer settings saved')} onReset={() => toast('Changes discarded', { icon: 'undo-2', tone: '' })} />
    </Card>
  )
}

function AuditLog() {
  return (
    <Card title="Audit Log" sub="Read-only · last 50 system events" noBody>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Action</th><th>User</th><th>Timestamp</th><th>IP address</th></tr></thead>
          <tbody>
            {AUDIT.map((a, i) => (
              <tr key={i}>
                <td className="td-strong">{a.act}</td>
                <td className="muted">{a.user}</td>
                <td className="muted tnum">{a.ts}</td>
                <td className="mono muted">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function Settings() {
  const [sec, setSec] = useState('store')

  return (
    <div className="content-pad" style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="section-title">Settings</div>
        <div className="section-sub">Configure Nenjankod Supermarket · Tenant <span className="mono">tn_njk_001</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '212px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="settings-nav">
          {SETTINGS_NAV.map(s => (
            <button key={s.id} className={'sb-nav' + (sec === s.id ? ' active' : '')} onClick={() => setSec(s.id)} style={{ marginBottom: 2 }}>
              <Icon name={s.icon} size={17} className="ic" /><span className="sb-txt">{s.label}</span>
            </button>
          ))}
        </div>
        <div>
          {sec === 'store'    && <StoreProfile />}
          {sec === 'users'    && <UserManagement />}
          {sec === 'tax'      && <TaxSettings />}
          {sec === 'payments' && <PaymentMethods />}
          {sec === 'printer'  && <PrinterSettings />}
          {sec === 'audit'    && <AuditLog />}
        </div>
      </div>
    </div>
  )
}
