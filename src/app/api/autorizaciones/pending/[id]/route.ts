import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** GET /api/autorizaciones/pending/[id] — returns saved form data */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getDb().execute({
      sql: 'SELECT data FROM firma_pending WHERE id = ?',
      args: [params.id],
    })
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    return NextResponse.json(JSON.parse(row.data as string))
  } catch (err) {
    console.error('[pending GET]', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
