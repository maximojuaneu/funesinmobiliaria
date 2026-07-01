'use client'
import { useState, useEffect, useRef } from 'react'

interface AutorizacionForm {
  agenteNombre:   string
  agenteEmail:    string
  inmuebleDir:    string
  inmuebleCiudad: string
  provincia:      string
  partida:        string
  precio:         string
  precioLetras:   string
  exclusividad:   boolean
  fecha:          string
}

const todayAR = () =>
  new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Spanish number-to-words (for precio en letras)
function numToWords(n: number): string {
  if (!isFinite(n) || n < 0) return ''
  if (n === 0) return 'cero'
  const ones   = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
                  'diez','once','doce','trece','catorce','quince','dieciséis','diecisiete',
                  'dieciocho','diecinueve']
  const tens   = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
  const veinte = ['veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco',
                  'veintiséis','veintisiete','veintiocho','veintinueve']
  const hunds  = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos',
                  'seiscientos','setecientos','ochocientos','novecientos']

  function below1000(x: number): string {
    if (x === 0) return ''
    if (x === 100) return 'cien'
    let r = ''
    if (x >= 100) { r += hunds[Math.floor(x / 100)] + ' '; x %= 100 }
    if (x >= 20)  { r += (x < 30 ? veinte[x - 20] : tens[Math.floor(x / 10)] + (x % 10 ? ' y ' + ones[x % 10] : '')); return r.trim() }
    if (x > 0)    { r += ones[x] }
    return r.trim()
  }

  let result = ''
  let x = Math.floor(n)
  if (x >= 1000000) { const m = Math.floor(x / 1000000); result += (m === 1 ? 'un millón' : below1000(m) + ' millones') + ' '; x %= 1000000 }
  if (x >= 1000)    { const t = Math.floor(x / 1000);    result += (t === 1 ? 'mil'        : below1000(t) + ' mil')      + ' '; x %= 1000 }
  const rest = below1000(x)
  if (rest) result += rest
  return result.trim()
}

function Input({ label, value, onChange, type = 'text', placeholder = '', className = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; className?: string; required?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition" />
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

export default function AutorizacionClient() {
  const [form, setForm] = useState<AutorizacionForm>({
    agenteNombre:   '',
    agenteEmail:    '',
    inmuebleDir:    '',
    inmuebleCiudad: '',
    provincia:      'Santa Fe',
    partida:        '',
    precio:         '',
    precioLetras:   '',
    exclusividad:   false,
    fecha:          todayAR(),
  })
  const [link,        setLink]        = useState('')
  const [copied,      setCopied]      = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const linkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { name?: string; email?: string } | null) => {
        if (d?.name)  setForm(f => ({ ...f, agenteNombre: d.name  ?? '' }))
        if (d?.email) setForm(f => ({ ...f, agenteEmail:  d.email ?? '' }))
      })
      .catch(() => {})
  }, [])

  const set = (key: keyof AutorizacionForm) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  const handlePrecio = (val: string) => {
    const digits = val.replace(/\D/g, '')
    const n = digits ? parseFloat(digits) : NaN
    setForm(f => ({ ...f, precio: digits, precioLetras: (!digits || isNaN(n)) ? '' : numToWords(n) }))
  }

  const generateLink = async () => {
    setGenerating(true)
    setCopied(false)
    try {
      const res = await fetch('/api/autorizaciones/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Error')
      setLink(`${window.location.origin}/firma/${data.id}`)
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          linkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
      }
    } catch (err) {
      console.error(err)
      alert('No se pudo generar el link. Intentá de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="max-w-2xl">

      {/* Inmueble */}
      <Section title="Datos del inmueble">
        <Input label="Calle y número" value={form.inmuebleDir} onChange={set('inmuebleDir')}
          placeholder="Ej: Av. San Martín 1234" className="col-span-2" required />
        <Input label="Ciudad" value={form.inmuebleCiudad} onChange={set('inmuebleCiudad')} placeholder="Ej: Funes" required />
        <Input label="Provincia" value={form.provincia} onChange={set('provincia')} required />
        <Input label="Partida inmobiliaria N°" value={form.partida} onChange={set('partida')}
          placeholder="Opcional" className="col-span-2" />
      </Section>

      {/* Precio y exclusividad */}
      <Section title="Condiciones">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Precio de venta (U$S)<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input type="text" inputMode="numeric" value={form.precio} placeholder="Ej: 150000"
            onChange={e => handlePrecio(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition" />
          {form.precioLetras && (
            <p className="text-xs text-gray-400 mt-0.5">
              {form.precioLetras} dólares
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exclusividad</label>
          <button type="button" onClick={() => set('exclusividad')(!form.exclusividad)}
            className={`h-[38px] px-4 rounded-lg text-sm font-semibold transition text-left ${
              form.exclusividad ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {form.exclusividad ? '✓ Con exclusividad' : 'Sin exclusividad'}
          </button>
        </div>
        <div className="col-span-2 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-600">
            Fecha del documento: <strong className="text-gray-800">{form.fecha}</strong>
          </span>
        </div>
      </Section>

      {/* Agente info (no editable, solo informativo) */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
          {form.agenteNombre.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{form.agenteNombre || '—'}</p>
          <p className="text-xs text-gray-400">Asesor — sesión activa</p>
        </div>
      </div>

      {/* Generar link — botón y resultado */}
      <div className="flex flex-col gap-3">
        {/* Botón + link inline en desktop, apilados en mobile */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <button onClick={generateLink} disabled={!form.inmuebleDir.trim() || !form.precio || generating}
            className="shrink-0 bg-brand-green hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition flex items-center gap-2 text-sm">
            {generating ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.828 14.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.1 1.1" />
              </svg>
            )}
            {generating ? 'Generando…' : 'Generar link de firma'}
          </button>

          {/* Link: inline en desktop */}
          {link && (
            <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <input readOnly value={link}
                className="flex-1 min-w-0 text-sm text-gray-600 bg-transparent font-mono outline-none truncate" />
              <button onClick={copyLink}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  copied ? 'bg-green-100 text-green-700' : 'bg-brand-green text-white hover:bg-brand-hover'
                }`}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>

        {/* Link: debajo del botón solo en mobile */}
        {link && (
          <div ref={linkRef} className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <input readOnly value={link}
              className="flex-1 min-w-0 text-sm text-gray-600 bg-transparent font-mono outline-none truncate" />
            <button onClick={copyLink}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                copied ? 'bg-green-100 text-green-700' : 'bg-brand-green text-white hover:bg-brand-hover'
              }`}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
