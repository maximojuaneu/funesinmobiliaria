'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gtagEvent } from '@/lib/gtag'

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
  const [operacion, setOperacion] = useState<'venta' | 'alquiler'>('venta')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')

  function handleBuscar() {
    const params = new URLSearchParams()
    if (type)     params.set('type', type)
    if (location) params.set('location', location)
    gtagEvent('search', { operacion, type, location })
    const query = params.toString()
    router.push(`/${operacion}${query ? `?${query}` : ''}`)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto text-left">
      {/* Operación toggle */}
      <div className="flex gap-1 mb-5">
        {(['venta', 'alquiler'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setOperacion(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              operacion === t
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
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

        <input
          className="input-field"
          placeholder="Dirección o barrio"
          value={location}
          onChange={e => setLocation(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBuscar()}
        />

        <button
          type="button"
          onClick={handleBuscar}
          className="btn-primary text-center rounded-lg"
        >
          Buscar
        </button>
      </div>
    </div>
  )
}
