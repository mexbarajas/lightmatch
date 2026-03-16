import { useState, useRef } from 'react'
import { db } from '@/lib/database'
import type { AppView } from '@/App'
import type { Product, MatchResult } from '@/lib/database'

type InputMode = 'manual' | 'catalog' | 'file'

const SIZES = ['2x4','2x2','1x4','1x1','1x2','4x6']
const BRANDS = ['acuity','rab','keystone','other']
const BRAND_LABELS: Record<string,string> = { acuity: 'Acuity / Lithonia', rab: 'RAB Lighting', keystone: 'Keystone', other: 'Other Brand' }

export function MatchEngine({ setView, quoteItems, setQuoteItems }: {
  setView: (v: AppView) => void
  quoteItems: any[]
  setQuoteItems: (items: any[]) => void
}) {
  const [mode, setMode] = useState<InputMode>('manual')
  const [results, setResults] = useState<MatchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual form state
  const [form, setForm] = useState({
    brand: 'acuity', catalogInput: '', size: '2x4',
    lumens: '', watts: '', cri: '80', cct: '4000K',
    dlc: 'standard', nsf: false, dimTo: '10',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const runMatch = () => {
    const partial: Partial<Product> = {
      brand: form.brand,
      size: form.size,
      lumens: { medium: Number(form.lumens) || 0 },
      cri: Number(form.cri) || 80,
      cct: [form.cct],
      dlc: form.dlc as any,
      nsf: form.nsf,
      dimTo: Number(form.dimTo) || 10,
    }
    const matches = db.findCooperMatch(partial)
    setResults(matches)
    setSearched(true)
  }

  const handleCatalogLookup = () => {
    const cat = form.catalogInput.trim().toLowerCase()
    // Try to infer size from catalog number
    let size = '2x4'
    if (cat.includes('2x2') || cat.includes('22')) size = '2x2'
    else if (cat.includes('1x4') || cat.includes('14')) size = '1x4'
    else if (cat.includes('1x1') || cat.includes('11')) size = '1x1'
    else if (cat.includes('1x2') || cat.includes('12')) size = '1x2'

    // Find source product in DB
    const source = db.getAllProducts().find(p =>
      p.catalogNumber.toLowerCase().includes(cat.split(' ')[0]) ||
      cat.includes(p.id.split('-')[1])
    )
    if (source) {
      const matches = db.findCooperMatch(source)
      setResults(matches)
    } else {
      set('size', size)
      const partial: Partial<Product> = { size }
      setResults(db.findCooperMatch(partial))
    }
    setSearched(true)
  }

  const addToQuote = (result: MatchResult, qty = 1) => {
    const id = `q-${Date.now()}-${result.cooperProduct.id}`
    const item = {
      id,
      description: result.cooperProduct.series + ' LED Panel',
      size: result.cooperProduct.size,
      qty,
      competitorBrand: BRAND_LABELS[form.brand] || form.brand,
      competitorCatalog: form.catalogInput || `${form.brand.toUpperCase()} ${form.size}`,
      cooperCatalog: result.cooperProduct.catalogNumber,
      cooperSeries: result.cooperProduct.series,
      lumens: result.cooperProduct.lumens.medium,
      watts: result.cooperProduct.watts.medium,
      cct: form.cct,
      accessories: [],
      notes: result.notes.join(' | '),
      matchScore: result.score,
    }
    setQuoteItems([...quoteItems, item])
    setAddedIds(prev => new Set([...prev, result.cooperProduct.id]))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Simulate parsing — in production this would parse Excel/PDF
    alert(`File "${file.name}" received. In production, this would parse your spec sheet or Excel BOM and auto-populate the match form. For now, please use Manual Input mode to enter specs.`)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Match & Convert</h1>
          <p className="page-sub">Find the Cooper equivalent for any competitor product</p>
        </div>
        {quoteItems.length > 0 && (
          <button className="btn-primary" onClick={() => setView('quote')}>
            View Quote ({quoteItems.length}) →
          </button>
        )}
      </div>

      {/* Mode tabs */}
      <div className="mode-tabs">
        {(['manual','catalog','file'] as InputMode[]).map(m => (
          <button key={m} className={`mode-tab ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {m === 'manual' ? '✏ Manual Input' : m === 'catalog' ? '🔍 Catalog Lookup' : '📁 File Upload'}
          </button>
        ))}
      </div>

      <div className="match-layout">
        {/* Input Panel */}
        <div className="input-panel">
          {mode === 'file' ? (
            <div className="file-zone" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf,.csv" style={{ display: 'none' }} onChange={handleFile} />
              <div className="file-icon">📁</div>
              <div className="file-label">Drop or click to upload</div>
              <div className="file-sub">Supports: Excel (.xlsx, .xls) · PDF spec sheets · CSV</div>
              <div className="file-btn">Browse Files</div>
            </div>
          ) : mode === 'catalog' ? (
            <div className="form-group">
              <label className="form-label">Competitor Catalog Number</label>
              <input
                className="form-input mono"
                placeholder="e.g. CPX 2X4 ALO8 SWW7 M2"
                value={form.catalogInput}
                onChange={e => set('catalogInput', e.target.value)}
              />
              <label className="form-label" style={{marginTop:16}}>Brand</label>
              <div className="pill-row">
                {BRANDS.map(b => (
                  <button key={b} className={`pill ${form.brand === b ? 'active' : ''}`} onClick={() => set('brand', b)}>
                    {BRAND_LABELS[b]}
                  </button>
                ))}
              </div>
              <button className="btn-primary full" style={{marginTop:24}} onClick={handleCatalogLookup}>
                Look Up →
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Competitor Brand</label>
              <div className="pill-row">
                {BRANDS.map(b => (
                  <button key={b} className={`pill ${form.brand === b ? 'active' : ''}`} onClick={() => set('brand', b)}>
                    {BRAND_LABELS[b]}
                  </button>
                ))}
              </div>

              <label className="form-label">Panel Size</label>
              <div className="pill-row">
                {SIZES.map(s => (
                  <button key={s} className={`pill ${form.size === s ? 'active' : ''}`} onClick={() => set('size', s)}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Lumens (medium/default)</label>
                  <input className="form-input" type="number" placeholder="e.g. 3600" value={form.lumens} onChange={e => set('lumens', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Watts (medium/default)</label>
                  <input className="form-input" type="number" placeholder="e.g. 28" value={form.watts} onChange={e => set('watts', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">CRI Minimum</label>
                  <select className="form-input" value={form.cri} onChange={e => set('cri', e.target.value)}>
                    <option value="80">80 CRI</option>
                    <option value="90">90 CRI</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">CCT Specified</label>
                  <select className="form-input" value={form.cct} onChange={e => set('cct', e.target.value)}>
                    {['2700K','3000K','3500K','4000K','5000K'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">DLC Requirement</label>
                  <select className="form-input" value={form.dlc} onChange={e => set('dlc', e.target.value)}>
                    <option value="none">None</option>
                    <option value="standard">DLC Standard</option>
                    <option value="premium">DLC Premium</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Min Dim Level</label>
                  <select className="form-input" value={form.dimTo} onChange={e => set('dimTo', e.target.value)}>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
              </div>

              <div className="check-row">
                <label className="check-label">
                  <input type="checkbox" checked={form.nsf} onChange={e => set('nsf', e.target.checked)} />
                  NSF/ANSI 2 required (food service)
                </label>
              </div>

              <button className="btn-primary full" style={{ marginTop: 24 }} onClick={runMatch}>
                Find Cooper Match ⇄
              </button>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {!searched ? (
            <div className="results-empty">
              <div className="empty-icon">⇄</div>
              <div className="empty-label">Enter competitor specs to find Cooper matches</div>
              <div className="empty-sub">Results will appear here with match scores, flags, and advantages</div>
            </div>
          ) : results.length === 0 ? (
            <div className="results-empty">
              <div className="empty-icon">◯</div>
              <div className="empty-label">No matches found</div>
              <div className="empty-sub">Try adjusting the size or relaxing some filters</div>
            </div>
          ) : (
            <div className="results-list">
              <div className="results-count">{results.length} Cooper match{results.length > 1 ? 'es' : ''} found</div>
              {results.map((r, i) => (
                <MatchCard key={r.cooperProduct.id} result={r} rank={i+1}
                  added={addedIds.has(r.cooperProduct.id)}
                  onAdd={qty => addToQuote(r, qty)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MatchCard({ result, rank, added, onAdd }: {
  result: MatchResult, rank: number, added: boolean, onAdd: (qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const p = result.cooperProduct
  const scoreColor = result.score >= 80 ? '#0e9f6e' : result.score >= 60 ? '#d97706' : '#e02424'

  return (
    <div className={`match-card ${rank === 1 ? 'match-card-top' : ''}`}>
      <div className="match-card-header">
        <div className="match-rank">#{rank}</div>
        <div className="match-score-bar">
          <div className="match-score-fill" style={{ width: `${result.score}%`, background: scoreColor }} />
        </div>
        <div className="match-score-val" style={{ color: scoreColor }}>{result.score}%</div>
        {rank === 1 && <span className="best-badge">Best Match</span>}
      </div>

      <div className="match-catalog">{p.catalogNumber}</div>
      <div className="match-series">{p.brand.toUpperCase()} / {p.series} — {p.size.toUpperCase()}</div>

      <div className="match-specs">
        <span className="spec-chip">{p.lumens.medium.toLocaleString()} lm</span>
        <span className="spec-chip">{p.watts.medium}W</span>
        <span className="spec-chip">{p.efficacy} lm/W</span>
        <span className="spec-chip">{p.cri} CRI</span>
        <span className="spec-chip">{p.cct.join(' / ')}</span>
        <span className="spec-chip">Dims to {p.dimTo}%</span>
        <span className="spec-chip">{p.dlc.toUpperCase()} DLC</span>
        <span className="spec-chip">{p.warranty}yr warranty</span>
      </div>

      {result.flags.length > 0 && (
        <div className="match-flags">
          {result.flags.map(f => <span key={f} className="flag-chip">⚠ {f}</span>)}
        </div>
      )}

      {result.advantages.length > 0 && (
        <div className="match-advantages">
          {result.advantages.map(a => <span key={a} className="adv-chip">✓ {a}</span>)}
        </div>
      )}

      <div className="match-actions">
        <div className="qty-control">
          <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <input type="number" value={qty} min={1} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button onClick={() => setQty(qty + 1)}>+</button>
        </div>
        <button
          className={`btn-add ${added ? 'added' : ''}`}
          onClick={() => onAdd(qty)}
          disabled={added}
        >
          {added ? '✓ Added to Quote' : 'Add to Quote →'}
        </button>
      </div>
    </div>
  )
}
