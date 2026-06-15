import { NextRequest, NextResponse } from 'next/server'
import { appendPostulationToSheet } from '@/lib/sheets'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const required = ['nombre', 'edad', 'whatsapp', 'email', 'ciudad', 'corredor', 'comision', 'experiencia', 'movilidad', 'club', 'colegio', 'personalidad', 'motivacion', 'emprendimiento', 'fulltime', 'respaldo']
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 })
      }
    }
    await appendPostulationToSheet(data)

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Funes Inmobiliaria <onboarding@resend.dev>',
        to: 'maximo.funesinmobiliaria@gmail.com',
        subject: `Nueva postulación: ${data.nombre}`,
        html: `
          <h2>Nueva postulación recibida</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Nombre</td><td style="padding:6px 12px">${data.nombre}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Edad</td><td style="padding:6px 12px">${data.edad}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">WhatsApp</td><td style="padding:6px 12px">${data.whatsapp}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:6px 12px">${data.email}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Ciudad</td><td style="padding:6px 12px">${data.ciudad}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Corredor inmobiliario</td><td style="padding:6px 12px">${data.corredor}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Comisión</td><td style="padding:6px 12px">${data.comision}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Experiencia</td><td style="padding:6px 12px">${data.experiencia}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Movilidad</td><td style="padding:6px 12px">${data.movilidad}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Club</td><td style="padding:6px 12px">${data.club}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Colegio</td><td style="padding:6px 12px">${data.colegio}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Personalidad</td><td style="padding:6px 12px">${data.personalidad}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Motivación</td><td style="padding:6px 12px">${data.motivacion}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Emprendimiento</td><td style="padding:6px 12px">${data.emprendimiento}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Full time</td><td style="padding:6px 12px">${data.fulltime}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5">Respaldo económico</td><td style="padding:6px 12px">${data.respaldo}</td></tr>
          </table>
        `,
      }).catch(err => console.error('Email error:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Postulacion error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
