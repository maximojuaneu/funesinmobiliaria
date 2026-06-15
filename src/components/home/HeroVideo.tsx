'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEOS = [
  '/hero-video.mp4',
  '/hero-video-2.mp4',
  '/hero-video-3.mp4',
]

const FADE_MS = 1500

export default function HeroVideo() {
  const [mounted, setMounted] = useState(false)
  const [front, setFront] = useState<'a' | 'b'>('a')
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const refA = useRef<HTMLVideoElement>(null)
  const refB = useRef<HTMLVideoElement>(null)
  const indexRef = useRef(0)
  const fadingRef = useRef(false)
  const preloadedRef = useRef(false)

  useEffect(() => {
    indexRef.current = Math.floor(Math.random() * VIDEOS.length)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const v = refA.current
    if (!v) return
    v.src = VIDEOS[indexRef.current]
    v.load()
    v.play().catch(() => {})
  }, [mounted])

  function handleTimeUpdate(slot: 'a' | 'b') {
    if (fadingRef.current || preloadedRef.current) return
    const video = (slot === 'a' ? refA : refB).current
    if (!video || !isFinite(video.duration)) return
    if (video.currentTime >= video.duration - 3) {
      preloadedRef.current = true
      const nextSlot: 'a' | 'b' = slot === 'a' ? 'b' : 'a'
      const nextIndex = (indexRef.current + 1) % VIDEOS.length
      const nextVideo = (nextSlot === 'a' ? refA : refB).current
      if (nextVideo) {
        nextVideo.src = VIDEOS[nextIndex]
        nextVideo.load()
      }
    }
  }

  function handleEnded(slot: 'a' | 'b') {
    if (fadingRef.current) return
    fadingRef.current = true
    preloadedRef.current = false

    const nextSlot: 'a' | 'b' = slot === 'a' ? 'b' : 'a'
    const nextIndex = (indexRef.current + 1) % VIDEOS.length
    indexRef.current = nextIndex

    const nextVideo = (nextSlot === 'a' ? refA : refB).current
    if (nextVideo) {
      if (!nextVideo.src.endsWith(VIDEOS[nextIndex])) {
        nextVideo.src = VIDEOS[nextIndex]
        nextVideo.load()
      }
      nextVideo.play().catch(() => {})
    }

    if (slot === 'a') {
      setOpacityA(0)
      setOpacityB(1)
    } else {
      setOpacityA(1)
      setOpacityB(0)
    }
    setFront(nextSlot)

    setTimeout(() => { fadingRef.current = false }, FADE_MS + 100)
  }

  if (!mounted) return null

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={refA}
        muted
        playsInline
        poster="/vista-aerea-banner.jpg"
        onTimeUpdate={() => handleTimeUpdate('a')}
        onEnded={() => handleEnded('a')}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: opacityA,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
          zIndex: front === 'a' ? 1 : 0,
        }}
      />
      <video
        ref={refB}
        muted
        playsInline
        onTimeUpdate={() => handleTimeUpdate('b')}
        onEnded={() => handleEnded('b')}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: opacityB,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
          zIndex: front === 'b' ? 1 : 0,
        }}
      />
    </div>
  )
}
