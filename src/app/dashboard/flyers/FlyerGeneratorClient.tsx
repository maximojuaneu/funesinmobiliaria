'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const TYPE_ES: Record<string, string> = {
  House:               'CASA',
  Casa:                'CASA',
  Apartment:           'DEPTO',
  Departamento:        'DEPTO',
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

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const iR = img.width / img.height
  const bR = w / h
  let sx, sy, sw, sh
  if (iR > bR) {
    sh = img.height; sw = img.height * bR
    sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = img.width / bR
    sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
  ctx.fill()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

export default function FlyerGeneratorClient() {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const [propId,    setPropId]    = useState('')
  const [property,  setProperty]  = useState<any>(null)
  const [photos,    setPhotos]    = useState<string[]>([])
  const [selected,  setSelected]  = useState<string[]>([])
  const [badges,    setBadges]    = useState<string[]>([])
  const [loading,   setLoading]   = useState(false)
  const [rendering, setRendering] = useState(false)
  const [ready,     setReady]     = useState(false)

  const BADGES = [
    { id: 'apta-credito', label: 'Apta Crédito' },
    { id: 'retasado',     label: 'Retasado'      },
    { id: 'reservado',    label: 'Reservado'      },
  ]

  const fetchProperty = async () => {
    const id = propId.trim()
    if (!id) return
    setLoading(true)
    setProperty(null); setPhotos([]); setSelected([]); setBadges([]); setReady(false)
    try {
      const res  = await fetch(`/api/tokko/property/${id}`)
      const data = await res.json()
      if (data?.id) {
        setProperty(data)
        const imgs = (data.photos ?? [])
          .filter((p: any) => !p.is_blueprint && !p.is_floor_plan)
          .map((p: any) => p.image as string)
        setPhotos(imgs)
      } else {
        alert('No se encontró la propiedad.')
      }
    } catch { alert('Error al buscar la propiedad.') }
    finally   { setLoading(false) }
  }

  // Max 4 photos: 1 hero + up to 3 secondary
  const togglePhoto = (url: string) =>
    setSelected(prev =>
      prev.includes(url)
        ? prev.filter(p => p !== url)
        : prev.length < 4 ? [...prev, url] : prev
    )

  const drawFlyer = useCallback(async () => {
    if (selected.length < 2 || !property || !canvasRef.current) return
    setRendering(true)
    setReady(false)
    try {
      const canvas = canvasRef.current
      const W = 1080, H = 1920
      canvas.width  = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      // Fonts are declared in globals.css @font-face — just wait for them to be ready
      await Promise.allSettled([
        document.fonts.load(`700 ${TITLE_FS}px Eurostile`),
        document.fonts.load(`400 ${ADDR_FS}px MontserratLight`),
      ])

      // Warm-up: force canvas to resolve fonts before drawing (critical on mobile)
      ctx.save()
      ctx.globalAlpha = 0
      ctx.font = `700 ${TITLE_FS}px Eurostile, Arial`
      ctx.fillText('W', -1000, -1000)
      ctx.font = `400 ${ADDR_FS}px MontserratLight, Arial`
      ctx.fillText('W', -1000, -1000)
      ctx.restore()

      // ── Zone constants ────────────────────────────────────────────────────
      const HERO_H   = 600
      const INFO_H   = 540
      const INFO_Y   = HERO_H           // 600
      const PHOTOS_Y = INFO_Y + INFO_H  // 1140
      const PHOTOS_H = H - PHOTOS_Y    // 780
      const PAD      = 80

      // Load images
      const imgs = await Promise.all(
        selected.map(u => loadImg(u).catch(() => null))
      ) as (HTMLImageElement | null)[]

      const aptaSelected      = badges.includes('apta-credito')
      const reservadoSelected = badges.includes('reservado')
      const retasadoSelected  = badges.includes('retasado')
      const [marbleImg, logoImg, separadorImg, aptaBadgeImg, reservadoBadgeImg, retasadoBadgeImg] = await Promise.all([
        loadImg('/marble.jpg'),
        loadImg('/logo-flyer.png'),
        loadImg('/separador-titulo.png'),
        aptaSelected      ? loadImg('/badge-apta-credito-layer.png') : Promise.resolve(null),
        reservadoSelected ? loadImg('/badge-reservado-layer.png')    : Promise.resolve(null),
        retasadoSelected  ? loadImg('/badge-retasado-layer.png')     : Promise.resolve(null),
      ]) as [HTMLImageElement, HTMLImageElement, HTMLImageElement, HTMLImageElement | null, HTMLImageElement | null, HTMLImageElement | null]

      // ── 1. HERO PHOTO ─────────────────────────────────────────────────────
      if (imgs[0]) drawCover(ctx, imgs[0], 0, 0, W, HERO_H)
      else { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, W, HERO_H) }

      // Logo icon — full canvas layer (1080×1920), position already baked in
      ctx.drawImage(logoImg, 0, 0, W, H)


      // ── 2. MARBLE BANNER ─────────────────────────────────────────────────
      // Shadow on hero photo bottom — marble "floats" over it
      const SHADE = 90
      const gHeroShadow = ctx.createLinearGradient(0, INFO_Y - SHADE, 0, INFO_Y)
      gHeroShadow.addColorStop(0, 'rgba(0,0,0,0)')
      gHeroShadow.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = gHeroShadow
      ctx.fillRect(0, INFO_Y - SHADE, W, SHADE)

      // Draw marble on top (clean edges, no internal shadow)
      drawCover(ctx, marbleImg, 0, INFO_Y, W, INFO_H)

      // ── 3. PROPERTY INFO ─────────────────────────────────────────────────
      const typeName = (property.type?.name ?? '').toLowerCase()
      const typeLbl  = TYPE_ES[property.type?.name] ?? (property.type?.name ?? '').toUpperCase()
      const rawOp    = (property.operations?.[0]?.operation_type as string) ?? ''
      const opLbl    =
        rawOp === 'Sale'    || rawOp === 'Venta'    ? 'VENTA'    :
        rawOp === 'Rent'    || rawOp === 'Alquiler' ? 'ALQUILER' :
        rawOp.toUpperCase()

      const isTerreno = typeName === 'land'        || typeName === 'terreno'       || typeName.includes('terreno')
      const isDepto   = typeName === 'apartment'   || typeName === 'departamento'  || typeName.includes('apartment') || typeName.includes('departamento') || typeName.includes('depto')
      const isCampo   = typeName === 'countryside' || typeName === 'campo'         || typeName.includes('campo')
      const isLocal   = typeName.includes('bussiness') || typeName.includes('premises') || typeName.includes('local') || typeName.includes('office') || typeName.includes('oficina')

      // Stats by property type
      let statsL1 = '', statsL2 = ''

      if (isCampo) {
        const sup = parseFloat(String(property.surface || property.total_surface || 0))
        if (sup > 0) statsL1 = `${Math.round(sup / 10000)} ha`
      } else if (isTerreno) {
        const sup = parseFloat(String(property.surface || property.total_surface || 0))
        if (sup > 0) statsL1 = `${Math.round(sup)} m² totales`
        const fmt = (v: any) => parseFloat(v).toFixed(1).replace('.', ',')
        const pts: string[] = []
        if (property.front_measure) pts.push(`${fmt(property.front_measure)} m de frente`)
        if (property.depth_measure)  pts.push(`${fmt(property.depth_measure)} m de fondo`)
        statsL2 = pts.join('  ·  ')
      } else if (isDepto) {
        const cub = parseFloat(String(property.roofed_surface || property.total_surface || 0))
        if (cub > 0) statsL1 = `${Math.round(cub)} m² cubiertos`
        const rm    = property.suite_amount ?? 0
        const rooms = property.room_amount
        const isMono = rm === 0 || (rooms !== undefined && rooms <= 1)
        const bath = property.bathroom_amount || 0
        const roomLabel = isMono ? 'Monoambiente' : `${rm} Dormitorio${rm !== 1 ? 's' : ''}`
        statsL2 = [roomLabel, bath > 0 ? `${bath} Baño${bath !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' - ')
      } else if (isLocal) {
        const cub = parseFloat(String(property.roofed_surface || 0))
        if (cub > 0) statsL1 = `${Math.round(cub)} m² cubiertos`
        const bath = property.bathroom_amount || 0
        if (bath > 0) statsL2 = `${bath} Baño${bath !== 1 ? 's' : ''}`
      } else {
        // Casa / default
        const ter  = parseFloat(String(property.surface || property.total_surface || 0))
        if (ter > 0) statsL1 = `${Math.round(ter)} m² de terreno`
        const rm   = property.suite_amount || 0
        const bath = property.bathroom_amount || 0
        const pts: string[] = []
        if (rm   > 0) pts.push(`${rm} Dormitorio${rm !== 1 ? 's' : ''}`)
        if (bath > 0) pts.push(`${bath} Baño${bath !== 1 ? 's' : ''}`)
        statsL2 = pts.join(' - ')
      }

      const hasL2 = statsL2.length > 0
      const addr  = property.fake_address || property.address || ''

      // Price
      const priceObj  = property.operations?.[0]?.prices?.[0]
      const priceAmt  = priceObj?.price ?? 0
      const priceCur  = (priceObj?.currency ?? 'USD').toUpperCase()
      const isRental  = rawOp === 'Rent' || rawOp === 'Alquiler'
      const pricePrefix = (priceCur === 'USD' && !isRental) ? 'U$S' : '$'
      const priceStr  = priceAmt > 0
        ? `${pricePrefix} ${Math.round(priceAmt).toLocaleString('es-AR')}`
        : ''

      const TITLE_FS = 90, PRICE_FS = 54, STATS_FS = 42, ADDR_FS = 36

      // Address anchored at fixed position — bottom of marble banner
      const addrY = INFO_Y + INFO_H - 44

      // Title top-anchored with fixed padding
      const topPad = 28
      ctx.textAlign = 'center'

      // Title line 1 — Eurostile, black
      const b1 = INFO_Y + topPad + TITLE_FS
      ctx.fillStyle = '#0a0a0a'
      ctx.font = `700 ${TITLE_FS}px Eurostile, Arial`
      ctx.fillText(`${typeLbl} EN`, W / 2, b1)

      // Title line 2 — Eurostile, green
      const b2 = b1 + 18 + TITLE_FS
      ctx.fillStyle = '#067148'
      ctx.font = `700 ${TITLE_FS}px Eurostile, Arial`
      ctx.fillText(opLbl, W / 2, b2)

      // Separator
      const sepY = b2 + 28
      ctx.fillStyle = '#b0b0b0'
      ctx.fillRect(PAD * 2, sepY, W - PAD * 4, 2)

      // Space between separator and address for price + stats
      const midTop    = sepY + 2
      const midBottom = addrY - ADDR_FS - 22
      const midH      = midBottom - midTop

      // When retasado or reservado is active, hide stats
      // When reservado is active, also hide price
      const showStats = !retasadoSelected && !reservadoSelected
      const showPrice = !reservadoSelected

      // Count content lines to distribute
      const statLines  = showStats ? [statsL1, hasL2 ? statsL2 : null].filter(Boolean).length : 0
      const totalLines = (showPrice && priceStr ? 1 : 0) + statLines
      const lineH      = totalLines > 0 ? Math.min(PRICE_FS, Math.floor(midH / totalLines)) : PRICE_FS
      const lineGap    = totalLines > 1 ? Math.floor((midH - lineH * totalLines) / (totalLines + 1)) : 0

      let curY = midTop + lineGap + lineH

      if (showPrice && priceStr) {
        ctx.fillStyle = retasadoSelected ? '#E8000D' : '#0a0a0a'
        ctx.font = `700 ${PRICE_FS}px Eurostile, Arial`
        ctx.fillText(priceStr, W / 2, curY)
        curY += lineH + lineGap
      }

      if (showStats) {
        ctx.fillStyle = '#1a1a1a'
        ctx.font = `700 ${Math.min(STATS_FS, lineH)}px Eurostile, Arial`
        if (statsL1) { ctx.fillText(statsL1, W / 2, curY); curY += lineH + lineGap }
        if (hasL2)     ctx.fillText(statsL2, W / 2, curY)
      }

      // Address — Montserrat Light, fixed at bottom of marble
      const city     = property.location?.name ?? ''
      const addrFull = city ? `${addr} - ${city}` : addr
      ctx.fillStyle = '#067148'
      ctx.font = `400 ${ADDR_FS}px MontserratLight, Arial`
      ctx.fillText(fitText(ctx, addrFull, W - PAD * 3), W / 2, addrY)

      // ── 4. SECONDARY PHOTOS + shadow from marble onto them ───────────────
      const pGap = 6
      const pY   = PHOTOS_Y

      if (selected.length === 4 && imgs[1] && imgs[2] && imgs[3]) {
        const half = (W - pGap) / 2
        const topH = Math.round(PHOTOS_H * 0.45)
        const botH = PHOTOS_H - topH - pGap
        drawCover(ctx, imgs[1], 0,           pY,               half, topH)
        drawCover(ctx, imgs[2], half + pGap, pY,               half, topH)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(half, pY, pGap, topH)
        drawCover(ctx, imgs[3], 0,           pY + topH + pGap, W,    botH)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, pY + topH, W, pGap)
      } else if (selected.length === 3 && imgs[1] && imgs[2]) {
        const half = (W - pGap) / 2
        drawCover(ctx, imgs[1], 0,           pY, half, PHOTOS_H)
        drawCover(ctx, imgs[2], half + pGap, pY, half, PHOTOS_H)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(half, pY, pGap, PHOTOS_H)
      } else if (imgs[1]) {
        drawCover(ctx, imgs[1], 0, pY, W, PHOTOS_H)
      }

      // Shadow from marble bottom onto secondary photos
      const gPhotoShadow = ctx.createLinearGradient(0, PHOTOS_Y, 0, PHOTOS_Y + SHADE)
      gPhotoShadow.addColorStop(0, 'rgba(0,0,0,0.42)')
      gPhotoShadow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gPhotoShadow
      ctx.fillRect(0, PHOTOS_Y, W, SHADE)

      // ── 5. BADGES ────────────────────────────────────────────────────────
      if (aptaBadgeImg)      ctx.drawImage(aptaBadgeImg,      0, 0, W, H)
      if (reservadoBadgeImg) ctx.drawImage(reservadoBadgeImg, 0, 0, W, H)
      if (retasadoBadgeImg)  ctx.drawImage(retasadoBadgeImg,  0, 0, W, H)

      // Solo quedan pills para badges no cubiertos por PNG
      const textBadges = badges.filter(b => b !== 'apta-credito' && b !== 'reservado' && b !== 'retasado')
      if (textBadges.length > 0) {
        const bFS   = 34
        const bPadX = 38
        const bPadY = 22
        const bH    = bFS + bPadY * 2
        const bGap  = 12

        textBadges.forEach((badgeId, i) => {
          const label = BADGES.find(b => b.id === badgeId)?.label.toUpperCase() ?? ''
          ctx.font = `700 ${bFS}px Eurostile, Arial`
          const textW = ctx.measureText(label).width
          const bW    = textW + bPadX * 2
          const bX    = PAD
          const bY    = HERO_H - 110 - (bH + bGap) * (i + 1) + bGap

          ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18
          ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4
          ctx.fillStyle = '#000000'
          roundRect(ctx, bX, bY, bW, bH, bH / 2)
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0

          ctx.save()
          ctx.beginPath()
          ctx.roundRect(bX, bY, bW, bH, bH / 2)
          ctx.clip()
          ctx.fillStyle = '#067148'
          ctx.fillRect(bX, bY, 10, bH)
          ctx.restore()

          ctx.fillStyle = '#FFFFFF'
          ctx.font      = `${bFS * 0.7}px Arial`
          ctx.textAlign = 'left'
          ctx.fillText('★', bX + bPadX, bY + bPadY + bFS * 0.72)

          ctx.fillStyle = '#FFFFFF'
          ctx.font      = `700 ${bFS}px Eurostile, Arial`
          const starW   = ctx.measureText('★ ').width
          ctx.fillText(label, bX + bPadX + starW * 0.9, bY + bPadY + bFS * 0.85)

          const labelW2 = ctx.measureText(label).width
          ctx.fillStyle = '#FFFFFF'
          ctx.font      = `${bFS * 0.7}px Arial`
          ctx.fillText(' ★', bX + bPadX + starW * 0.9 + labelW2, bY + bPadY + bFS * 0.72)
        })
      }

      ctx.textAlign = 'left'
      setReady(true)
    } catch (e) {
      console.error('Flyer error:', e)
    } finally {
      setRendering(false)
    }
  }, [selected, property, badges])

  useEffect(() => {
    if (selected.length >= 2) drawFlyer()
    else setReady(false)
  }, [selected, badges, drawFlyer])

  const download = () => {
    const canvas = canvasRef.current!
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      // En mobile abrimos la imagen en nueva pestaña para guardar con pulsación larga
      const win = window.open()
      if (win) {
        win.document.write(`<img src="${dataUrl}" style="max-width:100%;display:block;margin:auto" />`)
        win.document.title = `flyer-${property?.id ?? 'prop'}.jpg`
      }
    } else {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `flyer-${property?.id ?? 'prop'}.jpg`
      link.click()
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">

      {/* ── Left: Steps ── */}
      <div className="space-y-5">

        {/* Step 1 — Search */}
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
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Buscando
                </span>
              ) : 'Buscar'}
            </button>
          </div>
          {property && (
            <p className="text-sm text-brand-green mt-2 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {property.publication_title || property.fake_address || property.address}
            </p>
          )}
        </div>

        {/* Step 2 — Select photos */}
        {property && photos.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-green">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">2</span>
              Elegir fotos
            </h2>
            <p className="text-xs text-gray-500 mb-4 ml-8">
              Seleccioná <strong>2, 3 o 4 fotos</strong> en orden.
              {selected.length > 0
                ? <span className="text-brand-green font-semibold"> {selected.length}/4 seleccionada{selected.length !== 1 ? 's' : ''}</span>
                : <span className="text-gray-400"> (0 seleccionadas)</span>
              }
            </p>
            <p className="text-xs text-gray-400 mb-4 ml-8">
              Foto 1 = principal (grande, arriba) · Fotos 2–4 = secundarias (abajo)
            </p>

            <div className="grid grid-cols-3 gap-2">
              {photos.map(url => {
                const idx = selected.indexOf(url)
                const sel = idx !== -1
                const atMax = selected.length >= 4 && !sel
                return (
                  <button
                    key={url}
                    onClick={() => togglePhoto(url)}
                    disabled={atMax}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-150 ${
                      sel
                        ? 'border-brand-green ring-2 ring-brand-green/30 scale-[0.97]'
                        : atMax
                        ? 'border-transparent opacity-40 cursor-not-allowed'
                        : 'border-transparent hover:border-gray-300 hover:scale-[0.98]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {sel && (
                      <div className="absolute inset-0 bg-brand-green/25 flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-brand-green text-white text-base font-extrabold flex items-center justify-center shadow-lg">
                          {idx + 1}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {selected.length > 0 && (
              <button
                onClick={() => { setSelected([]); setReady(false) }}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Limpiar selección
              </button>
            )}
          </div>
        )}

        {/* Step 3 — Badges */}
        {property && (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${badges.length > 0 ? 'border-brand-green' : 'border-gray-100'}`}>
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">3</span>
              Etiquetas
            </h2>
            <p className="text-xs text-gray-500 mb-4 ml-8">Opcional — se muestran sobre la foto principal. Podés elegir más de una.</p>
            <div className="flex flex-wrap gap-2">
              {BADGES.map(b => {
                const isSelected = badges.includes(b.id)
                const isDisabled =
                  (b.id === 'reservado' && badges.includes('retasado')) ||
                  (b.id === 'retasado'  && badges.includes('reservado'))
                return (
                  <button
                    key={b.id}
                    disabled={isDisabled}
                    onClick={() => setBadges(prev =>
                      prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                    )}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : isDisabled
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {b.label}
                  </button>
                )
              })}
            </div>
            {badges.length > 0 && (
              <button
                onClick={() => setBadges([])}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Quitar etiquetas
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Preview ── */}
      <div className="sticky top-6 flex flex-col items-center gap-3">
        <div
          className="bg-gray-100 rounded-2xl overflow-hidden w-full"
          style={{ height: 'calc(100vh - 260px)', maxHeight: 420 }}
        >
          {selected.length < 2 && !rendering ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 p-8 text-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">
                {!property ? 'Buscá una propiedad para comenzar' : 'Seleccioná al menos 2 fotos'}
              </p>
              {property && <p className="text-xs">El flyer se generará automáticamente</p>}
            </div>
          ) : rendering ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="w-8 h-8 border-brand-green border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
                <p className="text-sm">Generando flyer...</p>
              </div>
            </div>
          ) : null}

          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain ${(!ready || rendering) ? 'hidden' : 'block'}`}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {ready ? (
          <>
            <p className="text-xs text-gray-400">
              {selected.length} foto{selected.length !== 1 ? 's' : ''} · 1080×1920 px
            </p>
            <button onClick={download} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar flyer (JPG)
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
