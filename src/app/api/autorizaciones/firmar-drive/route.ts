import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAutorizacionesFolder, uploadToDrive } from '@/lib/gdrive'

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData()
    const pdf     = form.get('pdf')     as File   | null
    const address = String(form.get('address') ?? '').trim()
    const city    = String(form.get('city')    ?? '').trim()
    const token   = String(form.get('token')   ?? '').trim()

    if (!pdf || !address || !token) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Validate that the token corresponds to a real firma session
    const result = await getDb().execute({
      sql: 'SELECT id FROM firma_pending WHERE id = ?',
      args: [token],
    })
    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
    }

    const folderId = await getAutorizacionesFolder()
    const filename = `Autorizacion venta ${address}${city ? ` - ${city}` : ''}.pdf`
    const buffer   = Buffer.from(await pdf.arrayBuffer())
    const file     = await uploadToDrive(folderId, filename, buffer, 'application/pdf')

    return NextResponse.json({ ok: true, file })
  } catch (err) {
    console.error('[firmar-drive]', err)
    return NextResponse.json({ error: 'Error al subir a Drive' }, { status: 500 })
  }
}
