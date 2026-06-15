'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const PROPERTY_TYPES: { label: string; value: string }[] = [
  { label: 'Casa',             value: 'House' },
  { label: 'Departamento',     value: 'Apartment' },
  { label: 'Terreno / Lote',   value: 'Land' },
  { label: 'Local comercial',  value: 'Bussiness Premises' },
  { label: 'Oficina',          value: 'Office' },
  { label: 'Campo',            value: 'Countryside' },
  { label: 'Depósito',         value: 'Warehouse' },
]

const SUITE_OPTIONS = [
  { label: 'Mono', value: '0' },
  { label: '1',    value: '1' },
  { label: '2',    value: '2' },
  { label: '3',    value: '3' },
  { label: '4+',   value: '4' },
]

const OPERATION_OPTIONS = [
  { label: 'Venta',               value: 'Sale' },
  { label: 'Alquiler',            value: 'Rent' },
  { label: 'Alquiler Temporario', value: 'TempRent' },
]

interface Props {
  operationType: 'Sale' | 'Rent' | 'TempRent'
  mobile?: boolean
  onClose?: () => void
}

export default function PropertyFilters({ operationType, mobile, onClose }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const parseSuites = (raw: string | null) =>
    raw ? raw.split(',').filter(Boolean) : []

  const [operation, setOperation] = useState(operationType)
  const [type,      setType]      = useState(searchParams.get('type')      ?? '')
  const [suites,    setSuites]    = useState<string[]>(parseSuites(searchParams.get('suites')))
  const [location,  setLocation]  = useState(searchParams.get('location')  ?? '')
  const [priceFrom, setPriceFrom] = useState(searchParams.get('priceFrom') ?? '')
  const [priceTo,   setPriceTo]   = useState(searchParams.get('priceTo')   ?? '')

  useEffect(() => {
    setOperation(operationType)
    setType(searchParams.get('type')           ?? '')
    setSuites(parseSuites(searchParams.get('suites')))
    setLocation(searchParams.get('location')   ?? '')
    setPriceFrom(searchParams.get('priceFrom') ?? '')
    setPriceTo(searchParams.get('priceTo')     ?? '')
  }, [searchParams, operationType])

  const toggleSuite = (value: string) =>
    setSuites(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )

  const buildParams = (op: string) => {
    const values: Record<string, string> = {
      type,
      suites: suites.join(','),
      location,
      priceFrom,
      priceTo,
    }
    if (op === 'TempRent') values.temp = '1'
    const currentView = searchParams.get('view')
    if (currentView === 'map') values.view = 'map'
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v)
    }
    return params.toString()
  }

  const basePath = (op: string) => op === 'Sale' ? '/venta' : '/alquiler'

  const applyFilters = () => {
    const qs = buildParams(operation)
    router.push(`${basePath(operation)}${qs ? `?${qs}` : ''}`, { scroll: false })
    onClose?.()
  }

  const clearAll = () => {
    setType(''); setSuites([]); setLocation(''); setPriceFrom(''); setPriceTo('')
    router.push(basePath(operation))
  }

  if (mobile) return (
    <div className="p-5 space-y-5">

      {/* Tipo de operación */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de operación</label>
        <select
          className="input-field"
          value={operation}
          onChange={e => setOperation(e.target.value as 'Sale' | 'Rent' | 'TempRent')}
        >
          {OPERATION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tipo de propiedad */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de propiedad</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setType('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              type === '' ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-600'
            }`}
          >Todas</button>
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(type === t.value ? '' : t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                type === t.value ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-600'
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Dormitorios */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dormitorios</label>
        <div className="flex gap-2 flex-wrap">
          {SUITE_OPTIONS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleSuite(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                suites.includes(s.value) ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-600'
              }`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rango de precio</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input-field"
            type="number"
            placeholder="Mín"
            value={priceFrom}
            onChange={e => setPriceFrom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Máx"
            value={priceTo}
            onChange={e => setPriceTo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
          />
        </div>
      </div>

      {/* Barrio */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Barrio / Ciudad</label>
        <input
          className="input-field"
          placeholder="Ej: Funes, Roldán, Rosario"
          value={location}
          onChange={e => setLocation(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
        />
      </div>

      {/* CTA */}
      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full btn-primary text-center py-3 text-base"
        >
          Ver propiedades
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="w-full text-sm text-gray-400 hover:text-brand-green underline"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )

  return (
    <aside className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-24">

      {/* Header + buttons */}
      <div className="p-5 border-b border-gray-100 space-y-3">
        <h3 className="font-bold text-gray-900 font-sans">Filtros</h3>
        <button
          type="button"
          onClick={applyFilters}
          className="w-full btn-primary text-center py-2.5"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="w-full text-sm text-gray-400 hover:text-brand-green underline"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Filter fields */}
      <div className="p-5 space-y-5">

        {/* Tipo de operación */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de operación</label>
          <select
            className="input-field"
            value={operation}
            onChange={e => setOperation(e.target.value as 'Sale' | 'Rent' | 'TempRent')}
          >
            {OPERATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Tipo de propiedad */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de propiedad</label>
          <select
            className="input-field"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="">Todos</option>
            {PROPERTY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Barrio / Ciudad — Enter aplica filtros */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Barrio / Ciudad</label>
          <input
            className="input-field"
            placeholder="Ej: Funes, Roldán, Rosario"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
          />
        </div>

        {/* Precio */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input-field"
              type="number"
              placeholder="Desde"
              value={priceFrom}
              onChange={e => setPriceFrom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
            />
            <input
              className="input-field"
              type="number"
              placeholder="Hasta"
              value={priceTo}
              onChange={e => setPriceTo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyFilters() }}
            />
          </div>
        </div>

        {/* Dormitorios */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dormitorios</label>
          <div className="flex gap-2 flex-wrap">
            {SUITE_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSuite(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  suites.includes(s.value)
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'border-gray-200 text-gray-600 hover:border-brand-green'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </aside>
  )
}
