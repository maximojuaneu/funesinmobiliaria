import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const required = ['agenteNombre', 'inmuebleDir', 'inmuebleCiudad', 'titularNombre', 'titularDNI']
    for (const f of required) {
      if (!body[f]) return NextResponse.json({ error: `Campo requerido: ${f}` }, { status: 400 })
    }

    const record = {
      id:             crypto.randomUUID(),
      agenteNombre:   String(body.agenteNombre   ?? '').trim(),
      agenteEmail:    String(body.agenteEmail     ?? '').trim(),
      agenteTel:      String(body.agenteTel       ?? '').trim(),
      inmuebleDir:    String(body.inmuebleDir      ?? '').trim(),
      inmuebleCiudad: String(body.inmuebleCiudad  ?? '').trim(),
      provincia:      String(body.provincia        ?? 'Santa Fe').trim(),
      partida:        String(body.partida          ?? '').trim(),
      precio:         String(body.precio           ?? '').trim(),
      precioLetras:   String(body.precioLetras     ?? '').trim(),
      comision:       String(body.comision         ?? '3').trim(),
      vigencia:       String(body.vigencia         ?? '180').trim(),
      exclusividad:   Boolean(body.exclusividad) ? 1 : 0,
      fecha:          String(body.fecha            ?? '').trim(),
      titularNombre:  String(body.titularNombre    ?? '').trim(),
      titularDNI:     String(body.titularDNI       ?? '').trim(),
      titularTel:     String(body.titularTel       ?? '').trim(),
      titularEmail:   String(body.titularEmail     ?? '').trim(),
      fechaFirma:     new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      propiedadId:    null as string | null,
      firmaDataUrl:   String(body.firmaDataUrl     ?? ''),
    }

    const db = getDb()
    await db.execute({
      sql: `INSERT INTO autorizaciones
        (id,agenteNombre,agenteEmail,agenteTel,inmuebleDir,inmuebleCiudad,
         provincia,partida,precio,precioLetras,comision,vigencia,exclusividad,
         fecha,titularNombre,titularDNI,titularTel,titularEmail,fechaFirma,
         propiedadId,firmaDataUrl)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        record.id, record.agenteNombre, record.agenteEmail, record.agenteTel,
        record.inmuebleDir, record.inmuebleCiudad, record.provincia, record.partida,
        record.precio, record.precioLetras, record.comision, record.vigencia,
        record.exclusividad, record.fecha, record.titularNombre, record.titularDNI,
        record.titularTel, record.titularEmail, record.fechaFirma,
        record.propiedadId, record.firmaDataUrl,
      ],
    })

    return NextResponse.json({ ok: true, id: record.id })
  } catch (err) {
    console.error('firmar error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
