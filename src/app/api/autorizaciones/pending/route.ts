import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/** POST { ...formData } — saves pending authorization and returns a short id */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.inmuebleDir || !body?.precio) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await getDb().execute({
      sql: "INSERT INTO firma_pending (id, data, createdAt) VALUES (?, ?, datetime('now'))",
      args: [id, JSON.stringify(body)],
    })

    return NextResponse.json({ id })
  } catch (err) {
    console.error('[pending POST]', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
