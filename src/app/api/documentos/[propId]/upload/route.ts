import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOrCreatePropertyFolder, uploadToDrive } from '@/lib/gdrive'
import { getDb } from '@/lib/db'

interface PropDoc {
  propId:   string
  folderId: string
  address:  string
  city:     string
}

const DOC_LABELS: Record<string, string> = {
  titulo:       'Título',
  plano:        'Plano',
  autorizacion: 'Autorización de Venta',
}

/** POST /api/documentos/[propId]/upload  (multipart: type, address, city, file) */
export async function POST(req: NextRequest, { params }: { params: { propId: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const form    = await req.formData()
    const type    = String(form.get('type')    ?? '')
    const address = String(form.get('address') ?? '')
    const city    = String(form.get('city')    ?? '')
    const file    = form.get('file') as File | null

    if (!type || !file || !DOC_LABELS[type]) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const { propId } = params
    const db         = getDb()
    let   propDoc    = db.prepare('SELECT * FROM prop_docs WHERE propId = ?').get(propId) as PropDoc | undefined

    if (!propDoc && address) {
      const folderId = await getOrCreatePropertyFolder(address, city)
      db.prepare('INSERT OR IGNORE INTO prop_docs (propId,folderId,address,city) VALUES (?,?,?,?)').run(propId, folderId, address, city)
      propDoc = { propId, folderId, address, city }
    }

    if (!propDoc) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const buffer   = Buffer.from(await file.arrayBuffer())
    const ext      = file.name.split('.').pop() ?? 'pdf'
    const filename = `${DOC_LABELS[type]} - ${address}.${ext}`

    const uploaded = await uploadToDrive(propDoc.folderId, filename, buffer, file.type)
    return NextResponse.json({ ok: true, file: uploaded })
  } catch (e) {
    console.error('documentos upload error:', e)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
