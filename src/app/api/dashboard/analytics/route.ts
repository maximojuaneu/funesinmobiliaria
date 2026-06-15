import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getAnalyticsData } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || session.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate   = searchParams.get('endDate')   || 'today'

    const data = await getAnalyticsData(startDate, endDate)
    if (!data)
      return NextResponse.json({ error: 'Error al conectar con Google Analytics' }, { status: 500 })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[analytics API]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno del servidor' }, { status: 500 })
  }
}
