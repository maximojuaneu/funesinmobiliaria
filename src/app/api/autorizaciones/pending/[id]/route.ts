import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** GET /api/autorizaciones/pending/[id] — returns form data, or { signed: true } if already signed */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getDb().execute({
      sql: 'SELECT data, signedAt FROM firma_pending WHERE id = ?',
      args: [params.id],
    })
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    if (row.signedAt) {
      return NextResponse.json({ signed: true, signedAt: row.signedAt })
    }

    return NextResponse.json(JSON.parse(row.data as string))
  } catch (err) {
    console.error('[pending GET]', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

/** PATCH /api/autorizaciones/pending/[id] — marks as signed */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDb().execute({
      sql: "UPDATE firma_pending SET signedAt = datetime('now') WHERE id = ?",
      args: [params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pending PATCH]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
