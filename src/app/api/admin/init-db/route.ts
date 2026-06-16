import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb, SCHEMA_SQL } from '@/lib/db'

/** GET /api/admin/init-db  — creates all tables on Turso (idempotent) */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = getDb()
    await db.batch(
      SCHEMA_SQL.map(sql => ({ sql, args: [] as never[] })),
      'write',
    )
    return NextResponse.json({ ok: true, tables: SCHEMA_SQL.length })
  } catch (err) {
    console.error('init-db error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
