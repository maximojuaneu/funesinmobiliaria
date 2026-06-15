import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllActiveProperties } from '@/lib/tokko'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const all = await getAllActiveProperties()
  const producers = Array.from(new Map(all.map(p => [p.producer?.id, p.producer])).values())
    .filter(Boolean)
    .map(p => ({ id: p!.id, name: p!.name }))

  return NextResponse.json({
    session: { name: session.name, role: session.role, tokkoId: session.tokkoId },
    totalProperties: all.length,
    producers,
  })
}
