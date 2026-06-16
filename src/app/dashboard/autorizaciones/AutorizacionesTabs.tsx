'use client'
import { useState, useEffect } from 'react'
import AutorizacionClient from './AutorizacionClient'
import PropiedadesClient  from './PropiedadesClient'

type TabId = 'nueva' | 'propiedades'

export default function AutorizacionesTabs() {
  const [active,   setActive]   = useState<TabId>('nueva')
  const [pending,  setPending]  = useState(0)

  useEffect(() => {
    let initialLoad = true

    const refresh = () => {
      fetch('/api/autorizaciones')
        .then(r => r.ok ? r.json() : [])
        .then((auths: { propiedadId: string | null }[]) => {
          const count = auths.filter(a => !a.propiedadId).length
          setPending(count)
          if (initialLoad && count > 0) {
            setActive('propiedades')
            initialLoad = false
          }
        })
        .catch(() => {})
    }

    refresh()
    // Poll every 30s so new digital signatures appear without manual refresh
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-7">
        {(['nueva', 'propiedades'] as const).map(id => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition ${
              active === id
                ? 'bg-white text-brand-green shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {id === 'nueva' ? 'Nueva autorización' : 'Mis propiedades'}
            {id === 'propiedades' && pending > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {active === 'nueva'       && <AutorizacionClient />}
      {active === 'propiedades' && <PropiedadesClient />}
    </div>
  )
}
