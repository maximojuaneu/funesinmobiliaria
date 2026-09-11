'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gtagEvent } from '@/lib/gtag'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'

// Values must match what Tokko / venta|alquiler pages expect via `type` param
const PROPERTY_TYPES = [
  { label: 'Casa',             value: 'House' },
  { label: 'Departamento',     value: 'Apartment' },
  { label: 'Terreno / Lote',   value: 'Land' },
  { label: 'Local comercial',  value: 'Bussiness Premises' },
  { label: 'Campo',            value: 'Countryside' },
  { label: 'Oficina',          value: 'Office' },
]

export default function HeroSearch() {
  const router = useRouter()
  const [operacion,  setOperacion] = useState<'venta' | 'alquiler' | 'temporario'>('venta')
  const [type,       setType]      = useState('')
  const [locations,  setLocations] = useState<string[]>([])
  const pendingRef = useRef('')

  function handleBuscar(newLocations?: string[]) {
    const pending = pendingRef.current.trim()
    const base = newLocations ?? locations
    const locs = pending && !base.includes(pending) ? [...base, pending] : base
    pendingRef.current = ''
    const params = new URLSearchParams()
    if (type)        params.set('type', type)
    if (locs.length) params.set('location', locs.join(','))
    if (operacion === 'temporario') params.set('temp', '1')
    gtagEvent('search', { operacion, type, location: locs.join(',') })
    const query = params.toString()
    const basePath = operacion === 'temporario' ? '/alquiler' : `/${operacion}`
    router.push(`${basePath}${query ? `?${query}` : ''}`)
  }

  const TABS: { value: 'venta' | 'alquiler' | 'temporario'; label: string }[] = [
    { value: 'venta',      label: 'Venta' },
    { value: 'alquiler',   label: 'Alquiler' },
    { value: 'temporario', label: 'Temporario' },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto text-left">
      {/* Operación toggle */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setOperacion(t.value)}
            className={`px-3 py-2 sm:px-5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              operacion === t.value
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          className="input-field"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="">Tipo de propiedad</option>
          {PROPERTY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <LocationAutocomplete
          className="input-field"
          placeholder="Ciudad, barrio, dirección"
          values={locations}
          onChangeMulti={setLocations}
          maxValues={3}
          onEnter={handleBuscar}
          onQueryChange={q => { pendingRef.current = q }}
        />

        <button
          type="button"
          onClick={() => handleBuscar()}
          className="btn-primary text-center rounded-lg"
        >
          Buscar
        </button>
      </div>
    </div>
  )
}
