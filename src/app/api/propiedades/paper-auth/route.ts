import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const result = await getDb().execute('SELECT propId FROM paper_auth')
  return NextResponse.json(result.rows.map(r => r.propId))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const propId = body?.propId
    if (!propId) return NextResponse.json({ error: 'propId requerido' }, { status: 400 })

    await getDb().execute({
      sql: "INSERT OR REPLACE INTO paper_auth (propId, marcadaEn) VALUES (?, datetime('now'))",
      args: [String(propId)],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[paper-auth POST]', err)
    return NextResponse.json({ error: 'Error al guardar. Intentá de nuevo.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const propId = body?.propId
    if (!propId) return NextResponse.json({ error: 'propId requerido' }, { status: 400 })

    await getDb().execute({ sql: 'DELETE FROM paper_auth WHERE propId = ?', args: [String(propId)] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[paper-auth DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
