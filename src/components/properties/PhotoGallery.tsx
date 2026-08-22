'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Photo { image: string; is_blueprint?: boolean }
interface Props  { photos: Photo[]; title: string }

export default function PhotoGallery({ photos, title }: Props) {
  const [open, setOpen]           = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while gallery or lightbox is open
  useEffect(() => {
    document.body.style.overflow = (open || lightboxIdx !== null) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, lightboxIdx])

  // Keyboard: Escape closes, arrows navigate lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx !== null) {
        if (e.key === 'Escape')      { setLightboxIdx(null); return }
        if (e.key === 'ArrowRight')  setLightboxIdx(i => i !== null ? Math.min(i + 1, photos.length - 1) : i)
        if (e.key === 'ArrowLeft')   setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : i)
      } else if (open && e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, lightboxIdx, photos.length])

  const openLightbox = useCallback((idx: number) => setLightboxIdx(idx), [])
  const closeLightbox = useCallback(() => setLightboxIdx(null), [])

  if (!photos.length) {
    return (
      <div className="h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
        Sin fotos disponibles
      </div>
    )
  }

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
      {/* ── Thumbnail grid ── */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[260px] sm:h-[480px]">
        <button onClick={() => setOpen(true)} className="col-span-3 row-span-2 relative overflow-hidden group">
          <Image src={photos[0].image} alt={title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="75vw" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        {photos.slice(1, 3).map((ph, j) => (
          <button key={j} onClick={() => setOpen(true)} className="relative overflow-hidden group">
            <Image src={ph.image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {j === 1 && photos.length > 3 && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">+{photos.length - 3} fotos</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Full-screen scroll gallery ── */}
      {open && (
        <div className={`fixed inset-0 z-[1100] bg-black flex flex-col${lightboxIdx !== null ? ' invisible' : ''}`}>
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
                      className="relative w-full rounded-xl overflow-hidden bg-white/5 cursor-zoom-in group block"
                    >
                      <img
                        src={ph.image}
                        alt={`${title} — foto ${row.idx + 1}`}
                        className="w-full h-auto block group-hover:brightness-90 transition-[filter] duration-200"
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
        <div
          className="fixed inset-0 z-[1200] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
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
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
            {lightboxIdx + 1} / {photos.length}
          </div>

          {/* Prev arrow */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}
              aria-label="Foto anterior"
              className="fixed left-3 top-1/2 -translate-y-1/2 z-[1300] w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {lightboxIdx < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}
              aria-label="Foto siguiente"
              className="fixed right-3 top-1/2 -translate-y-1/2 z-[1300] w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="max-w-5xl max-h-[90vh] w-full px-16 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={photos[lightboxIdx].image}
              alt={`${title} — foto ${lightboxIdx + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  )
}
