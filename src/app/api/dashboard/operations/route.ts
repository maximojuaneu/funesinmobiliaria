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

  const result = await getDb().execute('SELECT * FROM closed_operations ORDER BY rowid DESC')
  return NextResponse.json(result.rows)
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

  await getDb().execute({
    sql: `INSERT INTO closed_operations
      (id,address,lat,lng,fecha,tipo,valorPublicacion,valorCierre,
       tiempoComercializacion,captador,vendedor,status,creadaPor,creadaEn,source,photoUrl,tokkoId)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      op.id, op.address, op.lat, op.lng, op.fecha, op.tipo,
      op.valorPublicacion, op.valorCierre, op.tiempoComercializacion,
      op.captador, op.vendedor, op.status, op.creadaPor, op.creadaEn,
      op.source ?? 'manual', op.photoUrl ?? '', op.tokkoId ?? null,
    ],
  })

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
  const found = await db.execute({ sql: 'SELECT * FROM closed_operations WHERE id = ?', args: [id] })
  if (!found.rows[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await db.execute({ sql: 'UPDATE closed_operations SET status = ? WHERE id = ?', args: [status, id] })
  const updated = await db.execute({ sql: 'SELECT * FROM closed_operations WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true, op: updated.rows[0] })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  await getDb().execute({ sql: 'DELETE FROM closed_operations WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true })
}
