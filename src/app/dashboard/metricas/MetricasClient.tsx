'use client'

import { useEffect, useState, useCallback } from 'react'
import type { GaData } from '@/lib/analytics'

const PRESETS = [
  { label: 'Hoy',          start: 'today',      end: 'today' },
  { label: 'Ayer',         start: 'yesterday',  end: 'yesterday' },
  { label: '7 días',       start: '7daysAgo',   end: 'today' },
  { label: '30 días',      start: '30daysAgo',  end: 'today' },
  { label: '90 días',      start: '90daysAgo',  end: 'today' },
  { label: 'Este año',     start: 'startOfYear', end: 'today' },
]

function toApiDate(val: string): string {
  if (!val.includes('-')) return val
  return val  // already YYYY-MM-DD which GA accepts
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function startOfYear() {
  return `${new Date().getFullYear()}-01-01`
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

const DEVICE_COLOR: Record<string, string> = {
  Mobile:  'bg-blue-500',
  Desktop: 'bg-brand-green',
  Tablet:  'bg-purple-500',
}

const SOURCE_COLOR: Record<string, string> = {
  'Google orgánico':        'bg-blue-500',
  'Directo':                'bg-gray-500',
  'Redes sociales':         'bg-pink-500',
  'Redes sociales (pago)':  'bg-rose-400',
  'Referidos':              'bg-orange-400',
  'Email':                  'bg-amber-500',
  'Google Ads':             'bg-green-500',
}

export default function MetricasClient() {
  const [activePreset, setActivePreset] = useState('30 días')
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate,   setEndDate]   = useState(todayStr())
  const [apiStart,  setApiStart]  = useState('30daysAgo')
  const [apiEnd,    setApiEnd]    = useState('today')
  const [data,      setData]      = useState<GaData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/analytics?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load with 30-day default
  useEffect(() => { fetchData('30daysAgo', 'today') }, [fetchData])

  function applyPreset(preset: typeof PRESETS[number]) {
    setActivePreset(preset.label)
    let s = preset.start
    let e = preset.end
    if (s === 'startOfYear') s = startOfYear()
    if (e === 'today') e = todayStr()
    if (s === 'today') s = todayStr()
    if (s === 'yesterday') { const d = new Date(); d.setDate(d.getDate()-1); s = d.toISOString().slice(0,10) }
    if (e === 'yesterday') { const d = new Date(); d.setDate(d.getDate()-1); e = d.toISOString().slice(0,10) }
    setStartDate(s)
    setEndDate(e)
    setApiStart(preset.start === 'startOfYear' ? startOfYear() : preset.start)
    setApiEnd(preset.end)
    fetchData(preset.start === 'startOfYear' ? startOfYear() : preset.start, preset.end)
  }

  function applyCustomRange() {
    setActivePreset('')
    fetchData(toApiDate(startDate), toApiDate(endDate))
    setApiStart(startDate)
    setApiEnd(endDate)
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Métricas del sitio</h1>
        <p className="text-gray-500 text-sm mt-1">Datos de Google Analytics en tiempo real</p>
      </div>

      {/* Date range selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activePreset === p.label
                  ? 'bg-brand-green text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">Desde</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => { setStartDate(e.target.value); setActivePreset('') }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">Hasta</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr()}
              onChange={e => { setEndDate(e.target.value); setActivePreset('') }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <button
            onClick={applyCustomRange}
            disabled={loading}
            className="px-4 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-28">
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Overview ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Usuarios totales',         value: data.overview.totalUsers.toLocaleString('es-AR'),              sub: 'visitas únicas',       color: 'text-brand-green' },
              { label: 'Usuarios nuevos',           value: data.overview.newUsers.toLocaleString('es-AR'),                sub: `${Math.round(data.overview.totalUsers > 0 ? (data.overview.newUsers/data.overview.totalUsers)*100 : 0)}% del total`, color: 'text-blue-600' },
              { label: 'Tiempo medio interacción', value: fmtDuration(data.overview.avgEngagementTimeSecs),               sub: 'por sesión',           color: 'text-purple-600' },
              { label: 'Tasa de interacción',      value: `${data.overview.engagementRate}%`,                             sub: 'sesiones con interacción', color: data.overview.engagementRate >= 60 ? 'text-emerald-600' : data.overview.engagementRate >= 40 ? 'text-amber-600' : 'text-red-500' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 leading-tight">{card.label}</p>
                <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Fuente de tráfico + Dispositivos ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-1">Fuente de tráfico</h2>
              <p className="text-xs text-gray-400 mb-5">De dónde llegan los visitantes</p>
              {data.trafficSources.length === 0
                ? <p className="text-gray-400 text-sm">Sin datos para el período seleccionado.</p>
                : <div className="space-y-3">
                    {data.trafficSources.map(s => (
                      <div key={s.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${SOURCE_COLOR[s.source] ?? 'bg-gray-400'}`} />
                            {s.source}
                          </span>
                          <span className="text-gray-500 text-xs">{s.pct}% · {s.sessions.toLocaleString('es-AR')} ses.</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${SOURCE_COLOR[s.source] ?? 'bg-gray-400'}`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-1">Dispositivos</h2>
              <p className="text-xs text-gray-400 mb-5">Desde dónde acceden los usuarios</p>
              {data.devices.length === 0
                ? <p className="text-gray-400 text-sm">Sin datos para el período seleccionado.</p>
                : <div className="space-y-4">
                    {data.devices.map(d => (
                      <div key={d.device}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{d.device}</span>
                          <span className="text-gray-500">{d.pct}% · {d.sessions.toLocaleString('es-AR')} ses.</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${DEVICE_COLOR[d.device] ?? 'bg-gray-400'}`} style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* ── Páginas más visitadas + Landing pages ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Páginas más visitadas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Por vistas de página</p>
              </div>
              <div className="divide-y divide-gray-50">
                {data.topPages.length === 0
                  ? <p className="px-6 py-4 text-gray-400 text-sm">Sin datos para el período.</p>
                  : data.topPages.map((p, i) => (
                      <div key={p.path} className="flex items-center gap-3 px-6 py-3">
                        <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800 truncate" title={p.path}>{p.label}</span>
                        <span className="text-sm font-bold text-brand-green flex-shrink-0">{p.views.toLocaleString('es-AR')}</span>
                      </div>
                    ))
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Landing pages</h2>
                <p className="text-xs text-gray-400 mt-0.5">Primera página vista en cada sesión</p>
              </div>
              <div className="divide-y divide-gray-50">
                {data.landingPages.length === 0
                  ? <p className="px-6 py-4 text-gray-400 text-sm">Sin datos para el período.</p>
                  : data.landingPages.map((p, i) => (
                      <div key={p.path} className="flex items-center gap-3 px-6 py-3">
                        <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800 truncate" title={p.path}>{p.label}</span>
                        <span className="text-sm font-bold text-blue-600 flex-shrink-0">{p.sessions.toLocaleString('es-AR')}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* ── Fichas de propiedades ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Fichas de propiedades más visitadas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Páginas individuales de propiedades</p>
            </div>
            <div className="divide-y divide-gray-50">
              {data.propertyPages.length === 0
                ? <p className="px-6 py-4 text-gray-400 text-sm">Sin visitas a fichas de propiedades en el período seleccionado.</p>
                : data.propertyPages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-3 px-6 py-3">
                      <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.label || `Propiedad ${p.id}`}</p>
                        <p className="text-xs text-gray-400 truncate">{p.path}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-600 flex-shrink-0">{p.views.toLocaleString('es-AR')}</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* ── Ciudades ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Ciudad de origen de los visitantes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Top 10 ciudades por usuarios</p>
            </div>
            {data.cities.length === 0
              ? <p className="px-6 py-4 text-gray-400 text-sm">Sin datos para el período.</p>
              : (() => {
                  const max = Math.max(...data.cities.map(c => c.sessions), 1)
                  return (
                    <div className="divide-y divide-gray-50">
                      {data.cities.map((c, i) => (
                        <div key={c.city} className="flex items-center gap-3 px-6 py-3">
                          <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                          <span className="w-32 text-sm font-medium text-gray-800 flex-shrink-0">{c.city}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green/60 rounded-full" style={{ width: `${Math.round((c.sessions / max) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-700 w-10 text-right flex-shrink-0">{c.sessions.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()
            }
          </div>
        </>
      )}
    </div>
  )
}
