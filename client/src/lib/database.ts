// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  brand: string
  series: string
  catalogNumber: string
  size: string            // "2x4", "2x2", "1x4", "1x1", "1x2", "4x6"
  fixtureType: string
  lumens: { low?: number; medium: number; high?: number }
  watts: { low?: number; medium: number; high?: number }
  efficacy: number        // lm/W at medium
  cri: number             // minimum CRI
  cct: string[]           // e.g. ["3500K","4000K","5000K"]
  cctSelectable: boolean
  lumenSelectable: boolean
  voltage: string
  dimming: string
  dimTo: number           // minimum dim %
  mounting: string[]
  dlc: 'none' | 'standard' | 'premium'
  ul: boolean
  nsf: boolean
  ic: boolean
  ipRating: string        // "IP5X" or "none"
  warranty: number        // years
  emergency: string       // "none", "7W/10W/14W", etc.
  ambientMax: number      // °C
  controls: string[]
  occupancySensor: string // "none", "integral", "external", "optional"
  weight: number          // lbs (medium size of family)
  notes: string[]
  flags: string[]         // auto-generated mismatch flags
  advantages: string[]
}

export interface Brand {
  id: string
  name: string
  parent: string
  color: string
  products: string[]  // product ids
}

export interface MatchResult {
  cooperProduct: Product
  score: number           // 0–100
  flags: string[]
  advantages: string[]
  notes: string[]
}

export interface QuoteItem {
  id: string
  description: string
  size: string
  qty: number
  competitorBrand: string
  competitorCatalog: string
  cooperCatalog: string
  cooperSeries: string
  lumens: number
  watts: number
  cct: string
  accessories: string[]
  notes: string
  matchScore: number
}

// ─── Catalog Grammar Engine ───────────────────────────────────────────────────

export interface CatalogSegment {
  position: number
  code: string
  field: string
  meaning: string
  value: string | number | null
}

export interface DecodedCatalog {
  raw: string
  brand: string
  series: string
  isValid: boolean
  segments: CatalogSegment[]
  // Resolved spec fields
  size: string
  fixtureType: string
  lumensTarget: number
  lumensDelivered: number
  inputWatts: number
  efficacy: number
  cri: number
  cct: string
  voltage: string
  dimmingType: string
  dimmingRange: string
  numDrivers: number
  mounting: string
  mountingMode: string   // "standalone" | "continuous"
  uplightPct: number     // 0, 8, or 15
  hasUplight: boolean
  packaging: string
  revision: string
  emergencyOption: string
  sensorOption: string
  flags: string[]
  notes: string[]
}

// ── WSL performance table (from spec sheet page 4) ────────────────────────────
const WSL_PERFORMANCE: Record<string, { lumens: number; watts: number; efficacy: number }> = {
  // 4ft
  "4WSL-30":  { lumens: 3023,  watts: 24.9,  efficacy: 121 },
  "4WSL-35":  { lumens: 3544,  watts: 30.6,  efficacy: 116 },
  "4WSL-40":  { lumens: 4010,  watts: 35.1,  efficacy: 114 },
  "4WSL-45":  { lumens: 4502,  watts: 39.9,  efficacy: 113 },
  "4WSL-50":  { lumens: 4988,  watts: 44.8,  efficacy: 111 },
  "4WSL-55":  { lumens: 5541,  watts: 49.9,  efficacy: 111 },
  "4WSL-60":  { lumens: 5988,  watts: 56.2,  efficacy: 107 },
  "4WSL-65":  { lumens: 6591,  watts: 61.9,  efficacy: 106 },
  "4WSL-70":  { lumens: 7005,  watts: 68.7,  efficacy: 102 },
  "4WSL-75":  { lumens: 7623,  watts: 73.9,  efficacy: 103 },
  "4WSL-80":  { lumens: 7806,  watts: 76.0,  efficacy: 103 },
  // 8ft
  "8WSL-60":  { lumens: 6128,  watts: 53.5,  efficacy: 115 },
  "8WSL-65":  { lumens: 6536,  watts: 57.6,  efficacy: 113 },
  "8WSL-70":  { lumens: 6934,  watts: 63.6,  efficacy: 109 },
  "8WSL-75":  { lumens: 7468,  watts: 67.2,  efficacy: 111 },
  "8WSL-80":  { lumens: 8072,  watts: 73.1,  efficacy: 110 },
  "8WSL-90":  { lumens: 9004,  watts: 80.6,  efficacy: 112 },
  "8WSL-100": { lumens: 9976,  watts: 90.6,  efficacy: 110 },
  "8WSL-110": { lumens: 11082, watts: 98.9,  efficacy: 112 },
  "8WSL-120": { lumens: 11976, watts: 113.5, efficacy: 106 },
  "8WSL-130": { lumens: 13182, watts: 124.7, efficacy: 106 },
  "8WSL-140": { lumens: 14010, watts: 136.6, efficacy: 103 },
  "8WSL-150": { lumens: 15246, watts: 148.7, efficacy: 103 },
  "8WSL-160": { lumens: 15612, watts: 152.9, efficacy: 102 },
}

// ── Driver type lookup ─────────────────────────────────────────────────────────
const DRIVER_TYPES: Record<string, { label: string; dimRange: string; compatible: string }> = {
  "CD":    { label: "0-10V Dimming Driver",            dimRange: "1%-100%",   compatible: "WaveLinx LITE, WaveLinx PRO" },
  "SR":    { label: "Sensor-Ready Dimming Driver",     dimRange: "1%-100%",   compatible: "WaveLinx sensors" },
  "5LTD":  { label: "Fifth Light DALI Driver",         dimRange: "10%-100%",  compatible: "Fifth Light system" },
  "5LTHD": { label: "Fifth Light Dimming Driver",      dimRange: "1%-100%",   compatible: "Fifth Light system" },
  "SD":    { label: "Step Dimming Driver",             dimRange: "50%/100%",  compatible: "Step dim switches" },
  "LH":    { label: "Lutron HiLume EcoSystem Driver",  dimRange: "1%-100%",   compatible: "Lutron EcoSystem" },
}

// ── Mounting application lookup ────────────────────────────────────────────────
const MOUNTING_TYPES: Record<string, { label: string; mount: string; mode: string }> = {
  "SRS": { label: "Surface Standalone",          mount: "surface",    mode: "standalone"  },
  "SRC": { label: "Surface Continuous Row",      mount: "surface",    mode: "continuous"  },
  "SPS": { label: "Suspended Standalone",        mount: "suspended",  mode: "standalone"  },
  "SPC": { label: "Suspended Continuous Row",    mount: "suspended",  mode: "continuous"  },
}

// ── CCT / CRI decode ───────────────────────────────────────────────────────────
const CCT_MAP: Record<string, { cri: number; cct: string }> = {
  "L835": { cri: 80, cct: "3500K" },
  "L840": { cri: 80, cct: "4000K" },
  "L850": { cri: 80, cct: "5000K" },
}

// ── Master decoder function ────────────────────────────────────────────────────
export function decodeCatalogNumber(raw: string): DecodedCatalog {
  const parts = raw.trim().toUpperCase().split("-")
  const flags: string[] = []
  const notes: string[] = []

  // --- Detect prefix (TAA or blank) ---
  let idx = 0
  const taa = parts[0] === "TAA"
  if (taa) { idx++; notes.push("TAA compliant — Trade Agreements Act qualified") }

  // --- Position 1: Series ---
  const seriesCode = parts[idx] || ""
  idx++
  const isFour = seriesCode === "4WSL"
  const isEight = seriesCode === "8WSL"
  const size = isFour ? "4ft" : isEight ? "8ft" : "unknown"
  if (!isFour && !isEight) flags.push("Unrecognized series: " + seriesCode)

  // --- Position 2: Revision ---
  const revision = parts[idx] || ""
  idx++
  if (revision !== "LD2") flags.push("Unknown revision: " + revision + " (expected LD2)")

  // --- Position 3: Lumen Output ---
  const lumenCode = parts[idx] || ""
  idx++
  const lumenTarget = parseInt(lumenCode) * 100 || 0
  const perfKey = seriesCode + "-" + lumenCode
  const perf = WSL_PERFORMANCE[perfKey] || null
  if (!perf && lumenTarget > 0) flags.push("Lumen package " + lumenCode + " not in performance table — verify")

  // --- Position 4: Application (mounting) ---
  const appCode = parts[idx] || ""
  idx++
  const mountInfo = MOUNTING_TYPES[appCode] || null
  if (!mountInfo) flags.push("Unknown application code: " + appCode)

  // --- Position 5: Uplight (optional — detect by UPL prefix) ---
  let uplightPct = 0
  let uplightCode = ""
  if (parts[idx] && parts[idx].startsWith("UPL")) {
    uplightCode = parts[idx]
    idx++
    if (uplightCode === "UPL8")  uplightPct = 8
    if (uplightCode === "UPL15") uplightPct = 15
    notes.push("Uplight: " + uplightPct + "% — indirect component adds ambient light above fixture")
  }

  // --- Position 6: Voltage ---
  const voltCode = parts[idx] || ""
  idx++
  const voltLabel =
    voltCode === "UNV" ? "120-277V Universal" :
    voltCode === "347" ? "347V" :
    voltCode === "480" ? "480V" : voltCode
  if (voltCode === "347" && isFour) flags.push("347V not available on 4ft — only valid on 8WSL")

  // --- Position 7: Color Temperature ---
  const cctCode = parts[idx] || ""
  idx++
  const cctInfo = CCT_MAP[cctCode] || null
  if (!cctInfo) flags.push("Unknown CCT code: " + cctCode + " (valid: L835, L840, L850)")

  // --- Position 8: Driver Type ---
  const driverCode = parts[idx] || ""
  idx++
  const driverInfo = DRIVER_TYPES[driverCode] || null
  if (!driverInfo) flags.push("Unknown driver code: " + driverCode)

  // --- Position 9: Number of Drivers ---
  const numDriversRaw = parts[idx] || "1"
  idx++
  const numDrivers = parseInt(numDriversRaw) || 1
  // Validate driver count vs lumen package
  if (lumenTarget >= 5500 && lumenTarget <= 10000 && numDrivers < 2)
    flags.push("5500-10000 lm requires 2 drivers (CD2) — verify")
  if (lumenTarget >= 11000 && numDrivers < 2)
    flags.push("11000+ lm requires 2+ drivers — verify")

  // --- Position 10: Packaging ---
  const pkgCode = parts[idx] || ""
  const pkgLabel = pkgCode === "U" ? "Unit Pack" : pkgCode

  // --- Emergency / Sensor options (if appended after U) ---
  const remaining = parts.slice(idx + 1)
  let emergencyOption = ""
  let sensorOption = ""
  remaining.forEach(p => {
    if (p.startsWith("EL"))   emergencyOption = p === "EL7W" ? "7W Emergency Battery" : "14W Emergency Battery"
    if (p === "GTR2")         emergencyOption = "Bodine Generator Transfer Relay"
    if (p === "ETRD")         emergencyOption = "Emergency Transfer Relay w/ Dimming"
    if (p === "WLS")          sensorOption = "WaveLinx LITE Wireless Sensor (occupancy + photocell)"
    if (p === "WPS")          sensorOption = "WaveLinx PRO Wireless Sensor (occupancy + photocell)"
  })

  // --- Build segments array ---
  const segments: CatalogSegment[] = [
    { position: 1, code: seriesCode,   field: "Series",           meaning: isFour ? "4 ft. Linear Wavestream LED" : isEight ? "8 ft. Linear Wavestream LED" : "Unknown",  value: size },
    { position: 2, code: revision,     field: "Revision",         meaning: "LED 2.0 platform",                     value: revision },
    { position: 3, code: lumenCode,    field: "Lumen Output",     meaning: lumenTarget + " lm nominal target",     value: lumenTarget },
    { position: 4, code: appCode,      field: "Application",      meaning: mountInfo?.label || appCode,            value: mountInfo?.mount || appCode },
    { position: 5, code: uplightCode,  field: "Uplight",          meaning: uplightPct > 0 ? uplightPct + "% uplight aperture" : "Downlight only (solid top)", value: uplightPct },
    { position: 6, code: voltCode,     field: "Voltage",          meaning: voltLabel,                              value: voltCode },
    { position: 7, code: cctCode,      field: "Color Temperature", meaning: cctInfo ? cctInfo.cri + " CRI / " + cctInfo.cct : cctCode, value: cctInfo?.cct || "" },
    { position: 8, code: driverCode,   field: "Driver Type",      meaning: driverInfo?.label || driverCode,        value: driverInfo?.dimRange || "" },
    { position: 9, code: numDriversRaw, field: "Number of Drivers", meaning: numDrivers + " driver" + (numDrivers > 1 ? "s" : ""), value: numDrivers },
    { position: 10, code: pkgCode,     field: "Packaging",        meaning: pkgLabel,                               value: pkgCode },
  ]

  if (emergencyOption) notes.push("Emergency: " + emergencyOption)
  if (sensorOption)    notes.push("Sensor: " + sensorOption)
  if (driverInfo)      notes.push("Controls compatible: " + driverInfo.compatible)
  if (uplightPct > 0)  notes.push("Efficacy slightly lower with uplight version due to aperture in top")

  return {
    raw,
    brand: "Cooper / Metalux",
    series: "WSL Linear",
    isValid: flags.length === 0,
    segments,
    // Resolved spec fields
    size,
    fixtureType: "Linear Wavestream LED — " + (mountInfo?.label || appCode),
    lumensTarget: lumenTarget,
    lumensDelivered: perf?.lumens || 0,
    inputWatts: perf?.watts || 0,
    efficacy: perf?.efficacy || 0,
    cri: cctInfo?.cri || 80,
    cct: cctInfo?.cct || "",
    voltage: voltLabel,
    dimmingType: driverInfo?.label || driverCode,
    dimmingRange: driverInfo?.dimRange || "1%-100%",
    numDrivers,
    mounting: mountInfo?.mount || "",
    mountingMode: mountInfo?.mode || "",
    uplightPct,
    hasUplight: uplightPct > 0,
    packaging: pkgLabel,
    revision,
    emergencyOption,
    sensorOption,
    flags,
    notes,
  }
}



// ── NeoRay Omni grammar ────────────────────────────────────────────────────────

// Performance lookup — keyed as "DIRECTPKG-INDIRECTPKG-OPTIC" => { directLmFt, indirectLmFt, totalLmFt, wFt, lmW }
// Source: pages 7–10, 80CRI 3500K base values. CRI/CCT multipliers applied separately.
// Format: directCode + "-" + indirectCode + "-" + opticCode
const OMNI_PERF: Record<string, { dLmFt: number; iLmFt: number; tLmFt: number; wFt: number; lmW: number; ugr: number }> = {
  // FLL direct + no indirect
  "50D--FLL":   { dLmFt: 505,  iLmFt: 0,    tLmFt: 507,  wFt: 3.6,  lmW: 141.9, ugr: 24.1 },
  "75D--FLL":   { dLmFt: 748,  iLmFt: 0,    tLmFt: 752,  wFt: 5.5,  lmW: 137.9, ugr: 25.5 },
  "100D--FLL":  { dLmFt: 989,  iLmFt: 0,    tLmFt: 994,  wFt: 7.5,  lmW: 133.0, ugr: 26.5 },
  "125D--FLL":  { dLmFt: 1261, iLmFt: 0,    tLmFt: 1268, wFt: 10.0, lmW: 126.8, ugr: 27.3 },
  // FLL direct + OOB indirect combos
  "50D-25U-FLL":  { dLmFt: 505, iLmFt: 259,  tLmFt: 764,  wFt: 5.7,  lmW: 135.3, ugr: 21.5 },
  "50D-50U-FLL":  { dLmFt: 505, iLmFt: 498,  tLmFt: 1003, wFt: 7.2,  lmW: 138.9, ugr: 20.1 },
  "50D-75U-FLL":  { dLmFt: 505, iLmFt: 755,  tLmFt: 1260, wFt: 8.8,  lmW: 143.6, ugr: 19.1 },
  "50D-100U-FLL": { dLmFt: 505, iLmFt: 996,  tLmFt: 1501, wFt: 10.8, lmW: 138.7, ugr: 18.3 },
  "50D-125U-FLL": { dLmFt: 505, iLmFt: 1253, tLmFt: 1758, wFt: 13.1, lmW: 133.9, ugr: 17.7 },
  "50D-150U-FLL": { dLmFt: 505, iLmFt: 1497, tLmFt: 2003, wFt: 15.7, lmW: 127.4, ugr: 17.1 },
  "75D-25U-FLL":  { dLmFt: 748, iLmFt: 261,  tLmFt: 1009, wFt: 7.5,  lmW: 134.0, ugr: 23.5 },
  "75D-50U-FLL":  { dLmFt: 748, iLmFt: 500,  tLmFt: 1248, wFt: 9.1,  lmW: 137.1, ugr: 22.4 },
  "75D-75U-FLL":  { dLmFt: 748, iLmFt: 756,  tLmFt: 1504, wFt: 10.7, lmW: 141.2, ugr: 21.5 },
  "75D-100U-FLL": { dLmFt: 748, iLmFt: 998,  tLmFt: 1746, wFt: 12.7, lmW: 137.5, ugr: 20.8 },
  "75D-125U-FLL": { dLmFt: 748, iLmFt: 1254, tLmFt: 2002, wFt: 15.0, lmW: 133.5, ugr: 20.1 },
  "75D-150U-FLL": { dLmFt: 748, iLmFt: 1499, tLmFt: 2247, wFt: 17.6, lmW: 127.7, ugr: 19.6 },
  "100D-25U-FLL":  { dLmFt: 990, iLmFt: 262,  tLmFt: 1251, wFt: 9.6,  lmW: 131.0, ugr: 24.9 },
  "100D-50U-FLL":  { dLmFt: 990, iLmFt: 501,  tLmFt: 1490, wFt: 11.1, lmW: 134.0, ugr: 23.9 },
  "100D-75U-FLL":  { dLmFt: 990, iLmFt: 757,  tLmFt: 1747, wFt: 12.7, lmW: 137.8, ugr: 23.1 },
  "100D-100U-FLL": { dLmFt: 990, iLmFt: 999,  tLmFt: 1989, wFt: 14.7, lmW: 135.0, ugr: 22.4 },
  "100D-125U-FLL": { dLmFt: 990, iLmFt: 1255, tLmFt: 2245, wFt: 17.0, lmW: 131.9, ugr: 21.9 },
  "100D-150U-FLL": { dLmFt: 990, iLmFt: 1500, tLmFt: 2490, wFt: 19.6, lmW: 126.9, ugr: 21.4 },
  "125D-25U-FLL":  { dLmFt: 1261, iLmFt: 263,  tLmFt: 1525, wFt: 12.1, lmW: 126.3, ugr: 26.0 },
  "125D-50U-FLL":  { dLmFt: 1261, iLmFt: 502,  tLmFt: 1764, wFt: 13.7, lmW: 129.2, ugr: 25.2 },
  "125D-75U-FLL":  { dLmFt: 1262, iLmFt: 759,  tLmFt: 2020, wFt: 15.2, lmW: 132.9, ugr: 24.4 },
  "125D-100U-FLL": { dLmFt: 1262, iLmFt: 1000, tLmFt: 2262, wFt: 17.3, lmW: 131.1, ugr: 23.8 },
  "125D-125U-FLL": { dLmFt: 1262, iLmFt: 1257, tLmFt: 2518, wFt: 19.6, lmW: 128.8, ugr: 23.3 },
  "125D-150U-FLL": { dLmFt: 1262, iLmFt: 1501, tLmFt: 2763, wFt: 22.2, lmW: 124.7, ugr: 22.9 },
  // BBM (90CRI required) — direct only
  "50D--BBM":   { dLmFt: 492,  iLmFt: 0,    tLmFt: 492,  wFt: 4.6,  lmW: 108.1, ugr: 1.1  },
  "75D--BBM":   { dLmFt: 733,  iLmFt: 0,    tLmFt: 733,  wFt: 7.0,  lmW: 105.0, ugr: 2.4  },
  "100D--BBM":  { dLmFt: 972,  iLmFt: 0,    tLmFt: 972,  wFt: 9.5,  lmW: 102.0, ugr: 3.4  },
  "125D--BBM":  { dLmFt: 1229, iLmFt: 0,    tLmFt: 1229, wFt: 12.4, lmW: 99.3,  ugr: 4.2  },
  "50D-75U-BBM":  { dLmFt: 492,  iLmFt: 641,  tLmFt: 1133, wFt: 9.8,  lmW: 116.2, ugr: 0.0  },
  "75D-75U-BBM":  { dLmFt: 733,  iLmFt: 641,  tLmFt: 1374, wFt: 12.2, lmW: 112.9, ugr: 0.0  },
  "100D-75U-BBM": { dLmFt: 972,  iLmFt: 641,  tLmFt: 1613, wFt: 14.7, lmW: 109.6, ugr: 0.1  },
  "125D-75U-BBM": { dLmFt: 1230, iLmFt: 641,  tLmFt: 1871, wFt: 17.6, lmW: 106.4, ugr: 1.4  },
  "125D-150U-BBM": { dLmFt: 1230, iLmFt: 1250, tLmFt: 2480, wFt: 24.5, lmW: 101.1, ugr: 0.0 },
  // WBM (90CRI required)
  "50D--WBM":   { dLmFt: 534,  iLmFt: 0,    tLmFt: 534,  wFt: 4.6,  lmW: 117.3, ugr: 8.9  },
  "75D--WBM":   { dLmFt: 795,  iLmFt: 0,    tLmFt: 795,  wFt: 7.0,  lmW: 114.0, ugr: 10.3 },
  "100D--WBM":  { dLmFt: 1055, iLmFt: 0,    tLmFt: 1055, wFt: 9.5,  lmW: 110.7, ugr: 11.3 },
  "125D--WBM":  { dLmFt: 1334, iLmFt: 0,    tLmFt: 1334, wFt: 12.4, lmW: 107.8, ugr: 12.1 },
  "125D-150U-WBM": { dLmFt: 1335, iLmFt: 1250, tLmFt: 2584, wFt: 24.5, lmW: 105.4, ugr: 7.9 },
}

// Lumen adjustment multipliers by CCT/CRI (base = 80CRI 3500K = 1.000)
const OMNI_CCT_MULT: Record<string, number> = {
  "830": 0.999, "835": 1.000, "840": 1.029,
  "930": 0.843, "935": 0.884, "940": 0.924,
}

const OMNI_DIRECTIONS: Record<string, { label: string; hasIndirect: boolean; mount: string }> = {
  "DP":  { label: "Direct Only Pendant/Suspended", hasIndirect: false, mount: "suspended" },
  "DS":  { label: "Direct Only Surface",            hasIndirect: false, mount: "surface"   },
  "DIP": { label: "Direct/Indirect Pendant",        hasIndirect: true,  mount: "suspended" },
}

const OMNI_LENGTHS: Record<string, number> = {
  "4F0": 4, "6F0": 6, "8F0": 8, "12F0": 12,
}

const OMNI_DIRECT_PKG: Record<string, number> = {
  "50D": 500, "75D": 750, "100D": 1000, "125D": 1250,
}

const OMNI_INDIRECT_PKG: Record<string, number> = {
  "25U": 250, "50U": 500, "75U": 750, "100U": 1000, "125U": 1250, "150U": 1500,
}

const OMNI_DIRECT_OPTICS: Record<string, { label: string; cri?: string; ugr: string }> = {
  "FLL": { label: "Frosted Lens (Diffuse)",                       ugr: "standard"    },
  "CLB": { label: "Batwing Lens (wide distribution)",             ugr: "standard"    },
  "BBM": { label: "Black Discreet Baffle, Medium optic (80 deg)", cri: "90", ugr: "low" },
  "WBM": { label: "White Discreet Baffle, Medium optic (80 deg)", cri: "90", ugr: "low" },
}

const OMNI_INDIRECT_OPTICS: Record<string, string> = {
  "OOB": "Batwing indirect optic (open top, 110 deg peak)",
  "":    "None",
}

const OMNI_CCT: Record<string, { cri: number; cct: string }> = {
  "830": { cri: 80, cct: "3000K" },
  "835": { cri: 80, cct: "3500K" },
  "840": { cri: 80, cct: "4000K" },
  "930": { cri: 90, cct: "3000K" },
  "935": { cri: 90, cct: "3500K" },
  "940": { cri: 90, cct: "4000K" },
}

const OMNI_CIRCUITING: Record<string, string> = {
  "1": "Single circuit",
  "2": "Dual circuit — independent direct and indirect",
  "S": "Secondary circuit",
}

const OMNI_EMERGENCY: Record<string, string> = {
  "D": "None (standard)",
  "E": "Emergency circuit",
  "B": "6W integral emergency battery (90-min backup, ~600 lm)",
  "T": "UL924 bypass relay device",
}

const OMNI_VOLTAGE: Record<string, string> = {
  "U": "Universal 120–277V",
  "3": "347V",
}

const OMNI_CONTROLS: Record<string, string> = {
  "DD":  "Standard 0-10V dimming (1%–100%)",
  "SR":  "Sensor ready 0-10V (1%–100%)",
  "WPS": "WaveLinx PRO integrated sensor (occupancy + photocell)",
  "WLS": "WaveLinx LITE integrated sensor (occupancy + photocell)",
  "5LT": "Fifth Light DALI (1%–100%)",
  "LDE": "Lutron Hi-Lume EcoSystem (1%–100%)",
  "LWI": "Enlighted integrated sensor",
}

const OMNI_FINISH: Record<string, string> = {
  "W": "White", "S": "Silver", "B": "Black",
  "RR": "Real Red (RAL 3020)", "OO": "Oasis Orange (RAL 2004)",
  "YY": "Yippee Yellow (RAL 1018)", "GG": "Gracious Green (RAL 6018)",
  "CC": "Cyprus Cyan (RAL 6027)", "TT": "Totally Turquoise (RAL 5018)",
  "BB": "Biosphere Blue (RAL 5017)", "PP": "Perfect Purple (RAL 4005)",
  "VV": "Vacation Violet (RAL 4008)", "MM": "Magic Magenta (RAL 4010)",
  "C": "Custom RAL color (ETO)", "CM": "Custom match color (ETO)",
}

const OMNI_SUSPENSION: Record<string, string> = {
  "C04": "4ft aircraft cable", "C10": "10ft aircraft cable",
  "C20": "20ft aircraft cable", "C30": "30ft aircraft cable",
  "SMT": "Surface mount (ceiling)",
}

const OMNI_CEILING: Record<string, string> = {
  "T1": "15/16in flat T-grid", "T9": "9/16in flat T-grid",
  "TS": "9/16in dimensional T-grid (slotted/Interlude)",
  "JB": "J-Box / Structure",
}

export interface OmniDecodedCatalog {
  raw: string
  brand: string
  series: string
  isValid: boolean
  segments: CatalogSegment[]
  // Resolved fields
  baa: boolean
  diameter: string
  direction: string
  directionLabel: string
  hasIndirect: boolean
  mounting: string
  patternType: string
  lengthFt: number
  directPkgLmFt: number
  indirectPkgLmFt: number
  cri: number
  cct: string
  cctCode: string
  directOptic: string
  indirectOptic: string
  circuiting: string
  emergency: string
  voltage: string
  controls: string
  bodyFinish: string
  endPlateFinish: string
  suspensionType: string
  ceilingType: string
  hwColor: string
  // Calculated performance
  perfKey: string
  baseDLmFt: number
  baseILmFt: number
  baseTLmFt: number
  baseWFt: number
  baseLmW: number
  baseUgr: number
  cctMult: number
  adjDLmFt: number
  adjILmFt: number
  adjTLmFt: number
  totalFixtureLm: number
  totalFixtureW: number
  flags: string[]
  notes: string[]
}

export function decodeOmniCatalogNumber(raw: string): OmniDecodedCatalog {
  const flags: string[] = []
  const notes: string[] = []
  const segs: CatalogSegment[] = []

  // Tokenize on dash, but be careful: some codes contain no dashes between them
  // The Omni format groups some segments without dashes (e.g. "125D150US935")
  // We need to parse the raw string intelligently
  const parts = raw.trim().toUpperCase().split("-")
  let i = 0

  // --- BAA prefix ---
  let baa = false
  if (parts[i] === "BAA") { baa = true; i++ }

  // --- Series (OMN4) ---
  const seriesCode = parts[i] || ""; i++
  const isDiam4 = seriesCode === "OMN4"
  if (!isDiam4) flags.push("Unknown series: " + seriesCode + " (expected OMN4)")
  segs.push({ position: 1, code: seriesCode, field: "Series", meaning: "NeoRay Omni 4in diameter", value: "4in" })

  // --- Direction (DP / DS / DIP) ---
  const dirCode = parts[i] || ""; i++
  const dirInfo = OMNI_DIRECTIONS[dirCode] || null
  if (!dirInfo) flags.push("Unknown direction code: " + dirCode)
  segs.push({ position: 2, code: dirCode, field: "Direction", meaning: dirInfo?.label || dirCode, value: dirInfo?.mount || "" })

  // --- Pattern type (SR / PT) ---
  const patternCode = parts[i] || ""; i++
  const patternLabel = patternCode === "SR" ? "Straight Run" : patternCode === "PT" ? "Custom Pattern (ETO)" : patternCode
  segs.push({ position: 3, code: patternCode, field: "Pattern Type", meaning: patternLabel, value: patternCode })

  // --- Length (4F0 / 6F0 / 8F0 / 12F0) ---
  const lengthCode = parts[i] || ""; i++
  const lengthFt = OMNI_LENGTHS[lengthCode] || 0
  if (!lengthFt) flags.push("Unknown length code: " + lengthCode)
  segs.push({ position: 4, code: lengthCode, field: "Length", meaning: lengthFt + " ft", value: lengthFt })

  // --- Output + CRI/CCT block: e.g. "125D150US935" — parse as one combined token ---
  // This segment is NOT dash-separated internally
  const outputBlock = parts[i] || ""; i++

  // Parse directCode: starts with digits then D
  const dMatch = outputBlock.match(/^(\d+D)/)
  const directCode = dMatch ? dMatch[1] : ""
  let rest = outputBlock.slice(directCode.length)

  // Parse indirect code if present: digits then U
  const uMatch = rest.match(/^(\d+U)/)
  const indirectCode = uMatch ? uMatch[1] : ""
  rest = rest.slice(indirectCode.length)

  // Performance indicator: S = standard
  const perfCode = rest.startsWith("S") ? "S" : ""
  rest = rest.slice(perfCode.length)

  // CRI/CCT: 3 digits
  const cctCode = rest.slice(0, 3)
  const cctInfo = OMNI_CCT[cctCode] || null
  if (!cctInfo) flags.push("Unknown CRI/CCT code: " + cctCode)

  const directPkgLmFt  = OMNI_DIRECT_PKG[directCode]   || 0
  const indirectPkgLmFt = OMNI_INDIRECT_PKG[indirectCode] || 0

  segs.push({ position: 5, code: directCode,   field: "Direct Output",   meaning: directPkgLmFt + " lm/ft direct target",   value: directPkgLmFt })
  segs.push({ position: 6, code: indirectCode || "(none)", field: "Indirect Output", meaning: indirectCode ? indirectPkgLmFt + " lm/ft indirect target" : "None — downlight only", value: indirectPkgLmFt })
  segs.push({ position: 7, code: perfCode,      field: "Performance",    meaning: "Standard",                               value: "S" })
  segs.push({ position: 8, code: cctCode,       field: "CRI / CCT",      meaning: cctInfo ? cctInfo.cri + " CRI / " + cctInfo.cct : cctCode, value: cctInfo?.cct || "" })

  // --- Optics block: e.g. "BBMOOB" or "FLLFLL" or "FLLOOB" ---
  const opticsBlock = parts[i] || ""; i++

  // Known direct optic codes (3 chars each): FLL, CLB, BBM, WBM
  const knownDirectOptics = ["FLL", "CLB", "BBM", "WBM"]
  let directOpticCode = ""
  let indirectOpticCode = ""
  for (const op of knownDirectOptics) {
    if (opticsBlock.startsWith(op)) { directOpticCode = op; break }
  }
  const afterDirect = opticsBlock.slice(directOpticCode.length)
  // Indirect optic: OOB or blank
  if (afterDirect === "OOB") indirectOpticCode = "OOB"

  const directOpticInfo = OMNI_DIRECT_OPTICS[directOpticCode] || null
  if (!directOpticInfo) flags.push("Unknown direct optic: " + directOpticCode)
  if (directOpticInfo?.cri === "90" && cctInfo && cctInfo.cri < 90)
    flags.push("BBM/WBM baffle optic requires 90 CRI — but " + cctCode + " is 80 CRI")

  segs.push({ position: 9,  code: directOpticCode,   field: "Direct Optic",   meaning: directOpticInfo?.label || directOpticCode, value: directOpticCode })
  segs.push({ position: 10, code: indirectOpticCode || "(none)", field: "Indirect Optic", meaning: OMNI_INDIRECT_OPTICS[indirectOpticCode] || "None", value: indirectOpticCode })

  // --- Electrical block: e.g. "1DUDD" ---
  const elecBlock = parts[i] || ""; i++

  const circuitCode   = elecBlock[0] || "1"
  const emergencyCode = elecBlock[1] || "D"
  const voltageCode   = elecBlock[2] || "U"
  const controlsCode  = elecBlock.slice(3)  // DD / SR / WPS / WLS etc.

  const circuiting = OMNI_CIRCUITING[circuitCode]  || "Unknown: " + circuitCode
  const emergency  = OMNI_EMERGENCY[emergencyCode]  || "Unknown: " + emergencyCode
  const voltage    = OMNI_VOLTAGE[voltageCode]      || "Unknown: " + voltageCode
  const controls   = OMNI_CONTROLS[controlsCode]    || "Unknown: " + controlsCode

  if (voltageCode === "3" && controlsCode !== "DD")
    flags.push("347V requires Standard 0-10V (DD) driver only")
  if (emergencyCode === "B" && dirCode === "DIP" && controlsCode !== "DD")
    flags.push("Emergency battery in DIP (direct/indirect) 4ft requires DD controls only")
  if ((controlsCode === "WPS" || controlsCode === "WLS") && circuitCode !== "1")
    flags.push("Integrated sensors (WPS/WLS) require Single Circuit (1)")

  segs.push({ position: 11, code: circuitCode,   field: "Circuiting",   meaning: circuiting, value: circuitCode })
  segs.push({ position: 12, code: emergencyCode, field: "Emergency",    meaning: emergency,  value: emergencyCode })
  segs.push({ position: 13, code: voltageCode,   field: "Voltage",      meaning: voltage,    value: voltageCode })
  segs.push({ position: 14, code: controlsCode,  field: "Controls",     meaning: controls,   value: controlsCode })

  // --- Options block: Body, EndPlate, Suspension, Ceiling, HW Color ---
  // All remaining parts
  const remaining = parts.slice(i)

  // Body finish: first 1-2 char color code
  const bodyFinish = remaining[0] || ""
  const endPlateFinish = remaining[1] || ""
  const suspensionCode = remaining[2] || ""
  const ceilingCode = remaining[3] || ""
  const hwColorCode = remaining[4] || ""

  segs.push({ position: 15, code: bodyFinish,     field: "Body Finish",       meaning: OMNI_FINISH[bodyFinish]     || bodyFinish,     value: bodyFinish })
  segs.push({ position: 16, code: endPlateFinish,  field: "End Plate Finish",  meaning: OMNI_FINISH[endPlateFinish] || endPlateFinish,  value: endPlateFinish })
  segs.push({ position: 17, code: suspensionCode,  field: "Suspension Type",   meaning: OMNI_SUSPENSION[suspensionCode] || suspensionCode, value: suspensionCode })
  segs.push({ position: 18, code: ceilingCode,     field: "Ceiling Type",      meaning: OMNI_CEILING[ceilingCode]   || ceilingCode,    value: ceilingCode })
  segs.push({ position: 19, code: hwColorCode,     field: "Hardware Color",    meaning: hwColorCode === "W" ? "White" : hwColorCode === "B" ? "Black" : hwColorCode, value: hwColorCode })

  // --- Performance lookup ---
  const opticKey = directOpticCode || "FLL"
  const perfKey = directCode + "-" + indirectCode + "-" + opticKey
  const perfAlt = directCode + "--" + opticKey  // direct-only fallback
  const perf = OMNI_PERF[perfKey] || OMNI_PERF[perfAlt] || null

  const cctMult = OMNI_CCT_MULT[cctCode] || 1.0
  const baseDLmFt  = perf?.dLmFt || 0
  const baseILmFt  = perf?.iLmFt || 0
  const baseTLmFt  = perf?.tLmFt || 0
  const baseWFt    = perf?.wFt   || 0
  const baseLmW    = perf?.lmW   || 0
  const baseUgr    = perf?.ugr   || 0

  const adjDLmFt   = Math.round(baseDLmFt * cctMult)
  const adjILmFt   = Math.round(baseILmFt * cctMult)
  const adjTLmFt   = Math.round(baseTLmFt * cctMult)
  const totalFixtureLm = Math.round(adjTLmFt * lengthFt)
  const totalFixtureW  = Math.round(baseWFt * lengthFt * 10) / 10

  if (!perf) flags.push("Performance data not in table for: " + perfKey + " — verify on cooperlighting.com")
  if (perf && baseUgr < 19) notes.push("Meets LEED v4.1 glare control (UGR " + baseUgr + " < 19)")
  if (perf && baseUgr < 16) notes.push("Meets WELL v2 L04 Managing Glare (UGR " + baseUgr + " < 16)")
  if (baa) notes.push("BAA compliant — Buy American Act qualified")
  if (cctMult !== 1.0) notes.push("CCT/CRI adjustment: base lm/ft x " + cctMult + " (80CRI 3500K base)")
  if (dirInfo?.hasIndirect) notes.push("Direct/Indirect: " + Math.round(baseDLmFt / (baseTLmFt || 1) * 100) + "% down / " + Math.round(baseILmFt / (baseTLmFt || 1) * 100) + "% up")
  if (controlsCode === "WPS") notes.push("WaveLinx PRO: LLLC, photocell, occupancy + CCT control via scenes")
  if (controlsCode === "WLS") notes.push("WaveLinx LITE: LLLC, photocell, occupancy sensing")

  return {
    raw, brand: "Cooper / NeoRay", series: "Omni", isValid: flags.length === 0, segments: segs,
    baa, diameter: "4in circular", direction: dirCode, directionLabel: dirInfo?.label || dirCode,
    hasIndirect: dirInfo?.hasIndirect || false, mounting: dirInfo?.mount || "",
    patternType: patternLabel, lengthFt,
    directPkgLmFt, indirectPkgLmFt,
    cri: cctInfo?.cri || 80, cct: cctInfo?.cct || "", cctCode,
    directOptic: OMNI_DIRECT_OPTICS[directOpticCode]?.label || directOpticCode,
    indirectOptic: OMNI_INDIRECT_OPTICS[indirectOpticCode] || "None",
    circuiting, emergency, voltage, controls,
    bodyFinish: OMNI_FINISH[bodyFinish] || bodyFinish,
    endPlateFinish: OMNI_FINISH[endPlateFinish] || endPlateFinish,
    suspensionType: OMNI_SUSPENSION[suspensionCode] || suspensionCode,
    ceilingType: OMNI_CEILING[ceilingCode] || ceilingCode,
    hwColor: hwColorCode === "W" ? "White" : hwColorCode === "B" ? "Black" : hwColorCode,
    perfKey, baseDLmFt, baseILmFt, baseTLmFt, baseWFt, baseLmW, baseUgr,
    cctMult, adjDLmFt, adjILmFt, adjTLmFt, totalFixtureLm, totalFixtureW,
    flags, notes,
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedProducts: Product[] = [
  // ── COOPER / METALUX MMS ─────────────────────────────────────────────────
  {
    id: 'mms-2x4', brand: 'cooper', series: 'MMS', catalogNumber: '24MMS-L3C3-UNV',
    size: '2x4', fixtureType: 'LED Backlit Panel',
    lumens: { low: 3839, medium: 4963, high: 6598 },
    watts: { low: 25, medium: 33.5, high: 47 },
    efficacy: 148, cri: 90, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 5,
    mounting: ['surface','recessed','suspended','wall'],
    dlc: 'standard', ul: true, nsf: true, ic: true, ipRating: 'none', warranty: 5,
    emergency: '7W/10W/14W', ambientMax: 25,
    controls: ['WaveLinx PRO','WaveLinx LITE','0-10V'],
    occupancySensor: 'external',
    weight: 12.98,
    notes: ['Surface mount requires no kit','Integral driver','Sealed housing'],
    flags: [], advantages: ['90 CRI','5% dim','Surface no kit','Lightest driver']
  },
  {
    id: 'mms-2x2', brand: 'cooper', series: 'MMS', catalogNumber: '22MMS-L3C3-UNV',
    size: '2x2', fixtureType: 'LED Backlit Panel',
    lumens: { low: 2857, medium: 3772, high: 5267 },
    watts: { low: 19, medium: 25.8, high: 39 },
    efficacy: 146, cri: 90, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 5,
    mounting: ['surface','recessed','suspended','wall'],
    dlc: 'standard', ul: true, nsf: true, ic: true, ipRating: 'none', warranty: 5,
    emergency: '7W/10W/14W', ambientMax: 25,
    controls: ['WaveLinx PRO','WaveLinx LITE','0-10V'],
    occupancySensor: 'external', weight: 8.07,
    notes: [], flags: [], advantages: ['90 CRI','5% dim','Versatile mounting']
  },
  {
    id: 'mms-1x4', brand: 'cooper', series: 'MMS', catalogNumber: '14MMS-L3C3-UNV',
    size: '1x4', fixtureType: 'LED Backlit Panel',
    lumens: { low: 2793, medium: 3725, high: 5286 },
    watts: { low: 18, medium: 25.2, high: 38 },
    efficacy: 148, cri: 90, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 5,
    mounting: ['surface','recessed','suspended','wall'],
    dlc: 'standard', ul: true, nsf: true, ic: true, ipRating: 'none', warranty: 5,
    emergency: '7W/10W/14W', ambientMax: 25,
    controls: ['WaveLinx PRO','WaveLinx LITE','0-10V'],
    occupancySensor: 'external', weight: 7.78,
    notes: [], flags: [], advantages: ['90 CRI','5% dim','Highest efficacy 1x4']
  },
  {
    id: 'mms-1x1', brand: 'cooper', series: 'MMS', catalogNumber: '11MMS-L3C5-UNV',
    size: '1x1', fixtureType: 'LED Backlit Panel',
    lumens: { low: 1108, medium: 1659, high: 2177 },
    watts: { low: 9, medium: 14, high: 20 },
    efficacy: 119, cri: 90, cct: ['2700K','3000K','3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 5,
    mounting: ['surface','recessed'],
    dlc: 'none', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 5,
    emergency: 'none', ambientMax: 25,
    controls: ['WaveLinx LITE','0-10V'],
    occupancySensor: 'external', weight: 3.04,
    notes: ['No DLC — does not qualify for rebates','Emergency not compatible with 1x1'],
    flags: ['No DLC'], advantages: ['Cooper exclusive size','5-CCT selectable','Lightest 1x1']
  },
  {
    id: 'mms-1x2', brand: 'cooper', series: 'MMS', catalogNumber: '12MMS-L3C5-UNV',
    size: '1x2', fixtureType: 'LED Backlit Panel',
    lumens: { low: 1963, medium: 2561, high: 3156 },
    watts: { low: 17, medium: 24, high: 33 },
    efficacy: 107, cri: 90, cct: ['2700K','3000K','3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 5,
    mounting: ['surface','recessed','suspended'],
    dlc: 'none', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 5,
    emergency: 'none', ambientMax: 25,
    controls: ['WaveLinx LITE','0-10V'],
    occupancySensor: 'external', weight: 4.99,
    notes: ['No DLC'], flags: ['No DLC'], advantages: ['Cooper exclusive size','5-CCT']
  },

  // ── ACUITY / LITHONIA CPX ────────────────────────────────────────────────
  {
    id: 'cpx-2x4', brand: 'acuity', series: 'CPX', catalogNumber: 'CPX 2X4 ALO8 SWW7 M2',
    size: '2x4', fixtureType: 'LED Flat Panel',
    lumens: { low: 4033, medium: 5009, high: 6563 },
    watts: { low: 28.1, medium: 35.6, high: 48.5 },
    efficacy: 141, cri: 80, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (SMK kit)','suspended (PAC kit)'],
    dlc: 'standard', ul: true, nsf: true, ic: true, ipRating: 'IP5X', warranty: 5,
    emergency: '7W/10W/15W/20W', ambientMax: 25,
    controls: ['Sensor Switch WSX-D','SPOD','0-10V'],
    occupancySensor: 'external', weight: 17.05,
    notes: ['External driver','DLC Premium available on UVOLT HE version'],
    flags: ['80 CRI only','10% min dim','External driver','Heavy 17lbs'],
    advantages: ['IP5X rated','DLC Premium (HE)','Widest EM range','347V option (HE)']
  },
  {
    id: 'cpx-2x2', brand: 'acuity', series: 'CPX', catalogNumber: 'CPX 2X2 ALO7 SWW7 M4',
    size: '2x2', fixtureType: 'LED Flat Panel',
    lumens: { low: 2570, medium: 3649, high: 4564 },
    watts: { low: 18.5, medium: 27.5, high: 35.8 },
    efficacy: 133, cri: 80, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (SMK kit)'],
    dlc: 'standard', ul: true, nsf: true, ic: true, ipRating: 'IP5X', warranty: 5,
    emergency: '7W/10W/15W/20W', ambientMax: 25,
    controls: ['Sensor Switch WSX-D','SPOD','0-10V'],
    occupancySensor: 'external', weight: 9.45,
    notes: ['External driver'], flags: ['80 CRI only','10% min dim'],
    advantages: ['IP5X rated','NSF rated','DLC Premium (HE)']
  },
  {
    id: 'cpx-1x4', brand: 'acuity', series: 'CPX', catalogNumber: 'CPX 1X4 ALO7 SWW7 M4',
    size: '1x4', fixtureType: 'LED Flat Panel',
    lumens: { low: 2594, medium: 3583, high: 4280 },
    watts: { low: 19.7, medium: 27.2, high: 33.7 },
    efficacy: 132, cri: 80, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (SMK kit)'],
    dlc: 'standard', ul: true, nsf: false, ic: true, ipRating: 'IP5X', warranty: 5,
    emergency: '10W', ambientMax: 25,
    controls: ['Sensor Switch WSX-D','0-10V'],
    occupancySensor: 'external', weight: 8.11,
    notes: [], flags: ['80 CRI only','10% min dim'],
    advantages: ['IP5X rated']
  },

  // ── RAB T34 ───────────────────────────────────────────────────────────────
  {
    id: 'rab-2x4', brand: 'rab', series: 'T34 FA', catalogNumber: 'T34FA-2X4',
    size: '2x4', fixtureType: 'LED Flat Panel',
    lumens: { low: 3943, medium: 4989, high: 6027 },
    watts: { low: 28.4, medium: 36.6, high: 44.6 },
    efficacy: 136, cri: 84, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (kit)'],
    dlc: 'standard', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 5,
    emergency: 'available (/E)', ambientMax: 40,
    controls: ['Lightcloud Blue','Lightcloud Enterprise','0-10V'],
    occupancySensor: 'integral', weight: 10.0,
    notes: ['Tunable white 3000-6500K on LCB models'],
    flags: ['No NSF','EM wattage unspecified'],
    advantages: ['40°C ambient','Integral occupancy sensor','Tunable white option','DLC Premium (FAHE)','CCEA compliant']
  },
  {
    id: 'rab-2x2', brand: 'rab', series: 'T34 FA', catalogNumber: 'T34FA-2X2',
    size: '2x2', fixtureType: 'LED Flat Panel',
    lumens: { low: 2341, medium: 3411, high: 4100 },
    watts: { low: 17.5, medium: 25.6, high: 34.4 },
    efficacy: 133, cri: 84, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (kit)'],
    dlc: 'standard', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 5,
    emergency: 'available (/E)', ambientMax: 40,
    controls: ['Lightcloud Blue','0-10V'],
    occupancySensor: 'integral', weight: 5.4,
    notes: [],
    flags: ['No NSF'], advantages: ['40°C ambient','Lightest 2x2','Integral sensor']
  },
  {
    id: 'rab-1x4', brand: 'rab', series: 'T34 FA', catalogNumber: 'T34FA-1X4',
    size: '1x4', fixtureType: 'LED Flat Panel',
    lumens: { low: 2198, medium: 3223, high: 4089 },
    watts: { low: 17.2, medium: 25.4, high: 32.8 },
    efficacy: 127, cri: 84, cct: ['3500K','4000K','5000K'], cctSelectable: true, lumenSelectable: true,
    voltage: '120-277V', dimming: '0-10V', dimTo: 10,
    mounting: ['recessed','surface (kit)'],
    dlc: 'standard', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 5,
    emergency: 'available (/E)', ambientMax: 40,
    controls: ['Lightcloud Blue','0-10V'],
    occupancySensor: 'integral', weight: 5.6,
    notes: [], flags: ['No NSF'], advantages: ['40°C ambient','Lightest 1x4','Integral sensor']
  },

  // ── KEYSTONE KT-BPLED ─────────────────────────────────────────────────────
  {
    id: 'kt-2x2', brand: 'keystone', series: 'KT-BPLED', catalogNumber: 'KT-BPLED20-22-840-VDIM-P/G2',
    size: '2x2', fixtureType: 'LED Backlit Panel',
    lumens: { medium: 2500 },
    watts: { medium: 20 },
    efficacy: 125, cri: 80, cct: ['3500K','4000K','5000K'], cctSelectable: false, lumenSelectable: false,
    voltage: '120-277V', dimming: '0-10V', dimTo: 0,
    mounting: ['recessed','surface (kit)'],
    dlc: 'premium', ul: true, nsf: false, ic: true, ipRating: 'none', warranty: 10,
    emergency: '5W/12W (SmartSafe)', ambientMax: 40,
    controls: ['Smart Loop Bluetooth','0-10V'],
    occupancySensor: 'optional',
    weight: 6.20,
    notes: ['Fixed CCT — separate SKU per color','Fixed wattage — no lumen select','21.57in face — smaller than standard 24in tile','UGR <19 published','L70 >100k hrs LED chip','10-year warranty','480V step-down available'],
    flags: ['Fixed CCT','Fixed wattage','21.57in face gap warning','No NSF','Lower lumens vs field'],
    advantages: ['DLC Premium standard','10-year warranty','UGR <19','L70 >100k hrs','40°C ambient','480V option','Built-in J-box','Per-LED optics — no yellowing']
  },
]

const seedBrands: Brand[] = [
  { id: 'cooper', name: 'Cooper / Metalux', parent: 'Signify (Eaton)', color: '#1a56db', products: ['mms-2x4','mms-2x2','mms-1x4','mms-1x1','mms-1x2'] },
  { id: 'acuity', name: 'Acuity / Lithonia', parent: 'Acuity Brands', color: '#0e9f6e', products: ['cpx-2x4','cpx-2x2','cpx-1x4'] },
  { id: 'rab', name: 'RAB Lighting', parent: 'RAB Lighting Inc.', color: '#d03801', products: ['rab-2x4','rab-2x2','rab-1x4'] },
  { id: 'keystone', name: 'Keystone Technologies', parent: 'Keystone Technologies', color: '#7e3af2', products: ['kt-2x2'] },
]


// ─── Knowledge Store ──────────────────────────────────────────────────────────
// Every spec sheet, document, and product addition is indexed here.
// This store grows with usage and provides context to all AI calls.

export interface SpecSheetRecord {
  id: string
  addedAt: string           // ISO date
  fileName: string
  brand: string
  series: string
  fixtureType: string       // "LED Panel", "Linear", "Downlight", etc.
  rawExtractedText: string  // full text Claude extracted from the PDF
  catalogGrammar: CatalogGrammarRule[]
  fieldDefinitions: FieldDefinition[]
  productIds: string[]      // product IDs saved from this sheet
  notes: string
}

export interface CatalogGrammarRule {
  position: number
  fieldName: string
  codes: Record<string, string>  // code -> meaning
  format: string                 // e.g. "2-digit + letter", "alphanumeric"
  required: boolean
  notes: string
}

export interface FieldDefinition {
  field: string        // e.g. "Lumen Output", "CRI", "Voltage"
  unit: string         // e.g. "lm", "CRI value", "V"
  validValues: string  // e.g. "80 or 90", "3000K-5000K", "120-277V"
  notes: string
}

export interface LearningContext {
  totalDocuments: number
  totalProducts: number
  brands: string[]
  seriesList: string[]
  fixtureTypes: string[]
  catalogGrammars: Record<string, CatalogGrammarRule[]>  // series -> grammar
  recentlyAdded: string[]  // last 5 product IDs
  systemPromptContext: string  // pre-built context string for Claude API calls
}

class KnowledgeStore {
  private records: SpecSheetRecord[] = []

  // Add a complete spec sheet record after extraction + save
  addRecord(record: SpecSheetRecord): void {
    this.records = this.records.filter(r => r.id !== record.id)
    this.records.push(record)
  }

  // Get all records
  getAll(): SpecSheetRecord[] { return this.records }

  // Get records by brand
  getByBrand(brand: string): SpecSheetRecord[] {
    return this.records.filter(r => r.brand.toLowerCase() === brand.toLowerCase())
  }

  // Get records by series
  getBySeries(series: string): SpecSheetRecord[] {
    return this.records.filter(r => r.series.toLowerCase().includes(series.toLowerCase()))
  }

  // Get learned catalog grammar for a specific series
  getGrammar(series: string): CatalogGrammarRule[] {
    const rec = this.records.find(r => r.series.toLowerCase().includes(series.toLowerCase()))
    return rec?.catalogGrammar || []
  }

  // Build the full context string that gets prepended to every Claude API call
  // This is the core of the learning — AI calls become smarter with each doc added
  buildSystemContext(): string {
    if (this.records.length === 0) return ""

    const brands = [...new Set(this.records.map(r => r.brand).filter(Boolean))]
    const series = [...new Set(this.records.map(r => r.series).filter(Boolean))]
    const types  = [...new Set(this.records.map(r => r.fixtureType).filter(Boolean))]

    const grammarSummaries = this.records
      .filter(r => r.catalogGrammar.length > 0)
      .map(r => {
        const rules = r.catalogGrammar
          .map(g => "  Position " + g.position + " (" + g.fieldName + "): " + Object.entries(g.codes).slice(0, 4).map(([k,v]) => k + "=" + v).join(", "))
          .join("\n")
        return r.brand + " " + r.series + " catalog grammar:\n" + rules
      })
      .join("\n\n")

    const fieldSummaries = this.records
      .filter(r => r.fieldDefinitions.length > 0)
      .flatMap(r => r.fieldDefinitions)
      .map(f => "  " + f.field + " [" + f.unit + "]: " + f.validValues)
      .join("\n")

    let ctx = "=== KNOWLEDGE BASE CONTEXT ===\n"
    ctx += "Indexed brands: " + brands.join(", ") + "\n"
    ctx += "Indexed series: " + series.join(", ") + "\n"
    ctx += "Fixture types: " + types.join(", ") + "\n"
    ctx += "Total spec sheets indexed: " + this.records.length + "\n\n"

    if (grammarSummaries) {
      ctx += "CATALOG NUMBER GRAMMARS LEARNED FROM SPEC SHEETS:\n" + grammarSummaries + "\n\n"
    }

    if (fieldSummaries) {
      ctx += "FIELD DEFINITIONS LEARNED:\n" + fieldSummaries + "\n\n"
    }

    ctx += "Use the above context when:\n"
    ctx += "- Parsing new catalog numbers from the same brands/series\n"
    ctx += "- Extracting fields from spec sheets of similar products\n"
    ctx += "- Matching competitor products to Cooper equivalents\n"
    ctx += "=== END KNOWLEDGE BASE CONTEXT ===\n"

    return ctx
  }

    // Get stats for display
  getStats() {
    return {
      totalDocuments: this.records.length,
      totalBrands: new Set(this.records.map(r => r.brand)).size,
      totalSeries: new Set(this.records.map(r => r.series)).size,
      recentDocs: this.records.slice(-5).reverse().map(r => ({
        id: r.id,
        fileName: r.fileName,
        brand: r.brand,
        series: r.series,
        addedAt: r.addedAt,
        productCount: r.productIds.length
      }))
    }
  }

  // Clear all learned data (reset)
  clear(): void { this.records = [] }
}

// Singleton exported for use across the app
export const knowledgeStore = new KnowledgeStore()


// ─── Database Class ───────────────────────────────────────────────────────────



class Database {
  private brands: Brand[]
  private products: Product[]

  constructor() {
    this.brands = seedBrands
    this.products = seedProducts
  }

  private save(): void { /* in-memory only — no persistence in this environment */ }

  getBrands(): Brand[] { return this.brands }
  getBrand(id: string): Brand | undefined { return this.brands.find(b => b.id === id) }
  getAllProducts(): Product[] { return this.products }
  getProduct(id: string): Product | undefined { return this.products.find(p => p.id === id) }
  getCooperProducts(): Product[] { return this.products.filter(p => p.brand === 'cooper') }
  getProductsByBrand(brandId: string): Product[] { return this.products.filter(p => p.brand === brandId) }
  getProductsBySize(size: string): Product[] { return this.products.filter(p => p.size === size) }

  addProduct(product: Product): void {
    this.products = this.products.filter(p => p.id !== product.id)
    this.products.push(product)
    const brand = this.brands.find(b => b.id === product.brand)
    if (brand && !brand.products.includes(product.id)) brand.products.push(product.id)
    this.save()
  }

  addBrand(brand: Brand): void {
    this.brands = this.brands.filter(b => b.id !== brand.id)
    this.brands.push(brand)
    this.save()
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    this.products = this.products.map(p => p.id === id ? { ...p, ...updates } : p)
    this.save()
  }

  resetToSeed(): void {
    this.brands = seedBrands
    this.products = seedProducts
    this.save()
  }

  // ── Match Engine ──────────────────────────────────────────────────────────
  findCooperMatch(source: Partial<Product>): MatchResult[] {
    const coopers = this.getCooperProducts()
    return coopers.map(cp => {
      let score = 100
      const flags: string[] = []
      const advantages: string[] = []
      const notes: string[] = []

      // Size match — hard filter
      if (source.size && cp.size !== source.size) score -= 60

      // Lumens within 15%
      if (source.lumens?.medium && cp.lumens.medium) {
        const diff = Math.abs(cp.lumens.medium - source.lumens.medium) / source.lumens.medium
        if (diff > 0.15) { score -= 20; flags.push(`Lumen diff ${Math.round(diff*100)}%`) }
        if (cp.lumens.medium > source.lumens.medium) advantages.push('Higher lumen output')
      }

      // CRI
      if (source.cri && cp.cri >= 90 && source.cri < 90) advantages.push('90 CRI upgrade')
      if (source.cri && source.cri >= 90 && cp.cri < 90) { score -= 15; flags.push('CRI downgrade') }

      // CCT coverage
      if (source.cct && source.cct.length > 0) {
        const missing = source.cct.filter(c => !cp.cct.includes(c))
        if (missing.length > 0) { score -= 10; flags.push(`Missing CCT: ${missing.join(', ')}`) }
      }

      // DLC
      if (source.dlc === 'premium' && cp.dlc === 'standard') { score -= 5; flags.push('DLC Standard only (vs Premium)') }
      if (source.dlc === 'none' && cp.dlc === 'standard') advantages.push('DLC Standard — rebate eligible')

      // NSF
      if (source.nsf && !cp.nsf) { score -= 20; flags.push('NSF required — Cooper qualifies') }
      if (!source.nsf && cp.nsf) advantages.push('NSF rated bonus')

      // Dimming
      if (source.dimTo && source.dimTo > cp.dimTo) advantages.push(`Better dim: ${cp.dimTo}% vs ${source.dimTo}%`)

      // Warranty
      if (source.warranty && cp.warranty > source.warranty) advantages.push(`${cp.warranty}yr warranty`)

      // Mounting advantage
      if (!source.mounting?.includes('surface') && cp.mounting.includes('surface')) {
        advantages.push('Surface mount — no kit needed')
      }

      notes.push(`Cooper ${cp.series} ${cp.size} — ${cp.catalogNumber}`)
      if (cp.cri >= 90) notes.push('90 CRI standard — superior color rendering')
      if (cp.dimTo === 5) notes.push('Dims to 5% — best-in-class dimming')

      return { cooperProduct: cp, score: Math.max(0, score), flags, advantages, notes }
    }).filter(r => r.score > 20).sort((a, b) => b.score - a.score)
  }

  getStats() {
    const products = this.getAllProducts()
    const byBrand: Record<string, number> = {}
    const bySize: Record<string, number> = {}
    products.forEach(p => {
      byBrand[p.brand] = (byBrand[p.brand] || 0) + 1
      bySize[p.size] = (bySize[p.size] || 0) + 1
    })
    return { total: products.length, byBrand, bySize, brands: this.brands.length }
  }
}

export const db = new Database()
