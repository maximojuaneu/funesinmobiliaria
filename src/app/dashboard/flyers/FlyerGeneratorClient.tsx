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

// Letter-spacing manual — funciona en todos los browsers (ctx.letterSpacing no es universal)
function fillTextLS(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  }
}

export default function FlyerGeneratorClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [propId,        setPropId]        = useState('')
  const [property,      setProperty]      = useState<any>(null)
  const [photos,        setPhotos]        = useState<string[]>([])
  const [selected,      setSelected]      = useState<string[]>([])
  const [customAddress, setCustomAddress] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [rendering,     setRendering]     = useState(false)
  const [ready,         setReady]         = useState(false)

  const fetchProperty = async () => {
    const id = propId.trim()
    if (!id) return
    setLoading(true)
    setProperty(null); setPhotos([]); setSelected([]); setCustomAddress(''); setReady(false)
    try {
      const res  = await fetch(`/api/tokko/property/${id}`)
      const data = await res.json()
      if (data?.id) {
        setProperty(data)
        const imgs = (data.photos ?? [])
          .filter((p: any) => !p.is_blueprint && !p.is_floor_plan)
          .map((p: any) => p.image as string)
        setPhotos(imgs)
        const rawAddr   = data.fake_address || data.address || ''
        const locParts  = (data.location?.full_location ?? '').split(' | ').map((s: string) => s.trim()).filter(Boolean)
        const localidad = locParts.length >= 3 ? locParts[2] : (locParts[locParts.length - 1] ?? '')
        setCustomAddress(localidad ? `${rawAddr} - ${localidad}` : rawAddr)
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

      // Pre-load fonts — esperar a que estén completamente disponibles para canvas
      await document.fonts.ready
      await Promise.allSettled([
        document.fonts.load('800 67px Montserrat'),
        document.fonts.load('700 67px Montserrat'),
        document.fonts.load('700 59px Montserrat'),
        document.fonts.load('400 51px Montserrat'),
        document.fonts.load('400 49px Montserrat'),
      ])

      // ── Posiciones exactas extraídas del CDF de Canva (página 14) ──────
      // Fotos
      const TOP_H   = 727   // foto principal: y=0 a y=727
      const BOT_Y   = 1230  // fotos inferiores empiezan en y=1230
      const BOT_H   = H - BOT_Y          // 690px hasta el borde
      const BOT_MID = 546   // punto de división entre foto2 y foto3

      // Textos (y = baseline en canvas, x = margen izquierdo)
      const TX     = 84    // margen izquierdo de todos los textos
      const TX2    = 370   // x de caract2 (ej: "2 baños")
      const TX3    = 580   // x de caract3 (ej: "living")
      const TY_TIPO   = 850  // "DEPARTAMENTO EN VENTA"  (pos_top=782 + ascender ~68)
      const TY_SUP    = 975  // "Superficie de 84 m²"    (pos_top=911 + ascender ~59)
      const TY_UBIC   = 1036 // "Rosario - Zona Centro"  (pos_top=976 + ascender ~51)
      const TY_CARACT = 1148 // características          (pos_top=1089 + ascender ~49)

      // ── Capas PNG estáticas ─────────────────────────────────────────────
      const [seccionImg, logoImg] = await Promise.all([
        loadImg('/' + encodeURIComponent('sección central.png')),
        loadImg('/' + encodeURIComponent('logotipo.png')),
      ])

      // ── Fotos de la propiedad ───────────────────────────────────────────
      const imgs = await Promise.all(selected.map(u => loadImg(u).catch(() => null))) as (HTMLImageElement | null)[]

      // 1. Fondo blanco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // 2. Foto principal (arriba)
      if (imgs[0]) drawCover(ctx, imgs[0], 0, 0, W, TOP_H)
      else { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, W, TOP_H) }

      // 3. Fotos inferiores
      const botImgs = imgs.slice(1).filter(Boolean) as HTMLImageElement[]
      if (botImgs.length >= 2) {
        drawCover(ctx, botImgs[0], 0,       BOT_Y, BOT_MID,       BOT_H)
        drawCover(ctx, botImgs[1], BOT_MID, BOT_Y, W - BOT_MID,   BOT_H)
      } else if (botImgs[0]) {
        drawCover(ctx, botImgs[0], 0, BOT_Y, W, BOT_H)
      }

      // 4. Overlay "sección central" (marco, sombras, panel blanco)
      ctx.drawImage(seccionImg, 0, 0, W, H)

      // 5. Textos
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'alphabetic'

      const typeName = (property.type?.name ?? '').toLowerCase()
      const typeLbl  = TYPE_LABEL[property.type?.name] ?? (property.type?.name ?? '').toUpperCase()
      const rawOp    = (property.operations?.[0]?.operation_type as string) ?? ''
      const opLbl    =
        rawOp === 'Sale'    || rawOp === 'Venta'    ? 'VENTA'    :
        rawOp === 'Rent'    || rawOp === 'Alquiler' ? 'ALQUILER' :
        rawOp.toUpperCase()

      const isTerreno = typeName.includes('land')       || typeName.includes('terreno')
      const isDepto   = typeName.includes('apartment')  || typeName.includes('departamento')
      const isCampo   = typeName.includes('countryside') || typeName.includes('campo')
      const isComercial = typeName.includes('bussiness') || typeName.includes('local') || typeName.includes('office') || typeName.includes('oficina') || typeName.includes('warehouse') || typeName.includes('depósito') || typeName.includes('deposito')

      const LS_TITULO  = -2.5  // letter-spacing título (px entre chars)
      const LS_CARACT  = -1.8  // letter-spacing características

      // "DEPARTAMENTO EN VENTA" — bold, verde
      ctx.fillStyle = '#016333'
      ctx.font      = '700 67px "Montserrat", Arial'
      fillTextLS(ctx, `${typeLbl} EN ${opLbl}`, TX, TY_TIPO, LS_TITULO)

      // "Superficie de X m²" — bold, negro
      let supText = ''
      if (isCampo) {
        const s = parseFloat(String(property.surface || property.total_surface || 0))
        if (s > 0) supText = `Superficie de ${Math.round(s / 10000)} ha`
      } else if (isTerreno) {
        const s = parseFloat(String(property.surface || property.total_surface || 0))
        if (s > 0) supText = `Terreno de ${Math.round(s)} m²`
      } else if (isDepto) {
        const s = parseFloat(String(property.roofed_surface || property.total_surface || 0))
        if (s > 0) supText = `Superficie de ${Math.round(s)} m²`
      } else if (isComercial) {
        const s = parseFloat(String(property.roofed_surface || property.total_surface || 0))
        if (s > 0) supText = `${Math.round(s)} m² cubiertos`
      } else {
        const s = parseFloat(String(property.surface || property.total_surface || 0))
        if (s > 0) supText = `Terreno de ${Math.round(s)} m²`
      }
      if (supText) {
        ctx.fillStyle = '#000000'
        ctx.font      = '700 59px "Montserrat", Arial'
        fillTextLS(ctx, supText, TX, TY_SUP, LS_TITULO)
      }

      // Ubicación — normal, verde
      if (customAddress) {
        ctx.fillStyle = '#016333'
        ctx.font      = '400 51px "Montserrat", Arial'
        let addr = customAddress
        // Truncar si no entra — medir con spacing manual
        const measureLS = (t: string) => [...t].reduce((acc, ch) => acc + ctx.measureText(ch).width + LS_TITULO, 0)
        while (addr.length > 1 && measureLS(addr) > 880) addr = addr.slice(0, -1)
        if (addr !== customAddress) addr += '…'
        fillTextLS(ctx, addr, TX, TY_UBIC, LS_TITULO)
      }

      // Características — normal, negro — 3 columnas fijas
      const rm     = property.suite_amount       ?? 0
      const bath   = property.bathroom_amount    ?? 0
      const garage = property.parking_lot_amount ?? 0

      ctx.fillStyle = '#000000'
      ctx.font      = '400 49px "Montserrat", Arial'

      if (isTerreno) {
        const fmt = (v: any) => parseFloat(v).toFixed(1).replace('.', ',')
        if (property.front_measure) fillTextLS(ctx, `${fmt(property.front_measure)} m de frente`, TX,  TY_CARACT, LS_CARACT)
        if (property.depth_measure) fillTextLS(ctx, `${fmt(property.depth_measure)} m de fondo`,  TX2, TY_CARACT, LS_CARACT)
      } else if (!isCampo) {
        const c1 = rm === 0 ? 'Monoambiente' : `${rm} dormitorio${rm !== 1 ? 's' : ''}`
        const c2 = bath   > 0 ? `${bath} baño${bath !== 1 ? 's' : ''}`          : ''
        const c3 = garage > 0 ? `${garage} cochera${garage !== 1 ? 's' : ''}` : (rm > 0 ? 'Living' : '')
        fillTextLS(ctx, c1, TX,  TY_CARACT, LS_CARACT)
        if (c2) fillTextLS(ctx, c2, TX2, TY_CARACT, LS_CARACT)
        if (c3) fillTextLS(ctx, c3, TX3, TY_CARACT, LS_CARACT)
      }

      // 6. Logo
      ctx.drawImage(logoImg, 0, 0, W, H)

      setReady(true)
    } catch (e) {
      console.error('Flyer error:', e)
    } finally {
      setRendering(false)
    }
  }, [selected, property, customAddress])

  useEffect(() => {
    if (selected.length >= 1) drawFlyer()
    else setReady(false)
  }, [selected, customAddress, drawFlyer])

  const download = () => {
    const canvas  = canvasRef.current!
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96)
    const addr    = property?.fake_address || property?.address || String(property?.id ?? 'prop')
    const city    = property?.location?.name ?? ''
    const name    = `Flyer-${city ? `${addr} - ${city}` : addr}`.replace(/[<>:"/\\|?*]/g, '').trim()
    const link    = document.createElement('a')
    link.href = dataUrl; link.download = `${name}.jpg`; link.click()
  }

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

        {/* Step 3 */}
        {property && (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${customAddress ? 'border-brand-green' : 'border-gray-100'}`}>
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">3</span>
              Dirección / Ubicación
            </h2>
            <p className="text-xs text-gray-500 mb-4 ml-8">Podés editarla libremente antes de generar.</p>
            <input className="input-field w-full" value={customAddress} onChange={e => setCustomAddress(e.target.value)} placeholder="Ej: San Luis 300 - Rosario - Zona Centro - Piso 4" />
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
