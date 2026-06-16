import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
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

    if (process.env.RESEND_API_KEY && record.agenteEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Funes Inmobiliaria <onboarding@resend.dev>',
        to:   record.agenteEmail,
        subject: `✅ Autorización firmada: ${record.inmuebleDir} — ${record.titularNombre}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#067148;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="color:white;margin:0;font-size:18px">Autorización de Venta Firmada</h2>
            </div>
            <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-radius:0 0 8px 8px">
              <p style="margin:0 0 16px;color:#444">
                Tu cliente <strong>${record.titularNombre}</strong> firmó la autorización de venta.<br>
                Asignala a la propiedad correspondiente desde el dashboard.
              </p>
              <table style="border-collapse:collapse;width:100%;font-size:14px">
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee;width:40%">Inmueble</td><td style="padding:6px 12px">${record.inmuebleDir}, ${record.inmuebleCiudad}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee">Titular</td><td style="padding:6px 12px">${record.titularNombre}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee">DNI</td><td style="padding:6px 12px">${record.titularDNI}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee">Precio</td><td style="padding:6px 12px">U$S ${record.precio}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee">Exclusividad</td><td style="padding:6px 12px">${record.exclusividad ? '✅ Con exclusividad' : 'Sin exclusividad'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:600;background:#e6f4ee">Firmado el</td><td style="padding:6px 12px">${record.fechaFirma}</td></tr>
              </table>
            </div>
          </div>
        `,
      }).catch(err => console.error('Email error:', err))
    }

    return NextResponse.json({ ok: true, id: record.id })
  } catch (err) {
    console.error('firmar error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
