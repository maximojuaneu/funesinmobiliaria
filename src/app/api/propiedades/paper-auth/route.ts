import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase-server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await getSupabase().from('paper_auth').select('propId')
  return NextResponse.json((data ?? []).map(r => r.propId))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const propId = body?.propId
    if (!propId) return NextResponse.json({ error: 'propId requerido' }, { status: 400 })

    const { error } = await getSupabase()
      .from('paper_auth')
      .upsert({ propId: String(propId), marcadaEn: new Date().toISOString() })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[paper-auth POST]', err)
    return NextResponse.json({ error: 'Error al guardar. Intentá de nuevo.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const propId = body?.propId
    if (!propId) return NextResponse.json({ error: 'propId requerido' }, { status: 400 })

    await getSupabase().from('paper_auth').delete().eq('propId', String(propId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[paper-auth DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
