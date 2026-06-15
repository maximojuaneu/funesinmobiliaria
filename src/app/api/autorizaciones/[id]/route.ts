import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

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

  const db     = getDb()
  const record = db.prepare('SELECT * FROM autorizaciones WHERE id = ?').get(params.id) as Record<string, unknown> | undefined
  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  return NextResponse.json(toAuth(record))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body   = await req.json()
  const db     = getDb()
  const record = db.prepare('SELECT * FROM autorizaciones WHERE id = ?').get(params.id) as Record<string, unknown> | undefined
  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  db.prepare('UPDATE autorizaciones SET propiedadId = ? WHERE id = ?').run(body.propiedadId ?? null, params.id)
  const updated = db.prepare('SELECT * FROM autorizaciones WHERE id = ?').get(params.id) as Record<string, unknown>
  return NextResponse.json(toAuth(updated))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db     = getDb()
  const record = db.prepare('SELECT * FROM autorizaciones WHERE id = ?').get(params.id) as Record<string, unknown> | undefined
  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (record.propiedadId) {
    return NextResponse.json({ error: 'No se puede eliminar una autorización asignada' }, { status: 400 })
  }

  db.prepare('DELETE FROM autorizaciones WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
