'use client'

import { useState, useEffect } from 'react'
import { ToastProvider, useToast } from './ui'
import { Sidebar, Topbar, type ViewId } from './shell'
import { Dashboard } from './dashboard'
import { POS } from './pos'
import { Inventory } from './inventory'
import { Purchases } from './purchases'
import { Settings } from './settings'
import { LoginScreen } from './login'
import { useAuth } from '@/lib/auth-context'

function AppInner() {
  const toast = useToast()
  const [view, setView] = useState<ViewId>('dashboard')
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

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
          onCmd={() => toast('Search — use the search on each screen', { icon: 'command', tone: '' })}
        />
        <div className={'content' + (isPOS ? ' pos-mode' : '')}>
          {view === 'dashboard' && <Dashboard setView={(v) => setView(v as ViewId)} />}
          {view === 'pos'       && <POS />}
          {view === 'inventory' && <Inventory />}
          {view === 'purchases' && <Purchases />}
          {view === 'settings'  && <Settings />}
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
