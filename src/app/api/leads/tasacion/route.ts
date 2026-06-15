import { NextRequest, NextResponse } from 'next/server'
import { appendLeadToSheet } from '@/lib/sheets'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const required = ['nombre', 'motivo', 'tipo', 'direccion', 'telefono', 'email']
    for (const field of required) {
      if (!data[field]) return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 })
    }
    await appendLeadToSheet(data)

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Funes Inmobiliaria <onboarding@resend.dev>',
        to: 'maximo.funesinmobiliaria@gmail.com',
        subject: `Nueva solicitud de tasación: ${data.nombre}`,
        html: `
          <h2>Nueva solicitud de tasación recibida</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Nombre</td><td style="padding:6px 12px">${data.nombre}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Motivo</td><td style="padding:6px 12px">${data.motivo}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Tipo de propiedad</td><td style="padding:6px 12px">${data.tipo}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Dirección</td><td style="padding:6px 12px">${data.direccion}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Teléfono</td><td style="padding:6px 12px">${data.telefono}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:6px 12px">${data.email}</td></tr>
            ${data.detalles ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Detalles</td><td style="padding:6px 12px">${data.detalles}</td></tr>` : ''}
          </table>
        `,
      }).catch(err => console.error('Email error:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Lead error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
