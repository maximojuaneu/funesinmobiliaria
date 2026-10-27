import { createClient } from '@supabase/supabase-js'
import { getTokkoUserPhotos } from '@/lib/tokko'

export interface PersonaWeb {
  key: string
  name: string
  position: string
  matricula?: string
  picture?: string
}

const ROLES_GERENTE = ['gerente', 'admin', 'administrador']
const CARGO: Record<string, string> = {
  gerente: 'Gerente',
  admin: 'Administrador',
  administrador: 'Administrador',
  vendedor: 'Asesor comercial',
  agente: 'Asesor comercial',
  disenador: 'Diseñador',
  administracion: 'Administración',
  asesor_alquileres: 'Asesor comercial - Alquileres',
}

// Orden del equipo: primero los asesores comerciales, luego alquileres, diseño y administración; dentro de cada cargo, alfabético.
const ORDEN_ROL: Record<string, number> = { vendedor: 0, agente: 0, asesor_alquileres: 1, disenador: 2, administracion: 3 }
const ordenDe = (role: string) => ORDEN_ROL[role] ?? 4

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

// Lee de la sección Empresa del CRM (tabla profiles) a quienes tienen activado "Mostrar en la web".
// Devuelve null si no se puede leer o no hay nadie marcado, y la página usa entonces su lista anterior.
export async function getEquipoWeb(): Promise<{ direccion: PersonaWeb[]; equipo: PersonaWeb[] } | null> {
  try {
    // Sin caché: lo que se cambia en la sección Empresa del CRM tiene que verse en la web al instante.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false }, global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }) } },
    )
    const res: any = await supabase.from('profiles').select('id, email, full_name, role, web_visible, web_matricula, web_foto').eq('web_visible', true)
    const { data, error } = res
    if (error || !data?.length) return null

    let fotos: Awaited<ReturnType<typeof getTokkoUserPhotos>> | null = null
    try { fotos = await getTokkoUserPhotos() } catch {}

    const personas = (data as any[])
      .filter(p => p.full_name)
      .map(p => {
        const role = String(p.role ?? '')
        const picture =
          (p.email && fotos?.byEmail.get(String(p.email).toLowerCase().trim())) ||
          fotos?.byName.get(normalize(p.full_name)) ||
          p.web_foto ||
          undefined
        return {
          esGerente: ROLES_GERENTE.includes(role),
          orden: ordenDe(role),
          persona: {
            key: String(p.id),
            name: p.full_name as string,
            position: CARGO[role] || 'Equipo',
            matricula: ROLES_GERENTE.includes(role) ? (p.web_matricula || undefined) : undefined,
            picture,
          } as PersonaWeb,
        }
      })

    const porNombre = (a: { persona: PersonaWeb }, b: { persona: PersonaWeb }) => a.persona.name.localeCompare(b.persona.name)
    const direccion = personas.filter(x => x.esGerente).sort(porNombre).map(x => x.persona)
    const equipo = personas.filter(x => !x.esGerente).sort((a, b) => a.orden - b.orden || porNombre(a, b)).map(x => x.persona)
    return { direccion, equipo }
  } catch {
    return null
  }
}
