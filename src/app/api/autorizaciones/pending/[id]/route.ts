import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface SignatureData {
  titularNombre: string
  titularDNI:    string
  titularTel:    string
  titularEmail:  string
  firmaDataUrl:  string
  signedAt?:     string
}

/** GET /api/autorizaciones/pending/[id] — devuelve datos del formulario o { signed: true } si ya está completo */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getDb().execute({
      sql: 'SELECT data, signedAt FROM firma_pending WHERE id = ?',
      args: [params.id],
    })
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Completamente firmado (todas las firmas recolectadas)
    if (row.signedAt) {
      return NextResponse.json({ signed: true, signedAt: row.signedAt })
    }

    const parsedData = JSON.parse(row.data as string)
    const requiredSignatures = Math.max(1, Number(parsedData.cantidadVendedores) || 1)
    const existingSignatures: SignatureData[] = parsedData.signatures || []

    return NextResponse.json({
      ...parsedData,
      requiredSignatures,
      existingSignatures,
    })
  } catch (err) {
    console.error('[pending GET]', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

/** PATCH /api/autorizaciones/pending/[id] — agrega firma; marca como completo cuando se alcanza cantidadVendedores */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const current = await getDb().execute({
      sql: 'SELECT data FROM firma_pending WHERE id = ?',
      args: [params.id],
    })
    const row = current.rows[0]
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const parsedData = JSON.parse(row.data as string)
    const requiredSignatures = Math.max(1, Number(parsedData.cantidadVendedores) || 1)
    const signatures: SignatureData[] = [...(parsedData.signatures || [])]

    // Agregar la nueva firma si viene en el body
    const body: Partial<SignatureData> = await req.json().catch(() => ({}))
    if (body.titularNombre) {
      signatures.push({
        titularNombre: String(body.titularNombre),
        titularDNI:    String(body.titularDNI    ?? ''),
        titularTel:    String(body.titularTel    ?? ''),
        titularEmail:  String(body.titularEmail  ?? ''),
        firmaDataUrl:  String(body.firmaDataUrl  ?? ''),
        signedAt:      new Date().toISOString(),
      })
    }

    parsedData.signatures = signatures
    const isComplete   = signatures.length >= requiredSignatures
    const newDataJson  = JSON.stringify(parsedData)

    if (isComplete) {
      await getDb().execute({
        sql: "UPDATE firma_pending SET data = ?, signedAt = datetime('now') WHERE id = ?",
        args: [newDataJson, params.id],
      })
    } else {
      await getDb().execute({
        sql: 'UPDATE firma_pending SET data = ? WHERE id = ?',
        args: [newDataJson, params.id],
      })
    }

    return NextResponse.json({
      ok: true,
      isComplete,
      signaturesCount:    signatures.length,
      requiredSignatures,
      signatures,
    })
  } catch (err) {
    console.error('[pending PATCH]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
