'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Photo { image: string }
interface Props  { photos: Photo[]; title: string }

export default function DevelopmentGallery({ photos, title }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!photos.length) return null

  return (
    <>
      {/* Square thumbnail grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setOpen(true)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            <Image
              src={photo.image}
              alt={`${title} - foto ${i + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="16vw"
            />
            {i === photos.length - 1 && photos.length > 1 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">Ver todas</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Full-screen vertical scroll lightbox */}
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

          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <p className="text-white/70 text-sm font-medium">{photos.length} fotos · {title}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              {photos.map((ph, i) => (
                <div key={i} className="relative w-full rounded-xl overflow-hidden bg-white/5">
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
