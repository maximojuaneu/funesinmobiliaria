import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAgents } from '@/lib/tokko'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const agents = await getAgents()
  return NextResponse.json(agents.map(a => ({ id: a.id, name: a.name })))
}
