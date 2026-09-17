import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase-server'

function toAuth(row: Record<string, unknown>) {
  return { ...row, exclusividad: row.exclusividad === 1 }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const supabase = getSupabase()
    const query = supabase
      .from('autorizaciones')
      .select('id, agenteNombre, agenteEmail, agenteTel, inmuebleDir, inmuebleCiudad, provincia, partida, precio, precioLetras, comision, vigencia, exclusividad, fecha, titularNombre, titularDNI, titularTel, titularEmail, fechaFirma, propiedadId')
      .order('id', { ascending: false })

    const { data, error } = session.role === 'admin'
      ? await query
      : await query.ilike('agenteNombre', session.name)

    if (error) throw error
    return NextResponse.json((data ?? []).map(r => toAuth(r as unknown as Record<string, unknown>)))
  } catch {
    return NextResponse.json([])
  }
}
