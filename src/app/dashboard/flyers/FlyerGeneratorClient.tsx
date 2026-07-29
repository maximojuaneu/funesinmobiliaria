'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const TYPE_LABEL: Record<string, string> = {
  House:               'CASA',
  Casa:                'CASA',
  Apartment:           'DEPARTAMENTO',
  Departamento:        'DEPARTAMENTO',
  Land:                'TERRENO',
  Terreno:             'TERRENO',
  'Bussiness Premises': 'LOCAL',
  'Local Comercial':   'LOCAL',
  'Local comercial':   'LOCAL',
  Office:              'OFICINA',
  Oficina:             'OFICINA',
  Countryside:         'CAMPO',
  Campo:               'CAMPO',
  Warehouse:           'DEPÓSITO',
  'Depósito':          'DEPÓSITO',
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => rej(new Error(`Failed: ${src}`))
    img.src = src
  })
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iR = img.width / img.height
  const bR = w / h
  let sx, sy, sw, sh
  if (iR > bR) { sh = img.height; sw = sh * bR; sx = (img.width - sw) / 2; sy = 0 }
  else          { sw = img.width;  sh = sw / bR; sx = 0; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function fillTextLS(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  }
}

function measureTextLS(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  return [...text].reduce((acc, ch) => acc + ctx.measureText(ch).width + spacing, 0)
}

export default function FlyerGeneratorClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [propId,        setPropId]        = useState('')
  const [property,      setProperty]      = useState<any>(null)
  const [photos,        setPhotos]        = useState<string[]>([])
  const [selected,      setSelected]      = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [rendering,     setRendering]     = useState(false)
  const [ready,         setReady]         = useState(false)

  // Campos editables del flyer
  const [customTipo,    setCustomTipo]    = useState('')
  const [customSup,     setCustomSup]     = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [customC1,      setCustomC1]      = useState('')
  const [customC2,      setCustomC2]      = useState('')
  const [customC3,      setCustomC3]      = useState('')
  const [customPrice,   setCustomPrice]   = useState('')
  const [priceBackup,   setPriceBackup]   = useState('')

  const fetchProperty = async () => {
    const id = propId.trim()
    if (!id) return
    setLoading(true)
    setProperty(null); setPhotos([]); setSelected([]); setReady(false)
    setCustomTipo(''); setCustomSup(''); setCustomAddress('')
    setCustomC1(''); setCustomC2(''); setCustomC3(''); setCustomPrice('')
    try {
      const res  = await fetch(`/api/tokko/property/${id}`)
      const data = await res.json()
      if (data?.id) {
        setProperty(data)

        // Fotos
        const imgs = (data.photos ?? [])
          .filter((p: any) => !p.is_blueprint && !p.is_floor_plan)
          .map((p: any) => p.image as string)
        setPhotos(imgs)

        // Tipo y operación
        const tLbl = TYPE_LABEL[data.type?.name] ?? (data.type?.name ?? '').toUpperCase()
        const rOp  = (data.operations?.[0]?.operation_type ?? '') as string
        const oLbl = rOp === 'Sale' || rOp === 'Venta' ? 'VENTA' : rOp === 'Rent' || rOp === 'Alquiler' ? 'ALQUILER' : rOp.toUpperCase()
        setCustomTipo(`${tLbl} EN ${oLbl}`)

        // Detección de tipo
        const tName     = (data.type?.name ?? '').toLowerCase()
        const isTerreno = tName.includes('land')        || tName.includes('terreno')
        const isDepto   = tName.includes('apartment')   || tName.includes('departamento')
        const isCampo   = tName.includes('countryside') || tName.includes('campo')
        const isCom     = tName.includes('bussiness')   || tName.includes('local') || tName.includes('office') || tName.includes('oficina') || tName.includes('warehouse') || tName.includes('depósito') || tName.includes('deposito')

        // Superficie
        let supStr = ''
        if (isCampo) {
          const s = parseFloat(data.surface || data.total_surface || 0)
          if (s > 0) supStr = `Superficie de ${Math.round(s / 10000)} ha`
        } else if (isTerreno) {
          const s = parseFloat(data.surface || data.total_surface || 0)
          if (s > 0) supStr = `Terreno de ${Math.round(s)} m²`
        } else if (isDepto) {
          const s = parseFloat(data.roofed_surface || data.total_surface || 0)
          if (s > 0) supStr = `Superficie de ${Math.round(s)} m²`
        } else if (isCom) {
          const s = parseFloat(data.roofed_surface || data.total_surface || 0)
          if (s > 0) supStr = `${Math.round(s)} m² cubiertos`
        } else {
          const s = parseFloat(data.surface || data.total_surface || 0)
          if (s > 0) supStr = `Terreno de ${Math.round(s)} m²`
        }
        setCustomSup(supStr)

        // Dirección
        const rawAddr  = data.fake_address || data.address || ''
        const locParts = (data.location?.full_location ?? '').split(' | ').map((s: string) => s.trim()).filter(Boolean)
        const localidad = locParts.length >= 3 ? locParts[2] : (locParts[locParts.length - 1] ?? '')
        setCustomAddress(localidad ? `${rawAddr} - ${localidad}` : rawAddr)

        // Características
        const rm     = data.suite_amount       ?? 0
        const bath   = data.bathroom_amount    ?? 0
        const garage = data.parking_lot_amount ?? 0
        const fmt    = (v: any) => parseFloat(v).toFixed(1).replace('.', ',')
        if (isTerreno) {
          setCustomC1(data.front_measure ? `${fmt(data.front_measure)} m de frente` : '')
          setCustomC2(data.depth_measure ? `${fmt(data.depth_measure)} m de fondo`  : '')
          setCustomC3('')
        } else if (!isCampo) {
          setCustomC1(rm === 0 ? 'Monoambiente' : `${rm} dormitorio${rm !== 1 ? 's' : ''}`)
          setCustomC2(bath   > 0 ? `${bath} baño${bath !== 1 ? 's' : ''}` : '')
          setCustomC3(garage > 0 ? `${garage} cochera${garage !== 1 ? 's' : ''}` : (rm > 0 ? 'Living' : ''))
        }

        // Precio
        const priceObj = data.operations?.[0]?.prices?.[0]
        if (priceObj?.price) {
          const curr = priceObj.currency === 'USD' ? 'U$S' : '$'
          setCustomPrice(`${curr} ${Math.round(priceObj.price).toLocaleString('es-AR')}`)
        }
      } else {
        alert('No se encontró la propiedad.')
      }
    } catch { alert('Error al buscar la propiedad.') }
    finally   { setLoading(false) }
  }

  const togglePhoto = (url: string) =>
    setSelected(prev =>
      prev.includes(url) ? prev.filter(p => p !== url)
      : prev.length < 3  ? [...prev, url]
      : prev
    )

  const drawFlyer = useCallback(async () => {
    if (selected.length < 1 || !property || !canvasRef.current) return
    setRendering(true); setReady(false)
    try {
      const canvas = canvasRef.current
      const W = 1080, H = 1920
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')!

      await document.fonts.ready
      await Promise.allSettled([
        document.fonts.load('700 67px Montserrat'),
        document.fonts.load('700 59px Montserrat'),
        document.fonts.load('700 57px Montserrat'),
        document.fonts.load('400 51px Montserrat'),
        document.fonts.load('400 49px Montserrat'),
      ])

      // Layout
      const TOP_H   = 727
      const BOT_Y   = 1250
      const BOT_H   = H - BOT_Y
      const BOT_MID = 546

      // Posiciones de texto
      const TX        = 84
      const TY_TIPO   = 850
      const TY_SUP    = 955
      const TY_UBIC   = 1016
      const TY_CARACT = 1080
      const TY_PRICE  = 1185

      const LS_T = -2.5  // letter-spacing títulos
      const LS_C = -1.8  // letter-spacing características

      const [seccionImg, logoImg] = await Promise.all([
        loadImg('/' + encodeURIComponent('sección central.png')),
        loadImg('/' + encodeURIComponent('logotipo.png')),
      ])

      const imgs = await Promise.all(selected.map(u => loadImg(u).catch(() => null))) as (HTMLImageElement | null)[]

      // 1. Fondo blanco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // 2. Foto principal
      if (imgs[0]) drawCover(ctx, imgs[0], 0, 0, W, TOP_H)
      else { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, W, TOP_H) }

      // 3. Fotos inferiores
      const botImgs = imgs.slice(1).filter(Boolean) as HTMLImageElement[]
      if (botImgs.length >= 2) {
        drawCover(ctx, botImgs[0], 0,       BOT_Y, BOT_MID,     BOT_H)
        drawCover(ctx, botImgs[1], BOT_MID, BOT_Y, W - BOT_MID, BOT_H)
      } else if (botImgs[0]) {
        drawCover(ctx, botImgs[0], 0, BOT_Y, W, BOT_H)
      }

      // 4. Overlay sección central
      ctx.drawImage(seccionImg, 0, 0, W, H)

      // 5. Textos
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'alphabetic'

      // Línea 1: tipo + operación
      if (customTipo) {
        ctx.fillStyle = '#016333'
        ctx.font      = '700 67px "Montserrat", Arial'
        fillTextLS(ctx, customTipo, TX, TY_TIPO, LS_T)
      }

      // Línea 2: superficie
      if (customSup) {
        ctx.fillStyle = '#000000'
        ctx.font      = '700 59px "Montserrat", Arial'
        fillTextLS(ctx, customSup, TX, TY_SUP, LS_T)
      }

      // Línea 3: dirección
      if (customAddress) {
        ctx.fillStyle = '#016333'
        ctx.font      = '400 51px "Montserrat", Arial'
        let addr = customAddress
        while (addr.length > 1 && measureTextLS(ctx, addr, LS_T) > 880) addr = addr.slice(0, -1)
        if (addr !== customAddress) addr += '…'
        fillTextLS(ctx, addr, TX, TY_UBIC, LS_T)
      }

      // Línea 4: características (columnas dinámicas)
      ctx.fillStyle = '#000000'
      ctx.font      = '400 49px "Montserrat", Arial'
      const cols = [customC1, customC2, customC3].filter(Boolean)
      let cx = TX
      for (const col of cols) {
        fillTextLS(ctx, col, cx, TY_CARACT, LS_C)
        cx += measureTextLS(ctx, col, LS_C) + 30
      }

      // Línea 5: precio — centrado, mismo estilo que línea 2
      if (customPrice) {
        ctx.fillStyle = customPrice === 'RESERVADO' ? '#FF1A1A' : '#000000'
        ctx.font      = '700 59px "Montserrat", Arial'
        ctx.textAlign = 'center'
        ;(ctx as any).letterSpacing = '-2px'
        ctx.fillText(customPrice, W / 2, TY_PRICE)
        ;(ctx as any).letterSpacing = '0px'
        ctx.textAlign = 'left'
      }

      // 6. Logo
      ctx.drawImage(logoImg, 0, 0, W, H)

      setReady(true)
    } catch (e) {
      console.error('Flyer error:', e)
    } finally {
      setRendering(false)
    }
  }, [selected, property, customTipo, customSup, customAddress, customC1, customC2, customC3, customPrice])

  useEffect(() => {
    if (selected.length >= 1) drawFlyer()
    else setReady(false)
  }, [drawFlyer])

  const download = () => {
    const canvas = canvasRef.current!
    const addr   = property?.fake_address || property?.address || String(property?.id ?? 'prop')
    const city   = property?.location?.name ?? ''
    const name   = `Flyer-${city ? `${addr} - ${city}` : addr}`.replace(/[<>:"/\\|?*]/g, '').trim()

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg' })

      // En mobile usamos Web Share API (iOS/Android) si está disponible
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return // usuario canceló
        }
      }

      // Fallback desktop: blob URL (más confiable que data URI)
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `${name}.jpg`; link.click()
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.96)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors'
  const labelClass = 'block text-xs text-gray-500 mb-1'

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">

      {/* ── Left: Steps ── */}
      <div className="space-y-5">

        {/* Step 1 */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${property ? 'border-brand-green' : 'border-gray-100'}`}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">1</span>
            Buscar propiedad
          </h2>
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="ID de propiedad en Tokko"
              value={propId}
              onChange={e => setPropId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchProperty()}
            />
            <button onClick={fetchProperty} disabled={loading || !propId.trim()} className="btn-primary px-5 disabled:opacity-50">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Buscando</span> : 'Buscar'}
            </button>
          </div>
          {property && (
            <p className="text-sm text-brand-green mt-2 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {property.publication_title || property.fake_address || property.address}
            </p>
          )}
        </div>

        {/* Step 2 */}
        {property && photos.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-green">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">2</span>
              Elegir fotos
            </h2>
            <p className="text-xs text-gray-500 mb-4 ml-8">
              Hasta <strong>3 fotos</strong> en orden. Foto 1 = principal · Fotos 2–3 = abajo.
              {selected.length > 0 && <span className="text-brand-green font-semibold"> {selected.length}/3 seleccionadas</span>}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(url => {
                const idx = selected.indexOf(url); const sel = idx !== -1; const atMax = selected.length >= 3 && !sel
                return (
                  <button key={url} onClick={() => togglePhoto(url)} disabled={atMax}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-150 ${sel ? 'border-brand-green ring-2 ring-brand-green/30 scale-[0.97]' : atMax ? 'border-transparent opacity-40 cursor-not-allowed' : 'border-transparent hover:border-gray-300 hover:scale-[0.98]'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {sel && <div className="absolute inset-0 bg-brand-green/25 flex items-center justify-center"><span className="w-8 h-8 rounded-full bg-brand-green text-white text-base font-extrabold flex items-center justify-center shadow-lg">{idx + 1}</span></div>}
                  </button>
                )
              })}
            </div>
            {selected.length > 0 && <button onClick={() => { setSelected([]); setReady(false) }} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline">Limpiar selección</button>}
          </div>
        )}

        {/* Step 3 — Editar texto */}
        {property && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-green">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">3</span>
              Editar texto del flyer
            </h2>
            <p className="text-xs text-gray-500 mb-5 ml-8">Todos los campos se pueden editar antes de descargar.</p>

            <div className="space-y-4">
              {/* Línea 1 */}
              <div>
                <label className={labelClass}>Línea 1 — Tipo y operación</label>
                <input className={inputClass} value={customTipo} onChange={e => setCustomTipo(e.target.value.toUpperCase())} placeholder="Ej: DEPARTAMENTO EN VENTA" />
              </div>

              {/* Línea 2 */}
              <div>
                <label className={labelClass}>Línea 2 — Superficie</label>
                <input className={inputClass} value={customSup} onChange={e => setCustomSup(e.target.value)} placeholder="Ej: Superficie de 84 m²" />
              </div>

              {/* Línea 3 */}
              <div>
                <label className={labelClass}>Línea 3 — Dirección / Ubicación</label>
                <input className={inputClass} value={customAddress} onChange={e => setCustomAddress(e.target.value)} placeholder="Ej: San Luis 300 - Rosario - Zona Centro - Piso 4" />
              </div>

              {/* Características */}
              <div>
                <label className={labelClass}>Características (3 columnas)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} value={customC1} onChange={e => setCustomC1(e.target.value)} placeholder="3 dormitorios" />
                  <input className={inputClass} value={customC2} onChange={e => setCustomC2(e.target.value)} placeholder="2 baños" />
                  <input className={inputClass} value={customC3} onChange={e => setCustomC3(e.target.value)} placeholder="Living" />
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className={labelClass}>Precio</label>
                <div className="flex gap-2">
                  <input className={inputClass} value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Ej: U$S 120.000" />
                  <button
                    onClick={() => {
                      if (customPrice === 'RESERVADO') {
                        setCustomPrice(priceBackup)
                      } else {
                        setPriceBackup(customPrice)
                        setCustomPrice('RESERVADO')
                      }
                    }}
                    className={`shrink-0 px-3 py-2 rounded-xl text-sm font-bold text-white transition-colors ${customPrice === 'RESERVADO' ? 'bg-gray-400 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    RESERVADO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Preview ── */}
      <div className="sticky top-6 flex flex-col items-center gap-3">
        <div className="bg-gray-100 rounded-2xl overflow-hidden w-full" style={{ height: 'calc(100vh - 260px)', maxHeight: 460 }}>
          {selected.length < 1 && !rendering ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 p-8 text-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm font-medium">{!property ? 'Buscá una propiedad para comenzar' : 'Seleccioná al menos 1 foto'}</p>
              {property && <p className="text-xs">El flyer se genera automáticamente</p>}
            </div>
          ) : rendering ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="w-8 h-8 border-brand-green border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
                <p className="text-sm">Generando flyer…</p>
              </div>
            </div>
          ) : null}
          <canvas ref={canvasRef} className={`w-full h-full object-contain ${(!ready || rendering) ? 'hidden' : 'block'}`} style={{ objectFit: 'contain' }} />
        </div>
        {ready && (
          <>
            <p className="text-xs text-gray-400">1080×1920 px · {selected.length} foto{selected.length !== 1 ? 's' : ''}</p>
            <button onClick={download} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar flyer (JPG)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
