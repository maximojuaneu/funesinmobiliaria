'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice, getOperationLabel } from '@/lib/tokko'

interface Props {
  property: TokkoProperty
  operationType?: 'Sale' | 'Rent' | 'Temporary Rent'
}

const TYPE_ES: Record<string, string> = {
  'House':             'Casa',
  'Apartment':         'Departamento',
  'Land':              'Terreno',
  'Bussiness Premises':'Local comercial',
  'Office':            'Oficina',
  'Countryside':       'Campo',
  'Warehouse':         'Depósito',
}

const m2 = (val: any) => { const n = parseFloat(val); return n > 0 ? Math.round(n) : null }
const mt = (val: any) => { const n = parseFloat(val); return n > 0 ? n : null }
const ha = (val: any) => { const n = parseFloat(val); return n > 0 ? (n / 10000).toFixed(2) : null }

function getStats(p: TokkoProperty): string {
  const type = p.type?.name

  if (type === 'Countryside') {
    return [
      ha(p.surface)       ? `${ha(p.surface)} ha`             : null,
      ha(p.total_surface) && p.total_surface !== p.surface
        ? `${ha(p.total_surface)} ha total`                    : null,
    ].filter(Boolean).join(' · ')
  }

  if (type === 'Land') {
    return [
      m2(p.surface)       ? `${m2(p.surface)} m² terreno`    : null,
      mt(p.front_measure) ? `${mt(p.front_measure)}m frente`  : null,
      mt(p.depth_measure) ? `${mt(p.depth_measure)}m fondo`   : null,
    ].filter(Boolean).join(' · ')
  }

  if (type === 'Apartment') {
    return [
      p.suite_amount      ? `${p.suite_amount} dorm.`          : null,
      p.bathroom_amount   ? `${p.bathroom_amount} baños`        : null,
      p.room_amount       ? `${p.room_amount} amb.`             : null,
      m2(p.roofed_surface)? `${m2(p.roofed_surface)} m² cub.`  : null,
    ].filter(Boolean).join(' · ')
  }

  return [
    p.suite_amount        ? `${p.suite_amount} dorm.`           : null,
    p.bathroom_amount     ? `${p.bathroom_amount} baños`         : null,
    m2(p.surface)         ? `${m2(p.surface)} m² terreno`       : null,
    m2(p.roofed_surface)  ? `${m2(p.roofed_surface)} m² cub.`   : null,
  ].filter(Boolean).join(' · ')
}

function getCity(p: TokkoProperty): string {
  const full = p.location?.full_location
  if (!full) return ''
  const parts = full.split(' | ')
  return parts[2] ?? parts[parts.length - 1] ?? ''
}

export default function PropertyCard({ property, operationType }: Props) {
  const opType  = operationType ?? property.operations[0]?.operation_type
  const price   = getOperationPrice(property, opType)
  const label   = opType ? getOperationLabel(opType) : null
  const stats   = getStats(property)
  const city    = getCity(property)
  const address = property.fake_address || property.address

  const allPhotos = (property.photos ?? []).filter(p => !p.is_blueprint)
  // Show first 3 real photos + optional "ver más" slide
  const photos   = allPhotos.slice(0, 3)
  const hasMore  = allPhotos.length > 3
  const total    = photos.length + (hasMore ? 1 : 0)   // virtual slide count
  const [idx, setIdx] = useState(0)
  const isMoreSlide = hasMore && idx === photos.length  // last virtual slide

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    setIdx(i => (i - 1 + total) % total)
  }
  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    setIdx(i => (i + 1) % total)
  }

  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) setIdx(i => (i + 1) % total)
    else setIdx(i => (i - 1 + total) % total)
  }

  const saveScroll = useCallback(() => {
    sessionStorage.setItem('prop-list-scroll', String(window.scrollY))
  }, [])

  return (
    <Link href={`/propiedades/${property.id}`} onClick={saveScroll} className="group block bg-white rounded-xl overflow-hidden shadow-sm md:hover:shadow-md md:hover:-translate-y-1 transition-all duration-200">
      <div
        className="relative h-52 overflow-hidden bg-gray-100"
        onTouchStart={total > 1 ? handleTouchStart : undefined}
        onTouchEnd={total > 1 ? handleTouchEnd : undefined}
      >

        {/* Pre-render all 3 real photos — instant switching via opacity */}
        {photos.length > 0 ? photos.map((photo, i) => (
          <Image
            key={photo.image}
            src={photo.image}
            alt={property.publication_title || property.address}
            fill
            className={`object-cover ${i > 0 ? 'hidden md:block' : ''}`}
            style={{ opacity: i === idx ? 1 : 0, transition: 'none' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={i === 0}
          />
        )) : (
          <div className="w-full h-full bg-gray-200" />
        )}

        {/* "Ver más fotos" virtual slide: blurred last photo + overlay */}
        {hasMore && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ opacity: isMoreSlide ? 1 : 0, transition: 'none', pointerEvents: isMoreSlide ? 'auto' : 'none' }}
          >
            {/* Blurred background using last photo */}
            <Image
              src={photos[photos.length - 1].image}
              alt=""
              fill
              className="object-cover"
              style={{ filter: 'blur(4px) brightness(0.45)', transform: 'scale(1.08)' }}
              sizes="33vw"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center gap-2 text-white pointer-events-none select-none">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-sm font-semibold tracking-wide">Ver más fotos</span>
              <span className="text-xs text-white/70">{allPhotos.length} fotos en total</span>
            </div>
          </div>
        )}

        {/* Arrows — desktop only, visible on hover */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Foto anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {!isMoreSlide && (
              <button
                onClick={next}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                aria-label="Foto siguiente"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}

            {/* Dots — desktop only */}
            <div className="hidden md:flex absolute bottom-2 left-0 right-0 justify-center gap-1 z-20">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all ${i === idx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {label && (
          <span className={`absolute top-3 left-3 ${opType === 'Sale' ? 'tag-venta' : 'tag-alquiler'} z-10`}>
            {label}
          </span>
        )}
        {property.is_starred_on_web && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            DESTACADA
          </span>
        )}
      </div>

      <div className="p-4">
        {price && (
          <p className="text-xl font-bold text-gray-900 mb-1">
            {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
          </p>
        )}
        <p className="text-sm font-medium text-gray-700 truncate">{address}</p>
        {city && <p className="text-sm text-gray-500 truncate mb-1">{city}</p>}
        {stats && <p className="text-sm text-gray-600 mt-1">{stats}</p>}
        {property.type?.name && (
          <p className="text-xs text-gray-400 mt-1">{TYPE_ES[property.type.name] ?? property.type.name}</p>
        )}
      </div>
    </Link>
  )
}
