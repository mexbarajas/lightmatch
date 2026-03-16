import { useState, useRef, useCallback } from "react"
import { db, knowledgeStore } from "@/lib/database"
import type { AppView } from "@/App"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMRow {
  lineNum: number
  rawData: Record<string, string>   // original columns from Excel
  parsed: {
    qty: number
    description: string
    brand: string
    catalogNumber: string
    size: string
    lumens: number
    watts: number
    cri: number
    cct: string
    voltage: string
    location: string
    notes: string
  }
  status: "pending" | "matching" | "matched" | "no-match" | "skipped"
  matchScore: number
  cooperCatalog: string
  cooperSeries: string
  flags: string[]
  advantages: string[]
  selected: boolean
}

interface ParsedBOM {
  rows: BOMRow[]
  headers: string[]
  fileName: string
  totalRows: number
  skippedRows: number
}

type BOMStep = "upload" | "parsing" | "review" | "matching" | "done"

const STEP_LABELS: Record<BOMStep, string> = {
  upload: "Upload",
  parsing: "Parse",
  review: "Review",
  matching: "Match",
  done: "Results"
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BOMImporter({ setView, quoteItems, setQuoteItems }: {
  setView: (v: AppView) => void
  quoteItems: any[]
  setQuoteItems: (items: any[]) => void
}) {
  const [step, setStep]           = useState<BOMStep>("upload")
  const [bom, setBOM]             = useState<ParsedBOM | null>(null)
  const [rows, setRows]           = useState<BOMRow[]>([])
  const [error, setError]         = useState("")
  const [progress, setProgress]   = useState(0)
  const [pasteText, setPasteText] = useState("")
  const [inputMode, setInputMode] = useState<"file" | "paste">("file")
  const [fileName, setFileName]   = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Upload / parse ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setError("")
    setStep("parsing")

    try {
      const buffer = await file.arrayBuffer()
      const bytes  = new Uint8Array(buffer)
      const base64 = btoa(bytes.reduce((d, b) => d + String.fromCharCode(b), ""))
      await parseWithClaude(base64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", file.name)
    } catch (e: any) {
      setError("Could not read file: " + e.message)
      setStep("upload")
    }
  }, [])

  const handlePaste = useCallback(async () => {
    if (!pasteText.trim()) { setError("Paste some data first"); return }
    setError("")
    setStep("parsing")
    await parseTextWithClaude(pasteText)
  }, [pasteText])

  // ── Parse via Claude API ────────────────────────────────────────────────────
  const parseWithClaude = async (base64: string, mediaType: string, fname: string) => {
    try {
      const systemPrompt = buildParseSystemPrompt()
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: mediaType, data: base64 }
              },
              { type: "text", text: "Parse this fixture schedule / BOM and return the JSON array of rows." }
            ]
          }]
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      processParsedResponse(data, fname)
    } catch (e: any) {
      setError("Parse failed: " + e.message)
      setStep("upload")
    }
  }

  const parseTextWithClaude = async (text: string) => {
    try {
      const systemPrompt = buildParseSystemPrompt()
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: "Parse this fixture schedule and return the JSON array:\n\n" + text
          }]
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      processParsedResponse(data, "pasted-data")
    } catch (e: any) {
      setError("Parse failed: " + e.message)
      setStep("upload")
    }
  }

  const buildParseSystemPrompt = () => {
    const learnedContext = knowledgeStore.buildSystemContext()
    return learnedContext + `You are a commercial lighting fixture schedule parser.
Parse the uploaded fixture schedule / Bill of Materials and extract each fixture line item.
Ignore header rows, total rows, notes rows, and blank rows.
Return ONLY a valid JSON array — no markdown, no explanation.

Each item in the array:
{
  "lineNum": row number as integer,
  "qty": quantity as integer (default 1 if missing),
  "description": fixture description or type,
  "brand": manufacturer brand name (e.g. "Acuity", "RAB", "Keystone", "Lithonia", "Cooper", "Cree", "GE"),
  "catalogNumber": full catalog/part number string,
  "size": panel size — one of: "1x1","1x2","1x4","2x2","2x4","4x6" (infer from catalog number or description if possible, else "2x4"),
  "lumens": delivered lumens as integer (0 if unknown),
  "watts": input watts as number (0 if unknown),
  "cri": CRI as integer (80 if unknown),
  "cct": color temperature string like "4000K" (use "4000K" if unknown),
  "voltage": voltage string like "120-277V" (use "120-277V" if unknown),
  "location": room/area/location label if present else "",
  "notes": any special notes for this line else ""
}

Skip rows that are clearly not fixtures (subtotals, section headers, blank lines).
Be generous — if a row looks like it could be a fixture, include it.`
  }

  const processParsedResponse = (data: any, fname: string) => {
    try {
      const raw = data.content?.find((b: any) => b.type === "text")?.text || "[]"
      const clean = raw.replace(/^```[a-z]*/i, "").replace(/```$/i, "").trim()
      const parsed: any[] = JSON.parse(clean)

      const bomRows: BOMRow[] = parsed.map((r, i) => ({
        lineNum: r.lineNum || i + 1,
        rawData: r,
        parsed: {
          qty:          Math.max(1, parseInt(r.qty) || 1),
          description:  r.description || "",
          brand:        r.brand || "",
          catalogNumber: r.catalogNumber || "",
          size:         r.size || "2x4",
          lumens:       parseInt(r.lumens) || 0,
          watts:        parseFloat(r.watts) || 0,
          cri:          parseInt(r.cri) || 80,
          cct:          r.cct || "4000K",
          voltage:      r.voltage || "120-277V",
          location:     r.location || "",
          notes:        r.notes || "",
        },
        status: "pending",
        matchScore: 0,
        cooperCatalog: "",
        cooperSeries: "",
        flags: [],
        advantages: [],
        selected: true,
      }))

      const skipped = Math.max(0, parsed.length - bomRows.length)
      setBOM({ rows: bomRows, headers: [], fileName: fname, totalRows: bomRows.length, skippedRows: skipped })
      setRows(bomRows)
      setStep("review")
    } catch (e: any) {
      setError("Could not parse response: " + e.message)
      setStep("upload")
    }
  }

  // ── Run matching ────────────────────────────────────────────────────────────
  const runMatching = async () => {
    setStep("matching")
    setProgress(0)
    const selected = rows.filter(r => r.selected)
    const updated  = [...rows]

    for (let i = 0; i < selected.length; i++) {
      const row = selected[i]
      const idx = updated.findIndex(r => r.lineNum === row.lineNum)

      updated[idx] = { ...updated[idx], status: "matching" }
      setRows([...updated])

      const matches = db.findCooperMatch({
        size:   row.parsed.size as any,
        lumens: { medium: row.parsed.lumens || 0 },
        cri:    row.parsed.cri,
        cct:    [row.parsed.cct],
        dlc:    "standard" as any,
        dimTo:  10,
      })

      if (matches.length > 0) {
        const best = matches[0]
        updated[idx] = {
          ...updated[idx],
          status:        "matched",
          matchScore:    best.score,
          cooperCatalog: best.cooperProduct.catalogNumber,
          cooperSeries:  best.cooperProduct.series,
          flags:         best.flags,
          advantages:    best.advantages,
        }
      } else {
        updated[idx] = { ...updated[idx], status: "no-match" }
      }

      setRows([...updated])
      setProgress(Math.round(((i + 1) / selected.length) * 100))
      await new Promise(r => setTimeout(r, 80))
    }

    setStep("done")
  }

  // ── Add to quote ────────────────────────────────────────────────────────────
  const addToQuote = () => {
    const matched = rows.filter(r => r.selected && r.status === "matched")
    const newItems = matched.map(r => ({
      id:               "bom-" + r.lineNum + "-" + Date.now(),
      description:      r.parsed.description || r.cooperSeries + " LED Panel",
      size:             r.parsed.size,
      qty:              r.parsed.qty,
      competitorBrand:  r.parsed.brand || "Competitor",
      competitorCatalog: r.parsed.catalogNumber || r.parsed.description,
      cooperCatalog:    r.cooperCatalog,
      cooperSeries:     r.cooperSeries,
      lumens:           r.parsed.lumens || 0,
      watts:            r.parsed.watts || 0,
      cct:              r.parsed.cct,
      accessories:      [],
      notes:            r.parsed.location ? "Location: " + r.parsed.location + (r.parsed.notes ? " | " + r.parsed.notes : "") : r.parsed.notes,
      matchScore:       r.matchScore,
    }))
    setQuoteItems([...quoteItems, ...newItems])
    setView("quote")
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggleRow   = (lineNum: number) => setRows(rs => rs.map(r => r.lineNum === lineNum ? { ...r, selected: !r.selected } : r))
  const toggleAll   = (val: boolean)    => setRows(rs => rs.map(r => ({ ...r, selected: val })))
  const editField   = (lineNum: number, field: string, val: any) =>
    setRows(rs => rs.map(r => r.lineNum === lineNum ? { ...r, parsed: { ...r.parsed, [field]: val } } : r))

  const matchedCount   = rows.filter(r => r.status === "matched").length
  const selectedCount  = rows.filter(r => r.selected).length
  const noMatchCount   = rows.filter(r => r.status === "no-match").length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">BOM Importer</h1>
          <p className="page-sub">Upload a fixture schedule — match all rows to Cooper products at once</p>
        </div>
        {step === "done" && matchedCount > 0 && (
          <button className="btn-primary" onClick={addToQuote}>
            Add {matchedCount} Matches to Quote →
          </button>
        )}
      </div>

      {/* Progress stepper */}
      <div className="wizard-progress" style={{ marginBottom: 24 }}>
        {(Object.keys(STEP_LABELS) as BOMStep[]).map((s, i) => {
          const stepOrder: BOMStep[] = ["upload","parsing","review","matching","done"]
          const cur  = stepOrder.indexOf(step)
          const idx  = stepOrder.indexOf(s)
          const done = cur > idx
          const active = cur === idx
          return (
            <div key={s} className="wiz-step">
              <div className={`wiz-dot ${done ? "done" : active ? "active" : ""}`}>{done ? "✓" : i + 1}</div>
              <div className={`wiz-label ${active ? "active" : done ? "done" : ""}`}>{STEP_LABELS[s]}</div>
              {i < 4 && <div className={`wiz-line ${done ? "done" : ""}`} />}
            </div>
          )
        })}
      </div>

      {error && <div className="wiz-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div className="bom-upload-layout">
          <div className="bom-mode-tabs">
            <button className={`mode-tab ${inputMode === "file" ? "active" : ""}`} onClick={() => setInputMode("file")}>📁 Upload File</button>
            <button className={`mode-tab ${inputMode === "paste" ? "active" : ""}`} onClick={() => setInputMode("paste")}>📋 Paste Data</button>
          </div>

          {inputMode === "file" ? (
            <div
              className="spec-drop-zone bom-drop-zone"
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              <div className="drop-empty">
                <div className="bom-drop-formats">
                  <span className="bom-fmt">XLS</span>
                  <span className="bom-fmt">XLSX</span>
                  <span className="bom-fmt">CSV</span>
                  <span className="bom-fmt">PDF</span>
                </div>
                <div className="drop-label">Drop your fixture schedule here</div>
                <div className="drop-sub">or click to browse — Excel, CSV, or PDF fixture schedules</div>
              </div>
            </div>
          ) : (
            <div className="bom-paste-area">
              <div className="form-label">Paste fixture schedule data</div>
              <textarea
                className="form-input bom-paste-input"
                rows={12}
                placeholder="Paste rows from Excel, a spec list, or any table format. Example: Qty / Brand / Catalog / Size — column headers help but are not required"
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
              />
              <div className="bom-paste-tip">Tip: Copy directly from Excel (Ctrl+A, Ctrl+C) and paste here — column headers help but are not required</div>
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={handlePaste} disabled={!pasteText.trim()}>
                Parse Fixture Schedule →
              </button>
            </div>
          )}

          <div className="bom-what-works">
            <div className="bom-what-title">What gets extracted from your BOM</div>
            <div className="bom-what-grid">
              {[
                ["Quantity", "Each fixture count per line"],
                ["Brand / Manufacturer", "Acuity, RAB, Keystone, Cree, GE, Hubbell, etc."],
                ["Catalog Number", "Full part number or model number"],
                ["Panel Size", "1x4, 2x2, 2x4, etc."],
                ["Lumens & Watts", "If listed in the schedule"],
                ["CRI & CCT", "Color rendering and temperature"],
                ["Location / Room", "Area labels from the schedule"],
                ["Special Notes", "Per-line notes and requirements"],
              ].map(([k, v]) => (
                <div key={k} className="bom-what-row">
                  <span className="bom-what-key">{k}</span>
                  <span className="bom-what-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Parsing ── */}
      {step === "parsing" && (
        <div className="bom-center">
          <div className="extract-spinner" />
          <div className="wiz-title" style={{ marginTop: 16 }}>Reading Fixture Schedule</div>
          <div className="wiz-sub">Claude is parsing <strong>{fileName || "your data"}</strong> and extracting every fixture row...</div>
          <div className="extract-steps" style={{ marginTop: 20 }}>
            {["Reading document structure","Identifying fixture rows","Extracting catalog numbers","Parsing quantities and locations","Inferring missing panel sizes"].map((s, i) => (
              <div key={s} className="extract-step" style={{ animationDelay: i * 0.5 + "s" }}>
                <span className="extract-dot" />{s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step: Review ── */}
      {step === "review" && (
        <div>
          <div className="bom-review-bar">
            <div className="bom-review-stats">
              <span className="bom-stat"><strong>{rows.length}</strong> rows found</span>
              <span className="bom-stat-div">·</span>
              <span className="bom-stat"><strong>{selectedCount}</strong> selected</span>
              {bom?.skippedRows ? <><span className="bom-stat-div">·</span><span className="bom-stat bom-stat-muted">{bom.skippedRows} skipped</span></> : null}
            </div>
            <div className="bom-review-actions">
              <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => toggleAll(true)}>Select All</button>
              <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => toggleAll(false)}>Deselect All</button>
              <button className="btn-primary" onClick={runMatching} disabled={selectedCount === 0}>
                Match {selectedCount} Row{selectedCount !== 1 ? "s" : ""} to Cooper →
              </button>
            </div>
          </div>

          <div className="bom-table-wrap">
            <table className="bom-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={rows.every(r => r.selected)} onChange={e => toggleAll(e.target.checked)} />
                  </th>
                  <th>#</th>
                  <th>Qty</th>
                  <th>Brand</th>
                  <th>Catalog Number</th>
                  <th>Size</th>
                  <th>Lumens</th>
                  <th>Watts</th>
                  <th>CRI</th>
                  <th>CCT</th>
                  <th>Location</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.lineNum} className={row.selected ? "" : "bom-row-deselected"}>
                    <td>
                      <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.lineNum)} />
                    </td>
                    <td className="bom-td-num">{row.lineNum}</td>
                    <td><input className="bom-cell-input" type="number" value={row.parsed.qty} min={1} onChange={e => editField(row.lineNum, "qty", parseInt(e.target.value) || 1)} /></td>
                    <td><input className="bom-cell-input" value={row.parsed.brand} onChange={e => editField(row.lineNum, "brand", e.target.value)} /></td>
                    <td><input className="bom-cell-input bom-cell-mono bom-cell-wide" value={row.parsed.catalogNumber} onChange={e => editField(row.lineNum, "catalogNumber", e.target.value)} /></td>
                    <td>
                      <select className="bom-cell-input" value={row.parsed.size} onChange={e => editField(row.lineNum, "size", e.target.value)}>
                        {["1x1","1x2","1x4","2x2","2x4","4x6"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><input className="bom-cell-input bom-cell-num" type="number" value={row.parsed.lumens || ""} placeholder="—" onChange={e => editField(row.lineNum, "lumens", parseInt(e.target.value) || 0)} /></td>
                    <td><input className="bom-cell-input bom-cell-num" type="number" value={row.parsed.watts || ""} placeholder="—" onChange={e => editField(row.lineNum, "watts", parseFloat(e.target.value) || 0)} /></td>
                    <td><input className="bom-cell-input bom-cell-num" type="number" value={row.parsed.cri} onChange={e => editField(row.lineNum, "cri", parseInt(e.target.value) || 80)} /></td>
                    <td>
                      <select className="bom-cell-input" value={row.parsed.cct} onChange={e => editField(row.lineNum, "cct", e.target.value)}>
                        {["2700K","3000K","3500K","4000K","5000K"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td><input className="bom-cell-input" value={row.parsed.location} onChange={e => editField(row.lineNum, "location", e.target.value)} /></td>
                    <td><input className="bom-cell-input" value={row.parsed.notes} onChange={e => editField(row.lineNum, "notes", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Step: Matching ── */}
      {step === "matching" && (
        <div className="bom-center">
          <div className="bom-progress-ring">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg4)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--navy)" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.3s" }}
              />
            </svg>
            <div className="bom-progress-pct">{progress}%</div>
          </div>
          <div className="wiz-title" style={{ marginTop: 16 }}>Matching to Cooper Products</div>
          <div className="wiz-sub">Running {rows.filter(r => r.selected).length} rows through the matching engine...</div>
          <div className="bom-live-rows">
            {rows.filter(r => r.selected).slice(-5).map(r => (
              <div key={r.lineNum} className={`bom-live-row bom-live-${r.status}`}>
                <span className="bom-live-icon">
                  {r.status === "matching" ? "⟳" : r.status === "matched" ? "✓" : r.status === "no-match" ? "✗" : "·"}
                </span>
                <span className="bom-live-cat">{r.parsed.catalogNumber || r.parsed.description}</span>
                {r.status === "matched" && <span className="bom-live-result">→ {r.cooperCatalog} ({r.matchScore}%)</span>}
                {r.status === "no-match" && <span className="bom-live-nope">No match found</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && (
        <div>
          {/* Summary banner */}
          <div className="bom-summary-banner">
            <div className="bom-summary-stat">
              <div className="bom-summary-num bom-sum-green">{matchedCount}</div>
              <div className="bom-summary-label">Matched</div>
            </div>
            <div className="bom-summary-divider" />
            <div className="bom-summary-stat">
              <div className="bom-summary-num bom-sum-amber">{noMatchCount}</div>
              <div className="bom-summary-label">No Match</div>
            </div>
            <div className="bom-summary-divider" />
            <div className="bom-summary-stat">
              <div className="bom-summary-num">{rows.filter(r => !r.selected).length}</div>
              <div className="bom-summary-label">Skipped</div>
            </div>
            <div className="bom-summary-divider" />
            <div className="bom-summary-stat">
              <div className="bom-summary-num">{rows.filter(r => r.status === "matched").reduce((a,r) => a + r.parsed.qty, 0)}</div>
              <div className="bom-summary-label">Total Fixtures</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {matchedCount > 0 && (
                <button className="btn-primary" onClick={addToQuote}>
                  Add {matchedCount} Matches to Quote →
                </button>
              )}
            </div>
          </div>

          {/* Results table */}
          <div className="bom-table-wrap">
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>#</th>
                  <th>Qty</th>
                  <th>Original Catalog</th>
                  <th>Brand</th>
                  <th>Size</th>
                  <th>Cooper Match</th>
                  <th>Score</th>
                  <th>Flags / Advantages</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => r.selected).map(row => {
                  const scoreColor = row.matchScore >= 80 ? "var(--green)" : row.matchScore >= 60 ? "var(--amber)" : "var(--red)"
                  return (
                    <tr key={row.lineNum}>
                      <td>
                        <span className={`bom-status-chip bom-status-${row.status}`}>
                          {row.status === "matched" ? "✓ Match" : row.status === "no-match" ? "✗ None" : row.status}
                        </span>
                      </td>
                      <td className="bom-td-num">{row.lineNum}</td>
                      <td className="bom-td-num">{row.parsed.qty}</td>
                      <td className="bom-td-mono">{row.parsed.catalogNumber || row.parsed.description}</td>
                      <td>{row.parsed.brand}</td>
                      <td>{row.parsed.size.toUpperCase()}</td>
                      <td className="bom-td-mono bom-td-cooper">{row.cooperCatalog || "—"}</td>
                      <td>
                        {row.matchScore > 0 && (
                          <span className="bom-score-pill" style={{ color: scoreColor, borderColor: scoreColor }}>
                            {row.matchScore}%
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {row.flags.slice(0,2).map(f => <span key={f} className="flag-chip" style={{ fontSize: 10 }}>{f}</span>)}
                          {row.advantages.slice(0,2).map(a => <span key={a} className="adv-chip" style={{ fontSize: 10 }}>✓ {a}</span>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button className="btn-outline" onClick={() => { setStep("upload"); setRows([]); setBOM(null); setPasteText("") }}>
              Import Another BOM
            </button>
            {matchedCount > 0 && (
              <button className="btn-primary" onClick={addToQuote}>
                Add {matchedCount} Matches to Quote →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
