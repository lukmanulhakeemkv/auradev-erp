'use client'

import { useState, useEffect } from 'react'
import { ToastProvider, useToast } from './ui'
import { Sidebar, Topbar, type ViewId } from './shell'
import { GlobalSearch, type GlobalSearchSelect } from './global-search'
import { Dashboard } from './dashboard'
import { POS } from './pos'
import { Inventory } from './inventory'
import { Purchases } from './purchases'
import { Bills } from './bills'
import { Settings } from './settings'
import { LoginScreen } from './login'
import { useAuth } from '@/lib/auth-context'

function AppInner() {
  const toast = useToast()
  const [view, setView] = useState<ViewId>('dashboard')
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ view: ViewId; q: string; key: number } | null>(null)
  const [openBillId, setOpenBillId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view === 'pos') return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [view])

  useEffect(() => {
    if (view === 'pos') setSearchOpen(false)
  }, [view])

  function handleSearchSelect(sel: GlobalSearchSelect) {
    setView(sel.view)
    if (sel.billId) {
      setOpenBillId(sel.billId)
      return
    }
    if (sel.query) setPrefill({ view: sel.view, q: sel.query, key: Date.now() })
  }

  function setTheme(t: string) {
    setThemeState(t as 'light' | 'dark')
  }

  const isPOS = view === 'pos'

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} collapsed={collapsed} toast={toast} />
      <div className="main">
        <Topbar
          view={view}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onCmd={() => setSearchOpen(true)}
        />
        <GlobalSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={handleSearchSelect}
        />
        <div className={'content' + (isPOS ? ' pos-mode' : '')}>
          <div className="dashboard-mount" style={{ display: view === 'dashboard' ? 'block' : 'none' }}>
            <Dashboard
              setView={(v) => setView(v as ViewId)}
              onOpenBill={(id) => { setOpenBillId(id); setView('bills') }}
              active={view === 'dashboard'}
            />
          </div>
          {view === 'bills' && (
            <Bills
              openBillId={openBillId}
              onOpenBillConsumed={() => setOpenBillId(null)}
              prefillQuery={prefill?.view === 'bills' ? prefill.q : undefined}
              prefillKey={prefill?.view === 'bills' ? prefill.key : undefined}
              onPrefillConsumed={() => setPrefill(null)}
            />
          )}
          {view === 'inventory' && (
            <Inventory
              prefillQuery={prefill?.view === 'inventory' ? prefill.q : undefined}
              prefillKey={prefill?.view === 'inventory' ? prefill.key : undefined}
              onPrefillConsumed={() => setPrefill(null)}
            />
          )}
          {view === 'purchases' && (
            <Purchases
              prefillQuery={prefill?.view === 'purchases' ? prefill.q : undefined}
              prefillKey={prefill?.view === 'purchases' ? prefill.key : undefined}
              onPrefillConsumed={() => setPrefill(null)}
            />
          )}
          {view === 'settings'  && <Settings />}
          <div
            className="pos-mount"
            style={{ display: isPOS ? 'flex' : 'none' }}
          >
            <POS
              active={isPOS}
              prefillQuery={prefill?.view === 'pos' ? prefill.q : undefined}
              prefillKey={prefill?.view === 'pos' ? prefill.key : undefined}
              onPrefillConsumed={() => setPrefill(null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ERPApp() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 7 9-4 9 4-9 4-9-4Z"/>
            <path d="m3 7 9 4v10"/>
            <path d="m21 7-9 4" opacity=".55"/>
          </svg>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
