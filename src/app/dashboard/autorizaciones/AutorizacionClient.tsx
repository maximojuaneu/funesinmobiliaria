'use client'
import { useState, useEffect, useRef } from 'react'

interface AutorizacionForm {
  agenteNombre:       string
  agenteEmail:        string
  inmuebleDir:        string
  inmuebleCiudad:     string
  provincia:          string
  partida:            string
  precio:             string
  precioLetras:       string
  exclusividad:       boolean
  periodo:            string
  fecha:              string
  cantidadVendedores: string
}

const todayAR = () =>
  new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

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

function daysToWords(n: number): string {
  if (!isFinite(n) || n <= 0) return ''
  const ones   = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
                  'diez','once','doce','trece','catorce','quince','dieciséis','diecisiete',
                  'dieciocho','diecinueve']
  const tens   = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
  const veinte = ['veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco',
                  'veintiséis','veintisiete','veintiocho','veintinueve']
  const hunds  = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos',
                  'seiscientos','setecientos','ochocientos','novecientos']
  let x = Math.floor(n); let r = ''
  if (x === 100) return 'cien'
  if (x >= 100) { r += hunds[Math.floor(x / 100)] + ' '; x %= 100 }
  if (x >= 20)  { r += (x < 30 ? veinte[x - 20] : tens[Math.floor(x / 10)] + (x % 10 ? ' y ' + ones[x % 10] : '')) }
  else if (x > 0) r += ones[x]
  return r.trim()
}

function parseFecha(fecha: string) {
  const parts = fecha.split('/')
  if (parts.length !== 3) return { dia: fecha, mes: '', año: '' }
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']
  return { dia: String(parseInt(parts[0])), mes: meses[parseInt(parts[1]) - 1] ?? parts[1], año: parts[2] }
}

// dd/mm/yyyy ↔ yyyy-mm-dd para input type="date"
const fechaToInput = (f: string) => {
  const [d, m, y] = f.split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
const inputToFecha = (v: string) => {
  if (!v) return ''
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

// Texto plano para enviar al PDF
function buildParas(form: AutorizacionForm): string[] {
  const { dia, mes, año } = parseFecha(form.fecha)
  const dir      = form.inmuebleDir    || '........................................'
  const ciudad   = form.inmuebleCiudad || '..................'
  const prov     = form.provincia      || '.................'
  const partida  = form.partida        || '.............................................................................'
  const precio   = form.precio         || '……………'
  const pLetras  = form.precioLetras   ? `${form.precioLetras} dólares` : '……………………………………………………………'
  const periodoNum  = parseInt(form.periodo || '180') || 180
  const periodoText = `${daysToWords(periodoNum)} (${periodoNum}) días`
  const exclText    = form.exclusividad ? ' en exclusividad' : ''

  return [
    `Por la presente autorizo${exclText} a FUNES INMOBILIARIA representada por C.I Fabio H. Juaneu Mat. 0298 COCIR y/o C.I Máximo F. Juaneu Mat. 2708 COCIR, con oficinas en calle Córdoba 2115 (s/ruta 9) Funes; para que gestionen la venta, por mi cuenta y orden, de la propiedad ubicada en ${dir} de la ciudad de ${ciudad}, Pcia de ${prov} denominada con partida inmobiliaria N° ${partida}`,
    `El precio de venta es de ${pLetras} (U$S ${precio}), siendo la forma de pago a convenir. En caso de vender el inmueble abonare a Uds. en concepto de honorarios inmobiliarios, el equivalente al tres por ciento (3%) mas IVA del valor total de la compra-venta. Garantizo a ustedes que los títulos de propiedad son perfectos y sobre esta base pueden vender. Los impuestos que graven el inmueble deberán ser abonados por mi parte hasta el día de la escrituración a favor de los compradores (salvo acuerdo contrario).`,
    `La presente autorización es amplia e irrevocablemente valida por ${periodoText} a partir del ${dia} de ${mes} de ${año}, quedando automáticamente prorrogada a partir del vencimiento por periodos de treinta días (30) sucesivos si no comunicara fehacientemente la voluntad de dejarla sin efecto, obligándome a respetar la operación como bien realizada en las condiciones y plazos establecidos en la autorización.`,
    `Si la operación se concretara durante el período de la vigencia de la presente autorización en forma directa entre vendedor y comprador sin informar a la inmobiliaria, o si luego de vencido el plazo se realizara la operación compraventa con clientes que hubieran efectuado tratativas con Uds, se le reconocerá los honorarios inmobiliarios pactados mas los honorarios inmobiliarios de la parte compradora del 3% mas IVA.`,
    `Todos los gastos que demande la concreción del negocio, publicidad, carteles, movilidad, etc. serán soportados por la inmobiliaria interviniente. Autorizo al corredor inmobiliario a tomar reservas de ofertas y retener el monto entregado en tal concepto hasta el día la firma del boleto/cesión/adhesión o escritura traslativa de dominio (lo que ocurra primero).`,
    `Además, autorizo a que publiquen en los medios de comunicación tradicionales y como así también en los medios de comunicación digitales y las redes sociales, y que coloquen cartel de VENTA en la propiedad.-`,
    `Funes, a los ${dia} días del mes de ${mes} de ${año}.-`,
  ]
}

// HTML para el preview: valores clave en negrita
function buildParasHtml(form: AutorizacionForm): string[] {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const b   = (s: string) => `<strong>${esc(s)}</strong>`

  const { dia, mes, año } = parseFecha(form.fecha)
  const dir      = form.inmuebleDir    || '........................................'
  const ciudad   = form.inmuebleCiudad || '..................'
  const prov     = form.provincia      || '.................'
  const partida  = form.partida        || '.............................................................................'
  const precio   = form.precio         || '……………'
  const pLetras  = form.precioLetras   ? `${form.precioLetras} dólares` : '……………………………………………………………'
  const periodoNum  = parseInt(form.periodo || '180') || 180
  const periodoText = `${daysToWords(periodoNum)} (${periodoNum}) días`
  const exclHtml    = form.exclusividad ? ` ${b('en exclusividad')}` : ''

  return [
    `Por la presente autorizo${exclHtml} a FUNES INMOBILIARIA representada por C.I Fabio H. Juaneu Mat. 0298 COCIR y/o C.I Máximo F. Juaneu Mat. 2708 COCIR, con oficinas en calle Córdoba 2115 (s/ruta 9) Funes; para que gestionen la venta, por mi cuenta y orden, de la propiedad ubicada en ${b(dir)} de la ciudad de ${b(ciudad)}, Pcia de ${esc(prov)} denominada con partida inmobiliaria N° ${esc(partida)}`,
    `El precio de venta es de ${b(pLetras)} (U$S ${b(precio)}), siendo la forma de pago a convenir. En caso de vender el inmueble abonare a Uds. en concepto de honorarios inmobiliarios, el equivalente al tres por ciento (3%) mas IVA del valor total de la compra-venta. Garantizo a ustedes que los títulos de propiedad son perfectos y sobre esta base pueden vender. Los impuestos que graven el inmueble deberán ser abonados por mi parte hasta el día de la escrituración a favor de los compradores (salvo acuerdo contrario).`,
    `La presente autorización es amplia e irrevocablemente valida por <strong>${esc(periodoText)}</strong> a partir del ${esc(dia)} de ${esc(mes)} de ${esc(año)}, quedando automáticamente prorrogada a partir del vencimiento por periodos de treinta días (30) sucesivos si no comunicara fehacientemente la voluntad de dejarla sin efecto, obligándome a respetar la operación como bien realizada en las condiciones y plazos establecidos en la autorización.`,
    esc(`Si la operación se concretara durante el período de la vigencia de la presente autorización en forma directa entre vendedor y comprador sin informar a la inmobiliaria, o si luego de vencido el plazo se realizara la operación compraventa con clientes que hubieran efectuado tratativas con Uds, se le reconocerá los honorarios inmobiliarios pactados mas los honorarios inmobiliarios de la parte compradora del 3% mas IVA.`),
    esc(`Todos los gastos que demande la concreción del negocio, publicidad, carteles, movilidad, etc. serán soportados por la inmobiliaria interviniente. Autorizo al corredor inmobiliario a tomar reservas de ofertas y retener el monto entregado en tal concepto hasta el día la firma del boleto/cesión/adhesión o escritura traslativa de dominio (lo que ocurra primero).`),
    esc(`Además, autorizo a que publiquen en los medios de comunicación tradicionales y como así también en los medios de comunicación digitales y las redes sociales, y que coloquen cartel de VENTA en la propiedad.-`),
    esc(`Funes, a los ${dia} días del mes de ${mes} de ${año}.-`),
  ]
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

const PARA_COUNT = 7

export default function AutorizacionClient() {
  const [form, setForm] = useState<AutorizacionForm>({
    agenteNombre:       '',
    agenteEmail:        '',
    inmuebleDir:        '',
    inmuebleCiudad:     '',
    provincia:          'Santa Fe',
    partida:            '',
    precio:             '',
    precioLetras:       '',
    exclusividad:       false,
    periodo:            '180',
    fecha:              todayAR(),
    cantidadVendedores: '1',
  })
  const [link,       setLink]       = useState('')
  const [copied,     setCopied]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const linkRef = useRef<HTMLDivElement>(null)

  // Preview state
  const paraRefsArr    = useRef<(HTMLDivElement | null)[]>(Array(PARA_COUNT).fill(null))
  const customizedSet  = useRef<Set<number>>(new Set())
  const [customized, setCustomized] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { name?: string; email?: string } | null) => {
        if (d?.name)  setForm(f => ({ ...f, agenteNombre: d.name  ?? '' }))
        if (d?.email) setForm(f => ({ ...f, agenteEmail:  d.email ?? '' }))
      })
      .catch(() => {})
  }, [])

  // Actualiza párrafos no editados en el preview cuando cambia el formulario
  useEffect(() => {
    const htmlParas = buildParasHtml(form)
    htmlParas.forEach((html, i) => {
      if (!customizedSet.current.has(i) && paraRefsArr.current[i]) {
        paraRefsArr.current[i]!.innerHTML = html
      }
    })
  }, [form])

  const set = (key: keyof AutorizacionForm) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  const handlePrecio = (val: string) => {
    const digits = val.replace(/\D/g, '')
    const n = digits ? parseFloat(digits) : NaN
    setForm(f => ({ ...f, precio: digits, precioLetras: (!digits || isNaN(n)) ? '' : numToWords(n) }))
  }

  const handleParaInput = (i: number) => {
    if (!customizedSet.current.has(i)) {
      customizedSet.current.add(i)
      setCustomized(prev => new Set([...prev, i]))
    }
  }

  const resetPara = (i: number) => {
    customizedSet.current.delete(i)
    setCustomized(prev => { const s = new Set(prev); s.delete(i); return s })
    const htmlParas = buildParasHtml(form)
    if (paraRefsArr.current[i]) {
      paraRefsArr.current[i]!.innerHTML = htmlParas[i]
    }
  }

  const generateLink = async () => {
    setGenerating(true)
    setCopied(false)
    try {
      const customParas = paraRefsArr.current.map((ref, i) =>
        customizedSet.current.has(i) ? (ref?.textContent ?? '') : ''
      )
      const res = await fetch('/api/autorizaciones/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, customParas }),
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
    <div className="grid lg:grid-cols-2 gap-8 items-start">

      {/* ── Left: Form ── */}
      <div>
        {/* Inmueble */}
        <Section title="Datos del inmueble">
          <Input label="Calle y número" value={form.inmuebleDir} onChange={set('inmuebleDir')}
            placeholder="Ej: Av. San Martín 1234" className="col-span-2" required />
          <Input label="Ciudad" value={form.inmuebleCiudad} onChange={set('inmuebleCiudad')} placeholder="Ej: Funes" required />
          <Input label="Provincia" value={form.provincia} onChange={set('provincia')} required />
          <Input label="Partida inmobiliaria N°" value={form.partida} onChange={set('partida')}
            placeholder="Opcional" className="col-span-2" />
        </Section>

        {/* Condiciones */}
        <Section title="Condiciones">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Precio de venta (U$S)<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input type="text" inputMode="numeric" value={form.precio} placeholder="Ej: 150000"
              onChange={e => handlePrecio(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition" />
            {form.precioLetras && (
              <p className="text-xs text-gray-400 mt-0.5">{form.precioLetras} dólares</p>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período (días)</label>
            <input
              type="number" min="1" inputMode="numeric"
              value={form.periodo}
              onChange={e => set('periodo')(e.target.value.replace(/\D/g, '') || '1')}
              onWheel={e => e.currentTarget.blur()}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Cantidad de vendedores <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="number" min="1" max="10" inputMode="numeric"
              value={form.cantidadVendedores}
              onChange={e => set('cantidadVendedores')(e.target.value.replace(/\D/g, ''))}
              onWheel={e => e.currentTarget.blur()}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {Number(form.cantidadVendedores) > 1 && (
              <p className="text-xs text-gray-400 mt-0.5">
                El link podrá firmarse {form.cantidadVendedores} veces, una por cada vendedor.
              </p>
            )}
          </div>
          <label className="col-span-2 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-2.5 cursor-pointer transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600 shrink-0">Fecha del documento:</span>
            <input
              type="date"
              value={fechaToInput(form.fecha)}
              onChange={e => set('fecha')(inputToFecha(e.target.value))}
              className="bg-transparent text-sm font-bold text-gray-800 focus:outline-none cursor-pointer flex-1"
            />
          </label>
        </Section>

        {/* Agente */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
            {form.agenteNombre.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{form.agenteNombre || '—'}</p>
            <p className="text-xs text-gray-400">Asesor — sesión activa</p>
          </div>
        </div>

        {/* Generar link */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <button onClick={generateLink} disabled={!form.inmuebleDir.trim() || !form.precio || !form.cantidadVendedores || generating}
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

      {/* ── Right: Document Preview ── */}
      <div className="sticky top-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Vista previa</h3>
            <span className="text-xs text-gray-400">Hacé clic en el texto para editar</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <div className="px-7 py-6 leading-[1.8] text-gray-800" style={{ fontFamily: 'Verdana, Geneva, Tahoma, sans-serif', fontSize: '9px' }}>

              {/* Header */}
              <div className="flex justify-between items-center pb-2 mb-4 border-b-2 border-brand-green">
                <span className="text-brand-green font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>
                  Autorización de Venta
                </span>
                <span className="text-gray-400" style={{ fontSize: '8px' }}>FUNES INMOBILIARIA</span>
              </div>

              {/* Editable paragraphs */}
              {Array.from({ length: PARA_COUNT }, (_, i) => (
                <div key={i} className="relative mb-3 group">
                  <div
                    ref={el => { paraRefsArr.current[i] = el }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => handleParaInput(i)}
                    className={`text-justify focus:outline-none rounded px-1 -mx-1 transition-colors cursor-text ${
                      customized.has(i)
                        ? 'bg-amber-50/60 ring-1 ring-amber-200'
                        : 'hover:bg-gray-50 focus:bg-blue-50/40'
                    }`}
                  />
                  {customized.has(i) && (
                    <button
                      onMouseDown={e => { e.preventDefault(); resetPara(i) }}
                      className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full transition-colors z-10"
                      title="Restaurar texto original"
                    >
                      ↺ restaurar
                    </button>
                  )}
                  {i < PARA_COUNT - 1 && (
                    <div className="border-b border-gray-100 mt-3" />
                  )}
                </div>
              ))}

              {/* Signature area */}
              <div className="mt-5 pt-4 border-t border-gray-400">
                <p className="font-bold uppercase tracking-wider text-gray-500 mb-4" style={{ fontSize: '8px' }}>
                  Firma del Vendedor
                </p>
                <div style={{ height: 44, width: 140, borderBottom: '1px solid #555', marginBottom: 3 }} />
                <p className="text-gray-400" style={{ fontSize: '8px' }}>Firma</p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2 border-t border-gray-200 flex justify-between">
                <span className="text-gray-400" style={{ fontSize: '7px' }}>
                  FUNES INMOBILIARIA — Córdoba 2115 (s/ruta 9), Funes — Mat. 0298
                </span>
                <span className="text-gray-400" style={{ fontSize: '7px' }}>{form.fecha}</span>
              </div>
            </div>
          </div>
        </div>
        {customized.size > 0 && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            {customized.size} párrafo{customized.size !== 1 ? 's' : ''} modificado{customized.size !== 1 ? 's' : ''} · los cambios se guardarán al generar el link
          </p>
        )}
      </div>

    </div>
  )
}
