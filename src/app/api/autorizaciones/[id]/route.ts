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

  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM autorizaciones WHERE id = ?', args: [params.id] })
  const record = result.rows[0] as unknown as Record<string, unknown> | undefined
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

  const body = await req.json()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM autorizaciones WHERE id = ?', args: [params.id] })
  const record = result.rows[0] as unknown as Record<string, unknown> | undefined
  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await db.execute({
    sql: 'UPDATE autorizaciones SET propiedadId = ? WHERE id = ?',
    args: [body.propiedadId ?? null, params.id],
  })
  const updated = await db.execute({ sql: 'SELECT * FROM autorizaciones WHERE id = ?', args: [params.id] })
  return NextResponse.json(toAuth(updated.rows[0] as unknown as Record<string, unknown>))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM autorizaciones WHERE id = ?', args: [params.id] })
  const record = result.rows[0] as unknown as Record<string, unknown> | undefined
  if (!record || !canAccess(session, String(record.agenteNombre))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (record.propiedadId) {
    return NextResponse.json({ error: 'No se puede eliminar una autorización asignada' }, { status: 400 })
  }

  await db.execute({ sql: 'DELETE FROM autorizaciones WHERE id = ?', args: [params.id] })
  return NextResponse.json({ ok: true })
}
