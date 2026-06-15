import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

function toAuth(row: Record<string, unknown>) {
  return { ...row, exclusividad: row.exclusividad === 1 }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const db   = getDb()
    const rows = session.role === 'admin'
      ? db.prepare('SELECT * FROM autorizaciones ORDER BY rowid DESC').all()
      : db.prepare('SELECT * FROM autorizaciones WHERE lower(agenteNombre) = lower(?) ORDER BY rowid DESC').all(session.name)

    // Strip firmaDataUrl from list — fetched individually when generating PDF
    const result = (rows as Record<string, unknown>[]).map(r => {
      const auth = toAuth(r) as Record<string, unknown>
      delete auth.firmaDataUrl
      return auth
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json([])
  }
}
