export interface TokkoPhoto {
  image: string
  original: string
  thumb: string
  is_blueprint: boolean
  is_front_cover: boolean
  order: number
}

export interface TokkoPrice {
  price: number
  currency: string
  period: number
}

export interface TokkoOperation {
  operation_id: number        // 1=Sale, 2=Rent, 3=Temporary Rent
  operation_type: 'Sale' | 'Rent' | 'Temporary Rent'
  prices: TokkoPrice[]
}

export interface TokkoLocation {
  id: number
  name: string
  full_location: string
  state?: { name: string }
}

export interface TokkoAgent {
  id: number
  name: string
  email: string
  phone: string
  cellphone?: string
  picture?: string
  position?: string
}

export interface TokkoProperty {
  development?: { id: number; name: string }
  id: number
  publication_title: string
  address: string
  fake_address?: string
  real_address?: string
  description: string
  rich_description?: string
  type: { id: number; name: string; code: string }
  operations: TokkoOperation[]
  location?: TokkoLocation
  suite_amount: number
  bathroom_amount: number
  toilet_amount?: number
  parking_lot_amount: number
  surface: number           // terreno
  total_surface: number     // total
  roofed_surface: number    // cubierto
  semiroofed_surface: number // semicubierto
  unroofed_surface: number  // descubierto
  front_measure?: number    // metros frente (terrenos)
  depth_measure?: number    // metros fondo (terrenos)
  room_amount?: number      // ambientes (departamentos)
  photos: TokkoPhoto[]
  videos?: { player_url: string }[]
  geo_lat: string
  geo_long: string
  is_starred_on_web: boolean
  status: number
  created_at?: string
  deleted_at?: string
  producer: TokkoAgent
  age?: number
  expenses?: number
  tags?: { id: number; name: string; type: number }[]  // type 1=Servicios, 2=Ambientes, 3=Amenidades
  custom_tags?: { name: string }[]
  extra_attributes?: { name: string; value: string }[]
  reference_code?: string
}

export interface TokkoListResponse<T> {
  meta: {
    limit: number
    offset: number
    next: string | null
    previous: string | null
    total_count: number
  }
  objects: T[]
}

export interface TokkoDevelopment {
  id: number
  name: string
  description: string
  publication_title?: string
  financing_details?: string
  construction_status?: number   // 1=Proyecto 2=En construcción 3=En pozo 4=Terminado 5=A estrenar 6=Posesión inmediata
  construction_date?: string     // ISO date: "YYYY-MM-DD"
  location?: TokkoLocation
  photos: TokkoPhoto[]
  videos?: { player_url: string }[]
  geo_lat: string
  geo_long: string
  address: string
  custom_tags?: { name: string }[]
  tags?: { id: number; name: string; type: number }[]
}

// operation_id map: 1=Sale, 2=Rent, 3=Temporary Rent
export const OPERATION_ID: Record<'Sale' | 'Rent' | 'Temporary Rent', number> = {
  'Sale': 1,
  'Rent': 2,
  'Temporary Rent': 3,
}

export interface PropertyFilters {
  operation?: 'Sale' | 'Rent' | 'Temporary Rent'
  type?: string
  location?: string
  priceFrom?: number
  priceTo?: number
  currency?: string
  suites?: number[]
  surfaceFrom?: number
  surfaceTo?: number
}
