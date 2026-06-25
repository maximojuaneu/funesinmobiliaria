import type {
  TokkoProperty,
  TokkoListResponse,
  TokkoDevelopment,
  TokkoPhoto,
  TokkoAgent,
  PropertyFilters,
} from '@/types/tokko'
import { OPERATION_ID } from '@/types/tokko'

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

// ── In-memory cache for the full property list (the most-called endpoint) ──
// TTL: 5 minutes. Shared across requests in the same Node.js process.
const PROPERTY_CACHE_TTL = 5 * 60 * 1000
let propertyCacheData: TokkoProperty[] | null = null
let propertyCacheTs   = 0

// Fetch all properties with optional server-side limit
async function fetchAllProperties(limit = 200): Promise<TokkoProperty[]> {
  if (propertyCacheData && Date.now() - propertyCacheTs < PROPERTY_CACHE_TTL) {
    return propertyCacheData
  }
  const data = await tokkoFetch<TokkoListResponse<TokkoProperty>>('/property/', { limit })
  propertyCacheData = data.objects
  propertyCacheTs   = Date.now()
  return data.objects
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

  // Filter by location/barrio (accent-insensitive)
  if (filters.location) {
    const loc = normalize(filters.location)
    filtered = filtered.filter(p =>
      normalize(p.address ?? '').includes(loc) ||
      normalize(p.location?.name ?? '').includes(loc) ||
      normalize(p.location?.full_location ?? '').includes(loc)
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

export async function getPropertyById(id: number | string): Promise<TokkoProperty> {
  const p = await tokkoFetch<TokkoProperty>(`/property/${id}/`, { lang: 'es_ar' })
  // Normalize operation_type: lang=es_ar returns "Venta"/"Alquiler" instead of "Sale"/"Rent"
  p.operations = p.operations?.map(op => ({
    ...op,
    operation_type: (op.operation_type as string) === 'Venta' ? 'Sale' as const
      : (op.operation_type as string) === 'Alquiler' ? 'Rent' as const
      : op.operation_type,
  }))
  // Normalize type.name: lang=es_ar returns Spanish names instead of English keys
  if (p.type?.name && TYPE_NAME_ES_TO_EN[p.type.name]) {
    p.type = { ...p.type, name: TYPE_NAME_ES_TO_EN[p.type.name] }
  }
  return p
}

export async function getFeaturedProperties(): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  return all.filter(p => p.is_starred_on_web)
}

let devCacheData: TokkoListResponse<TokkoDevelopment> | null = null
let devCacheTs = 0

export async function getDevelopments(): Promise<TokkoListResponse<TokkoDevelopment>> {
  if (devCacheData && Date.now() - devCacheTs < PROPERTY_CACHE_TTL) return devCacheData
  const data = await tokkoFetch<TokkoListResponse<TokkoDevelopment>>('/development/', { limit: 50, lang: 'es_AR' })
  devCacheData = data
  devCacheTs   = Date.now()
  return data
}

export async function getDevelopmentById(id: number | string): Promise<TokkoDevelopment> {
  return tokkoFetch<TokkoDevelopment>(`/development/${id}/`, { lang: 'es_AR' })
}

export async function getPropertiesByDevelopment(devId: number | string): Promise<TokkoProperty[]> {
  const all = await fetchAllProperties(200)
  return all.filter(p => p.development?.id === Number(devId))
}

// Get the price for a given operation type
export function getOperationPrice(property: TokkoProperty, type?: 'Sale' | 'Rent' | 'Temporary Rent') {
  const op = type
    ? property.operations.find(o => o.operation_type === type)
    : property.operations[0]
  if (!op) return null
  const price = op.prices[0]
  if (!price) return null
  return { amount: price.price, currency: price.currency }
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
export function getOperationLabel(type: 'Sale' | 'Rent' | 'Temporary Rent'): string {
  if (type === 'Sale') return 'VENTA'
  if (type === 'Temporary Rent') return 'ALQUILER TEMP.'
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

export interface ClosedOperation {
  id: number
  address: string
  lat: number
  lng: number
  date: string           // created_at de la propiedad (fecha de publicación original)
  type: string           // tipo de propiedad
  price: number          // precio de publicación
  currency: string       // USD | ARS
  agentName: string      // productor asignado
  photoUrl: string       // foto de portada
  status: 'RESERVADA' | 'NO DISPONIBLE'
  operationType: 'Sale' | 'Rent' | 'TempRent' | 'unknown'
}

export async function getClosedOperations(): Promise<ClosedOperation[]> {
  const SINCE = '2025-01-01'

  // Fetch status=2 (RESERVADA) and status=3 (NO DISPONIBLE) in parallel
  const [res2, res3] = await Promise.allSettled([
    tokkoFetch<TokkoListResponse<TokkoProperty>>('/property/', { limit: 200, status: 2 }),
    tokkoFetch<TokkoListResponse<TokkoProperty>>('/property/', { limit: 200, status: 3 }),
  ])

  const reserved     = res2.status === 'fulfilled' ? (res2.value.objects ?? []) : []
  const notAvailable = res3.status === 'fulfilled' ? (res3.value.objects ?? []) : []

  const all: Array<[TokkoProperty, 'RESERVADA' | 'NO DISPONIBLE']> = [
    ...reserved.map(p => [p, 'RESERVADA'] as [TokkoProperty, 'RESERVADA']),
    ...notAvailable.map(p => [p, 'NO DISPONIBLE'] as [TokkoProperty, 'NO DISPONIBLE']),
  ]

  const results: ClosedOperation[] = []

  for (const [p, status] of all) {
    // Must have coordinates
    if (!p.geo_lat || !p.geo_long) continue
    const lat = parseFloat(p.geo_lat)
    const lng = parseFloat(p.geo_long)
    if (isNaN(lat) || isNaN(lng)) continue

    // Date filter: use created_at if available, otherwise include it
    const dateStr = p.created_at ?? p.deleted_at ?? ''
    if (dateStr && dateStr < SINCE) continue

    const op = p.operations?.[0]
    const priceObj = op?.prices?.[0]

    // Determine operation type
    const rawOpType = op?.operation_type as string | undefined
    let operationType: ClosedOperation['operationType'] = 'unknown'
    if (rawOpType === 'Sale'    || rawOpType === 'Venta')              operationType = 'Sale'
    else if (rawOpType === 'Rent'    || rawOpType === 'Alquiler')      operationType = 'Rent'
    else if (rawOpType === 'TempRent'|| rawOpType === 'Alquiler Temp') operationType = 'TempRent'
    else if (op?.operation_id === 1)  operationType = 'Sale'
    else if (op?.operation_id === 2)  operationType = 'Rent'
    else if (op?.operation_id === 3)  operationType = 'TempRent'

    results.push({
      id:            p.id,
      address:       p.fake_address || p.address || 'Sin dirección',
      lat,
      lng,
      date:          dateStr.slice(0, 10),  // YYYY-MM-DD
      type:          p.type?.name ?? '—',
      price:         priceObj?.price ?? 0,
      currency:      priceObj?.currency ?? 'USD',
      agentName:     p.producer?.name ?? '—',
      photoUrl:      getMainPhoto(p),
      status,
      operationType,
    })
  }

  // Sort newest first
  return results.sort((a, b) => b.date.localeCompare(a.date))
}

export interface ContactStats {
  total: number
  byOrigin: Record<string, number>   // e.g. { Zonaprop: 18, Argenprop: 32 }
  byOperation: Record<string, number> // e.g. { Venta: 30, Alquiler: 28 }
}

// Fetch all contacts for a date range and aggregate by portal origin + operation type
// agentId: if provided, filter to only that agent's contacts
export async function getContactStats(
  startDate: string,    // YYYY-MM-DD
  endDate:   string,    // YYYY-MM-DD
  agentId?:  number,
): Promise<ContactStats> {
  const byOrigin: Record<string, number>    = {}
  const byOperation: Record<string, number> = {}
  let total = 0
  let offset = 0

  while (true) {
    const params: Record<string, string | number> = {
      limit:           50,   // Tokko hard-caps at 50; requesting more is silently ignored
      offset,
      ordering:        '-id',
      created_at__gte: startDate,
      created_at__lte: `${endDate}T23:59:59`,
    }
    if (agentId) params.agent = agentId

    const data = await tokkoFetch<{ meta: { total_count: number }; objects: any[] }>(
      '/contact/', params
    )

    for (const c of data.objects) {
      total++
      let origin: string | null = null
      for (const t of c.tags ?? []) {
        if (t.group_name === 'Origen de contacto') {
          origin = t.name as string
        } else if (t.name === 'Venta' || t.name === 'Alquiler' || t.name === 'Alquiler Temporal') {
          byOperation[t.name] = (byOperation[t.name] ?? 0) + 1
        }
      }
      byOrigin[origin ?? 'Sin origen'] = (byOrigin[origin ?? 'Sin origen'] ?? 0) + 1
    }

    // Advance by actual page size to handle the API's real cap correctly
    const fetched = data.objects.length
    if (fetched === 0 || offset + fetched >= data.meta.total_count) break
    offset += fetched
  }

  return { total, byOrigin, byOperation }
}
