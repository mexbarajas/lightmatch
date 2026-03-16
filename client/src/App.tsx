import { useState, useEffect } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { MatchEngine } from '@/components/MatchEngine'
import { KnowledgeBase } from '@/components/KnowledgeBase'
import { QuoteBuilder } from '@/components/QuoteBuilder'
import { db } from '@/lib/database'

export type AppView = 'dashboard' | 'match' | 'knowledge' | 'quote'

function ProxyBanner() {
  const [status, setStatus] = useState<'checking'|'ok'|'offline'>('checking')
  const check = () => {
    setStatus('checking')
    fetch('/health')
      .then(r => r.json())
      .then((d: any) => setStatus(d.status === 'ok' ? 'ok' : 'offline'))
      .catch(() => setStatus('offline'))
  }
  useEffect(() => { check() }, [])
  if (status === 'checking' || status === 'ok') return null
  return (
    <div className="proxy-banner">
      <div className="proxy-banner-icon">!</div>
      <div className="proxy-banner-text">
        <strong>Server not running</strong> — AI features need the proxy server.
        Open a terminal in the <code>lightmatch-server</code> folder and run:
        <code>npm install &amp;&amp; npm start</code> then refresh this page.
      </div>
      <button className="proxy-banner-retry" onClick={check}>Retry</button>
    </div>
  )
}

function Sidebar({ view, setView, quoteCount }: { view: AppView, setView: (v: AppView) => void, quoteCount: number }) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
    { id: 'match', label: 'Match & Convert', icon: '⇄' },
    { id: 'knowledge', label: 'Knowledge Base', icon: '◈' },
    { id: 'quote', label: 'Quote Builder', icon: '≡', badge: quoteCount || null },
  ]
  const brands = db.getBrands()
  const products = db.getAllProducts()
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">CLS</div>
        <div className="brand-text">
          <span className="brand-name">LightMatch</span>
          <span className="brand-sub">Cooper Lighting Solutions</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {nav.map(n => (
          <button
            key={n.id}
            className={`nav-item ${view === n.id ? 'active' : ''}`}
            onClick={() => setView(n.id as AppView)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
            {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="db-status">
          <span className="db-dot" />
          <span>{brands.length} brands · {products.length} products</span>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [quoteItems, setQuoteItems] = useState<any[]>([])

  return (
    <div className="app-shell-wrap">
      <ProxyBanner />
      <div className="app-shell">
      <Sidebar view={view} setView={setView} quoteCount={quoteItems.length} />
      <main className="main-content">
        {view === 'dashboard' && <Dashboard setView={setView} />}
        {view === 'match' && <MatchEngine setView={setView} quoteItems={quoteItems} setQuoteItems={setQuoteItems} />}
        {view === 'knowledge' && <KnowledgeBase />}
        {view === 'quote' && <QuoteBuilder quoteItems={quoteItems} setQuoteItems={setQuoteItems} />}
      </main>
      </div>
    </div>
  )
}
