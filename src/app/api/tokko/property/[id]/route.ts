import { NextRequest, NextResponse } from 'next/server'
import { getPropertyById } from '@/lib/tokko'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = params
  try {
    const property = await getPropertyById(id)
    return NextResponse.json(property)
  } catch (err) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }
}
