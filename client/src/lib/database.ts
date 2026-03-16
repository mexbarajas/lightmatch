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
