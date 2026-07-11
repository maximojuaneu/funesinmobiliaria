'use client'

import { useState, useEffect } from 'react'

const IMAGES = ['/hero-banner.png', '/hero-banner-2.png']
const STORAGE_KEY = 'hero_last_index'

export default function HeroVideo() {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
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
