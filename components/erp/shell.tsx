'use client'

import { useState, useRef } from 'react'
import { Icon } from './ui'
import { Avatar } from './ui'
import { useAuth } from '@/lib/auth-context'
import { canAccessView, formatRoleLabel } from '@/lib/rbac'
import { MercantileMark } from '@/components/brand/MercantileMark'
import { useClickOutside } from './ui'
import { useProductsQuery } from '@/lib/queries/use-catalog'
import { usePurchaseKpisQuery } from '@/lib/queries/use-purchases'
import { stockStatus } from '@/lib/erp-data'

export type ViewId = 'dashboard' | 'pos' | 'bills' | 'inventory' | 'purchases' | 'settings'

const NAV = [
  {
    label: 'Operations', items: [
      { id: 'dashboard' as ViewId, label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'pos' as ViewId, label: 'Billing / POS', icon: 'scan-line' },
      { id: 'bills' as ViewId, label: 'Sales bills', icon: 'receipt' },
      { id: 'inventory' as ViewId, label: 'Inventory', icon: 'boxes' },
    ],
  },
  {
    label: 'Procurement', items: [
      { id: 'purchases' as ViewId, label: 'Purchases', icon: 'truck' },
    ],
  },
]

const VIEW_META: Record<ViewId, { title: string; crumb: string }> = {
  dashboard: { title: 'Dashboard', crumb: 'Operations · Overview' },
  pos: { title: 'Billing / POS', crumb: 'Operations · Counter 1' },
  bills: { title: 'Sales bills', crumb: 'Operations · Bill history' },
  inventory: { title: 'Inventory', crumb: 'Operations · Stock' },
  purchases: { title: 'Purchases', crumb: 'Procurement · Supplier Bills' },
  settings: { title: 'Settings', crumb: 'Administration' },
}

export function Sidebar({
  view, setView, collapsed, mobileOpen, onNavigate,
}: {
  view: ViewId
  setView: (v: ViewId) => void
  collapsed: boolean
  mobileOpen?: boolean
  onNavigate?: () => void
}) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen)

  const canSettings = canAccessView(user, 'settings')

  const productsQuery = useProductsQuery()
  const lowStockCount = (productsQuery.data ?? []).filter(p => stockStatus(p) !== 'in').length

  function pickView(next: ViewId) {
    setView(next)
    setMenuOpen(false)
    onNavigate?.()
  }

  function navTo(next: ViewId) {
    setView(next)
    onNavigate?.()
  }

  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '')}>
      <div className="sb-brand">
        <div className="sb-logo">
          <MercantileMark height={16} />
        </div>
        <div className="sb-brand-text">
          <span className="nm font-brand">Mercantile</span>
        </div>
      </div>

      <div className="sb-scroll">
        {NAV.map(sec => {
          const items = sec.items.filter(it => canAccessView(user, it.id))
          if (!items.length) return null
          return (
          <div className="sb-section" key={sec.label}>
            <div className="sb-label">{sec.label}</div>
            {items.map(it => (
              <button
                key={it.id}
                className={'sb-nav' + (view === it.id ? ' active' : '')}
                data-tip={it.label}
                onClick={() => navTo(it.id)}
              >
                <Icon name={it.icon} size={18} className="ic" />
                <span className="sb-txt">{it.label}</span>
                {it.id === 'inventory' && lowStockCount > 0 && (
                  <span className="sb-count">{lowStockCount}</span>
                )}
              </button>
            ))}
          </div>
          )
        })}
      </div>

      <div className="sb-foot">
        <div ref={menuRef} className="sb-user-wrap">
          <button
            type="button"
            className={'sb-user' + (menuOpen ? ' open' : '')}
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Avatar name={user?.name ?? ''} size="sm" />
            <div className="who">
              <div className="n">{user?.name ?? '—'}</div>
              <div className="r">{user?.role ? formatRoleLabel(user.role) : ''}</div>
            </div>
            <Icon name={menuOpen ? 'chevron-down' : 'chevron-up'} size={15} className="chev" />
          </button>

          {menuOpen && (
            <div className="sb-user-menu popover" role="menu">
              <div className="sb-user-menu-head">
                <Avatar name={user?.name ?? ''} size="lg" />
                <div className="who">
                  <div className="n">{user?.name ?? '—'}</div>
                  <div className="e">{user?.email ?? ''}</div>
                  <div className="r">{user?.role ? formatRoleLabel(user.role) : ''}</div>
                </div>
              </div>
              {canSettings && (
                <>
                  <button type="button" className="menu-item" role="menuitem" onClick={() => pickView('settings')}>
                    <Icon name="settings" size={16} className="lead" />
                    Settings
                  </button>
                  <div className="menu-divider" />
                </>
              )}
              <button
                type="button"
                className="menu-item danger"
                role="menuitem"
                onClick={() => { setMenuOpen(false); logout() }}
              >
                <Icon name="log-out" size={16} className="lead" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const productsQuery = useProductsQuery()
  const kpisQuery = usePurchaseKpisQuery()

  const allProducts = productsQuery.data ?? []
  const lowStockProducts = allProducts.filter(p => stockStatus(p) !== 'in').slice(0, 6)

  const kpisAll = kpisQuery.data?.items ?? []
  const pendingGRN = kpisAll.filter(p => p.status === 'PENDING_GRN').slice(0, 4)
  const awaitingPayment = kpisAll.filter(p => p.status === 'BILLED').slice(0, 4)

  const totalCount =
    allProducts.filter(p => stockStatus(p) !== 'in').length +
    kpisAll.filter(p => p.status === 'PENDING_GRN' || p.status === 'BILLED').length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen(o => !o)}>
        <Icon name="bell" size={18} />
        {totalCount > 0 && <span className="dot" />}
      </button>

      {open && (
        <div className="notif-panel popover" role="menu">
          <div className="notif-panel-head">
            <Icon name="bell" size={16} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
            <div className="notif-title">Notifications</div>
            {totalCount > 0 && <span className="notif-count">{totalCount}</span>}
          </div>

          {lowStockProducts.length > 0 && (
            <>
              <div className="menu-label">Low / out of stock</div>
              {lowStockProducts.map(p => (
                <div key={p.id} className="menu-item" style={{ alignItems: 'flex-start', cursor: 'default' }}>
                  <Icon
                    name={p.stock <= 0 ? 'alert-circle' : 'alert-triangle'}
                    size={14}
                    className="lead"
                    style={{ color: p.stock <= 0 ? 'var(--danger-fg)' : 'var(--warning-fg)', marginTop: 2 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="notif-item-name">{p.name}</div>
                    <div className="notif-item-sub">
                      {p.stock <= 0 ? 'Out of stock' : `${p.stock} left · reorder at ${p.reorder}`}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {pendingGRN.length > 0 && (
            <>
              <div className="menu-divider" />
              <div className="menu-label">Pending delivery</div>
              {pendingGRN.map(p => (
                <div key={p.id} className="menu-item" style={{ alignItems: 'flex-start', cursor: 'default' }}>
                  <Icon name="truck" size={14} className="lead" style={{ marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="notif-item-name">{p.supplierName}</div>
                    <div className="notif-item-sub">{p.purchaseNo} · awaiting GRN</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {awaitingPayment.length > 0 && (
            <>
              <div className="menu-divider" />
              <div className="menu-label">Awaiting payment</div>
              {awaitingPayment.map(p => (
                <div key={p.id} className="menu-item" style={{ alignItems: 'flex-start', cursor: 'default' }}>
                  <Icon name="clock" size={14} className="lead" style={{ marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="notif-item-name">{p.supplierName}</div>
                    <div className="notif-item-sub">{p.purchaseNo} · payment due</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {totalCount === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 16px', color: 'var(--fg-subtle)', fontSize: 13 }}>
              <Icon name="check-circle" size={18} style={{ color: 'var(--success-fg)' }} />
              <span>All caught up</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import type { Theme } from '@/lib/theme'

export function Topbar({
  view, theme, onToggleTheme, collapsed, setCollapsed, onMobileNav, onCmd,
}: {
  view: ViewId
  theme: Theme
  onToggleTheme: () => void
  collapsed: boolean
  setCollapsed: (fn: (c: boolean) => boolean) => void
  onMobileNav?: () => void
  onCmd: () => void
}) {
  const meta = VIEW_META[view] ?? { title: '', crumb: '' }
  return (
    <header className="topbar">
      <button type="button" className="icon-btn mobile-only" onClick={onMobileNav} aria-label="Open navigation">
        <Icon name="menu" size={18} />
      </button>
      <button type="button" className="icon-btn desktop-only" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
        <Icon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={18} />
      </button>
      <div className="tb-title">
        <span className="h">{meta.title}</span>
        <span className="crumb">{meta.crumb}</span>
      </div>
      <div className="spacer" />
      {view !== 'pos' && (
        <button className="cmd-trigger" onClick={onCmd} type="button" aria-label="Open search">
          <Icon name="search" size={15} />
          <span className="cmd-trigger-label">Search products, bills…</span>
        </button>
      )}
      <NotificationBell />
      <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
    </header>
  )
}
