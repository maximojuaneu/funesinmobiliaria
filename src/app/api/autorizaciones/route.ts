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
    const db = getDb()
    const result = session.role === 'admin'
      ? await db.execute('SELECT * FROM autorizaciones ORDER BY rowid DESC')
      : await db.execute({
          sql: 'SELECT * FROM autorizaciones WHERE lower(agenteNombre) = lower(?) ORDER BY rowid DESC',
          args: [session.name],
        })

    const rows = result.rows as unknown as Record<string, unknown>[]
    const list = rows.map(r => {
      const auth = toAuth(r) as Record<string, unknown>
      delete auth.firmaDataUrl
      return auth
    })
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([])
  }
}
