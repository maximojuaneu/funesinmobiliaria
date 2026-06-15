import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export interface ClosedOpRecord {
  id:                     string
  address:                string
  lat:                    number
  lng:                    number
  fecha:                  string
  tipo:                   string
  valorPublicacion:       number
  valorCierre:            number
  tiempoComercializacion: number
  captador:               string
  vendedor:               string
  status:                 'RESERVADA' | 'VENDIDA'
  creadaPor:              string
  creadaEn:               string
  source?:                'manual' | 'tokko'
  photoUrl?:              string
  tokkoId?:               number
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ops = getDb().prepare('SELECT * FROM closed_operations ORDER BY rowid DESC').all()
  return NextResponse.json(ops)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const op: ClosedOpRecord = {
    id:                     crypto.randomUUID(),
    address:                String(body.address ?? '').trim(),
    lat:                    Number(body.lat),
    lng:                    Number(body.lng),
    fecha:                  String(body.fecha ?? ''),
    tipo:                   String(body.tipo ?? ''),
    valorPublicacion:       Number(body.valorPublicacion ?? 0),
    valorCierre:            Number(body.valorCierre ?? 0),
    tiempoComercializacion: Number(body.tiempoComercializacion ?? 0),
    captador:               String(body.captador ?? '').trim(),
    vendedor:               String(body.vendedor ?? '').trim(),
    status:                 body.status === 'VENDIDA' ? 'VENDIDA' : 'RESERVADA',
    creadaPor:              session.name,
    creadaEn:               new Date().toISOString(),
    source:                 'manual',
    photoUrl:               '',
    tokkoId:                undefined,
  }

  if (!op.address || isNaN(op.lat) || isNaN(op.lng)) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  getDb().prepare(`
    INSERT INTO closed_operations
      (id,address,lat,lng,fecha,tipo,valorPublicacion,valorCierre,
       tiempoComercializacion,captador,vendedor,status,creadaPor,creadaEn,source,photoUrl,tokkoId)
    VALUES
      (@id,@address,@lat,@lng,@fecha,@tipo,@valorPublicacion,@valorCierre,
       @tiempoComercializacion,@captador,@vendedor,@status,@creadaPor,@creadaEn,@source,@photoUrl,@tokkoId)
  `).run({ ...op, tokkoId: op.tokkoId ?? null })

  return NextResponse.json({ ok: true, op })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !['RESERVADA', 'VENDIDA'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const db = getDb()
  const op = db.prepare('SELECT * FROM closed_operations WHERE id = ?').get(id)
  if (!op) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  db.prepare('UPDATE closed_operations SET status = ? WHERE id = ?').run(status, id)
  const updated = db.prepare('SELECT * FROM closed_operations WHERE id = ?').get(id)
  return NextResponse.json({ ok: true, op: updated })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  getDb().prepare('DELETE FROM closed_operations WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
