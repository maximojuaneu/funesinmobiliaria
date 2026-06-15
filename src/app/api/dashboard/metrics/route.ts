import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getProperties } from '@/lib/tokko'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { objects: all } = await getProperties()

  const properties = session.tokkoId
    ? all.filter(p => p.producer?.id === session.tokkoId)
    : all

  const forSale  = properties.filter(p => p.operations.some(o => o.operation_id === 1)).length
  const forRent  = properties.filter(p => p.operations.some(o => o.operation_id === 2)).length
  const total    = properties.length

  return NextResponse.json({ total, forSale, forRent, agentName: session.name })
}
