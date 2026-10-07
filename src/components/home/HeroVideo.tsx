'use client'

import { useState, useEffect, useRef } from 'react'

const IMAGES = ['/hero-banner.jpg', '/hero-banner-2.jpg']
const STORAGE_KEY = 'hero_last_index'

export default function HeroVideo() {
  const [image, setImage] = useState<string | null>(null)
  const yaElegida = useRef(false)

  useEffect(() => {
    // En desarrollo React ejecuta el efecto dos veces; sin esta guarda la alternancia avanzaría dos pasos y mostraría siempre la misma foto.
    if (yaElegida.current) return
    yaElegida.current = true
    const stored = localStorage.getItem(STORAGE_KEY)
    const next = stored === null
      ? Math.round(Math.random())
      : (parseInt(stored, 10) + 1) % IMAGES.length
    localStorage.setItem(STORAGE_KEY, String(next))
    setImage(IMAGES[next])
  }, [])

  if (!image) return null

  return (
    <div
      className="absolute inset-0 w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url('${image}')` }}
    />
  )
}
