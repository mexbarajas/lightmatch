import { useState } from "react"

export function QuoteBuilder({ quoteItems, setQuoteItems }: { quoteItems: any[], setQuoteItems: (items: any[]) => void }) {
  const [projectName, setProjectName] = useState("")
  const [projectNum, setProjectNum] = useState("")
  const [preparedBy, setPreparedBy] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")

  const remove = (id: string) => setQuoteItems(quoteItems.filter((i: any) => i.id !== id))
  const updateQty = (id: string, qty: number) => setQuoteItems(quoteItems.map((i: any) => i.id === id ? { ...i, qty } : i))
  const updateNotes = (id: string, n: string) => setQuoteItems(quoteItems.map((i: any) => i.id === id ? { ...i, notes: n } : i))
  const clear = () => { if (confirm("Clear all items?")) setQuoteItems([]) }

  const exportCSV = () => {
    const q = String.fromCharCode(34)
    const esc = (c: any) => q + String(c).replace(new RegExp(q, "g"), q + q) + q
    const header = ["Line","Qty","Size","Cooper Catalog","Series","Lumens","Watts","CCT","Competitor Brand","Competitor Catalog","Match%","Notes"]
    const metaLines = [
      "Project: " + projectName,
      "Project #: " + projectNum,
      "Prepared By: " + preparedBy,
      "Customer: " + customerName,
      "Date: " + new Date().toLocaleDateString(),
      "",
      header.join(","),
    ]
    const dataLines = quoteItems.map((item: any, i: number) => [
      i+1, item.qty, item.size.toUpperCase(), item.cooperCatalog, item.cooperSeries,
      item.lumens, item.watts, item.cct, item.competitorBrand, item.competitorCatalog,
      item.matchScore + "%", item.notes
    ].map(esc).join(","))
    const csv = metaLines.concat(dataLines).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "Cooper_Quote_" + (projectNum || "draft") + "_" + new Date().toISOString().split("T")[0] + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const buildPrintHTML = () => {
    const styles = [
      "body{font-family:Arial,sans-serif;padding:32px;color:#111}",
      "h1{font-size:22px;margin:0}",
      ".hdr{display:flex;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1a56db}",
      ".meta{font-size:13px;margin-bottom:20px}",
      ".mk{font-weight:600;color:#555;min-width:110px;display:inline-block}",
      "table{width:100%;border-collapse:collapse;font-size:12px}",
      "th{background:#1a56db;color:#fff;padding:8px 10px;text-align:left}",
      "td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top}",
      "tr:nth-child(even) td{background:#f9fafb}",
      ".sh{background:#d1fae5;color:#065f46;padding:2px 7px;border-radius:99px;font-weight:600;font-size:11px}",
      ".sm{background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:99px;font-weight:600;font-size:11px}",
      ".foot{margin-top:28px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}",
    ].join("")

    const rowsHTML = quoteItems.map((item: any, i: number) => {
      const sc = item.matchScore >= 80 ? "sh" : "sm"
      return "<tr>" +
        "<td>" + (i + 1) + "</td>" +
        "<td>" + item.qty + "</td>" +
        "<td>" + item.size.toUpperCase() + "</td>" +
        "<td><b>" + item.cooperCatalog + "</b></td>" +
        "<td>" + item.cooperSeries + "</td>" +
        "<td>" + item.lumens.toLocaleString() + " lm</td>" +
        "<td>" + item.watts + "W</td>" +
        "<td>" + item.cct + "</td>" +
        "<td>" + item.competitorBrand + "<br><small>" + item.competitorCatalog + "</small></td>" +
        "<td><span class=" + sc + ">" + item.matchScore + "%</span></td>" +
        "<td><small>" + item.notes + "</small></td>" +
        "</tr>"
    }).join("")

    const metaRows = [
      projectName ? "<div><span class=mk>Project:</span>" + projectName + "</div>" : "",
      projectNum ? "<div><span class=mk>Project #:</span>" + projectNum + "</div>" : "",
      customerName ? "<div><span class=mk>Customer:</span>" + customerName + "</div>" : "",
      preparedBy ? "<div><span class=mk>Prepared By:</span>" + preparedBy + "</div>" : "",
      "<div><span class=mk>Date:</span>" + new Date().toLocaleDateString() + "</div>",
    ].join("")

    return "<!DOCTYPE html><html><head><title>Cooper Quote</title><style>" + styles + "</style></head><body>" +
      "<div class=hdr>" +
        "<div><h1>Cooper Lighting Solutions</h1><div style='color:#1a56db;font-size:14px'>LightMatch Cross-Reference Quote</div></div>" +
        "<div style='text-align:right'></div>" +
      "</div>" +
      "<div class=meta>" + metaRows + "</div>" +
      "<table><thead><tr><th>#</th><th>Qty</th><th>Size</th><th>Cooper Catalog #</th><th>Series</th>" +
      "<th>Lumens</th><th>Watts</th><th>CCT</th><th>Replaces</th><th>Match</th><th>Notes</th></tr></thead>" +
      "<tbody>" + rowsHTML + "</tbody></table>" +
      (notes ? "<div style='margin-top:20px;font-size:13px'><b>Notes:</b><br>" + notes + "</div>" : "") +
      "<div class=foot>Cooper Lighting Solutions — cooperlighting.com — Pricing subject to confirmation by representative.</div>" +
      "</body></html>"
  }

  const printQuote = () => {
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(buildPrintHTML())
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quote Builder</h1>
          <p className="page-sub">Review matches · Configure · Export Cooper quote</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {quoteItems.length > 0 && (
            <>
              <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
              <button className="btn-primary" onClick={printQuote}>Print / PDF Quote</button>
            </>
          )}
        </div>
      </div>

      <div className="quote-meta-card">
        <div className="quote-meta-title">Project Information</div>
        <div className="form-row">
          <div>
            <label className="form-label">Project Name</label>
            <input className="form-input" placeholder="e.g. Acme Office Renovation" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Project Number</label>
            <input className="form-input" placeholder="e.g. 2025-0342" value={projectNum} onChange={e => setProjectNum(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label className="form-label">Customer / End User</label>
            <input className="form-input" placeholder="Company name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Prepared By</label>
            <input className="form-input" placeholder="Your name" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} />
          </div>
        </div>
      </div>

      {quoteItems.length === 0 ? (
        <div className="results-empty" style={{ marginTop: 32 }}>
          <div className="empty-icon">≡</div>
          <div className="empty-label">No items in quote yet</div>
          <div className="empty-sub">Go to Match and Convert to find Cooper products and add them here</div>
        </div>
      ) : (
        <>
          <div className="quote-table-header">
            <span>{quoteItems.length} line item{quoteItems.length !== 1 ? "s" : ""}</span>
            <button className="btn-danger-sm" onClick={clear}>Clear All</button>
          </div>
          <div className="quote-items">
            {quoteItems.map((item: any, i: number) => (
              <QuoteLineItem
                key={item.id}
                item={item}
                lineNum={i + 1}
                onRemove={() => remove(item.id)}
                onQty={(q: number) => updateQty(item.id, q)}
                onNotes={(n: string) => updateNotes(item.id, n)}
              />
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <label className="form-label">Quote Notes / Special Instructions</label>
            <textarea className="form-input" rows={4} placeholder="Add project-specific notes, pricing requests, or delivery instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="quote-summary">
            <div className="summary-row"><span>Total Line Items</span><span>{quoteItems.length}</span></div>
            <div className="summary-row"><span>Total Fixture Count</span><span>{quoteItems.reduce((a: number, i: any) => a + i.qty, 0)} fixtures</span></div>
            <div className="summary-row"><span>Avg Match Score</span><span>{Math.round(quoteItems.reduce((a: number, i: any) => a + i.matchScore, 0) / quoteItems.length)}%</span></div>
            <div className="summary-note">Pricing to be provided by Cooper Lighting representative upon submission.</div>
          </div>
          <div className="quote-actions">
            <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
            <button className="btn-primary" onClick={printQuote}>Print / Generate PDF Quote</button>
          </div>
        </>
      )}
    </div>
  )
}

function QuoteLineItem({ item, lineNum, onRemove, onQty, onNotes }: any) {
  const [qty, setQtyLocal] = useState(item.qty)
  const scoreColor = item.matchScore >= 80 ? "#10b981" : item.matchScore >= 60 ? "#f59e0b" : "#ef4444"
  const handleQty = (val: number) => { setQtyLocal(val); onQty(val) }
  return (
    <div className="quote-line">
      <div className="ql-num">{lineNum}</div>
      <div className="ql-body">
        <div className="ql-header">
          <span className="ql-catalog">{item.cooperCatalog}</span>
          <span className="ql-series">{item.cooperSeries} · {item.size.toUpperCase()}</span>
          <span className="ql-score" style={{ color: scoreColor }}>{item.matchScore}% match</span>
        </div>
        <div className="ql-specs">
          <span className="spec-chip">{item.lumens.toLocaleString()} lm</span>
          <span className="spec-chip">{item.watts}W</span>
          <span className="spec-chip">{item.cct}</span>
        </div>
        <div className="ql-replaces">Replaces: <strong>{item.competitorBrand}</strong> {item.competitorCatalog}</div>
        <input className="form-input" style={{ marginTop: 8, fontSize: 12 }} placeholder="Line notes..." value={item.notes} onChange={e => onNotes(e.target.value)} />
      </div>
      <div className="ql-right">
        <div className="qty-control">
          <button onClick={() => handleQty(Math.max(1, qty - 1))}>-</button>
          <input type="number" value={qty} min={1} onChange={e => handleQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button onClick={() => handleQty(qty + 1)}>+</button>
        </div>
        <button className="remove-btn" onClick={onRemove}>x</button>
      </div>
    </div>
  )
}
