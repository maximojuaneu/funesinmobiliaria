'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { AutorizacionData } from './AutorizacionDocument'

interface TokenData {
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

function parseFechaLegible(fecha: string) {
  const parts = fecha.split('/')
  if (parts.length !== 3) return fecha
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${parseInt(parts[0])} de ${meses[parseInt(parts[1]) - 1] ?? parts[1]} de ${parts[2]}`
}

function toBase64(url: string): Promise<string> {
  return fetch(url).then(r => r.blob()).then(
    blob => new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload  = () => res(reader.result as string)
      reader.onerror = rej
      reader.readAsDataURL(blob)
    })
  )
}

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition w-full'

export default function FirmaClient({ token }: { token: string }) {
  const [data, setData]   = useState<TokenData | null>(null)
  const [error, setError] = useState(false)

  const [nombre,    setNombre]    = useState('')
  const [dni,       setDni]       = useState('')
  const [celular,   setCelular]   = useState('')
  const [email,     setEmail]     = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  useEffect(() => {
    fetch(`/api/autorizaciones/pending/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: TokenData) => setData(d))
      .catch(() => setError(true))
  }, [token])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    // On mobile use a taller canvas buffer so the drawing area is bigger
    if (window.innerWidth < 1024) canvas.height = 420
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [data])

  const getXY = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const client = 'touches' in e ? e.touches[0] : e
    return {
      x: (client.clientX - rect.left) * (canvas.width  / rect.width),
      y: (client.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx    = canvas.getContext('2d');  if (!ctx)    return
    isDrawing.current = true
    const { x, y } = getXY(e, canvas)
    ctx.beginPath(); ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx    = canvas.getContext('2d');  if (!ctx)    return
    const { x, y } = getXY(e, canvas)
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.lineTo(x, y); ctx.stroke()
    setHasSigned(true)
  }, [])

  const stopDraw = useCallback(() => { isDrawing.current = false }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx    = canvas.getContext('2d');  if (!ctx)    return
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  const generate = async () => {
    if (!data) return
    setLoading(true); setDone(false)
    try {
      const firmaDataUrl = canvasRef.current?.toDataURL('image/png') ?? ''

      const docData: AutorizacionData = {
        ...data,
        titularNombre:  nombre,
        titularDNI:     dni,
        titularTel:     celular,
        titularEmail:   email,
        firmaDataUrl,
      }

      const [logoUrl, { pdf }, { AutorizacionDocument }] = await Promise.all([
        toBase64('/logo.png'),
        import('@react-pdf/renderer'),
        import('./AutorizacionDocument'),
      ])

      const blob = await pdf(<AutorizacionDocument data={docData} logoUrl={logoUrl} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `Autorización de Venta - ${data.inmuebleDir || 'propiedad'}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      const saveRes = await fetch('/api/autorizaciones/firmar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, titularNombre: nombre, titularDNI: dni, titularTel: celular, titularEmail: email, firmaDataUrl }),
      }).catch(err => { console.error('Error al guardar autorización:', err); return null })
      if (!saveRes?.ok) {
        console.error('El servidor no guardó la autorización. Status:', saveRes?.status)
      }

      setDone(true)
    } catch (err) {
      console.error(err)
      alert('Error al generar el documento. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <p className="text-gray-700 font-semibold mb-2">Enlace no válido</p>
        <p className="text-gray-400 text-sm">Este enlace no es válido o expiró. Contactá al asesor para obtener uno nuevo.</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { fecha, inmuebleDir, inmuebleCiudad, provincia, partida, precio, precioLetras, exclusividad, agenteNombre } = data
  const dia = String(parseInt(fecha.split('/')[0] ?? ''))
  const mes = (['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'])[parseInt(fecha.split('/')[1] ?? '1') - 1] ?? ''
  const año = fecha.split('/')[2] ?? ''

  const isReady = nombre.trim() && dni.trim() && celular.trim() && email.trim() && hasSigned

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-brand-green py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Image src="/logo.png" alt="Funes Inmobiliaria" width={140} height={56} className="h-9 w-auto brightness-0 invert" />
        <span className="text-white/80 text-sm font-medium hidden sm:block">Autorización de Venta</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Banner */}
        <div className="bg-brand-light border border-brand-green/20 rounded-xl p-4">
          <p className="text-brand-green text-sm font-semibold mb-0.5">Documento para firmar</p>
          <p className="text-brand-green/80 text-xs">
            {agenteNombre} de Funes Inmobiliaria te envió esta autorización de venta.
            Leé el documento, completá tus datos y firmá para descargar tu copia.
          </p>
        </div>

        {/* Documento — texto exacto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-brand-green px-5 py-3 rounded-t-2xl flex items-center justify-between">
            <h2 className="text-white text-sm font-bold uppercase tracking-wide">Autorización de Venta</h2>
            <span className="text-white/60 text-xs">{fecha}</span>
          </div>
          <div className="p-6 text-sm text-gray-800 leading-relaxed space-y-4">

            <p>
              Por la presente autorizo{exclusividad && <strong> en exclusividad</strong>} a{' '}
              <strong>FUNES INMOBILIARIA</strong> representada por C.I Fabio H. Juaneu Mat. 0298 COCIR
              y/o C.I Máximo F. Juaneu Mat. 2708 COCIR, con oficinas en calle Córdoba 2115 (s/ruta 9)
              Funes; para que gestionen la
              venta, por mi cuenta y orden, de la propiedad ubicada en{' '}
              <strong>{inmuebleDir}</strong> de la ciudad de{' '}
              <strong>{inmuebleCiudad}</strong>, Pcia de <strong>{provincia}</strong>
              {partida ? <>, denominada con partida inmobiliaria N° <strong>{partida}</strong></> : null}
            </p>

            <hr className="border-gray-200" />

            <p>
              El precio de venta es de{' '}
              <strong>{precioLetras ? `${precioLetras} dólares` : '……………………………………'}</strong>{' '}
              (U$S <strong>{precio || '…………'}</strong>), siendo la forma de pago a convenir.
              En caso de vender el inmueble abonare a Uds. en concepto de honorarios
              inmobiliarios, el equivalente al tres por ciento (3%) mas IVA del valor total de la
              compra-venta. Garantizo a ustedes que los títulos de propiedad son perfectos y sobre
              esta base pueden vender. Los impuestos que graven el inmueble deberán ser abonados
              por mi parte hasta el día de la escrituración a favor de los compradores (salvo
              acuerdo contrario).
            </p>

            <p>
              La presente autorización es amplia e irrevocablemente valida por{' '}
              <strong>ciento ochenta (180) días</strong> a partir del{' '}
              <strong>{dia}</strong> de <strong>{mes}</strong> de <strong>{año}</strong>,
              quedando automáticamente prorrogada a partir del vencimiento por periodos de treinta
              días (30) sucesivos si no comunicara fehacientemente la voluntad de dejarla sin
              efecto, obligándome a respetar la operación como bien realizada en las condiciones y
              plazos establecidos en la autorización.
            </p>

            <p>
              Si la operación se concretara durante el período de la vigencia de la presente
              autorización en forma directa entre vendedor y comprador sin informar a la
              inmobiliaria, o si luego de vencido el plazo se realizara la operación compraventa
              con clientes que hubieran efectuado tratativas con Uds, se le reconocerá los
              honorarios inmobiliarios pactados mas los honorarios inmobiliarios de la parte
              compradora del 3% mas IVA.
            </p>

            <p>
              Todos los gastos que demande la concreción del negocio, publicidad, carteles,
              movilidad, etc. serán soportados por la inmobiliaria interviniente. Autorizo al
              corredor inmobiliario a tomar reservas de ofertas y retener el monto entregado en
              tal concepto hasta el día la firma del boleto/cesión/adhesión o escritura traslativa
              de dominio (lo que ocurra primero).
            </p>

            <p>
              Además, autorizo a que publiquen en los medios de comunicación tradicionales y como
              así también en los medios de comunicación digitales y las redes sociales, y que
              coloquen cartel de VENTA en la propiedad.-
            </p>

            <p className="font-medium">
              Funes, a los <strong>{dia}</strong> días del mes de <strong>{mes}</strong> de{' '}
              <strong>{año}</strong>.-
            </p>

          </div>
        </div>

        {/* Firma digital */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-brand-green px-5 py-3 rounded-t-2xl flex items-center justify-between">
            <h2 className="text-white text-sm font-bold uppercase tracking-wide">Firma digital <span className="text-white/60 font-normal normal-case">*</span></h2>
            {hasSigned && (
              <button onClick={clearCanvas}
                className="text-white/80 hover:text-white text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg transition">
                Borrar
              </button>
            )}
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-3">Dibujá tu firma con el dedo o con el mouse.</p>
            <div className={`border-2 rounded-xl overflow-hidden transition-colors ${
              hasSigned ? 'border-brand-green/40' : 'border-dashed border-gray-200'
            }`}>
              <canvas ref={canvasRef} width={560} height={240}
                className="w-full touch-none cursor-crosshair block"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
            </div>
            {!hasSigned && <p className="text-xs text-gray-400 text-center mt-2">← Dibujá aquí →</p>}
          </div>
        </div>

        {/* Datos del vendedor */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-brand-green px-5 py-3 rounded-t-2xl">
            <h2 className="text-white text-sm font-bold uppercase tracking-wide">Datos del vendedor</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Aclaración (nombre y apellido completo) <span className="text-red-400">*</span>
              </label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: María García" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  DNI <span className="text-red-400">*</span>
                </label>
                <input type="text" value={dni} onChange={e => setDni(e.target.value)}
                  placeholder="Ej: 30.123.456" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Celular (TE) <span className="text-red-400">*</span></label>
                <input type="tel" value={celular} onChange={e => setCelular(e.target.value)}
                  placeholder="Ej: 341 555-1234" className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Domicilio electrónico (email) <span className="text-red-400">*</span>
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Ej: nombre@mail.com" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="space-y-3 pb-8">
          {!isReady && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-amber-700 text-xs font-medium">
                Para continuar, dibujá tu firma y completá nombre, DNI, celular y email.
              </p>
            </div>
          )}

          <button onClick={generate} disabled={loading || !isReady}
            className="w-full bg-brand-green hover:bg-brand-hover text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generando documento…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Firmar y descargar documento
              </>
            )}
          </button>

          {done && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <p className="text-green-700 font-semibold text-sm">✓ Documento descargado correctamente</p>
              <p className="text-green-600 text-xs mt-1">Guardá el PDF firmado en un lugar seguro. Tu asesor fue notificado.</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center pt-2">
            Funes Inmobiliaria{agenteNombre ? ` — ${agenteNombre}` : ''}
          </p>
        </div>

      </div>
    </div>
  )
}
