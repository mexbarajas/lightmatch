import { useState, useRef, useCallback } from "react"
import { db, knowledgeStore } from "@/lib/database"
import type { SpecSheetRecord, CatalogGrammarRule, FieldDefinition } from "@/lib/database"
import type { Product } from "@/lib/database"

// ── Brand color map ──────────────────────────────────────────────────────────
const BRAND_COLORS: Record<string, string> = {
  cooper: "#003087", acuity: "#1a7a4a", rab: "#b45309", keystone: "#5b21b6"
}

const FIELD_SCHEMA: { key: keyof Product; label: string; type: string; hint: string }[] = [
  { key: "brand",          label: "Brand ID",           type: "text",   hint: "e.g. acuity, rab, keystone, cooper" },
  { key: "series",         label: "Series / Family",    type: "text",   hint: "e.g. CPX, T34FA, MMS" },
  { key: "catalogNumber",  label: "Catalog Number",     type: "text",   hint: "Full orderable catalog number" },
  { key: "size",           label: "Panel Size",         type: "select", hint: "2x4 | 2x2 | 1x4 | 1x1 | 1x2 | 4x6" },
  { key: "fixtureType",    label: "Fixture Type",       type: "text",   hint: "e.g. LED Backlit Panel" },
  { key: "cri",            label: "CRI Minimum",        type: "number", hint: "e.g. 80 or 90" },
  { key: "voltage",        label: "Voltage",            type: "text",   hint: "e.g. 120-277V" },
  { key: "dimming",        label: "Dimming Type",       type: "text",   hint: "e.g. 0-10V" },
  { key: "dimTo",          label: "Dims To (%)",        type: "number", hint: "e.g. 5 or 10" },
  { key: "dlc",            label: "DLC",                type: "select", hint: "none | standard | premium" },
  { key: "warranty",       label: "Warranty (years)",   type: "number", hint: "e.g. 5 or 10" },
  { key: "ambientMax",     label: "Ambient Max (C)",    type: "number", hint: "e.g. 25 or 40" },
  { key: "weight",         label: "Weight (lbs)",       type: "number", hint: "e.g. 8.07" },
  { key: "emergency",      label: "Emergency Backup",   type: "text",   hint: "e.g. 7W/10W/14W or none" },
  { key: "ipRating",       label: "IP Rating",          type: "text",   hint: "e.g. IP65 or none" },
  { key: "occupancySensor",label: "Occupancy Sensor",   type: "text",   hint: "none | integral | external | optional" },
]

// ── Main KnowledgeBase component ──────────────────────────────────────────────
export function KnowledgeBase() {
  const [filterBrand, setFilterBrand] = useState<string>("all")
  const [filterSize, setFilterSize]   = useState<string>("all")
  const [search, setSearch]           = useState("")
  const [selected, setSelected]       = useState<Product | null>(null)
  const [showWizard, setShowWizard]   = useState(false)
  const [refreshKey, setRefreshKey]   = useState(0)
  const [activeTab, setActiveTab]     = useState<"products" | "learning">("products")

  const brands     = db.getBrands()
  const allProducts = db.getAllProducts()

  const filtered = allProducts.filter(p => {
    if (filterBrand !== "all" && p.brand !== filterBrand) return false
    if (filterSize  !== "all" && p.size  !== filterSize)  return false
    if (search && !p.catalogNumber.toLowerCase().includes(search.toLowerCase()) &&
        !p.series.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const refresh = () => { setRefreshKey(k => k + 1); setSelected(null) }

  return (
    <div className="page" key={refreshKey}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-sub">All indexed products — grows with every spec sheet you upload</p>
        </div>
        <button className="btn-primary" onClick={() => setShowWizard(true)}>
          + Add via Spec Sheet
        </button>
      </div>

      {/* Tab bar */}
      <div className="mode-tabs" style={{ marginBottom: 20 }}>
        <button className={`mode-tab ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
          Products ({allProducts.length})
        </button>
        <button className={`mode-tab ${activeTab === "learning" ? "active" : ""}`} onClick={() => setActiveTab("learning")}>
          Learned Documents ({knowledgeStore.getStats().totalDocuments})
        </button>
      </div>

      {activeTab === "learning" && <LearningView />}

      {activeTab === "products" && <>

      {/* Filters */}
      <div className="filter-bar">
        <input className="search-input" placeholder="Search catalog # or series..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="pill-row">
          <button className={`pill ${filterBrand === "all" ? "active" : ""}`} onClick={() => setFilterBrand("all")}>All Brands</button>
          {brands.map(b => (
            <button key={b.id}
              className={`pill ${filterBrand === b.id ? "active" : ""}`}
              style={filterBrand === b.id ? { background: BRAND_COLORS[b.id] || "#003087", borderColor: BRAND_COLORS[b.id] || "#003087", color: "#fff" } : {}}
              onClick={() => setFilterBrand(b.id)}>
              {b.name.split("/")[0].trim()}
            </button>
          ))}
        </div>
        <div className="pill-row">
          {["all","2x4","2x2","1x4","1x1","1x2"].map(s => (
            <button key={s} className={`pill ${filterSize === s ? "active" : ""}`} onClick={() => setFilterSize(s)}>
              {s === "all" ? "All Sizes" : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="kb-layout">
        {/* Product list */}
        <div>
          <div className="kb-count">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>
          <div className="kb-list">
            {filtered.map(p => (
              <div key={p.id}
                className={`kb-row ${selected?.id === p.id ? "selected" : ""}`}
                onClick={() => { setSelected(p); setShowWizard(false) }}>
                <div className="kb-brand-dot" style={{ background: BRAND_COLORS[p.brand] || "#888" }} />
                <div className="kb-row-body">
                  <div className="kb-catalog">{p.catalogNumber}</div>
                  <div className="kb-meta">{p.size.toUpperCase()} · {p.series} · {p.cri} CRI · {p.lumens.medium.toLocaleString()} lm</div>
                </div>
                <div className={`kb-dlc-badge dlc-${p.dlc}`}>{p.dlc.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail / wizard panel */}
        <div className="kb-detail">
          {showWizard ? (
            <SpecSheetWizard onSave={() => { setShowWizard(false); refresh() }} onCancel={() => setShowWizard(false)} />
          ) : selected ? (
            <ProductDetail product={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="kb-placeholder">
              <div className="empty-icon">◈</div>
              <div className="empty-label">Select a product to view details</div>
              <div className="empty-sub">Or click + Add via Spec Sheet to index a new product</div>
            </div>
          )}
        </div>
      </div>
      </> }
    </div>
  )
}

// ── Learning View ─────────────────────────────────────────────────────────────
function LearningView() {
  const stats = knowledgeStore.getStats()
  const records = knowledgeStore.getAll()
  const [selected, setSelected] = useState<string | null>(null)
  const selectedRecord = records.find(r => r.id === selected) || null

  return (
    <div>
      {/* Stats */}
      <div className="learn-stats-row">
        <div className="learn-stat">
          <div className="learn-stat-num">{stats.totalDocuments}</div>
          <div className="learn-stat-label">Documents Indexed</div>
        </div>
        <div className="learn-stat">
          <div className="learn-stat-num">{stats.totalBrands}</div>
          <div className="learn-stat-label">Brands Learned</div>
        </div>
        <div className="learn-stat">
          <div className="learn-stat-num">{stats.totalSeries}</div>
          <div className="learn-stat-label">Product Series</div>
        </div>
        <div className="learn-stat-wide">
          <div className="learn-context-label">AI Context Status</div>
          <div className={`learn-context-pill ${stats.totalDocuments > 0 ? "active" : "inactive"}`}>
            {stats.totalDocuments > 0
              ? stats.totalDocuments + " doc" + (stats.totalDocuments !== 1 ? "s" : "") + " feeding AI context — all future extractions and BOM parsing use this knowledge"
              : "No documents indexed yet — add spec sheets to start training the AI"}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="results-empty" style={{ marginTop: 32 }}>
          <div className="empty-icon">◈</div>
          <div className="empty-label">No documents in the knowledge store yet</div>
          <div className="empty-sub">Every spec sheet you upload via + Add via Spec Sheet is indexed here automatically. The AI gets smarter with each one — catalog grammars, field definitions, and product relationships all accumulate.</div>
        </div>
      ) : (
        <div className="kb-layout">
          <div>
            <div className="kb-count">{records.length} indexed document{records.length !== 1 ? "s" : ""}</div>
            <div className="kb-list">
              {records.map(r => (
                <div key={r.id} className={`kb-row ${selected === r.id ? "selected" : ""}`} onClick={() => setSelected(r.id)}>
                  <div className="kb-brand-dot" style={{ background: "#003087", borderRadius: 2 }} />
                  <div className="kb-row-body">
                    <div className="kb-catalog">{r.fileName}</div>
                    <div className="kb-meta">{r.brand} · {r.series} · {r.fixtureType} · {new Date(r.addedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="kb-dlc-badge dlc-standard">
                    {r.catalogGrammar.length > 0 ? r.catalogGrammar.length + " rules" : r.productIds.length + " prod"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kb-detail">
            {selectedRecord ? (
              <div className="detail-panel">
                <div className="detail-header">
                  <div>
                    <div className="detail-catalog">{selectedRecord.fileName}</div>
                    <div className="detail-sub">{selectedRecord.brand} · {selectedRecord.series} · added {new Date(selectedRecord.addedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {selectedRecord.rawExtractedText && (
                  <div className="learn-summary-box">
                    <div className="detail-section-title">Product Summary</div>
                    <div className="learn-summary-text">{selectedRecord.rawExtractedText}</div>
                  </div>
                )}

                {selectedRecord.catalogGrammar.length > 0 && (
                  <div className="detail-section">
                    <div className="detail-section-title">Catalog Grammar Learned ({selectedRecord.catalogGrammar.length} positions)</div>
                    <div className="learn-grammar-table">
                      {selectedRecord.catalogGrammar.map((g, i) => (
                        <div key={i} className="learn-grammar-row">
                          <div className="learn-grammar-pos">{g.position}</div>
                          <div className="learn-grammar-field">{g.fieldName}</div>
                          <div className="learn-grammar-codes">
                            {Object.entries(g.codes).slice(0, 6).map(([k, v]) => (
                              <span key={k} className="learn-code-chip"><strong>{k}</strong> = {v}</span>
                            ))}
                            {Object.keys(g.codes).length > 6 && <span className="learn-code-more">+{Object.keys(g.codes).length - 6} more</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecord.fieldDefinitions.length > 0 && (
                  <div className="detail-section">
                    <div className="detail-section-title">Field Definitions Learned ({selectedRecord.fieldDefinitions.length})</div>
                    {selectedRecord.fieldDefinitions.map((f, i) => (
                      <div key={i} className="detail-row">
                        <span className="detail-key">{f.field} [{f.unit}]</span>
                        <span className="detail-val" style={{ fontSize: 11 }}>{f.validValues}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRecord.productIds.length > 0 && (
                  <div className="detail-section">
                    <div className="detail-section-title">Products Saved from This Document</div>
                    {selectedRecord.productIds.map(pid => {
                      const p = db.getProduct(pid)
                      return p ? (
                        <div key={pid} className="adv-chip" style={{ margin: "2px 0", display: "block" }}>
                          {p.catalogNumber} — {p.series} {p.size}
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="kb-placeholder">
                <div className="empty-icon">◈</div>
                <div className="empty-label">Select a document to inspect</div>
                <div className="empty-sub">View extracted grammar rules, field definitions, and linked products</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Multi-step wizard ─────────────────────────────────────────────────────────
type WizardStep = "upload" | "extracting" | "review" | "saving" | "done"

interface CompetitorResult {
  brand: string
  series: string
  catalogNumber: string
  size: string
  specSheetUrl: string
  productPageUrl: string
  lumens: string | number
  watts: string | number
  dlc: string
  notes: string
}

function SpecSheetWizard({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [step, setStep]           = useState<WizardStep>("upload")
  const [pdfBase64, setPdfBase64] = useState<string>("")
  const [fileName, setFileName]   = useState<string>("")
  const [extracted, setExtracted] = useState<Partial<Product> | null>(null)
  const [error, setError]         = useState<string>("")
  const [editForm, setEditForm]   = useState<any>({})
  const [competitors, setCompetitors]       = useState<CompetitorResult[]>([])
  const [compSearching, setCompSearching]   = useState(false)
  const [compSearchError, setCompSearchError] = useState<string>("")
  const [learningRecord, setLearningRecord]   = useState<Partial<SpecSheetRecord> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Step 1: file pick ──────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      // Strip the data:...;base64, prefix
      const base64 = result.split(",")[1]
      setPdfBase64(base64)
    }
    reader.readAsDataURL(file)
  }, [])

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  // ── Step 2: extract via Claude API ────────────────────────────────────────
  const runExtraction = async () => {
    if (!pdfBase64) return
    setStep("extracting")
    setError("")
    try {
      // Build context-aware system prompt using everything learned so far
    const learnedContext = knowledgeStore.buildSystemContext()

    const systemPrompt = learnedContext + `
You are a lighting product specification extractor.
You will receive a PDF spec sheet for a commercial LED lighting product.
Extract ALL of the following fields and return ONLY a valid JSON object — no markdown, no explanation, no backticks.

Required JSON structure (use null for missing fields):
{
  "brand": "brand id lowercase no spaces (e.g. acuity, rab, keystone, ge, eaton, cree, lithonia, neoray, cooper)",
  "series": "product family/series name (e.g. CPX, T34FA, MMS, WSL, Omni)",
  "fixtureType": "short fixture type description",
  "catalogNumber": "primary orderable catalog number shown on spec sheet",
  "size": "one of: 1x1, 1x2, 1x4, 2x2, 2x4, 4x6, linear-4ft, linear-8ft, downlight, other",
  "lumensMedium": "delivered lumens at medium/default setting as integer",
  "lumensLow": "delivered lumens at low setting or null",
  "lumensHigh": "delivered lumens at high setting or null",
  "wattsMedium": "input watts at medium/default as number",
  "wattsLow": "input watts at low setting or null",
  "wattsHigh": "input watts at high setting or null",
  "efficacy": "lumens per watt at medium setting as integer",
  "cri": "minimum CRI as integer (e.g. 80 or 90)",
  "cct": ["array of CCT strings e.g. 3500K"],
  "cctSelectable": true or false,
  "lumenSelectable": true or false,
  "voltage": "input voltage range (e.g. 120-277V)",
  "dimming": "dimming type (e.g. 0-10V)",
  "dimTo": "minimum dim percent as integer (e.g. 5 or 10)",
  "mounting": ["array of mounting types"],
  "dlc": "none or standard or premium",
  "ul": true or false,
  "nsf": true or false,
  "ic": true or false,
  "ipRating": "e.g. IP65 or none",
  "warranty": "warranty years as integer",
  "emergency": "emergency backup options as string or none",
  "ambientMax": "max ambient temp in Celsius as integer",
  "controls": ["array of compatible control systems"],
  "occupancySensor": "none or integral or external or optional",
  "weight": "fixture weight in lbs as number",
  "notes": ["array of important notes"],
  "flags": ["array of potential mismatch flags vs standard LED panels"],
  "advantages": ["array of product advantages"],
  "catalogGrammar": [
    {
      "position": 1,
      "fieldName": "name of this catalog position",
      "codes": {"CODE1": "meaning 1", "CODE2": "meaning 2"},
      "format": "description of format pattern",
      "required": true,
      "notes": "any special notes about this position"
    }
  ],
  "fieldDefinitions": [
    {
      "field": "field name e.g. Lumen Output",
      "unit": "unit e.g. lm or lm/ft",
      "validValues": "range or list of valid values",
      "notes": "any notes"
    }
  ],
  "rawSummary": "2-3 sentence plain-English summary of this product family"
}`

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }
              },
              { type: "text", text: "Extract all specification fields from this lighting product spec sheet and return only the JSON object." }
            ]
          }]
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message || "API error")

      const raw = data.content?.find((b: any) => b.type === "text")?.text || ""
      // Clean any accidental markdown fences
      const clean = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim()
      const parsed = JSON.parse(clean)

      // Map flat extracted fields to Product shape
      // Store grammar and field definitions for future AI calls
      const grammarRules: CatalogGrammarRule[] = Array.isArray(parsed.catalogGrammar)
        ? parsed.catalogGrammar.map((g: any, idx: number) => ({
            position:   g.position || idx + 1,
            fieldName:  g.fieldName || "",
            codes:      g.codes || {},
            format:     g.format || "",
            required:   g.required !== false,
            notes:      g.notes || "",
          }))
        : []

      const fieldDefs: FieldDefinition[] = Array.isArray(parsed.fieldDefinitions)
        ? parsed.fieldDefinitions.map((f: any) => ({
            field:       f.field || "",
            unit:        f.unit || "",
            validValues: f.validValues || "",
            notes:       f.notes || "",
          }))
        : []

      // Store the partial learning record — will be completed when product is saved
      setLearningRecord({
        id:               "learn-" + Date.now(),
        addedAt:          new Date().toISOString(),
        fileName:         fileName || "uploaded-spec",
        brand:            (parsed.brand || "").toLowerCase(),
        series:           parsed.series || "",
        fixtureType:      parsed.fixtureType || "LED Fixture",
        rawExtractedText: parsed.rawSummary || "",
        catalogGrammar:   grammarRules,
        fieldDefinitions: fieldDefs,
        productIds:       [],
        notes:            "Auto-extracted from spec sheet upload",
      })

      const product: Partial<Product> = {
        brand:          (parsed.brand || "").toLowerCase().replace(/\s+/g, "-"),
        series:         parsed.series || "",
        catalogNumber:  parsed.catalogNumber || "",
        size:           parsed.size || "2x2",
        fixtureType:    parsed.fixtureType || "LED Panel",
        lumens: {
          medium: parseInt(parsed.lumensMedium) || 0,
          low:    parsed.lumensLow ? parseInt(parsed.lumensLow) : undefined,
          high:   parsed.lumensHigh ? parseInt(parsed.lumensHigh) : undefined,
        },
        watts: {
          medium: parseFloat(parsed.wattsMedium) || 0,
          low:    parsed.wattsLow  ? parseFloat(parsed.wattsLow)  : undefined,
          high:   parsed.wattsHigh ? parseFloat(parsed.wattsHigh) : undefined,
        },
        efficacy:        parseInt(parsed.efficacy) || 0,
        cri:             parseInt(parsed.cri) || 80,
        cct:             Array.isArray(parsed.cct) ? parsed.cct : [],
        cctSelectable:   !!parsed.cctSelectable,
        lumenSelectable: !!parsed.lumenSelectable,
        voltage:         parsed.voltage || "120-277V",
        dimming:         parsed.dimming || "0-10V",
        dimTo:           parseInt(parsed.dimTo) || 10,
        mounting:        Array.isArray(parsed.mounting) ? parsed.mounting : ["recessed"],
        dlc:             (parsed.dlc || "none") as any,
        ul:              !!parsed.ul,
        nsf:             !!parsed.nsf,
        ic:              !!parsed.ic,
        ipRating:        parsed.ipRating || "none",
        warranty:        parseInt(parsed.warranty) || 5,
        emergency:       parsed.emergency || "none",
        ambientMax:      parseInt(parsed.ambientMax) || 25,
        controls:        Array.isArray(parsed.controls) ? parsed.controls : ["0-10V"],
        occupancySensor: parsed.occupancySensor || "none",
        weight:          parseFloat(parsed.weight) || 0,
        notes:           Array.isArray(parsed.notes) ? parsed.notes : [],
        flags:           Array.isArray(parsed.flags) ? parsed.flags : [],
        advantages:      Array.isArray(parsed.advantages) ? parsed.advantages : [],
      }

      setExtracted(product)
      setEditForm(product)
      setStep("review")
    } catch (err: any) {
      setError(err.message || "Extraction failed")
      setStep("upload")
    }
  }

  // ── Step 3: save then search competitors ─────────────────────────────────
  const saveProduct = async () => {
    if (!editForm.catalogNumber || !editForm.brand) {
      setError("Catalog Number and Brand are required")
      return
    }
    setStep("saving")
    const id = editForm.brand + "-" + editForm.size + "-" + Date.now()
    const product: Product = { id, ...editForm } as Product

    db.addProduct(product)

    const brands = db.getBrands()
    if (!brands.find((b: any) => b.id === editForm.brand)) {
      db.addBrand({
        id: editForm.brand,
        name: editForm.brand.charAt(0).toUpperCase() + editForm.brand.slice(1),
        parent: editForm.brand,
        color: "#888",
        products: []
      })
    }

    // Commit the learning record to the knowledge store
    if (learningRecord) {
      const finalRecord: SpecSheetRecord = {
        ...learningRecord as SpecSheetRecord,
        productIds: [id],
      }
      knowledgeStore.addRecord(finalRecord)
    } else {
      // Manual entry — create a minimal learning record
      knowledgeStore.addRecord({
        id:               "learn-manual-" + Date.now(),
        addedAt:          new Date().toISOString(),
        fileName:         "manual-entry",
        brand:            editForm.brand || "",
        series:           editForm.series || "",
        fixtureType:      editForm.fixtureType || "LED Fixture",
        rawExtractedText: "",
        catalogGrammar:   [],
        fieldDefinitions: [],
        productIds:       [id],
        notes:            "Manually entered via Knowledge Base form",
      })
    }

    // Transition to done, then kick off competitor search
    await new Promise(r => setTimeout(r, 700))
    setStep("done")
    runCompetitorSearch(product)
  }

  // ── Step 4: competitor search via Claude + web_search tool ────────────────
  const runCompetitorSearch = async (product: Product) => {
    setCompSearching(true)
    setCompetitors([])
    try {
      const query = product.series + " " + product.size.toUpperCase() + " LED flat panel " + product.brand + " competitor alternatives spec sheet"
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "You are a commercial lighting product research assistant. When asked to find competitor products, use web_search to find real manufacturer pages and spec sheets. Return ONLY a JSON array — no markdown, no explanation. Each item: { brand, series, catalogNumber, size, specSheetUrl, productPageUrl, lumens, watts, dlc, notes }. Find spec sheets from official manufacturer sites where possible (e.g. cooperlighting.com, lithonia.com, rablighting.com, creelighting.com, genlyte.com, acuitybrands.com, keystonetech.com, etc). If a direct PDF spec sheet link is not found, provide the product page URL instead.",
          messages: [{
            role: "user",
            content: "Find the top 5 competitor LED flat panel products that are direct alternatives to: " +
              product.brand.toUpperCase() + " " + product.series + " " + product.size.toUpperCase() + " panel. " +
              "Specs: " + product.lumens.medium + "lm, " + product.watts.medium + "W, " + product.cri + " CRI, " +
              product.cct.join("/") + ", " + product.dlc + " DLC. " +
              "Search for competing products from major brands like Cooper/Metalux, Acuity/Lithonia, RAB, Keystone, Cree, GE, Eaton, Hubbell, Legrand, Philips. " +
              "For each competitor find their spec sheet PDF URL or product page. Return JSON array only."
          }]
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      // Extract final text response (after tool use)
      const textBlock = data.content?.filter((b: any) => b.type === "text").pop()
      const raw = textBlock?.text || "[]"
      const clean = raw.replace(/^```[a-z]*/i, "").replace(/```$/i, "").trim()

      let results: CompetitorResult[] = []
      try {
        const parsed = JSON.parse(clean)
        results = Array.isArray(parsed) ? parsed : []
      } catch {
        // Try to extract JSON array from text
        const match = clean.match(/\[([\s\S]*)\]/)
        if (match) results = JSON.parse(match[0])
      }

      setCompetitors(results.slice(0, 5))
    } catch (err: any) {
      setCompSearchError(err.message || "Search failed")
    }
    setCompSearching(false)
  }

  const setField = (k: string, v: any) => setEditForm((f: any) => ({ ...f, [k]: v }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="wizard-wrap">
      {/* Progress bar */}
      <div className="wizard-progress">
        {[
          { id: "upload",     label: "Upload" },
          { id: "extracting", label: "Extract" },
          { id: "review",     label: "Review" },
          { id: "saving",     label: "Save" },
        ].map((s, i) => {
          const steps = ["upload","extracting","review","saving","done"]
          const cur = steps.indexOf(step)
          const idx = steps.indexOf(s.id)
          const done = cur > idx
          const active = cur === idx
          return (
            <div key={s.id} className="wiz-step">
              <div className={`wiz-dot ${done ? "done" : active ? "active" : ""}`}>
                {done ? "✓" : i + 1}
              </div>
              <div className={`wiz-label ${active ? "active" : done ? "done" : ""}`}>{s.label}</div>
              {i < 3 && <div className={`wiz-line ${done ? "done" : ""}`} />}
            </div>
          )
        })}
      </div>

      {/* Step: Upload */}
      {(step === "upload") && (
        <div className="wiz-body">
          <div className="wiz-title">Upload Spec Sheet</div>
          <div className="wiz-sub">Drop a PDF spec sheet — Claude will read every field automatically</div>

          {error && <div className="wiz-error">{error}</div>}

          <div
            className="spec-drop-zone"
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onFilePick} />
            {pdfBase64 ? (
              <div className="drop-ready">
                <div className="drop-icon-ready">✓</div>
                <div className="drop-filename">{fileName}</div>
                <div className="drop-change">Click to change file</div>
              </div>
            ) : (
              <div className="drop-empty">
                <div className="drop-icon">PDF</div>
                <div className="drop-label">Drop spec sheet PDF here</div>
                <div className="drop-sub">or click to browse — PDF only</div>
              </div>
            )}
          </div>

          <div className="wiz-what-extracts">
            <div className="wiz-what-title">Claude will extract all fields automatically:</div>
            <div className="wiz-field-grid">
              {["Brand / Series","Catalog Number","Panel Size","Lumens (Low/Med/High)",
                "Watts (Low/Med/High)","Efficacy (lm/W)","CRI Minimum","CCT Options",
                "Voltage & Dimming","Dims To (%)","DLC Qualification","UL / NSF / IC",
                "IP Rating","Warranty","Emergency Backup","Ambient Max Temp",
                "Controls Compatible","Occupancy Sensor","Mounting Types",
                "Weight (lbs)","Flags & Advantages","Notes"].map(f => (
                <div key={f} className="wiz-field-chip">{f}</div>
              ))}
            </div>
          </div>

          <div className="wiz-actions">
            <button className="btn-outline" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={runExtraction} disabled={!pdfBase64}>
              {pdfBase64 ? "Extract Specifications →" : "Select a PDF first"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Extracting */}
      {step === "extracting" && (
        <div className="wiz-body wiz-center">
          <div className="extract-spinner" />
          <div className="wiz-title" style={{ marginTop: 16 }}>Extracting Specifications</div>
          <div className="wiz-sub">Claude is reading <strong>{fileName}</strong> and mapping all fields...</div>
          <div className="extract-steps">
            {["Reading PDF content","Identifying product family","Mapping specification fields",
              "Extracting lumen & watt data","Checking certifications","Identifying advantages & flags"].map((s, i) => (
              <div key={s} className="extract-step" style={{ animationDelay: i * 0.4 + "s" }}>
                <span className="extract-dot" />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && extracted && (
        <div className="wiz-body">
          <div className="wiz-title">Review Extracted Data</div>
          <div className="wiz-sub">Claude extracted these values — edit anything before saving to the knowledge base</div>

          {error && <div className="wiz-error">{error}</div>}

          <div className="review-grid">

            <div className="review-section">
              <div className="review-section-title">Identity</div>
              <ReviewField label="Brand ID" value={editForm.brand || ""} onChange={v => setField("brand", v)} hint="e.g. acuity, rab, keystone" />
              <ReviewField label="Series" value={editForm.series || ""} onChange={v => setField("series", v)} hint="e.g. CPX, T34FA" />
              <ReviewField label="Catalog Number" value={editForm.catalogNumber || ""} onChange={v => setField("catalogNumber", v)} mono />
              <ReviewField label="Fixture Type" value={editForm.fixtureType || ""} onChange={v => setField("fixtureType", v)} />
              <div className="rf-row">
                <div className="rf-label">Panel Size</div>
                <select className="form-input" value={editForm.size || "2x2"} onChange={e => setField("size", e.target.value)}>
                  {["1x1","1x2","1x4","2x2","2x4","4x6"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-title">Photometrics</div>
              <ReviewField label="Lumens — Low" value={editForm.lumens?.low ?? ""} onChange={v => setField("lumens", { ...editForm.lumens, low: v ? Number(v) : undefined })} type="number" />
              <ReviewField label="Lumens — Medium" value={editForm.lumens?.medium ?? ""} onChange={v => setField("lumens", { ...editForm.lumens, medium: Number(v) })} type="number" />
              <ReviewField label="Lumens — High" value={editForm.lumens?.high ?? ""} onChange={v => setField("lumens", { ...editForm.lumens, high: v ? Number(v) : undefined })} type="number" />
              <ReviewField label="Watts — Low" value={editForm.watts?.low ?? ""} onChange={v => setField("watts", { ...editForm.watts, low: v ? Number(v) : undefined })} type="number" />
              <ReviewField label="Watts — Medium" value={editForm.watts?.medium ?? ""} onChange={v => setField("watts", { ...editForm.watts, medium: Number(v) })} type="number" />
              <ReviewField label="Watts — High" value={editForm.watts?.high ?? ""} onChange={v => setField("watts", { ...editForm.watts, high: v ? Number(v) : undefined })} type="number" />
              <ReviewField label="Efficacy (lm/W)" value={editForm.efficacy ?? ""} onChange={v => setField("efficacy", Number(v))} type="number" />
              <ReviewField label="CRI Minimum" value={editForm.cri ?? ""} onChange={v => setField("cri", Number(v))} type="number" />
              <ReviewField label="CCT Options (comma-sep)" value={(editForm.cct || []).join(", ")} onChange={v => setField("cct", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>

            <div className="review-section">
              <div className="review-section-title">Electrical</div>
              <ReviewField label="Voltage" value={editForm.voltage || ""} onChange={v => setField("voltage", v)} />
              <ReviewField label="Dimming" value={editForm.dimming || ""} onChange={v => setField("dimming", v)} />
              <ReviewField label="Dims To (%)" value={editForm.dimTo ?? ""} onChange={v => setField("dimTo", Number(v))} type="number" />
              <ReviewField label="Ambient Max (C)" value={editForm.ambientMax ?? ""} onChange={v => setField("ambientMax", Number(v))} type="number" />
              <ReviewField label="Emergency Backup" value={editForm.emergency || ""} onChange={v => setField("emergency", v)} />
              <ReviewField label="Weight (lbs)" value={editForm.weight ?? ""} onChange={v => setField("weight", Number(v))} type="number" />
              <ReviewField label="IP Rating" value={editForm.ipRating || ""} onChange={v => setField("ipRating", v)} />
            </div>

            <div className="review-section">
              <div className="review-section-title">Certifications</div>
              <div className="rf-row">
                <div className="rf-label">DLC</div>
                <select className="form-input" value={editForm.dlc || "none"} onChange={e => setField("dlc", e.target.value)}>
                  <option value="none">None</option>
                  <option value="standard">DLC Standard</option>
                  <option value="premium">DLC Premium</option>
                </select>
              </div>
              <ReviewField label="Warranty (years)" value={editForm.warranty ?? ""} onChange={v => setField("warranty", Number(v))} type="number" />
              <div className="cert-checks">
                {[["ul","UL Listed"],["nsf","NSF/ANSI 2"],["ic","IC Rated"]].map(([k, lbl]) => (
                  <label key={k} className="check-label">
                    <input type="checkbox" checked={!!editForm[k]} onChange={e => setField(k, e.target.checked)} />
                    {lbl}
                  </label>
                ))}
              </div>
              <div className="rf-row" style={{ marginTop: 10 }}>
                <div className="rf-label">Occupancy Sensor</div>
                <select className="form-input" value={editForm.occupancySensor || "none"} onChange={e => setField("occupancySensor", e.target.value)}>
                  {["none","integral","external","optional"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <ReviewField label="Controls (comma-sep)" value={(editForm.controls || []).join(", ")} onChange={v => setField("controls", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
              <ReviewField label="Mounting (comma-sep)" value={(editForm.mounting || []).join(", ")} onChange={v => setField("mounting", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>

            <div className="review-section review-section-wide">
              <div className="review-section-title">Flags, Advantages & Notes</div>
              <ReviewField label="Flags (comma-sep)" value={(editForm.flags || []).join(", ")} onChange={v => setField("flags", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
              <ReviewField label="Advantages (comma-sep)" value={(editForm.advantages || []).join(", ")} onChange={v => setField("advantages", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
              <ReviewField label="Notes (comma-sep)" value={(editForm.notes || []).join(", ")} onChange={v => setField("notes", v.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>
          </div>

          <div className="wiz-actions">
            <button className="btn-outline" onClick={() => { setStep("upload"); setError("") }}>Back</button>
            <button className="btn-primary" onClick={saveProduct}>Save to Knowledge Base</button>
          </div>
        </div>
      )}

      {/* Step: Saving */}
      {step === "saving" && (
        <div className="wiz-body wiz-center">
          <div className="extract-spinner" />
          <div className="wiz-title" style={{ marginTop: 16 }}>Saving to Knowledge Base...</div>
          <div className="wiz-sub">Indexing {editForm.catalogNumber}</div>
        </div>
      )}

      {/* Step: Done + Competitor Search */}
      {step === "done" && (
        <div className="wiz-body">
          {/* Saved confirmation */}
          <div className="saved-banner">
            <div className="saved-check">✓</div>
            <div>
              <div className="saved-title">{editForm.catalogNumber} indexed successfully</div>
              <div className="saved-sub">{editForm.series} {(editForm.size || "").toUpperCase()} · {editForm.lumens?.medium?.toLocaleString()} lm · {editForm.watts?.medium}W · {editForm.cri} CRI · {editForm.dlc?.toUpperCase()} DLC</div>
            </div>
          </div>

          {/* Competitor search results */}
          <div className="comp-section">
            <div className="comp-header">
              <div>
                <div className="comp-title">Top 5 Competitor Products</div>
                <div className="comp-sub">Direct alternatives found via web search — download their spec sheets to add to the knowledge base</div>
              </div>
              {!compSearching && competitors.length === 0 && !compSearchError && (
                <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => runCompetitorSearch(editForm as Product)}>
                  Search Competitors
                </button>
              )}
            </div>

            {compSearching && (
              <div className="comp-searching">
                <div className="extract-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
                <div className="comp-searching-text">
                  <span className="comp-searching-label">Searching web for competitor spec sheets...</span>
                  <span className="comp-searching-sub">Looking across Cooper, Acuity, RAB, Keystone, Cree, GE, Hubbell and more</span>
                </div>
              </div>
            )}

            {compSearchError && (
              <div className="wiz-error">{compSearchError}</div>
            )}

            {!compSearching && competitors.length > 0 && (
              <div className="comp-list">
                {competitors.map((c, i) => (
                  <CompetitorCard key={i} comp={c} rank={i + 1} />
                ))}
              </div>
            )}

            {!compSearching && competitors.length === 0 && !compSearchError && (
              <div className="comp-empty">
                <div className="empty-icon" style={{ fontSize: 24 }}>⇄</div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>Competitor search will run automatically after save</div>
              </div>
            )}
          </div>

          <div className="wiz-actions">
            <button className="btn-primary" onClick={onSave}>Done — Back to Knowledge Base</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Competitor card ──────────────────────────────────────────────────────────
function CompetitorCard({ comp, rank }: { comp: CompetitorResult; rank: number }) {
  const brandColors: Record<string, string> = {
    cooper: "#003087", metalux: "#003087", acuity: "#1a7a4a", lithonia: "#1a7a4a",
    rab: "#b45309", keystone: "#5b21b6", cree: "#c0392b", ge: "#1a4a8a",
    hubbell: "#444", eaton: "#e8530a", legrand: "#003087", philips: "#0066cc"
  }
  const brandKey = comp.brand.toLowerCase().split("/")[0].trim()
  const color = brandColors[brandKey] || "#555"

  const specUrl = comp.specSheetUrl && comp.specSheetUrl !== "null" && comp.specSheetUrl.startsWith("http")
    ? comp.specSheetUrl : null
  const pageUrl = comp.productPageUrl && comp.productPageUrl !== "null" && comp.productPageUrl.startsWith("http")
    ? comp.productPageUrl : null
  const primaryUrl = specUrl || pageUrl

  return (
    <div className="comp-card">
      <div className="comp-card-rank" style={{ background: color }}>{rank}</div>
      <div className="comp-card-body">
        <div className="comp-card-header">
          <div className="comp-card-brand" style={{ color }}>{comp.brand}</div>
          <div className="comp-card-series">{comp.series}</div>
          {comp.catalogNumber && (
            <span className="comp-cat-chip">{comp.catalogNumber}</span>
          )}
        </div>
        <div className="comp-card-specs">
          {comp.size && <span className="spec-chip">{comp.size.toUpperCase()}</span>}
          {comp.lumens && <span className="spec-chip">{comp.lumens} lm</span>}
          {comp.watts && <span className="spec-chip">{comp.watts}W</span>}
          {comp.dlc && comp.dlc !== "null" && <span className="spec-chip">DLC {comp.dlc}</span>}
        </div>
        {comp.notes && <div className="comp-card-notes">{comp.notes}</div>}
      </div>
      <div className="comp-card-actions">
        {specUrl && (
          <a href={specUrl} target="_blank" rel="noopener noreferrer" className="comp-dl-btn spec">
            <span className="comp-dl-icon">↓</span>
            Spec Sheet PDF
          </a>
        )}
        {pageUrl && (
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="comp-dl-btn page">
            <span className="comp-dl-icon">↗</span>
            {specUrl ? "Product Page" : "View Product"}
          </a>
        )}
        {!primaryUrl && (
          <span className="comp-no-link">Link not found — search manually</span>
        )}
      </div>
    </div>
  )
}

// ── Review field sub-component ────────────────────────────────────────────────
function ReviewField({ label, value, onChange, type = "text", hint = "", mono = false }: {
  label: string; value: any; onChange: (v: string) => void;
  type?: string; hint?: string; mono?: boolean
}) {
  return (
    <div className="rf-row">
      <div className="rf-label">{label}</div>
      <input
        className={"form-input" + (mono ? " mono" : "")}
        type={type}
        value={value ?? ""}
        placeholder={hint}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// ── Product detail panel ──────────────────────────────────────────────────────
function ProductDetail({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const color = BRAND_COLORS[p.brand] || "#888"
  const fields: [string, string][] = [
    ["Catalog Number", p.catalogNumber],
    ["Brand", p.brand],
    ["Series", p.series],
    ["Size", p.size.toUpperCase()],
    ["Fixture Type", p.fixtureType],
    ["Lumens (Low/Med/High)", (p.lumens.low ?? "-") + " / " + p.lumens.medium + " / " + (p.lumens.high ?? "-") + " lm"],
    ["Watts (Low/Med/High)", (p.watts.low ?? "-") + " / " + p.watts.medium + " / " + (p.watts.high ?? "-") + " W"],
    ["Efficacy", p.efficacy + " lm/W"],
    ["CRI Minimum", p.cri + " CRI"],
    ["CCT Options", p.cct.join(", ")],
    ["CCT Selectable", p.cctSelectable ? "Yes" : "No — fixed per SKU"],
    ["Lumen Selectable", p.lumenSelectable ? "Yes — 3-step" : "No — fixed"],
    ["Voltage", p.voltage],
    ["Dimming", p.dimming],
    ["Dims To", p.dimTo + "%"],
    ["Mounting", p.mounting.join(", ")],
    ["DLC", p.dlc.toUpperCase()],
    ["UL Listed", p.ul ? "Yes" : "No"],
    ["NSF/ANSI 2", p.nsf ? "Yes" : "No"],
    ["IC Rated", p.ic ? "Yes" : "No"],
    ["IP Rating", p.ipRating || "Not listed"],
    ["Warranty", p.warranty + " years"],
    ["Emergency", p.emergency || "None"],
    ["Ambient Max", p.ambientMax + "°C"],
    ["Controls", p.controls.join(", ")],
    ["Occupancy Sensor", p.occupancySensor],
    ["Weight", p.weight + " lbs"],
  ]

  return (
    <div className="detail-panel">
      <div className="detail-header" style={{ borderBottomColor: color }}>
        <div>
          <div className="detail-catalog">{p.catalogNumber}</div>
          <div className="detail-sub">{p.brand.toUpperCase()} · {p.series} · {p.size.toUpperCase()}</div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="detail-fields">
        {fields.map(([k, v]) => (
          <div className="detail-row" key={k}>
            <span className="detail-key">{k}</span>
            <span className="detail-val">{v}</span>
          </div>
        ))}
      </div>
      {p.advantages.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Advantages</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {p.advantages.map(a => <span key={a} className="adv-chip">{a}</span>)}
          </div>
        </div>
      )}
      {p.flags.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Flags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {p.flags.map(f => <span key={f} className="flag-chip">{f}</span>)}
          </div>
        </div>
      )}
      {p.notes.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Notes</div>
          {p.notes.map(n => <div key={n} className="note-line">• {n}</div>)}
        </div>
      )}
    </div>
  )
}
