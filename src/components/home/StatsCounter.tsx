'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  prefix?: string
  end: number | null
  label: string
  symbol?: string
}

const stats: Stat[] = [
  { prefix: '+', end: 45, label: 'Años de experiencia' },
  { prefix: '+', end: 1000, label: 'Operaciones concretadas' },
  { end: null, symbol: '✓', label: 'Corredores matriculados' },
]

function useCountUp(end: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, end, duration])

  return value
}

function CountStat({ stat, active }: { stat: Stat; active: boolean }) {
  const duration = stat.end && stat.end >= 500 ? 2000 : 1500
  const count = useCountUp(stat.end ?? 0, duration, active && stat.end !== null)

  return (
    <div className="flex flex-col items-center">
      <p className="text-5xl font-extrabold text-brand-green mb-2">
        {stat.end === null
          ? stat.symbol
          : `${stat.prefix ?? ''}${count.toLocaleString('es-AR')}`}
      </p>
      <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
    </div>
  )
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect() } },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-3xl mx-auto">
      {stats.map(stat => (
        <CountStat key={stat.label} stat={stat} active={active} />
      ))}
    </div>
  )
}
