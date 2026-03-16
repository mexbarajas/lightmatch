import { useState } from "react"
import { decodeCatalogNumber, decodeOmniCatalogNumber } from "@/lib/database"
import type { DecodedCatalog, OmniDecodedCatalog, CatalogSegment } from "@/lib/database"

function buildWSLSpecs(d: DecodedCatalog): [string, string][] {
  return [
    ["Series", d.series],
    ["Size", d.size + " · " + d.fixtureType],
    ["Lumens (nominal)", d.lumensTarget.toLocaleString() + " lm target"],
    ["Lumens (delivered)", d.lumensDelivered > 0 ? d.lumensDelivered.toLocaleString() + " lm" : "—"],
    ["Input Watts", d.inputWatts > 0 ? d.inputWatts + "W" : "—"],
    ["Efficacy", d.efficacy > 0 ? d.efficacy + " lm/W" : "—"],
    ["CRI", d.cri + " CRI minimum"],
    ["CCT", d.cct],
    ["Voltage", d.voltage],
    ["Dimming", d.dimmingType + " (" + d.dimmingRange + ")"],
    ["Drivers", d.numDrivers + " driver" + (d.numDrivers > 1 ? "s" : "")],
    ["Mounting", d.mounting],
    ["Row Config", d.mountingMode],
    ["Uplight", d.uplightPct > 0 ? d.uplightPct + "% uplight aperture" : "None"],
    ["Packaging", d.packaging],
    ["Emergency", d.emergencyOption || "None"],
    ["Sensor", d.sensorOption || "None"],
  ]
}

function buildOmniSpecs(d: OmniDecodedCatalog): [string, string][] {
  return [
    ["Series", d.series + " (NeoRay " + d.diameter + ")"],
    ["Direction", d.directionLabel],
    ["Mounting", d.mounting + " · " + d.patternType],
    ["Length", d.lengthFt + " ft"],
    ["Direct Output", d.directPkgLmFt > 0 ? d.directPkgLmFt + " lm/ft nominal" : "None"],
    ["Indirect Output", d.indirectPkgLmFt > 0 ? d.indirectPkgLmFt + " lm/ft nominal" : "None"],
    ["Direct Optic", d.directOptic],
    ["Indirect Optic", d.indirectOptic],
    ["CRI", d.cri + " CRI"],
    ["CCT", d.cct],
    ["Direct lm/ft (adj)", d.adjDLmFt > 0 ? d.adjDLmFt + " lm/ft" : "—"],
    ["Indirect lm/ft (adj)", d.adjILmFt > 0 ? d.adjILmFt + " lm/ft" : "—"],
    ["Total lm/ft (adj)", d.adjTLmFt > 0 ? d.adjTLmFt + " lm/ft" : "—"],
    ["Total fixture lumens", d.totalFixtureLm > 0 ? d.totalFixtureLm.toLocaleString() + " lm (" + d.lengthFt + "ft run)" : "—"],
    ["Total fixture watts", d.totalFixtureW > 0 ? d.totalFixtureW + "W" : "—"],
    ["Efficacy", d.baseLmW > 0 ? d.baseLmW + " lm/W" : "—"],
    ["Max UGR", d.baseUgr > 0 ? d.baseUgr.toString() : "—"],
    ["CCT multiplier", d.cctMult !== 1.0 ? d.cctMult.toString() : "1.0 (base)"],
    ["Voltage", d.voltage],
    ["Controls", d.controls],
    ["Circuiting", d.circuiting],
    ["Emergency", d.emergency],
    ["Body Finish", d.bodyFinish],
    ["End Plate Finish", d.endPlateFinish],
    ["Suspension", d.suspensionType],
    ["Ceiling Interface", d.ceilingType],
    ["Hardware Color", d.hwColor],
    ["BAA Compliant", d.baa ? "Yes — Buy American Act" : "No"],
  ]
}

const SEGMENT_COLORS = [
  "#003087","#e8530a","#1a7a4a","#b45309","#5b21b6",
  "#0e7490","#be185d","#1d4ed8","#92400e","#374151"
]

export function CatalogDecoder() {
  const [input, setInput]       = useState("")
  const [decoded, setDecoded]   = useState<DecodedCatalog | OmniDecodedCatalog | null>(null)
  const [history, setHistory]   = useState<(DecodedCatalog | OmniDecodedCatalog)[]>([])

  const decodeAny = (val: string) => {
    const upper = val.trim().toUpperCase()
    if (upper.startsWith("OMN4") || upper.startsWith("BAA-OMN4")) {
      return decodeOmniCatalogNumber(val)
    }
    return decodeCatalogNumber(val)
  }

  const decode = () => {
    const val = input.trim()
    if (!val) return
    const result = decodeAny(val)
    setDecoded(result)
    setHistory(h => [result, ...h.filter(x => x.raw !== result.raw)].slice(0, 8))
  }

  const loadExample = (cat: string) => {
    setInput(cat)
    const result = decodeAny(cat)
    setDecoded(result)
  }

  const examples = [
    "4WSL-LD2-80-SPS-UPL15-UNV-L835-CD1-U",
    "4WSL-LD2-40-SRS-UNV-L840-CD1-U",
    "OMN4DIP-SR8F0-125D150US935-BBMOOB-1DUDD-SBC10JBB",
    "OMN4DIP-SR4F0-100D75US840-FLLOOB-1DUDD-WWC04JBW",
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalog Decoder</h1>
          <p className="page-sub">Decode any Cooper / Metalux catalog number — every segment explained</p>
        </div>
      </div>

      {/* Input */}
      <div className="cd-input-card">
        <div className="cd-input-row">
          <input
            className="form-input cd-input-main mono"
            placeholder="e.g. 4WSL-LD2-80-SPS-UPL15-UNV-L835-CD1-U"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && decode()}
          />
          <button className="btn-primary cd-decode-btn" onClick={decode}>Decode →</button>
        </div>
        <div className="cd-examples">
          <span className="cd-examples-label">Examples:</span>
          {examples.map(ex => (
            <button key={ex} className="cd-example-btn" onClick={() => loadExample(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      {decoded && (
        <div className="cd-result">

          {/* Visual breakdown bar */}
          <div className="cd-section-title">Catalog Number Breakdown</div>
          <div className="cd-breakdown-bar">
            {decoded.segments.filter(s => s.code).map((seg, i) => (
              <div key={i} className="cd-seg-block" style={{ borderTopColor: SEGMENT_COLORS[i] }}>
                <div className="cd-seg-code" style={{ color: SEGMENT_COLORS[i] }}>{seg.code}</div>
                <div className="cd-seg-field">{seg.field}</div>
              </div>
            ))}
          </div>

          {/* Segment detail table */}
          <div className="cd-seg-table">
            {decoded.segments.filter(s => s.code).map((seg, i) => (
              <div key={i} className="cd-seg-row">
                <div className="cd-seg-pos" style={{ background: SEGMENT_COLORS[i] }}>{seg.position}</div>
                <div className="cd-seg-code-cell" style={{ color: SEGMENT_COLORS[i] }}>{seg.code}</div>
                <div className="cd-seg-field-cell">{seg.field}</div>
                <div className="cd-seg-meaning">{seg.meaning}</div>
              </div>
            ))}
          </div>

          {/* Resolved specs */}
          <div className="cd-specs-grid">
            <div className="cd-specs-panel">
              <div className="cd-section-title" style={{ margin: "0 0 12px" }}>Resolved Specifications</div>
              {(decoded.series === "Omni"
                ? buildOmniSpecs(decoded as OmniDecodedCatalog)
                : buildWSLSpecs(decoded as DecodedCatalog)
              ).map(([k, v]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="cd-status-panel">
              {/* Validity */}
              <div className={`cd-validity ${decoded.isValid ? "valid" : "invalid"}`}>
                <div className="cd-validity-icon">{decoded.isValid ? "✓" : "⚠"}</div>
                <div>
                  <div className="cd-validity-label">{decoded.isValid ? "Valid catalog number" : "Catalog number has issues"}</div>
                  <div className="cd-validity-sub">{decoded.brand} · {decoded.series}</div>
                </div>
              </div>

              {/* Flags */}
              {decoded.flags.length > 0 && (
                <div className="cd-flags-panel">
                  <div className="cd-panel-title">Flags to Review</div>
                  {decoded.flags.map((f, i) => (
                    <div key={i} className="cd-flag-item">
                      <span className="cd-flag-icon">⚠</span>{f}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {decoded.notes.length > 0 && (
                <div className="cd-notes-panel">
                  <div className="cd-panel-title">Application Notes</div>
                  {decoded.notes.map((n, i) => (
                    <div key={i} className="cd-note-item">
                      <span className="cd-note-icon">ℹ</span>{n}
                    </div>
                  ))}
                </div>
              )}

              {/* Performance context */}
              {decoded.series === "Omni" ? (
                (decoded as OmniDecodedCatalog).totalFixtureLm > 0 && (
                  <div className="cd-perf-panel">
                    <div className="cd-panel-title">Performance at a Glance</div>
                    <div className="cd-perf-row"><span>Total fixture lumens</span><strong>{(decoded as OmniDecodedCatalog).totalFixtureLm.toLocaleString()} lm</strong></div>
                    <div className="cd-perf-row"><span>Total fixture watts</span><strong>{(decoded as OmniDecodedCatalog).totalFixtureW}W</strong></div>
                    <div className="cd-perf-row"><span>System efficacy</span><strong>{(decoded as OmniDecodedCatalog).baseLmW} lm/W</strong></div>
                    <div className="cd-perf-row"><span>Max UGR</span><strong>{(decoded as OmniDecodedCatalog).baseUgr}</strong></div>
                    <div className="cd-perf-row"><span>Lumen maintenance (non-baffled)</span><strong>L99 @ 60,000 hrs</strong></div>
                    <div className="cd-perf-row"><span>Calculated L70</span><strong>235,000 hrs</strong></div>
                  </div>
                )
              ) : (
                (decoded as DecodedCatalog).lumensDelivered > 0 && (
                  <div className="cd-perf-panel">
                    <div className="cd-panel-title">Performance at a Glance</div>
                    <div className="cd-perf-row"><span>Delivered lumens</span><strong>{(decoded as DecodedCatalog).lumensDelivered.toLocaleString()} lm</strong></div>
                    <div className="cd-perf-row"><span>Input power</span><strong>{(decoded as DecodedCatalog).inputWatts}W</strong></div>
                    <div className="cd-perf-row"><span>Efficacy</span><strong>{(decoded as DecodedCatalog).efficacy} lm/W</strong></div>
                    <div className="cd-perf-row"><span>Lumen maintenance</span><strong>L81 @ 60,000 hrs</strong></div>
                    <div className="cd-perf-row"><span>Theoretical L70</span><strong>100,000+ hrs</strong></div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div style={{ marginTop: 28 }}>
          <div className="cd-section-title">Recent Decodes</div>
          <div className="cd-history">
            {history.slice(1).map((h, i) => (
              <button key={i} className="cd-history-chip" onClick={() => { setInput(h.raw); setDecoded(h) }}>
                <span className="cd-history-cat">{h.raw}</span>
                <span className="cd-history-meta">{h.cct} · {h.series}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
