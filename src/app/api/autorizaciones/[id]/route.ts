import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase-server'

function toAuth(row: Record<string, unknown>) {
  return { ...row, exclusividad: row.exclusividad === 1 }
}

function canAccess(session: { role: string; name: string }, agenteNombre: string) {
  return session.role === 'admin' || agenteNombre.toLowerCase() === session.name.toLowerCase()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: record } = await getSupabase()
    .from('autorizaciones')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  return NextResponse.json(toAuth(record as unknown as Record<string, unknown>))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const supabase = getSupabase()

  const { data: record } = await supabase
    .from('autorizaciones')
    .select('agenteNombre')
    .eq('id', params.id)
    .single()

  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const { data: updated } = await supabase
    .from('autorizaciones')
    .update({ propiedadId: body.propiedadId ?? null })
    .eq('id', params.id)
    .select('*')
    .single()

  return NextResponse.json(toAuth(updated as unknown as Record<string, unknown>))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabase()
  const { data: record } = await supabase
    .from('autorizaciones')
    .select('agenteNombre, propiedadId')
    .eq('id', params.id)
    .single()

  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (record.propiedadId) {
    return NextResponse.json({ error: 'No se puede eliminar una autorización asignada' }, { status: 400 })
  }

  await supabase.from('autorizaciones').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
