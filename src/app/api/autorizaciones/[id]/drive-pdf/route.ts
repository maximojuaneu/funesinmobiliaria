import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadToDrive } from '@/lib/gdrive'

const FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? ''

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const form    = await req.formData()
    const pdf     = form.get('pdf') as File | null
    const address = String(form.get('address') ?? '').trim()
    const city    = String(form.get('city')    ?? '').trim()

    if (!pdf || !FOLDER_ID) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const filename = `${address} - ${city}.pdf`
    const buffer   = Buffer.from(await pdf.arrayBuffer())
    const file     = await uploadToDrive(FOLDER_ID, filename, buffer, 'application/pdf')

    return NextResponse.json({ ok: true, file })
  } catch (e) {
    console.error('drive-pdf upload error:', e)
    return NextResponse.json({ error: 'Error al subir a Drive' }, { status: 500 })
  }
}
