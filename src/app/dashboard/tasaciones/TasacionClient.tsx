'use client'
import { useState, useEffect, useRef } from 'react'
import type { Comparativo, Referencia, TasacionData } from './TasacionDocument'

const today = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const emptyComp = (): Comparativo => ({ titulo: '', url: '', descripcion: '' })
const emptyRef  = (): Referencia  => ({ ubicacion: '', descripcion: '', año: '', precio: '' })

const ZONAS_OPTS    = ['Residencial', 'Comercial']
const SERVICIOS_OPTS = ['Electricidad', 'Gas Natural', 'Agua Corriente', 'Cloaca', 'Pavimento']

function subtituloAgente(nombre: string): string {
  const n = nombre.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n === 'maximo juaneu') return 'C.I Mat 2708 - COCIR'
  return 'Asesor comercial'
}

const emptyForm = (): TasacionData => ({
  agenteNombre:      '',
  agenteSubtitulo:   'Asesor comercial',
  agenteCel:         '',
  agenteEmail:       '',
  fecha:             today(),
  solicitanteNombre: '',
  solicitanteTel:    '',
  solicitanteEmail:  '',
  propiedadNombre:   '',
  calle:             '',
  numero:            '',
  barrio:            '',
  ciudad:            '',
  supTerreno:        '',
  supCubierta:       '',
  supSemicubierta:   '',
  antiguedad:        '',
  aptaCredito:       'SI',
  descripcionAmbientes: '',
  caracteristicasZona:  '',
  servicios:            '',
  comparativos: [emptyComp()],
  referencias:  [],
  valorACM:     '',
  valorPublicacion: '',
  segmentoMin:  '',
  segmentoMax:  '',
})

// ── Input ─────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <div className="flex flex-col gap-1 col-span-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition resize-none"
      />
    </div>
  )
}

// ── Multi-select dropdown ─────────────────────────────────────────────────
function MultiSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? value.split(', ').filter(Boolean) : []

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt]
    onChange(next.join(', '))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition text-left flex items-center justify-between bg-white"
      >
        <span className={selected.length === 0 ? 'text-gray-400' : ''}>
          {selected.length === 0 ? 'Seleccionar…' : selected.join(', ')}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-light cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-brand-green w-4 h-4"
              />
              <span className="text-sm text-gray-800">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
      <div className="bg-brand-green px-5 py-3 rounded-t-2xl">
        <h2 className="text-white text-sm font-bold uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function TasacionClient() {
  const [form, setForm] = useState<TasacionData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(async (d: { name?: string; picture?: string | null } | null) => {
        if (!d?.name) return
        let fotoBase64: string | undefined
        if (d.picture) {
          try {
            const r = await fetch('/api/scrape-comparativo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: d.picture }),
            })
            const j = await r.json() as { dataUrl?: string }
            if (j.dataUrl) fotoBase64 = j.dataUrl
          } catch { /* sin foto */ }
        }
        setForm(f => ({
          ...f,
          agenteNombre:    d.name ?? '',
          agenteSubtitulo: subtituloAgente(d.name ?? ''),
          ...(fotoBase64 ? { agenteFoto: fotoBase64 } : {}),
        }))
      })
      .catch(() => {})
  }, [])

  const set = (key: keyof TasacionData) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  // Comparativos
  const setComp = (i: number, key: keyof Comparativo) => (val: string) =>
    setForm(f => { const c = [...f.comparativos]; c[i] = { ...c[i], [key]: val }; return { ...f, comparativos: c } })
  const addComp    = () => { if (form.comparativos.length < 4) setForm(f => ({ ...f, comparativos: [...f.comparativos, emptyComp()] })) }
  const removeComp = (i: number) => setForm(f => ({ ...f, comparativos: f.comparativos.filter((_, idx) => idx !== i) }))

  const MAX_FOTOS = 2

  const addFotos = (i: number, files: FileList) => {
    const remaining = MAX_FOTOS - (form.comparativos[i].fotos?.length ?? 0)
    const toProcess = Array.from(files).slice(0, remaining)
    toProcess.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        setForm(f => {
          const c = [...f.comparativos]
          c[i] = { ...c[i], fotos: [...(c[i].fotos ?? []), dataUrl].slice(0, MAX_FOTOS) }
          return { ...f, comparativos: c }
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFoto = (compIdx: number, fotoIdx: number) =>
    setForm(f => {
      const c = [...f.comparativos]
      c[compIdx] = { ...c[compIdx], fotos: (c[compIdx].fotos ?? []).filter((_, fi) => fi !== fotoIdx) }
      return { ...f, comparativos: c }
    })

  const moveFoto = (compIdx: number, fotoIdx: number, dir: -1 | 1) =>
    setForm(f => {
      const c = [...f.comparativos]
      const fotos = [...(c[compIdx].fotos ?? [])]
      const target = fotoIdx + dir
      if (target < 0 || target >= fotos.length) return f
      ;[fotos[fotoIdx], fotos[target]] = [fotos[target], fotos[fotoIdx]]
      c[compIdx] = { ...c[compIdx], fotos }
      return { ...f, comparativos: c }
    })

  // Referencias
  const setRef     = (i: number, key: keyof Referencia) => (val: string) =>
    setForm(f => { const r = [...f.referencias]; r[i] = { ...r[i], [key]: val }; return { ...f, referencias: r } })
  const addRef     = () => setForm(f => ({ ...f, referencias: [...f.referencias, emptyRef()] }))
  const removeRef  = (i: number) => setForm(f => ({ ...f, referencias: f.referencias.filter((_, idx) => idx !== i) }))

  const propiedadNombreAuto = [
    [form.calle, form.numero].filter(Boolean).join(' '),
    form.barrio,
    form.ciudad,
  ].filter(Boolean).join(', ')

  const toBase64 = (url: string): Promise<string> =>
    fetch(url).then(r => r.blob()).then(blob => new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload  = () => res(reader.result as string)
      reader.onerror = rej
      reader.readAsDataURL(blob)
    }))

  // PDF
  const generate = async () => {
    setLoading(true); setDone(false)
    try {
      const { pdf }              = await import('@react-pdf/renderer')
      const { TasacionDocument } = await import('./TasacionDocument')
      const [logoUrl, logoBlancoUrl] = await Promise.all([toBase64('/logo.png'), toBase64('/logo-blanco.png')])
      const dataWithNombre = { ...form, propiedadNombre: propiedadNombreAuto }
      const blob = await pdf(<TasacionDocument data={dataWithNombre} logoUrl={logoUrl} logoBlancoUrl={logoBlancoUrl} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${propiedadNombreAuto ? `INFORME VALORACION - ${propiedadNombreAuto}` : 'INFORME VALORACION'} - ${form.fecha.replace(/\//g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch (err) {
      console.error(err)
      alert('Error al generar el PDF. Revisá la consola.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">

      {/* ── 1. Datos del tasador ── */}
      <Section title="1. Datos del tasador">
        {/* Nombre bloqueado — se toma de la sesión */}
        <div className="col-span-2 flex items-center gap-4">
          {form.agenteFoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.agenteFoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-brand-green flex-shrink-0" />
          )}
          <div>
            <p className="text-base font-bold text-gray-800">{form.agenteNombre || '—'}</p>
            <p className="text-xs text-gray-400">{form.agenteSubtitulo}</p>
          </div>
        </div>
        <Input label="Celular" value={form.agenteCel} onChange={set('agenteCel')} />
        <Input label="Email" value={form.agenteEmail} onChange={set('agenteEmail')} />
        <Input label="Fecha del informe" value={form.fecha} onChange={set('fecha')} />
      </Section>

      {/* ── 2. Solicitante ── */}
      <Section title="2. Datos del solicitante">
        <Input label="Nombre completo" value={form.solicitanteNombre} onChange={set('solicitanteNombre')} className="col-span-2" />
        <Input label="Teléfono de contacto" value={form.solicitanteTel} onChange={set('solicitanteTel')} />
        <Input label="Email (opcional)" value={form.solicitanteEmail} onChange={set('solicitanteEmail')} />
      </Section>

      {/* ── 3. Propiedad ── */}
      <Section title="3. Datos de la propiedad">
        <Input label="Calle" value={form.calle} onChange={set('calle')} />
        <Input label="Número / Identificación" value={form.numero} onChange={set('numero')} />
        <Input label="Barrio" value={form.barrio} onChange={set('barrio')} />
        <Input label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
        <Input label="Superficie terreno (m²)" value={form.supTerreno} onChange={set('supTerreno')} type="number" />
        <Input label="Superficie cubierta (m²)" value={form.supCubierta} onChange={set('supCubierta')} type="number" />
        <Input label="Superficie semicubierta (m²)" value={form.supSemicubierta} onChange={set('supSemicubierta')} type="number" />
        <Input label="Antigüedad (años)" value={form.antiguedad} onChange={set('antiguedad')} type="number" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apta crédito</label>
          <select
            value={form.aptaCredito}
            onChange={e => set('aptaCredito')(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
          >
            <option>SI</option>
            <option>NO</option>
            <option>A corroborar</option>
          </select>
        </div>
        <Textarea label="Descripción de ambientes y distribución" value={form.descripcionAmbientes} onChange={set('descripcionAmbientes')} rows={5} />
        <MultiSelect label="Características de la zona" options={ZONAS_OPTS} value={form.caracteristicasZona} onChange={set('caracteristicasZona')} />
        <MultiSelect label="Servicios disponibles" options={SERVICIOS_OPTS} value={form.servicios} onChange={set('servicios')} />
      </Section>

      {/* ── 4. Comparativos ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
        <div className="bg-brand-green px-5 py-3 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-white text-sm font-bold uppercase tracking-wide">4. Propiedades comparativas</h2>
          {form.comparativos.length < 4 && (
            <button onClick={addComp} className="text-white/80 hover:text-white text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg transition">+ Agregar</button>
          )}
        </div>
        <div className="p-5 space-y-4">
          {form.comparativos.map((comp, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-green uppercase tracking-wide">Comparativo {i + 1}</span>
                {form.comparativos.length > 1 && (
                  <button onClick={() => removeComp(i)} className="text-red-400 hover:text-red-600 text-xs transition">Eliminar</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ubicación" value={comp.titulo} onChange={setComp(i, 'titulo')} className="col-span-2" />
                <Input label="URL" value={comp.url} onChange={setComp(i, 'url')} className="col-span-2" />
                {/* Fotos - hasta 2, reordenables */}
                <div className="flex flex-col gap-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fotos (hasta 2)</label>
                    {comp.fotos && comp.fotos.length > 0 && (
                      <span className="text-brand-green text-xs">{comp.fotos.length} / 2</span>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {(comp.fotos ?? []).map((f, fi) => (
                      <div key={fi} className="flex flex-col gap-1 items-center">
                        <div className="relative group w-28 h-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f} alt="" className="w-28 h-20 object-cover rounded-lg border border-gray-200" />
                          <button type="button" onClick={() => removeFoto(i, fi)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition leading-none">✕</button>
                        </div>
                        {/* Botones de orden */}
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveFoto(i, fi, -1)} disabled={fi === 0}
                            className="w-6 h-5 rounded text-[10px] bg-gray-100 hover:bg-brand-green hover:text-white disabled:opacity-30 transition flex items-center justify-center">
                            ←
                          </button>
                          <button type="button" onClick={() => moveFoto(i, fi, 1)} disabled={fi === (comp.fotos?.length ?? 0) - 1}
                            className="w-6 h-5 rounded text-[10px] bg-gray-100 hover:bg-brand-green hover:text-white disabled:opacity-30 transition flex items-center justify-center">
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                    {(comp.fotos?.length ?? 0) < MAX_FOTOS && (
                      <label className="w-28 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-green hover:bg-brand-light transition text-gray-400 hover:text-brand-green text-xs gap-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span>Agregar foto</span>
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={e => e.target.files && addFotos(i, e.target.files)} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas (opcional)</label>
                  <textarea rows={2} value={comp.descripcion} onChange={e => setComp(i, 'descripcion')(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition resize-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Referencias ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
        <div className="bg-brand-green px-5 py-3 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-white text-sm font-bold uppercase tracking-wide">5. Referencias de ventas reales</h2>
          <button onClick={addRef} className="text-white/80 hover:text-white text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg transition">+ Agregar</button>
        </div>
        <div className="p-5 space-y-4">
          {form.referencias.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No hay referencias cargadas. Son opcionales.</p>
          )}
          {form.referencias.map((ref, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-green uppercase tracking-wide">Referencia {i + 1}</span>
                <button onClick={() => removeRef(i)} className="text-red-400 hover:text-red-600 text-xs transition">Eliminar</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ubicación" value={ref.ubicacion} onChange={setRef(i, 'ubicacion')} className="col-span-2" />
                <Input label="Descripción" value={ref.descripcion} onChange={setRef(i, 'descripcion')} className="col-span-2" />
                <Input label="Fecha y año de venta" value={ref.año} onChange={setRef(i, 'año')} />
                <Input label="Precio de cierre (U$S)" value={ref.precio} onChange={setRef(i, 'precio')} type="number" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Valuación ── */}
      <Section title="6. Valuación final">
        <Input label="Valoración del inmueble (U$S)" value={form.valorACM} onChange={set('valorACM')} type="number" />
        <Input label="Valor sugerido de publicación (U$S)" value={form.valorPublicacion} onChange={set('valorPublicacion')} type="number" />
        <Input label="Segmento mínimo (U$S)" value={form.segmentoMin} onChange={set('segmentoMin')} type="number" />
        <Input label="Segmento máximo (U$S)" value={form.segmentoMax} onChange={set('segmentoMax')} type="number" />
      </Section>

      {/* ── Generate ── */}
      <div className="mt-6 flex items-center gap-4">
        <button onClick={generate} disabled={loading}
          className="bg-brand-green hover:bg-brand-hover text-white font-bold px-8 py-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Generando PDF…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Generar informe PDF</>
          )}
        </button>
        {done && (
          <span className="text-sm text-brand-green font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            PDF descargado correctamente
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">El PDF se descarga directamente en tu equipo. No se almacena en el sistema.</p>
    </div>
  )
}
