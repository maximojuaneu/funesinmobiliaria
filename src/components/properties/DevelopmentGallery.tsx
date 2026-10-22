'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Photo { image: string }
interface Props  { photos: Photo[]; title: string }

const SLIDE_MS = 350

export default function DevelopmentGallery({ photos, title }: Props) {
  const [open, setOpen]           = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [dragX, setDragX]         = useState(0)        // desplazamiento del dedo, en px
  const [settling, setSettling]   = useState(false)    // true mientras corre la animación de cambio
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef  = useRef<HTMLDivElement>(null)
  const touchRef  = useRef<{ x: number; y: number; t: number; axis: 'h' | 'v' | null } | null>(null)
  const movedRef  = useRef(false)

  // Lock body scroll while gallery or lightbox is open
  useEffect(() => {
    document.body.style.overflow = (open || lightboxIdx !== null) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, lightboxIdx])

  const openLightbox  = useCallback((idx: number) => { setDragX(0); setSettling(false); setLightboxIdx(idx) }, [])
  const closeLightbox = useCallback(() => { setLightboxIdx(null); setDragX(0); setSettling(false) }, [])

  // Pasa a la foto anterior/siguiente deslizando la pista con una transición suave. Sirve para el dedo,
  // las flechas y el teclado. Si no hay foto en esa dirección, hace un pequeño rebote.
  const slideTo = (dir: 1 | -1) => {
    if (lightboxIdx === null || settling) return
    const target = lightboxIdx + dir
    setSettling(true)
    if (target < 0 || target >= photos.length) {
      setDragX(0)
      window.setTimeout(() => setSettling(false), SLIDE_MS)
      return
    }
    const w = trackRef.current?.clientWidth ?? window.innerWidth
    setDragX(-dir * w)
    window.setTimeout(() => {
      // Al terminar, las fotos se reacomodan y la pista vuelve al centro sin animación (no se nota el salto).
      setSettling(false)
      setDragX(0)
      setLightboxIdx(target)
    }, SLIDE_MS)
  }
  const slideRef = useRef(slideTo)
  slideRef.current = slideTo

  // Keyboard: Escape closes, arrows navigate lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx !== null) {
        if (e.key === 'Escape')      { closeLightbox(); return }
        if (e.key === 'ArrowRight')  slideRef.current(1)
        if (e.key === 'ArrowLeft')   slideRef.current(-1)
      } else if (open && e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, lightboxIdx, closeLightbox])

  const onTouchStart = (e: React.TouchEvent) => {
    if (settling || e.touches.length > 1) return
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), axis: null }
    movedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const st = touchRef.current
    if (!st || lightboxIdx === null) return
    const t = e.touches[0]
    const dx = t.clientX - st.x, dy = t.clientY - st.y
    if (!st.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      st.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (st.axis !== 'h') return
    movedRef.current = true
    // En la primera/última foto el dedo "tira" con resistencia, para indicar que no hay más.
    const sinMas = (lightboxIdx === 0 && dx > 0) || (lightboxIdx === photos.length - 1 && dx < 0)
    setDragX(sinMas ? dx * 0.3 : dx)
  }
  const onTouchEnd = () => {
    const st = touchRef.current
    touchRef.current = null
    // El "clic" que el navegador genera justo al soltar tras arrastrar no debe cerrar el visor; se vuelve
    // a permitir un instante después.
    window.setTimeout(() => { movedRef.current = false }, 120)
    if (!st || st.axis !== 'h') return
    const w = trackRef.current?.clientWidth ?? window.innerWidth
    const rapido = Math.abs(dragX) / Math.max(Date.now() - st.t, 1) > 0.5
    const lejos  = Math.abs(dragX) > w * 0.2
    if ((lejos || rapido) && Math.abs(dragX) > 24) slideTo(dragX < 0 ? 1 : -1)
    else { setSettling(true); setDragX(0); window.setTimeout(() => setSettling(false), SLIDE_MS) }
  }

  if (!photos.length) return null

  // Build gallery rows: groups of [1 full-width, 2 side-by-side]
  const rows: Array<{ type: 'full'; idx: number } | { type: 'pair'; idxA: number; idxB: number }> = []
  let i = 0
  while (i < photos.length) {
    if (i % 3 === 0) {
      rows.push({ type: 'full', idx: i })
      i++
    } else {
      rows.push({ type: 'pair', idxA: i, idxB: i + 1 < photos.length ? i + 1 : -1 })
      i += 2
    }
  }

  return (
    <>
      {/* Square thumbnail grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {photos.map((photo, j) => (
          <button
            key={j}
            onClick={() => setOpen(true)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            <Image
              src={photo.image}
              alt={`${title} - foto ${j + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="16vw"
            />
            {j === photos.length - 1 && photos.length > 1 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">Ver todas</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Full-screen scroll gallery ── */}
      {open && (
        <div className={`fixed inset-0 z-[1100] bg-black flex flex-col animate-fade-soft${lightboxIdx !== null ? ' invisible' : ''}`}>
          {/* Fixed close button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar galería"
            className="fixed top-4 right-4 z-[1200] w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center px-6 py-4 flex-shrink-0 border-b border-white/10 mt-0">
            <p className="text-white/70 text-sm font-medium">{photos.length} fotos · {title}</p>
          </div>

          {/* Scrollable masonry-style column */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-2">
              {rows.map((row, ri) => {
                if (row.type === 'full') {
                  const ph = photos[row.idx]
                  return (
                    <button
                      key={ri}
                      onClick={() => openLightbox(row.idx)}
                      className="relative w-fit max-w-full mx-auto rounded-xl overflow-hidden bg-white/5 cursor-zoom-in group block"
                    >
                      <img
                        src={ph.image}
                        alt={`${title} — foto ${row.idx + 1}`}
                        className="w-auto h-auto max-w-full max-h-[60vh] block group-hover:brightness-90 transition-[filter] duration-200"
                        loading={row.idx === 0 ? 'eager' : 'lazy'}
                      />
                      <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                        {row.idx + 1} / {photos.length}
                      </span>
                    </button>
                  )
                } else {
                  return (
                    <div key={ri} className="grid grid-cols-2 gap-2">
                      {[row.idxA, row.idxB].map((idx) => {
                        if (idx === -1) return <div key="empty" />
                        const ph = photos[idx]
                        return (
                          <button
                            key={idx}
                            onClick={() => openLightbox(idx)}
                            className="relative rounded-xl overflow-hidden bg-white/5 cursor-zoom-in group block"
                          >
                            <img
                              src={ph.image}
                              alt={`${title} — foto ${idx + 1}`}
                              className="w-full h-auto block group-hover:brightness-90 transition-[filter] duration-200"
                              loading="lazy"
                            />
                            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
                              {idx + 1} / {photos.length}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[1200] bg-black/95 animate-fade-soft">
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Cerrar"
            className="fixed top-4 right-4 z-[1300] w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Counter */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1300] bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
            {lightboxIdx + 1} / {photos.length}
          </div>

          {/* Prev arrow */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); slideTo(-1) }}
              aria-label="Foto anterior"
              className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-[1300] w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {lightboxIdx < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); slideTo(1) }}
              aria-label="Foto siguiente"
              className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-[1300] w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}

          {/* Pista deslizable: foto anterior, actual y siguiente. En celular la foto ocupa todo el ancho. */}
          <div
            ref={trackRef}
            className="absolute inset-0 overflow-hidden"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            <div
              className="flex h-full"
              style={{
                width: '300%',
                transform: `translateX(calc(-33.3333% + ${dragX}px))`,
                transition: settling ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
                willChange: 'transform',
              }}
            >
              {[lightboxIdx - 1, lightboxIdx, lightboxIdx + 1].map(i => (
                <div
                  key={i}
                  className="h-full flex items-center justify-center md:px-16"
                  style={{ width: '33.3333%' }}
                  onClick={() => { if (!movedRef.current) closeLightbox() }}
                >
                  {photos[i] && (
                    <img
                      src={photos[i].image}
                      alt={`${title} — foto ${i + 1}`}
                      className="max-w-full max-h-[90vh] md:max-w-4xl object-contain md:rounded-lg select-none"
                      draggable={false}
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
