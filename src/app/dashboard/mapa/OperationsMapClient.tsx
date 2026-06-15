'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { ClosedOpRecord } from '@/app/api/dashboard/operations/route'

const STATUS_COLOR: Record<string, string> = {
  RESERVADA: '#d97706',
  VENDIDA:   '#067148',
}
const TIPOS = ['Casa', 'Terreno', 'Departamento', 'Local', 'Oficina', 'PH', 'Otro']

const EMPTY_FORM = {
  calle: '', numero: '', ciudad: '',
  fecha: '', tipo: 'Casa',
  valorPublicacion: '', valorCierre: '',
  tiempoComercializacion: '', captador: '', vendedor: '',
  status: 'RESERVADA' as 'RESERVADA' | 'VENDIDA',
}

function fmt(n: number) {
  return n ? `USD ${n.toLocaleString('es-AR')}` : '—'
}

async function geocode(calle: string, numero: string, ciudad: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${calle} ${numero}, ${ciudad}, Santa Fe, Argentina`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'FunesInmobiliaria/1.0' } }
    )
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export default function OperationsMapClient() {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapObjRef  = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const tempPinRef = useRef<any>(null)

  const [manualOps, setManualOps]     = useState<ClosedOpRecord[]>([])
  const [tokkoOps, setTokkoOps]       = useState<ClosedOpRecord[]>([])
  const [loadingTokko, setLoadingTokko] = useState(true)
  const [agents, setAgents]           = useState<{ id: number; name: string }[]>([])
  const [selected, setSelected]       = useState<ClosedOpRecord | null>(null)
  const [filter, setFilter]           = useState({ agente: '', tipo: '', desde: '', hasta: '', estado: '' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [pinCoords, setPinCoords]     = useState<{ lat: number; lng: number } | null>(null)
  const [pickingPin, setPickingPin]   = useState(false)
  const [geocoding, setGeocoding]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  // Merge manual + Tokko ops; deduplicate by tokkoId so a manual entry doesn't double with a Tokko one
  const ops = [
    ...tokkoOps,
    ...manualOps.filter(m => !m.tokkoId || !tokkoOps.some(t => t.tokkoId === m.tokkoId)),
  ]

  const fetchManual = useCallback(async () => {
    const res = await fetch('/api/dashboard/operations')
    if (res.ok) setManualOps(await res.json())
  }, [])

  const fetchTokko = useCallback(async () => {
    setLoadingTokko(true)
    try {
      const res = await fetch('/api/dashboard/operations/tokko')
      if (res.ok) setTokkoOps(await res.json())
    } finally {
      setLoadingTokko(false)
    }
  }, [])

  useEffect(() => {
    fetchManual()
    fetchTokko()
    fetch('/api/dashboard/agents')
      .then(r => r.ok ? r.json() : [])
      .then(setAgents)
      .catch(() => {})
  }, [fetchManual, fetchTokko])

  const filtered = ops.filter(op => {
    if (filter.agente && ![op.captador, op.vendedor].join('|').includes(filter.agente)) return false
    if (filter.tipo   && op.tipo !== filter.tipo)   return false
    if (filter.estado && op.status !== filter.estado) return false
    if (filter.desde  && op.fecha < filter.desde)   return false
    if (filter.hasta  && op.fecha > filter.hasta)   return false
    return true
  })

  // ── Address completeness ─────────────────────────────────────────────────────
  const addressComplete = form.calle.trim() !== '' && form.numero.trim() !== '' && form.ciudad.trim() !== ''

  // ── Map init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css' as any)
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return
      const map = L.map(mapRef.current).setView([-32.915, -60.815], 13)
      mapObjRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)
    }
    init()
    return () => { try { mapObjRef.current?.remove(); mapObjRef.current = null } catch {} }
  }, [])

  // ── Operation markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    import('leaflet').then(({ default: L }) => {
      filtered.forEach(op => {
        const color = STATUS_COLOR[op.status] ?? '#067148'
        const isTokko = op.source === 'tokko'

        let icon: any
        if (isTokko && op.photoUrl) {
          // Photo circle marker for Tokko ops
          icon = L.divIcon({
            html: `
              <div style="position:relative;width:46px;height:54px;">
                <div style="
                  width:46px;height:46px;border-radius:50%;overflow:hidden;
                  border:3px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,.35);
                  background:#e5e7eb;
                ">
                  <img src="${op.photoUrl}" style="width:100%;height:100%;object-fit:cover;"
                    onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;\\'>🏠</div>'" />
                </div>
                <div style="
                  position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                  width:10px;height:10px;border-radius:50%;
                  background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3);
                "></div>
              </div>`,
            className: '', iconSize: [46, 54], iconAnchor: [23, 54],
          })
        } else {
          // Standard teardrop pin for manual ops
          icon = L.divIcon({
            html: `<div style="background:${color};color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);font-size:13px">✓</span></div>`,
            className: '', iconSize: [30, 30], iconAnchor: [15, 30],
          })
        }

        const m = L.marker([op.lat, op.lng], { icon })
          .addTo(map)
          .on('click', () => { setSelected(op); setShowForm(false) })
        markersRef.current.push(m)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops, filter])

  // ── Temp pin helper ──────────────────────────────────────────────────────────
  function placeTempPin(lat: number, lng: number, color?: string) {
    const map = mapObjRef.current
    if (!map) return
    const pinColor = color ?? STATUS_COLOR[formRef.current.status] ?? '#d97706'
    import('leaflet').then(({ default: L }) => {
      if (tempPinRef.current) tempPinRef.current.remove()
      tempPinRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="background:${pinColor};color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);font-size:13px">✓</span></div>`,
          className: '', iconSize: [30, 30], iconAnchor: [15, 30],
        }),
        draggable: true,
      }).addTo(map).on('dragend', (e: any) => {
        const { lat: la, lng: ln } = e.target.getLatLng()
        setPinCoords({ lat: la, lng: ln })
      })
      map.panTo([lat, lng])
    })
  }

  function clearTempPin() {
    if (tempPinRef.current) { tempPinRef.current.remove(); tempPinRef.current = null }
    setPinCoords(null)
  }

  // ── Cursor crosshair when picking pin ───────────────────────────────────────
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return
    const container = map.getContainer() as HTMLElement
    if (pickingPin) {
      container.style.setProperty('cursor', 'crosshair', 'important')
    } else {
      container.style.removeProperty('cursor')
    }
  }, [pickingPin])

  // ── Map click (pick mode) ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return
    const onMapClick = (e: any) => {
      if (!pickingPin) return
      const { lat, lng } = e.latlng
      setPinCoords({ lat, lng })
      placeTempPin(lat, lng)
      setPickingPin(false)
    }
    map.on('click', onMapClick)
    return () => map.off('click', onMapClick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickingPin])

  // ── Address field change: reset pin when any part changes ────────────────────
  const handleAddressChange = (field: 'calle' | 'numero' | 'ciudad', value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    clearTempPin()
  }

  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])

  const handleAddressBlurLatest = async () => {
    const { calle, numero, ciudad } = formRef.current
    if (!calle.trim() || !numero.trim() || !ciudad.trim()) return
    if (pinCoords) return
    setGeocoding(true)
    const coords = await geocode(calle, numero, ciudad)
    setGeocoding(false)
    if (coords) { setPinCoords(coords); placeTempPin(coords.lat, coords.lng) }
  }

  const closeForm = () => {
    setShowForm(false); setForm(EMPTY_FORM); clearTempPin()
    setPickingPin(false); setSaveError('')
  }

  const handleSave = async () => {
    if (!pinCoords) { setSaveError('Ubicá la propiedad en el mapa primero'); return }
    if (!form.fecha) { setSaveError('Ingresá la fecha'); return }
    const address = `${form.calle} ${form.numero}, ${form.ciudad}`.trim()
    setSaving(true); setSaveError('')
    const res = await fetch('/api/dashboard/operations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address, lat: pinCoords.lat, lng: pinCoords.lng,
        fecha: form.fecha, tipo: form.tipo, status: form.status,
        valorPublicacion: Number(form.valorPublicacion) || 0,
        valorCierre: Number(form.valorCierre) || 0,
        tiempoComercializacion: Number(form.tiempoComercializacion) || 0,
        captador: form.captador, vendedor: form.vendedor,
      }),
    })
    setSaving(false)
    if (res.ok) { await fetchManual(); closeForm() } else { setSaveError('Error al guardar') }
  }

  const handleChangeStatus = async (op: ClosedOpRecord) => {
    if (op.source === 'tokko') return // Tokko ops are read-only
    const newStatus: 'RESERVADA' | 'VENDIDA' = op.status === 'RESERVADA' ? 'VENDIDA' : 'RESERVADA'
    const res = await fetch('/api/dashboard/operations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: op.id, status: newStatus }),
    })
    if (res.ok) {
      await fetchManual()
      setSelected(prev => prev?.id === op.id ? { ...prev, status: newStatus } : prev)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta operación?')) return
    await fetch('/api/dashboard/operations', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSelected(null); fetchManual()
  }

  // ── Agent select ─────────────────────────────────────────────────────────────
  const AgentSelect = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <select className="input-field text-sm" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder ?? 'Seleccionar agente'}</option>
      {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
    </select>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

      {/* ── Filter sidebar ── */}
      <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-100 lg:flex-shrink-0 flex flex-col">

        {/* Header — siempre visible; en mobile actúa como toggle */}
        <button
          className="flex items-center justify-between p-4 w-full text-left lg:cursor-default"
          onClick={() => setFiltersOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm">Filtros</h3>
            <span className="text-xs text-gray-400">{filtered.length} op.</span>
          </div>
          <svg
            className="lg:hidden w-4 h-4 text-gray-400 transition-transform"
            style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Contenido colapsable en mobile, siempre visible en desktop */}
        <div className={`${filtersOpen ? 'flex' : 'hidden'} lg:flex flex-col gap-2.5 px-4 pb-4`}>

          <select className="input-field text-sm py-2" value={filter.estado} onChange={e => setFilter(p => ({ ...p, estado: e.target.value }))}>
            <option value="">Estado</option>
            <option value="RESERVADA">Reservada</option>
            <option value="VENDIDA">Vendida</option>
          </select>

          <select className="input-field text-sm py-2" value={filter.tipo} onChange={e => setFilter(p => ({ ...p, tipo: e.target.value }))}>
            <option value="">Tipo</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>

          <select className="input-field text-sm py-2" value={filter.agente} onChange={e => setFilter(p => ({ ...p, agente: e.target.value }))}>
            <option value="">Agente</option>
            {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" className="input-field text-xs py-2 px-2"
              value={filter.desde} onChange={e => setFilter(p => ({ ...p, desde: e.target.value }))} />
            <input type="date" className="input-field text-xs py-2 px-2"
              value={filter.hasta} onChange={e => setFilter(p => ({ ...p, hasta: e.target.value }))} />
          </div>

          <button onClick={() => setFilter({ agente:'', tipo:'', desde:'', hasta:'', estado:'' })}
            className="text-xs text-gray-400 hover:text-brand-green underline text-left">Limpiar filtros</button>

          <div className="flex gap-3 py-1">
            {[['RESERVADA','Reservada'],['VENDIDA','Vendida']].map(([k,v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[k] }} />{v}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button onClick={() => { setShowForm(true); setSelected(null) }} className="w-full btn-primary text-sm py-2">
              + Nueva operación
            </button>
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ minHeight: 400, flex: '1 1 auto' }}>

        {pickingPin && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1100] bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg pointer-events-none">
            Hacé click en el mapa para fijar la ubicación
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" style={{ minHeight: 400 }} />

        {/* ── Detail popup ── */}
        {selected && !showForm && (
          <div className="absolute top-2 left-2 right-2 lg:top-auto lg:bottom-4 lg:left-4 lg:right-auto lg:w-72 bg-white rounded-xl shadow-xl z-[1000] border border-gray-100 overflow-hidden">

            {/* Photo header for Tokko ops */}
            {selected.source === 'tokko' && selected.photoUrl && (
              <div className="relative w-full h-36 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.photoUrl}
                  alt={selected.address}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tokko
                </span>
              </div>
            )}

            <div className="p-4">
              <button onClick={() => setSelected(null)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 text-xs">✕</button>

              <div className="flex items-center gap-2 mb-3 pr-6">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ background: STATUS_COLOR[selected.status] }}>
                  {selected.status === 'VENDIDA' ? 'Vendida' : 'Reservada'}
                </span>
                {selected.source !== 'tokko' && (
                  <button onClick={() => handleChangeStatus(selected)}
                    className="text-xs text-gray-400 hover:text-brand-green underline leading-none">
                    {selected.status === 'RESERVADA' ? 'Marcar como vendida →' : 'Volver a reservada'}
                  </button>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-3 text-sm">{selected.address}</h3>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {[
                  ['Fecha',        selected.fecha],
                  ['Tipo',         selected.tipo],
                  ['Val. pub.',    fmt(selected.valorPublicacion)],
                  ...(selected.source !== 'tokko' ? [
                    ['Val. cierre',  fmt(selected.valorCierre)],
                    ['Comercializ.', selected.tiempoComercializacion ? `${selected.tiempoComercializacion} días` : '—'],
                    ['Vendedor',     selected.vendedor || '—'],
                  ] : []),
                  ['Agente',       selected.captador || '—'],
                ].map(([k, v]) => (
                  <>
                    <dt key={`k-${k}`} className="text-gray-500 font-medium">{k}</dt>
                    <dd key={`v-${k}`} className="text-gray-900">{v}</dd>
                  </>
                ))}
              </dl>

              {selected.source !== 'tokko' && (
                <button onClick={() => handleDelete(selected.id)}
                  className="mt-3 text-xs text-red-400 hover:text-red-600 underline">Eliminar</button>
              )}
            </div>
          </div>
        )}

        {/* ── New operation panel ── */}
        {showForm && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-[1000] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">Nueva operación</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

              {/* Address fields */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dirección *</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  <div className="col-span-2">
                    <input className="input-field text-sm" placeholder="Calle"
                      value={form.calle}
                      onChange={e => handleAddressChange('calle', e.target.value)}
                      onBlur={handleAddressBlurLatest} />
                  </div>
                  <div>
                    <input className="input-field text-sm" placeholder="Nº"
                      value={form.numero}
                      onChange={e => handleAddressChange('numero', e.target.value)}
                      onBlur={handleAddressBlurLatest} />
                  </div>
                </div>
                <input className="input-field text-sm mt-1.5" placeholder="Ciudad"
                  value={form.ciudad}
                  onChange={e => handleAddressChange('ciudad', e.target.value)}
                  onBlur={handleAddressBlurLatest} />
              </div>

              {/* Pin status */}
              <div className="flex items-center gap-2 min-h-[20px]">
                {geocoding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-brand-green border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="text-xs text-gray-400">Buscando ubicación...</span>
                  </>
                ) : pinCoords ? (
                  <span className="text-xs text-brand-green font-medium">
                    📍 Ubicado ·{' '}
                    <button onClick={() => setPickingPin(true)} className="text-gray-400 underline hover:text-gray-600">ajustar</button>
                  </span>
                ) : addressComplete ? (
                  <button onClick={() => setPickingPin(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    📍 No encontrado — hacer click en el mapa
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha *</label>
                  <input type="date" className="input-field mt-1 text-sm"
                    value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
                  <select className="input-field mt-1 text-sm" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
                <select className="input-field mt-1 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                  <option value="RESERVADA">Reservada</option>
                  <option value="VENDIDA">Vendida</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Val. publicación</label>
                  <input type="number" className="input-field mt-1 text-sm" placeholder="0"
                    value={form.valorPublicacion} onChange={e => setForm(p => ({ ...p, valorPublicacion: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Val. cierre</label>
                  <input type="number" className="input-field mt-1 text-sm" placeholder="0"
                    value={form.valorCierre} onChange={e => setForm(p => ({ ...p, valorCierre: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Días en comercialización</label>
                <input type="number" className="input-field mt-1 text-sm" placeholder="0"
                  value={form.tiempoComercializacion} onChange={e => setForm(p => ({ ...p, tiempoComercializacion: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Captador</label>
                  <div className="mt-1">
                    <AgentSelect value={form.captador} onChange={v => setForm(p => ({ ...p, captador: v }))} placeholder="— Captador —" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</label>
                  <div className="mt-1">
                    <AgentSelect value={form.vendedor} onChange={v => setForm(p => ({ ...p, vendedor: v }))} placeholder="— Vendedor —" />
                  </div>
                </div>
              </div>

              {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeForm}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              {!pinCoords ? (
                <button
                  disabled={!addressComplete || geocoding}
                  onClick={async () => {
                    if (!addressComplete) return
                    setGeocoding(true)
                    const { calle, numero, ciudad } = formRef.current
                    const coords = await geocode(calle, numero, ciudad)
                    setGeocoding(false)
                    if (coords) { setPinCoords(coords); placeTempPin(coords.lat, coords.lng) }
                    else setPickingPin(true)
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    addressComplete && !geocoding
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {geocoding ? 'Buscando...' : 'Ubicar'}
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm py-2">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        )}

        {loadingTokko && (
          <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border-2 border-brand-green border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Cargando desde Tokko…
          </div>
        )}

        {filtered.length === 0 && !showForm && !loadingTokko && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-xl px-5 py-3 shadow text-gray-500 text-sm text-center">
              <p>No hay operaciones registradas.</p>
              <p className="text-xs text-gray-400 mt-0.5">Usá "+ Nueva operación" para cargar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
