import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getClosedOperations } from '@/lib/tokko'
import type { ClosedOpRecord } from '@/app/api/dashboard/operations/route'

// Map Tokko type names to Spanish display labels
const TYPE_MAP: Record<string, string> = {
  House:               'Casa',
  Apartment:           'Departamento',
  Land:                'Terreno',
  'Bussiness Premises': 'Local',
  Office:              'Oficina',
  Countryside:         'Campo',
  Warehouse:           'Depósito',
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const tokkoOps = await getClosedOperations()

    const records: ClosedOpRecord[] = tokkoOps.map(op => ({
      id:                     `tokko-${op.id}`,
      address:                op.address,
      lat:                    op.lat,
      lng:                    op.lng,
      fecha:                  op.date,
      tipo:                   TYPE_MAP[op.type] ?? op.type,
      valorPublicacion:       op.price,
      valorCierre:            0,
      tiempoComercializacion: 0,
      captador:               op.agentName,
      vendedor:               '',
      status:                 op.status === 'RESERVADA' ? 'RESERVADA' : 'VENDIDA',
      creadaPor:              'tokko',
      creadaEn:               op.date,
      source:                 'tokko',
      photoUrl:               op.photoUrl,
      tokkoId:                op.id,
    }))

    return NextResponse.json(records)
  } catch (e) {
    console.error('Error fetching Tokko closed operations:', e)
    return NextResponse.json([], { status: 200 }) // fail gracefully
  }
}
