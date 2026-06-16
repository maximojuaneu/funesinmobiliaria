'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice } from '@/lib/tokko'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

const TYPE_ES: Record<string, string> = {
  'House': 'Casa', 'Apartment': 'Departamento', 'Land': 'Terreno / Lote',
  'Bussiness Premises': 'Local comercial', 'Office': 'Oficina',
  'Countryside': 'Campo', 'Warehouse': 'Depósito',
}

const m2 = (val: any) => { const n = parseFloat(val); return n > 0 ? Math.round(n) : null }
const mt = (val: any) => { const n = parseFloat(val); return n > 0 ? n : null }

function getStats(p: TokkoProperty): string {
  const type = p.type?.name
  if (type === 'Land') return [
    m2(p.surface) ? `${m2(p.surface)} m²` : null,
    mt(p.front_measure) ? `${mt(p.front_measure)}m frente` : null,
    mt(p.depth_measure) ? `${mt(p.depth_measure)}m fondo` : null,
  ].filter(Boolean).join(' · ')
  return [
    p.suite_amount    ? `${p.suite_amount} dorm.`            : null,
    p.bathroom_amount ? `${p.bathroom_amount} baños`         : null,
    m2(p.roofed_surface) ? `${m2(p.roofed_surface)} m² cub.` : null,
  ].filter(Boolean).join(' · ')
}

function CompactPropertyCard({ property }: { property: TokkoProperty }) {
  const price = getOperationPrice(property, property.operations[0]?.operation_type)
  const photo = property.photos?.find(p => p.is_front_cover) ?? property.photos?.[0]
  const address = property.fake_address || property.address
  const stats = getStats(property)
  const typeName = TYPE_ES[property.type?.name] ?? property.type?.name
  const isMobile = useIsMobile()

  return (
    <Link
      href={`/propiedades/${property.id}`}
      target={isMobile ? '_self' : '_blank'}
      rel={isMobile ? undefined : 'noopener noreferrer'}
      className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="relative w-32 h-24 flex-shrink-0 bg-gray-100">
        {photo ? (
          <Image src={photo.image} alt={address} fill className="object-cover" sizes="128px" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        {property.is_starred_on_web && (
          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            DEST.
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center py-3 pr-4 min-w-0">
        {price && (
          <p className="text-base font-bold text-gray-900 leading-tight">
            {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
          </p>
        )}
        <p className="text-sm font-medium text-gray-700 truncate mt-0.5">{address}</p>
        {stats && <p className="text-xs text-gray-500 mt-0.5">{stats}</p>}
        {typeName && <p className="text-xs text-gray-400 mt-0.5">{typeName}</p>}
      </div>
    </Link>
  )
}

const INITIAL_LIMIT = 3

export default function DevelopmentPropertyList({ properties }: { properties: TokkoProperty[] }) {
  const [expanded, setExpanded] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const visible = expanded ? properties : properties.slice(0, INITIAL_LIMIT)
  const hasMore = properties.length > INITIAL_LIMIT

  function toggle() {
    if (expanded) {
      setExpanded(false)
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } else {
      setExpanded(true)
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div ref={topRef} />
      {visible.map((prop) => (
        <CompactPropertyCard key={prop.id} property={prop} />
      ))}

      {hasMore && (
        <button
          onClick={toggle}
          className="self-start mt-1 text-sm text-brand-green font-medium hover:underline flex items-center gap-1"
        >
          {expanded ? 'Ocultar propiedades' : 'Ver todas las propiedades disponibles'}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  )
}
