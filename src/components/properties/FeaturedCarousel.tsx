'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice, getMainPhoto } from '@/lib/tokko'

const GAP = 20

function CarouselCard({ property }: { property: TokkoProperty }) {
  const opType  = property.operations[0]?.operation_type
  const price   = getOperationPrice(property, opType)
  const photo   = getMainPhoto(property)
  const address = (property as any).fake_address || property.address
  const city    = property.location?.full_location?.split(' | ')[2] ?? ''

  return (
    <Link
      href={`/propiedades/${property.id}`}
      className="featured-card group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0"
    >
      <div className="featured-card-img relative overflow-hidden bg-gray-100">
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

  const trackRef    = useRef<HTMLDivElement>(null)
  const xRef        = useRef(0)
  const isDragging  = useRef(false)
  const lastClientX = useRef(0)
  const velocityRef = useRef(0)
  const didDragRef  = useRef(false)   // distingue click real de drag
  const rafRef      = useRef<number>(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const getTotal = () => {
      const firstCard = track.children[0] as HTMLElement | null
      const cardW = firstCard?.offsetWidth ?? 320
      return (cardW + GAP) * properties.length
    }

    const autoSpeed = () => (window.innerWidth <= 640 ? 0.6 : 0.8)

    const tick = () => {
      const total = getTotal()

      if (isDragging.current) {
        // position updated by pointer/touch handlers
      } else if (Math.abs(velocityRef.current) > 0.15) {
        xRef.current += velocityRef.current
        velocityRef.current *= 0.93
      } else {
        velocityRef.current = 0
        xRef.current -= autoSpeed()
      }

      if (xRef.current < -total) xRef.current += total
      if (xRef.current > 0)      xRef.current -= total

      track.style.transform = `translateX(${xRef.current}px)`
      rafRef.current = requestAnimationFrame(tick)
    }

    // Mouse drag — listeners on window so fast moves don't escape the element
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastClientX.current
      if (Math.abs(dx) > 2) didDragRef.current = true
      lastClientX.current = e.clientX
      xRef.current += dx
      velocityRef.current = dx
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      track.style.cursor = 'grab'
    }

    // Trackpad two-finger horizontal scroll
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return // ignore vertical scroll
      e.preventDefault()
      xRef.current -= e.deltaX
      velocityRef.current = -e.deltaX * 0.3
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    track.addEventListener('wheel', onWheel, { passive: false })

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      track.removeEventListener('wheel', onWheel)
    }
  }, [properties.length])

  // ── Touch ──
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    lastClientX.current = e.touches[0].clientX
    velocityRef.current = 0
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - lastClientX.current
    lastClientX.current = e.touches[0].clientX
    xRef.current += dx
    velocityRef.current = dx
  }

  const onTouchEnd = () => { isDragging.current = false }

  // ── Mouse ──
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current  = true
    didDragRef.current  = false
    lastClientX.current = e.clientX
    velocityRef.current = 0
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing'
  }

  // Block link navigation when the user actually dragged (not just clicked)
  const onClickCapture = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
      didDragRef.current = false
    }
  }

  return (
    <div className="overflow-hidden">
      <style>{`
        .featured-card     { width: 320px; }
        .featured-card-img { height: 208px; }
        @media (max-width: 640px) {
          .featured-card     { width: 200px; }
          .featured-card-img { height: 134px; }
        }
      `}</style>

      <div
        ref={trackRef}
        className="flex will-change-transform select-none"
        style={{ gap: `${GAP}px`, width: 'max-content', cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Original */}
        {properties.map(p => <CarouselCard key={p.id} property={p} />)}
        {/* Duplicate for seamless loop */}
        {properties.map(p => <CarouselCard key={`d-${p.id}`} property={p} />)}
      </div>
    </div>
  )
}
