import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPropertiesByAgentId, getPropertiesByAgentName, getAllActiveProperties } from '@/lib/tokko'

const TYPE_MAP: Record<string, string> = {
  House:               'Casa',
  Apartment:           'Departamento',
  Land:                'Terreno',
  'Bussiness Premises':'Local',
  Office:              'Oficina',
  Countryside:         'Campo',
  Warehouse:           'Depósito',
}

export interface TokkoAgentProperty {
  id:        number
  address:   string
  type:      string
  price:     number | null
  currency:  string
  agentName: string
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    let raw

    if (session.role === 'admin') {
      // Admins see all active properties
      raw = await getAllActiveProperties()
    } else {
      // Agents see only their own properties
      raw = session.tokkoId
        ? await getPropertiesByAgentId(session.tokkoId)
        : []

      // Fallback: match by name (handles stale JWT or accent differences)
      if (raw.length === 0) {
        raw = await getPropertiesByAgentName(session.name)
      }

      // Debug: log producer names to diagnose name mismatches
      if (raw.length === 0) {
        const all = await getAllActiveProperties()
        const producers = [...new Set(all.map(p => p.producer?.name).filter(Boolean))]
        console.log('[tokko] session.name:', session.name, '| session.tokkoId:', session.tokkoId)
        console.log('[tokko] producers in Tokko:', producers)
      }
    }

    raw.sort((a, b) => {
      const da = a.created_at ?? ''
      const db = b.created_at ?? ''
      return db.localeCompare(da)
    })

    const props: TokkoAgentProperty[] = raw.map(p => {
      const op    = p.operations?.[0]
      const price = op?.prices?.[0]
      return {
        id:        p.id,
        address:   p.fake_address || p.address || 'Sin dirección',
        type:      TYPE_MAP[p.type?.name] ?? p.type?.name ?? '—',
        price:     price?.price ?? null,
        currency:  price?.currency ?? 'USD',
        agentName: p.producer?.name ?? '',
      }
    })
    return NextResponse.json(props)
  } catch (e) {
    console.error('Tokko agent properties error:', e)
    return NextResponse.json([])
  }
}
