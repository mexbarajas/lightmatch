import { db } from '@/lib/database'
import type { AppView } from '@/App'

const BRAND_COLORS: Record<string, string> = {
  cooper: '#1a56db', acuity: '#0e9f6e', rab: '#d03801', keystone: '#7e3af2'
}

export function Dashboard({ setView }: { setView: (v: AppView) => void }) {
  const stats = db.getStats()
  const brands = db.getBrands()
  const recentSizes = ['2x4','2x2','1x4','1x1','1x2']

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">LightMatch Intelligence</h1>
          <p className="page-sub">Competitor → Cooper Lighting cross-reference engine</p>
        </div>
        <button className="btn-primary" onClick={() => setView('match')}>
          Start Matching ⇄
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {[
          { label: 'Brands in DB', value: stats.brands, icon: '◈' },
          { label: 'Products Indexed', value: stats.total, icon: '⬡' },
          { label: 'Cooper SKUs', value: stats.byBrand['cooper'] || 0, icon: '★' },
          { label: 'Sizes Covered', value: Object.keys(stats.bySize).length, icon: '⊞' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Brand coverage */}
      <div className="section-title">Brand Coverage</div>
      <div className="brand-grid">
        {brands.map(b => {
          const products = db.getProductsByBrand(b.id)
          return (
            <div className="brand-card" key={b.id}>
              <div className="brand-card-accent" style={{ background: BRAND_COLORS[b.id] || '#888' }} />
              <div className="brand-card-body">
                <div className="brand-card-name">{b.name}</div>
                <div className="brand-card-parent">{b.parent}</div>
                <div className="brand-card-products">
                  {products.map(p => (
                    <span className="product-chip" key={p.id} style={{ borderColor: BRAND_COLORS[b.id] || '#888' }}>
                      {p.size.toUpperCase()} — {p.series}
                    </span>
                  ))}
                </div>
                <div className="brand-card-count">{products.length} product{products.length !== 1 ? 's' : ''} indexed</div>
              </div>
            </div>
          )
        })}
        <div className="brand-card brand-card-add" onClick={() => setView('knowledge')}>
          <div className="brand-add-icon">+</div>
          <div className="brand-add-label">Add Brand / Spec Sheet</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        <button className="qa-btn" onClick={() => setView('match')}>
          <span className="qa-icon">⇄</span>
          <span className="qa-label">Match a Competitor Part</span>
          <span className="qa-sub">Enter catalog # → get Cooper equivalent</span>
        </button>
        <button className="qa-btn" onClick={() => setView('match')}>
          <span className="qa-icon">📄</span>
          <span className="qa-label">Upload Spec Sheet / Excel</span>
          <span className="qa-sub">Bulk match from file upload</span>
        </button>
        <button className="qa-btn" onClick={() => setView('knowledge')}>
          <span className="qa-icon">◈</span>
          <span className="qa-label">Browse Knowledge Base</span>
          <span className="qa-sub">View & edit all indexed specs</span>
        </button>
        <button className="qa-btn" onClick={() => setView('quote')}>
          <span className="qa-icon">≡</span>
          <span className="qa-label">Open Quote Builder</span>
          <span className="qa-sub">Build & export Cooper quote</span>
        </button>
      </div>

      {/* Match flags reference */}
      <div className="section-title">Key Matching Rules</div>
      <div className="rules-grid">
        {[
          { icon: '★', color: '#1a56db', rule: '90 CRI', desc: 'Cooper MMS is the only brand with 90 CRI minimum. Always flag when downgrading.' },
          { icon: '◉', color: '#d03801', rule: '5% Dimming', desc: 'Cooper MMS and RAB FAHE dim to 5%. Acuity CPX and RAB FA dim to 10% only.' },
          { icon: '⊞', color: '#0e9f6e', rule: 'Size = Hard Match', desc: '2x4 must match 2x4. Keystone 2x2 is 21.57in — does not fill standard 24in grid.' },
          { icon: '◈', color: '#7e3af2', rule: 'DLC Premium', desc: 'Keystone is DLC Premium on all SKUs. Acuity & RAB require HE version for Premium rebates.' },
          { icon: '⬡', color: '#d03801', rule: 'NSF Required?', desc: 'Only Cooper and Acuity carry NSF/ANSI 2. RAB and Keystone cannot be used in food service.' },
          { icon: '✦', color: '#0e9f6e', rule: 'Cooper Exclusive Sizes', desc: '1x1, 1x2, and 4x6in are Cooper MMS only — no substitute exists in any other brand.' },
        ].map(r => (
          <div className="rule-card" key={r.rule}>
            <span className="rule-icon" style={{ color: r.color }}>{r.icon}</span>
            <div>
              <div className="rule-title">{r.rule}</div>
              <div className="rule-desc">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
