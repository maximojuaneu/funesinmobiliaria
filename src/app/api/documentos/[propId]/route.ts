import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOrCreatePropertyFolder, listFolderFiles } from '@/lib/gdrive'
import { getDb } from '@/lib/db'

interface PropDoc {
  propId:   string
  folderId: string
  address:  string
  city:     string
}

/** GET /api/documentos/[propId]?address=...&city=... */
export async function GET(req: NextRequest, { params }: { params: { propId: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { propId } = params
  const address    = req.nextUrl.searchParams.get('address') ?? ''
  const city       = req.nextUrl.searchParams.get('city')    ?? ''

  try {
    const db      = getDb()
    const found   = await db.execute({ sql: 'SELECT * FROM prop_docs WHERE propId = ?', args: [propId] })
    let propDoc   = found.rows[0] as unknown as PropDoc | undefined

    if (!propDoc && address) {
      const folderId = await getOrCreatePropertyFolder(address, city)
      await db.execute({
        sql: 'INSERT OR IGNORE INTO prop_docs (propId,folderId,address,city) VALUES (?,?,?,?)',
        args: [propId, folderId, address, city],
      })
      propDoc = { propId, folderId, address, city }
    }

    if (!propDoc) return NextResponse.json({ folderId: null, files: [] })

    const files = await listFolderFiles(propDoc.folderId)
    return NextResponse.json({ folderId: propDoc.folderId, files })
  } catch (e) {
    console.error('documentos GET error:', e)
    return NextResponse.json({ folderId: null, files: [] })
  }
}
