import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

// GET — returns array of propIds marked as paper-signed
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rows = getDb().prepare('SELECT propId FROM paper_auth').all() as { propId: string }[]
  return NextResponse.json(rows.map(r => r.propId))
}

// POST { propId } — mark a property as paper-signed
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { propId } = await req.json()
  if (!propId) return NextResponse.json({ error: 'propId requerido' }, { status: 400 })

  getDb().prepare('INSERT OR REPLACE INTO paper_auth (propId, marcadaEn) VALUES (?, datetime(\'now\'))').run(String(propId))
  return NextResponse.json({ ok: true })
}

// DELETE { propId } — unmark
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { propId } = await req.json()
  getDb().prepare('DELETE FROM paper_auth WHERE propId = ?').run(String(propId))
  return NextResponse.json({ ok: true })
}
