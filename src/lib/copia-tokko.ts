import { createClient } from '@supabase/supabase-js'
import type { TokkoProperty, TokkoDevelopment, TokkoListResponse } from '@/types/tokko'

/**
 * Lectura de la copia de Tokko que mantiene el CRM en Supabase (tablas propiedades_tokko y tokko_emprendimientos).
 *
 * Interruptor: PROPIEDADES_FUENTE=copia usa la copia; cualquier otro valor (o ninguno) sigue consultando Tokko directo.
 * Si la copia no está disponible o está atrasada, las funciones devuelven null y el llamador cae a Tokko.
 */
// Cliente propio con cache:'no-store': la lista completa pesa más de 2 MB y el caché de datos de Next.js no admite
// respuestas de ese tamaño (mismo motivo por el que las consultas a Tokko usan no-store). El caché real es el de memoria de tokko.ts.
let _cliente: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (_cliente) return _cliente
  _cliente = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    },
  )
  return _cliente
}

export const usarCopia = () => (process.env.PROPIEDADES_FUENTE ?? '').trim().toLowerCase() === 'copia'

// Si el sincronizador del CRM lleva más de esto sin completar una pasada, la copia no se usa.
const MAX_ATRASO_MS = 60 * 60 * 1000

async function copiaAlDia(): Promise<boolean> {
  const { data } = await getSupabase().from('tokko_sincronizacion').select('ultimo_exito').eq('id', 1).maybeSingle()
  const ultimo = (data as { ultimo_exito?: string } | null)?.ultimo_exito
  return !!ultimo && Date.now() - new Date(ultimo).getTime() < MAX_ATRASO_MS
}

/** Propiedades activas (la misma lista que devuelve /property/ de Tokko). */
export async function leerPropiedadesCopia(): Promise<TokkoProperty[] | null> {
  try {
    if (!(await copiaAlDia())) return null
    const propiedades: TokkoProperty[] = []
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await getSupabase().from('propiedades_tokko').select('datos')
        .eq('activa', true).order('id').range(desde, desde + 999)
      if (error) return null
      for (const f of (data ?? []) as { datos: TokkoProperty }[]) propiedades.push(f.datos)
      if ((data ?? []).length < 1000) break
    }
    // Una copia vacía no se usa: sería señal de un problema, no de que no haya propiedades.
    return propiedades.length > 0 ? propiedades : null
  } catch {
    return null
  }
}

/**
 * Una propiedad ACTIVA por su código. Las vendidas o retiradas que también guarda la copia no se devuelven a propósito:
 * hoy esas páginas dan "no encontrada" y no deben mostrarse como si estuvieran disponibles.
 */
export async function leerPropiedadCopia(id: number | string): Promise<TokkoProperty | null> {
  try {
    const { data } = await getSupabase().from('propiedades_tokko').select('datos').eq('id', Number(id)).eq('activa', true).maybeSingle()
    return (data as { datos?: TokkoProperty } | null)?.datos ?? null
  } catch {
    return null
  }
}

/** Emprendimientos, con el mismo formato que devuelve /development/ de Tokko. */
export async function leerEmprendimientosCopia(): Promise<TokkoListResponse<TokkoDevelopment> | null> {
  try {
    const { data, error } = await getSupabase().from('tokko_emprendimientos').select('datos').order('id')
    if (error || !data || data.length === 0) return null
    const objects = (data as { datos: TokkoDevelopment }[]).map(f => f.datos)
    return { meta: { limit: objects.length, offset: 0, next: null, previous: null, total_count: objects.length }, objects }
  } catch {
    return null
  }
}

export async function leerEmprendimientoCopia(id: number | string): Promise<TokkoDevelopment | null> {
  try {
    const { data } = await getSupabase().from('tokko_emprendimientos').select('datos').eq('id', Number(id)).maybeSingle()
    return (data as { datos?: TokkoDevelopment } | null)?.datos ?? null
  } catch {
    return null
  }
}

/**
 * Si el código corresponde a una propiedad que ya no está activa (vendida, reservada, retirada…), devuelve el listado
 * al que conviene mandar a quien abre ese link viejo. Si no se conoce el código o la propiedad sigue activa, devuelve null.
 */
export async function listadoDePropiedadNoActiva(id: number | string): Promise<string | null> {
  try {
    const { data } = await getSupabase().from('propiedades_tokko').select('activa,operacion').eq('id', Number(id)).maybeSingle()
    const fila = data as { activa?: boolean; operacion?: string } | null
    if (!fila || fila.activa !== false) return null
    const op = (fila.operacion ?? '').toLowerCase()
    if (op.includes('temporal')) return '/alquiler?temp=1'
    if (op.includes('alquiler')) return '/alquiler'
    return '/venta'
  } catch {
    return null
  }
}
