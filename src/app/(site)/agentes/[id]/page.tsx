import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPropertiesByAgentId } from '@/lib/tokko'
import PropertyCard from '@/components/properties/PropertyCard'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24
const waPhone   = (p: string) => p.replace(/\D/g, '')

interface Props {
  params:       { id: string }
  searchParams: { page?: string }
}

function hasCustomAvatar(url?: string) {
  if (!url) return false
  return url.startsWith('http') && !url.includes('no-avatar') && !url.includes('default')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const properties = await getPropertiesByAgentId(Number(params.id)).catch(() => [])
  const agent = properties[0]?.producer
  if (!agent) return { title: 'Agente' }
  return { title: `Propiedades de ${agent.name}` }
}

export default async function AgentePage({ params, searchParams }: Props) {
  const agentId = Number(params.id)
  if (isNaN(agentId)) notFound()

  const all = await getPropertiesByAgentId(agentId).catch(() => [])
  if (!all.length) notFound()

  // Ordenar más recientes primero
  const sorted = [...all].sort((a, b) => {
    const dA = new Date(a.created_at ?? 0).getTime()
    const dB = new Date(b.created_at ?? 0).getTime()
    return dB - dA
  })

  const agent      = sorted[0].producer
  const agentPhone = agent.cellphone || agent.phone || ''
  const agentWa    = agentPhone ? waPhone(agentPhone) : null
  const initials   = agent.name?.trim().split(/\s+/).filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const page       = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">

      {/* Agent header */}
      <div className="flex items-center gap-5 mb-10">
        {hasCustomAvatar(agent.picture)
          ? <Image src={agent.picture!} alt={agent.name} width={80} height={80} className="rounded-full object-cover flex-shrink-0 shadow" style={{ width: 80, height: 80 }} />
          : <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center text-brand-green font-bold text-2xl flex-shrink-0 shadow">
              {initials}
            </div>
        }
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
          {agent.position && <p className="text-sm text-gray-500">{agent.position}</p>}
          {agentPhone && (
            <a href={`tel:+${agentWa}`} className="text-sm text-brand-green hover:underline">
              {agentPhone}
            </a>
          )}
          <p className="text-sm text-gray-400 mt-0.5">
            {sorted.length} propiedad{sorted.length !== 1 ? 'es' : ''} publicada{sorted.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Properties grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map(p => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {page > 1 && (
            <Link
              href={`/agentes/${agentId}?page=${page - 1}`}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-brand-green hover:text-brand-green transition-colors"
            >
              ← Anterior
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span key={`dots-${p}`} className="text-gray-400 px-1">…</span>
                )}
                <Link
                  key={p}
                  href={`/agentes/${agentId}?page=${p}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-brand-green text-white'
                      : 'border border-gray-200 hover:border-brand-green hover:text-brand-green'
                  }`}
                >
                  {p}
                </Link>
              </>
            ))
          }
          {page < totalPages && (
            <Link
              href={`/agentes/${agentId}?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-brand-green hover:text-brand-green transition-colors"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}

      <div className="mt-10">
        <Link href="/venta" className="text-sm text-brand-green hover:underline">← Ver todas las propiedades</Link>
      </div>
    </div>
  )
}
