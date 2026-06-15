'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice, getMainPhoto } from '@/lib/tokko'

interface Props {
  properties: TokkoProperty[]
  operationType: 'Sale' | 'Rent' | 'Temporary Rent'
  hideSideList?: boolean
}

const POPUP_W = 280
const POPUP_H = 340

function formatPrice(amount: number, currency: string): string {
  const sym = currency === 'USD' ? 'U$S' : '$'
  if (amount >= 1_000_000) return `${sym} ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1000) return `${sym} ${Math.round(amount / 1000)}K`
  return `${sym} ${amount.toLocaleString('es-AR')}`
}

const TYPE_ES: Record<string, string> = {
  House: 'Casa', Apartment: 'Departamento', Land: 'Terreno',
  'Bussiness Premises': 'Local comercial', Office: 'Oficina',
  Countryside: 'Campo', Warehouse: 'Depósito',
}

const m2 = (val: any) => { const n = parseFloat(val); return n > 0 ? Math.round(n) : null }

function getStats(p: TokkoProperty): string {
  const type = p.type?.name
  if (type === 'Land') return m2(p.surface) ? `${m2(p.surface)} m² terreno` : ''
  return [
    p.suite_amount     ? `${p.suite_amount} dorm.` : null,
    p.bathroom_amount  ? `${p.bathroom_amount} baño${p.bathroom_amount > 1 ? 's' : ''}` : null,
    m2(p.roofed_surface || p.total_surface) ? `${m2(p.roofed_surface || p.total_surface)} m²` : null,
  ].filter(Boolean).join('  ·  ')
}

function hasValidCoords(p: TokkoProperty): boolean {
  if (!p.geo_lat || !p.geo_long) return false
  const lat = parseFloat(p.geo_lat)
  const lng = parseFloat(p.geo_long)
  return lat > -35 && lat < -30 && lng > -62 && lng < -59
}

function SmallCard({ property, operationType }: { property: TokkoProperty; operationType: 'Sale' | 'Rent' | 'Temporary Rent' }) {
  const price = getOperationPrice(property, operationType)
  const photo = getMainPhoto(property)
  const address = property.fake_address || property.address
  const typeName = TYPE_ES[property.type?.name] ?? property.type?.name ?? ''
  const stats = getStats(property)

  return (
    <Link
      href={`/propiedades/${property.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 bg-white rounded-xl hover:shadow-md hover:bg-gray-50 transition-all border border-gray-100"
    >
      <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {photo && <Image src={photo} alt={address} fill className="object-cover" sizes="80px" />}
      </div>
      <div className="min-w-0 flex-1">
        {price && (
          <p className="font-bold text-gray-900 text-sm leading-tight">
            {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
          </p>
        )}
        <p className="text-xs text-gray-600 truncate mt-0.5">{address}</p>
        {typeName && <p className="text-xs text-gray-400">{typeName}</p>}
        {stats && <p className="text-xs text-gray-500 mt-0.5">{stats}</p>}
      </div>
    </Link>
  )
}

// Build a custom cluster icon matching the brand palette
function makeClusterIcon(L: any, count: number) {
  const size = count < 10 ? 40 : count < 100 ? 48 : 56
  const half = size / 2
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:#067148;color:white;
        font-size:${count < 10 ? 15 : 13}px;font-weight:800;font-family:sans-serif;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:3px solid rgba(255,255,255,0.55);
        cursor:pointer;
      ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}

export default function PropertyMapView({ properties, operationType, hideSideList }: Props) {
  const mapRef           = useRef<HTMLDivElement>(null)
  const mapInstanceRef   = useRef<any>(null)
  const leafletRef       = useRef<any>(null)
  const clusterGroupRef  = useRef<any>(null)   // MarkerClusterGroup
  const selectedLatLngRef = useRef<[number, number] | null>(null)

  const [mapReady, setMapReady]                 = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<TokkoProperty | null>(null)
  const [, forceUpdate]                         = useState(0)

  const closePopup = useCallback(() => {
    setSelectedProperty(null)
    selectedLatLngRef.current = null
  }, [])

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    let map: any
    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css' as any)
      // Import markercluster (adds L.markerClusterGroup)
      await import('leaflet.markercluster' as any)
      await import('leaflet.markercluster/dist/MarkerCluster.css' as any)
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css' as any)

      if (!mapRef.current || mapInstanceRef.current) return

      leafletRef.current = L
      map = L.map(mapRef.current).setView([-32.915, -60.815], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // Create MarkerClusterGroup with custom cluster icon
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 60,          // px: how close markers need to be to cluster
        disableClusteringAtZoom: 17,   // at this zoom level all markers show individually
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) =>
          makeClusterIcon(L, cluster.getChildCount()),
      })

      clusterGroupRef.current = clusterGroup
      map.addLayer(clusterGroup)

      map.on('click', () => {
        setSelectedProperty(null)
        selectedLatLngRef.current = null
      })
      map.on('move zoom', () => forceUpdate(n => n + 1))

      setMapReady(true)
    }
    init()
    return () => {
      mapInstanceRef.current = null
      leafletRef.current     = null
      clusterGroupRef.current = null
      setMapReady(false)
      try { map?.remove() } catch {}
      if (mapRef.current) delete (mapRef.current as any)._leaflet_id
    }
  }, [])

  // ── Update markers whenever properties / operationType change ────────────
  useEffect(() => {
    const L            = leafletRef.current
    const map          = mapInstanceRef.current
    const clusterGroup = clusterGroupRef.current
    if (!L || !map || !clusterGroup) return

    setSelectedProperty(null)
    selectedLatLngRef.current = null
    clusterGroup.clearLayers()

    const withCoords = properties.filter(hasValidCoords)

    withCoords.forEach(p => {
      const lat   = parseFloat(p.geo_lat)
      const lng   = parseFloat(p.geo_long)
      const price = getOperationPrice(p, operationType)
      const label = price ? formatPrice(price.amount, price.currency) : '—'

      // Individual price-label pin (shown when not clustered)
      const icon = L.divIcon({
        html: `<div style="
          background:#067148;color:white;
          font-size:11px;font-weight:700;font-family:sans-serif;
          padding:5px 10px;border-radius:6px;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
          position:relative;cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;
        ">${label}<div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:5px solid #067148;
        "></div></div>`,
        className: '',
        iconSize: [80, 30],
        iconAnchor: [40, 35],
      })

      const marker = L.marker([lat, lng], { icon })
      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e)
        selectedLatLngRef.current = [lat, lng]
        setSelectedProperty(p)
      })
      clusterGroup.addLayer(marker)
    })

    // Fly to the bounds of all visible properties
    if (withCoords.length > 0) {
      try {
        const latLngs = withCoords
          .map(p => ({ lat: parseFloat(p.geo_lat), lng: parseFloat(p.geo_long) }))
          .filter(({ lat, lng }) => !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng))
          .map(({ lat, lng }) => L.latLng(lat, lng))
        if (latLngs.length > 0) {
          const bounds = L.latLngBounds(latLngs)
          if (bounds.isValid()) {
            map.invalidateSize()
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false })
          }
        }
      } catch (e) {
        console.warn('fitBounds failed:', e)
      }
    }
  }, [properties, operationType, mapReady])

  // ── Compute popup pixel position ─────────────────────────────────────────
  let popupLeft = 0, popupTop = 0, arrowBelow = false, arrowOffset = POPUP_W / 2

  if (selectedProperty && selectedLatLngRef.current && mapInstanceRef.current && mapRef.current) {
    const pt         = mapInstanceRef.current.latLngToContainerPoint(selectedLatLngRef.current)
    const containerW = mapRef.current.clientWidth
    popupLeft   = Math.max(8, Math.min(pt.x - POPUP_W / 2, containerW - POPUP_W - 8))
    arrowOffset = Math.max(20, Math.min(pt.x - popupLeft, POPUP_W - 20))
    popupTop    = Math.max(8, pt.y - POPUP_H - 15)
    arrowBelow  = true
  }

  const price    = selectedProperty ? getOperationPrice(selectedProperty, operationType) : null
  const photo    = selectedProperty ? getMainPhoto(selectedProperty) : ''
  const address  = selectedProperty ? (selectedProperty.fake_address || selectedProperty.address) : ''
  const typeName = selectedProperty ? (TYPE_ES[selectedProperty.type?.name] ?? selectedProperty.type?.name ?? '') : ''
  const stats    = selectedProperty ? getStats(selectedProperty) : ''

  return (
    <div className={`flex gap-3 ${hideSideList ? 'h-full' : ''}`} style={hideSideList ? undefined : { height: 560 }}>

      {/* Scrollable property list (desktop only) */}
      {!hideSideList && (
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-2 pr-1">
          {properties.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay propiedades</p>
          ) : (
            properties.map(p => (
              <SmallCard key={p.id} property={p} operationType={operationType} />
            ))
          )}
        </div>
      )}

      {/* Map */}
      <div className={`${hideSideList ? 'w-full' : 'flex-1'} relative overflow-hidden ${hideSideList ? '' : 'rounded-xl border border-gray-200 shadow-sm'}`}>
        <div ref={mapRef} className="w-full h-full" />

        {selectedProperty && (
          <div
            style={{ position: 'absolute', left: popupLeft, top: popupTop, width: POPUP_W, zIndex: 1000 }}
            onClick={e => e.stopPropagation()}
          >
            {!arrowBelow && (
              <div style={{
                width: 0, height: 0,
                borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
                borderBottom: '9px solid white',
                position: 'absolute', top: -9, left: arrowOffset - 9, zIndex: 1,
                filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.08))',
              }} />
            )}

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="relative h-40">
                {photo ? (
                  <Image src={photo} alt={address} fill className="object-cover" sizes={`${POPUP_W}px`} />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                {typeName && (
                  <span className="absolute top-2 left-2 bg-brand-green text-white text-xs font-bold px-2 py-0.5 rounded uppercase z-10">
                    {typeName}
                  </span>
                )}
                <button
                  onClick={closePopup}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full w-7 h-7 flex items-center justify-center text-sm z-10 shadow"
                  aria-label="Cerrar"
                >✕</button>
              </div>

              <div className="p-4">
                {price && (
                  <p className="text-lg font-bold text-brand-green leading-tight">
                    {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-800 mt-0.5 leading-snug">{address}</p>
                {stats && <p className="text-xs text-gray-500 mt-1">{stats}</p>}
                <Link
                  href={`/propiedades/${selectedProperty.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full btn-primary py-2 text-sm"
                >
                  Ver propiedad →
                </Link>
              </div>
            </div>

            {arrowBelow && (
              <div style={{
                width: 0, height: 0,
                borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
                borderTop: '9px solid white',
                marginLeft: arrowOffset - 9,
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.1))',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
