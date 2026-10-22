'use client'

import { useLayoutEffect, useEffect, useRef } from 'react'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface Props {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section'
  // Retraso en ms, para escalonar elementos hermanos.
  delay?: number
}

// Hace que un bloque aparezca suavemente al llegar a él con el scroll.
// El contenido es visible por defecto (HTML del servidor): solo se oculta, antes de pintar, lo que
// está debajo de la primera pantalla. Así lo principal no se demora, nada se tapa si falla el
// JavaScript y no se anima para quien tiene activado "reducir movimiento".
export default function Reveal({ children, className, as: Tag = 'div', delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.96) return

    el.classList.add('reveal-hidden')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.classList.add('reveal-in')
        io.disconnect()
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
