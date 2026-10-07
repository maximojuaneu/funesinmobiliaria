import type {
  TokkoProperty,
  TokkoListResponse,
  TokkoDevelopment,
  TokkoPhoto,
  TokkoAgent,
  PropertyFilters,
} from '@/types/tokko'
import { OPERATION_ID } from '@/types/tokko'
import { usarCopia, leerPropiedadesCopia, leerPropiedadCopia, leerEmprendimientosCopia, leerEmprendimientoCopia } from '@/lib/copia-tokko'

// Normalize string: lowercase + remove accents (á→a, é→e, etc.)
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

async function tokkoFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const BASE_URL = (process.env.TOKKO_BASE_URL ?? 'https://www.tokkobroker.com/api/v1').trim()
  const API_KEY  = (process.env.TOKKO_API_KEY ?? '').trim()
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('key', API_KEY)
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }
  // cache:'no-store' + fetchCache='force-no-store' in pages prevents Next.js from
  // writing to its data cache (which errors on responses > 2MB)
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Tokko API error: ${res.status} on ${path}`)
  return res.json()
}

// Follows Tokko's offset pagination until every object is fetched, so a catalog
// larger than one page is never silently truncated.
async function tokkoFetchAll<T extends { id: number }>(
  path: string,
  params: Record<string, string | number> = {},
  pageSize = 200,
): Promise<T[]> {
  const MAX_PAGES = 25
  const byId = new Map<number, T>()
  let offset = 0
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await tokkoFetch<TokkoListResponse<T>>(path, { ...params, limit: pageSize, offset })
    const objects = data.objects ?? []
    for (const o of objects) byId.set(o.id, o)
    offset += objects.length
    if (objects.length === 0 || offset >= data.meta.total_count) break
  }
  return Array.from(byId.values())
}

// ── In-memory cache for the full property list (the most-called endpoint) ──
// TTL: 5 minutes. Shared across requests in the same Node.js process.
const PROPERTY_CACHE_TTL = 5 * 60 * 1000
let propertyCacheData: TokkoProperty[] | null = null
let propertyCacheTs   = 0

// Fetch every property, paginating past Tokko's per-page limit
async function fetchAllProperties(pageSize = 200): Promise<TokkoProperty[]> {
  if (propertyCacheData && Date.now() - propertyCacheTs < PROPERTY_CACHE_TTL) {
    return propertyCacheData
  }
  // Con PROPIEDADES_FUENTE=copia se lee la copia del CRM; si no está al día, se consulta Tokko como siempre.
  const objects = (usarCopia() ? await leerPropiedadesCopia() : null)
    ?? await tokkoFetchAll<TokkoProperty>('/property/', {}, pageSize)
  propertyCacheData = objects
  propertyCacheTs   = Date.now()
  return objects
}

export async function getProperties(filters: PropertyFilters = {}): Promise<{ objects: TokkoProperty[]; count: number }> {
  const all = await fetchAllProperties(200)

  let filtered = all

  // Filter by operation type — use operation_id for reliability (1=Sale, 2=Rent, 3=Temporary Rent)
  if (filters.operation) {
    const targetId = OPERATION_ID[filters.operation]
    filtered = filtered.filter(p =>
      p.operations.some(op => op.operation_id === targetId)
    )
  }

  // Filter by property type (partial match, accent-insensitive)
  if (filters.type) {
    const t = normalize(filters.type)
    filtered = filtered.filter(p => normalize(p.type?.name ?? '').includes(t))
  }

  // Filter by location/barrio (accent-insensitive, supports comma-separated OR)
  if (filters.location) {
    const locs = filters.location.split(',').map(l => normalize(l.trim())).filter(Boolean)
    filtered = filtered.filter(p =>
      locs.some(loc =>
        normalize(p.address ?? '').includes(loc) ||
        normalize(p.location?.name ?? '').includes(loc) ||
        normalize(p.location?.full_location ?? '').includes(loc)
      )
    )
  }

  // Filter by price
  if (filters.priceFrom || filters.priceTo) {
    filtered = filtered.filter(p => {
      const op = filters.operation
        ? p.operations.find(o => o.operation_type === filters.operation)
        : p.operations[0]
      const price = op?.prices?.find(pr => !filters.currency || pr.currency === filters.currency)?.price
      if (!price) return false
      if (filters.priceFrom && price < filters.priceFrom) return false
      if (filters.priceTo   && price > filters.priceTo)   return false
      return true
    })
  }

  // Filter by suites (0 = mono: 0 dorm + ≤1 ambiente, 4 = 4+)
  // Accepts an array so multiple values can be selected simultaneously.
  if (filters.suites && filters.suites.length > 0) {
    const selected = filters.suites
    filtered = filtered.filter(p => {
      return selected.some(s => {
        if (s === 4) return p.suite_amount >= 4
        if (s === 0) {
          const type = p.type?.name
          const isCasaOrDepto = type === 'House' || type === 'Apartment'
          return isCasaOrDepto && p.suite_amount === 0 && (!p.room_amount || p.room_amount <= 1)
        }
        return p.suite_amount === s
      })
    })
  }

  // Filter by surface
  if (filters.surfaceFrom) filtered = filtered.filter(p => p.total_surface >= filters.surfaceFrom!)
  if (filters.surfaceTo)   filtered = filtered.filter(p => p.total_surface <= filters.surfaceTo!)

  // Sort: 1) featured first  2) newest created_at first
  filtered.sort((a, b) => {
    if (a.is_starred_on_web && !b.is_starred_on_web) return -1
    if (!a.is_starred_on_web && b.is_starred_on_web) return 1
    const dateA = new Date(a.created_at ?? 0).getTime()
    const dateB = new Date(b.created_at ?? 0).getTime()
    return dateB - dateA
  })

  return { objects: filtered, count: filtered.length }
}

// Maps Spanish type names (returned by lang=es_ar) back to the English keys
// the rest of the codebase expects.
const TYPE_NAME_ES_TO_EN: Record<string, string> = {
  'Departamento':    'Apartment',
  'Casa':            'House',
  'Terreno':         'Land',
  'Local Comercial': 'Bussiness Premises',
  'Local comercial': 'Bussiness Premises',
  'Oficina':         'Office',
  'Campo':           'Countryside',
  'Depósito':        'Warehouse',
  'Deposito':        'Warehouse',
}

function normalizeProperty(p: TokkoProperty): TokkoProperty {
  p.operations = p.operations?.map(op => ({
    ...op,
    operation_type: (op.operation_type as string) === 'Venta' ? 'Sale' as const
      : (op.operation_type as string) === 'Alquiler' ? 'Rent' as const
      : op.operation_type,
  }))
  if (p.type?.name && TYPE_NAME_ES_TO_EN[p.type.name]) {
    p.type = { ...p.type, name: TYPE_NAME_ES_TO_EN[p.type.name] }
  }
  return p
}

export async function getPropertyById(id: number | string): Promise<TokkoProperty> {
  // 1. Try direct lookup (available properties)
  const direct = await tokkoFetch<any>(`/property/${id}/`, { lang: 'es_ar' }).catch(() => null)
  if (direct?.id) return normalizeProperty(direct as TokkoProperty)

  // 2. Si Tokko no responde (o no la entrega), una propiedad activa se toma de la copia (si está activada)
  if (usarCopia()) {
    const copia = await leerPropiedadCopia(id)
    if (copia?.id) return normalizeProperty(copia)
  }

  // 3. Try direct lookup with status=2 (reserved) — works on some Tokko versions
  const directReserved = await tokkoFetch<any>(`/property/${id}/`, { lang: 'es_ar', status: 2 }).catch(() => null)
  if (directReserved?.id) return normalizeProperty(directReserved as TokkoProperty)

  // 4. Last resort: search in the reserved properties list
  const reservedList = await tokkoFetchAll<TokkoProperty>('/property/', { status: 2 })
    .catch(() => [] as TokkoProperty[])
  const found = reservedList.find(p => String(p.id) === String(id))
  if (found) return normalizeProperty(found)

  throw new Error(`Property ${id} not found`)
}

export async function getFeaturedProperties(): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  return all.filter(p => p.is_starred_on_web)
}

let devCacheData: TokkoListResponse<TokkoDevelopment> | null = null
let devCacheTs = 0

export async function getDevelopments(): Promise<TokkoListResponse<TokkoDevelopment>> {
  if (devCacheData && Date.now() - devCacheTs < PROPERTY_CACHE_TTL) return devCacheData
  const data = (usarCopia() ? await leerEmprendimientosCopia() : null)
    ?? await tokkoFetch<TokkoListResponse<TokkoDevelopment>>('/development/', { limit: 50, lang: 'es_AR' })
  devCacheData = data
  devCacheTs   = Date.now()
  return data
}

export async function getDevelopmentById(id: number | string): Promise<TokkoDevelopment> {
  if (usarCopia()) {
    const copia = await leerEmprendimientoCopia(id)
    if (copia) return copia
  }
  return tokkoFetch<TokkoDevelopment>(`/development/${id}/`, { lang: 'es_AR' })
}

export async function getPropertiesByDevelopment(devId: number | string): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  return all.filter(p => p.development?.id === Number(devId))
}

// Formats a number as Argentine-style thousands-separated integer (no locale dependency)
export function formatAmount(n: number | string): string {
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const MONTH_ES: Record<string, string> = {
  January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril',
  May: 'Mayo', June: 'Junio', July: 'Julio', August: 'Agosto',
  September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre',
}
export function translateMonth(period?: string): string | undefined {
  if (!period) return undefined
  return MONTH_ES[period] ?? period
}

// Get the price for a given operation type
export function getOperationPrice(property: TokkoProperty, type?: 'Sale' | 'Rent' | 'Temporary Rent') {
  const op = type
    ? property.operations.find(o => o.operation_type.toLowerCase() === type.toLowerCase())
    : property.operations[0]
  if (!op) return null
  const price = op.prices[0]
  if (!price) return null
  return { amount: Number(price.price), currency: price.currency, period: price.period || undefined }
}

// Get main photo URL
export function getMainPhoto(property: TokkoProperty): string {
  const photos = property.photos ?? []
  const main = photos.find(p => p.is_front_cover) ?? photos.find(p => !p.is_blueprint) ?? photos[0]
  return main?.image ?? '/placeholder.jpg'
}

// Get development cover photo (respects Tokko's is_front_cover flag)
export function getDevelopmentCover(photos: TokkoPhoto[]): string {
  const main = photos?.find(p => p.is_front_cover) ?? photos?.find(p => !p.is_blueprint) ?? photos?.[0]
  return main?.image ?? ''
}

// Human-readable operation label
export function getOperationLabel(type: string): string {
  if (type === 'Sale') return 'VENTA'
  if (type.toLowerCase() === 'temporary rent') return 'ALQUILER TEMP.'
  return 'ALQUILER'
}

const DEFAULT_TOKKO_AVATAR = 'https://static.tokkobroker.com/static/img/user.png'

export function hasCustomAvatar(picture: string | undefined): boolean {
  return !!picture && picture !== DEFAULT_TOKKO_AVATAR
}

export async function getPropertiesByAgentId(tokkoId: number): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  return all.filter(p => p.producer?.id === tokkoId)
}

export async function getPropertiesByAgentName(name: string): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  const target = normalize(name)
  return all.filter(p =>
    p.producer?.name && normalize(p.producer.name) === target
  )
}

export async function getAllActiveProperties(): Promise<TokkoProperty[]> {
  return fetchAllProperties(200)
}

export interface LocationSuggestion {
  name:        string
  type:        'ciudad' | 'barrio'
  city?:       string
  provincia:   string
  searchValue: string
}

export async function getLocations(): Promise<LocationSuggestion[]> {
  const all = await fetchAllProperties(200)
  const cities   = new Map<string, LocationSuggestion>()
  const barrios  = new Map<string, LocationSuggestion>()

  for (const p of all) {
    const fl = p.location?.full_location
    if (!fl) continue
    const parts = fl.split(' | ').map(s => s.trim()).filter(Boolean)
    // Format: Argentina | Provincia | Ciudad [| Barrio [| Sub]]
    if (parts.length < 3) continue
    const provincia = parts[1]
    const ciudad    = parts[2]

    if (!cities.has(ciudad)) {
      cities.set(ciudad, { name: ciudad, type: 'ciudad', provincia, searchValue: ciudad })
    }
    if (parts.length >= 4) {
      const barrio = parts[parts.length - 1]
      const key    = `${ciudad}|${barrio}`
      if (!barrios.has(key)) {
        barrios.set(key, { name: barrio, type: 'barrio', city: ciudad, provincia, searchValue: barrio })
      }
    }
  }

  return [
    ...Array.from(cities.values()).sort((a, b) => a.name.localeCompare(b.name)),
    ...Array.from(barrios.values()).sort((a, b) => a.name.localeCompare(b.name)),
  ]
}

export async function getAgents(): Promise<TokkoAgent[]> {
  const all = await fetchAllProperties(200)
  const seen = new Map<number, TokkoAgent>()
  for (const p of all) {
    const prod = p.producer
    if (prod?.id && !seen.has(prod.id)) {
      seen.set(prod.id, prod)
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getAgentById(id: number): Promise<TokkoAgent | null> {
  try {
    return await tokkoFetch<TokkoAgent>(`/user/${id}/`)
  } catch {
    return null
  }
}
