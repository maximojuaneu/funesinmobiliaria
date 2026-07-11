'use client'

import { useEffect, useRef, useState } from 'react'

export default function HeroVideo() {
  const [mounted, setMounted]           = useState(false)
  const [videoVisible, setVideoVisible] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const v = ref.current
    if (!v) return
    v.play().catch(() => {})
  }, [mounted])

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Imagen estática siempre visible — elimina el flash antes de que arranque el video */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: "url('/vista-aerea-banner.jpg')" }}
      />

      {mounted && (
        <video
          ref={ref}
          src="/hero-video-2.mp4"
          muted
          loop
          playsInline
          onCanPlay={() => setVideoVisible(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: videoVisible ? 1 : 0,
            transition: 'opacity 1500ms ease-in-out',
          }}
        />
      )}
    </div>
  )
}
