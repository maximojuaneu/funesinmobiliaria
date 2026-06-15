'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice, getMainPhoto } from '@/lib/tokko'

function CarouselCard({ property }: { property: TokkoProperty }) {
  const opType  = property.operations[0]?.operation_type
  const price   = getOperationPrice(property, opType)
  const photo   = getMainPhoto(property)
  const address = (property as any).fake_address || property.address
  const city    = property.location?.full_location?.split(' | ')[2] ?? ''

  return (
    <Link
      href={`/propiedades/${property.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0"
      style={{ width: '320px' }}
    >
      <div className="relative overflow-hidden bg-gray-100" style={{ height: '208px' }}>
        <Image
          src={photo}
          alt={property.publication_title || property.address}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="320px"
        />
        {opType && (
          <span className={`absolute top-3 left-3 ${opType === 'Sale' ? 'tag-venta' : 'tag-alquiler'}`}>
            {opType === 'Sale' ? 'VENTA' : 'ALQUILER'}
          </span>
        )}
        {property.is_starred_on_web && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">DESTACADA</span>
        )}
      </div>
      <div className="p-4">
        {price && (
          <p className="text-xl font-bold text-gray-900 mb-1">
            {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
          </p>
        )}
        <p className="text-sm font-medium text-gray-700 truncate">{address}</p>
        {city && <p className="text-sm text-gray-500 truncate">{city}</p>}
      </div>
    </Link>
  )
}

export default function FeaturedCarousel({ properties }: { properties: TokkoProperty[] }) {
  if (!properties.length) return null

  // Each card: 320px wide + 20px gap = 340px per card
  const totalWidth = 340 * properties.length

  return (
    <div className="overflow-hidden">
      <style>{`
        @keyframes featured-scroll {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-${totalWidth}px) }
        }
        .featured-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: featured-scroll ${properties.length * 4}s linear infinite;
          will-change: transform;
        }
      `}</style>

      <div className="featured-track">
        {/* Original */}
        {properties.map(p => <CarouselCard key={p.id} property={p} />)}
        {/* Duplicate for seamless loop */}
        {properties.map(p => <CarouselCard key={`d-${p.id}`} property={p} />)}
      </div>
    </div>
  )
}
