import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

interface Propiedad {
  id:        string
  agente:    string
  direccion: string
  ciudad:    string
  tipo:      string
  precio:    string
  notas:     string
  createdAt: string
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const props = getDb()
    .prepare('SELECT * FROM propiedades WHERE lower(agente) = lower(?) ORDER BY rowid DESC')
    .all(session.name)
  return NextResponse.json(props)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  if (!body.direccion?.trim()) {
    return NextResponse.json({ error: 'La dirección es requerida' }, { status: 400 })
  }

  const item: Propiedad = {
    id:        crypto.randomUUID(),
    agente:    session.name,
    direccion: String(body.direccion ?? '').trim(),
    ciudad:    String(body.ciudad    ?? 'Funes').trim(),
    tipo:      String(body.tipo      ?? '').trim(),
    precio:    String(body.precio    ?? '').trim(),
    notas:     String(body.notas     ?? '').trim(),
    createdAt: new Date().toISOString(),
  }

  getDb().prepare(`
    INSERT INTO propiedades (id,agente,direccion,ciudad,tipo,precio,notas,createdAt)
    VALUES (@id,@agente,@direccion,@ciudad,@tipo,@precio,@notas,@createdAt)
  `).run(item)

  return NextResponse.json(item, { status: 201 })
}
