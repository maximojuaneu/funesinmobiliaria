'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Photo { image: string; is_blueprint?: boolean }
interface Props  { photos: Photo[]; title: string }

export default function PhotoGallery({ photos, title }: Props) {
  const [open, setOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!photos.length) {
    return (
      <div className="h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
        Sin fotos disponibles
      </div>
    )
  }

  return (
    <>
      {/* ── Thumbnail grid ── */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[260px] sm:h-[480px]">
        <button onClick={() => setOpen(true)} className="col-span-3 row-span-2 relative overflow-hidden group">
          <Image src={photos[0].image} alt={title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="75vw" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        {photos.slice(1, 3).map((ph, i) => (
          <button key={i} onClick={() => setOpen(true)} className="relative overflow-hidden group">
            <Image src={ph.image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {i === 1 && photos.length > 3 && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">+{photos.length - 3} fotos</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Full-screen vertical scroll gallery ── */}
      {open && (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col" onClick={() => setOpen(false)}>
          {/* Fixed close button — always visible while scrolling */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar galería"
            className="fixed top-14 right-4 z-[1200] w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <p className="text-white/70 text-sm font-medium">{photos.length} fotos · {title}</p>
          </div>

          {/* Scrollable photo column */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              {photos.map((ph, i) => (
                <div key={i} className="relative w-full rounded-xl overflow-hidden bg-white/5">
                  {/* Natural-aspect image via img — no fixed height needed */}
                  <img
                    src={ph.image}
                    alt={`${title} — foto ${i + 1}`}
                    className="w-full h-auto block"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {i + 1} / {photos.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
