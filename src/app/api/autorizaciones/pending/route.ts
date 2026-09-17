import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

/** POST { ...formData } — saves pending authorization and returns a short id */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.inmuebleDir || !body?.precio) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { error } = await getSupabase()
      .from('firma_pending')
      .insert({ id, data: JSON.stringify(body), createdAt: new Date().toISOString() })

    if (error) throw error
    return NextResponse.json({ id })
  } catch (err) {
    console.error('[pending POST]', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
