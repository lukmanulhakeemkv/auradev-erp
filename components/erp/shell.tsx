'use client'

import { useState, useEffect } from 'react'
import { Icon } from './ui'
import { Avatar } from './ui'
import { useAuth } from '@/lib/auth-context'
import { MercantileMark } from '@/components/brand/MercantileMark'

export type ViewId = 'dashboard' | 'pos' | 'bills' | 'inventory' | 'purchases' | 'settings'

type ToastFn = (msg: string, opts?: { icon?: string; tone?: string }) => void

const NAV = [
  {
    label: 'Operations', items: [
      { id: 'dashboard' as ViewId, label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'pos' as ViewId, label: 'Billing / POS', icon: 'scan-line' },
      { id: 'bills' as ViewId, label: 'Sales bills', icon: 'receipt' },
      { id: 'inventory' as ViewId, label: 'Inventory', icon: 'boxes', count: 4 },
    ],
  },
  {
    label: 'Procurement', items: [
      { id: 'purchases' as ViewId, label: 'Purchases', icon: 'truck' },
    ],
  },
  {
    label: 'Administration', items: [
      { id: 'settings' as ViewId, label: 'Settings', icon: 'settings' },
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
  view, setView, collapsed, toast,
}: {
  view: ViewId; setView: (v: ViewId) => void; collapsed: boolean; toast: ToastFn
}) {
  const { user, logout } = useAuth()

  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
      <div className="sb-brand">
        <div className="sb-logo">
          <MercantileMark height={16} />
        </div>
        <div className="sb-brand-text">
          <span className="nm font-brand">Mercantile</span>
        </div>
      </div>

      <div className="sb-scroll">
        {NAV.map(sec => (
          <div className="sb-section" key={sec.label}>
            <div className="sb-label">{sec.label}</div>
            {sec.items.map(it => (
              <button
                key={it.id}
                className={'sb-nav' + (view === it.id ? ' active' : '')}
                data-tip={it.label}
                onClick={() => setView(it.id)}
              >
                <Icon name={it.icon} size={18} className="ic" />
                <span className="sb-txt">{it.label}</span>
                {'count' in it && it.count != null && (
                  <span className="sb-count">{it.count}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sb-foot">
        <div className="sb-user">
          <Avatar name={user?.name ?? ''} size="sm" />
          <div className="who">
            <div className="n">{user?.name ?? '—'}</div>
            <div className="r">{user?.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) ?? ''}</div>
          </div>
          <button
            className="icon-btn"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
            title="Sign out"
            onClick={() => logout()}
          >
            <Icon name="log-out" size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function Topbar({
  view, theme, setTheme, collapsed, setCollapsed, onCmd,
}: {
  view: ViewId; theme: string; setTheme: (t: string) => void;
  collapsed: boolean; setCollapsed: (fn: (c: boolean) => boolean) => void;
  onCmd: () => void
}) {
  const meta = VIEW_META[view] ?? { title: '', crumb: '' }
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
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
      <button className="icon-btn" aria-label="Notifications">
        <Icon name="bell" size={18} /><span className="dot" />
      </button>
      <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
    </header>
  )
}
