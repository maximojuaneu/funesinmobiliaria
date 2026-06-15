'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Suspense } from 'react'
import PropertyCard from './PropertyCard'
import PropertyFilters from './PropertyFilters'
import PropertyMapView from './PropertyMapView'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice } from '@/lib/tokko'

const PAGE_SIZE = 24

type SortKey = 'recent' | 'price_asc' | 'price_desc'

interface Props {
  properties: TokkoProperty[]
  operationType: 'Sale' | 'Rent' | 'TempRent'
  initialView?: 'list' | 'map'
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null

  // Show at most 5 page numbers centred around current page
  const delta = 2
  const start = Math.max(1, page - delta)
  const end   = Math.min(totalPages, page + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btn = (label: React.ReactNode, target: number, active = false, disabled = false) => (
    <button
      key={String(label)}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center ${
        active
          ? 'bg-brand-green text-white shadow-sm'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      {btn(
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
        page - 1, false, page === 1
      )}
      {start > 1 && <>{btn(1, 1)}{start > 2 && <span className="w-10 text-center text-gray-400">…</span>}</>}
      {pages.map(p => btn(p, p, p === page))}
      {end < totalPages && <>{end < totalPages - 1 && <span className="w-10 text-center text-gray-400">…</span>}{btn(totalPages, totalPages)}</>}
      {btn(
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
        page + 1, false, page === totalPages
      )}
    </div>
  )
}

export default function PropertiesPageContent({ properties, operationType, initialView = 'list' }: Props) {
  const [view, setView] = useState<'list' | 'map'>(initialView)
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)

  const handleSetView = (newView: 'list' | 'map') => {
    setView(newView)
  }
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = filtersRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const baseOpType: 'Sale' | 'Rent' | 'Temporary Rent' =
    operationType === 'Sale' ? 'Sale' :
    operationType === 'TempRent' ? 'Temporary Rent' : 'Rent'

  const sorted = useMemo(() => {
    const arr = [...properties]
    if (sort === 'recent') return arr
    return arr.sort((a, b) => {
      const pa = getOperationPrice(a, baseOpType)?.amount ?? 0
      const pb = getOperationPrice(b, baseOpType)?.amount ?? 0
      return sort === 'price_asc' ? pa - pb : pb - pa
    })
  }, [properties, sort, baseOpType])

  // Reset to page 1 whenever the sorted list changes (filter or sort applied)
  useEffect(() => { setPage(1) }, [sorted])

  const paginated = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  )

  const handlePageChange = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ── MOBILE MAP OVERLAY (full screen below navbar) ── */}
      {view === 'map' && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[900] flex flex-col bg-white" style={{ top: 80 }}>

          {/* Mobile controls bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtros
            </button>
            <span className="text-sm text-gray-500 font-medium">{properties.length} propiedades</span>
          </div>

          {/* Full-screen map */}
          <div className="flex-1 min-h-0">
            <PropertyMapView properties={sorted} operationType={baseOpType} hideSideList />
          </div>

          {/* Floating bottom pill: Lista button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSetView('list')}
              className="flex items-center gap-2.5 bg-gray-900 text-white px-7 py-3.5 rounded-full shadow-2xl text-sm font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Lista
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (list view always; map view only on desktop) ── */}
      <div className={`max-w-7xl mx-auto px-6 py-12 ${view === 'map' ? 'hidden md:block' : ''}`}>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-6">

          {/* Mobile: Filtros + Mapa buttons */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtros
            </button>
            <button
              type="button"
              onClick={() => handleSetView('map')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              Mapa
            </button>
          </div>

          {/* Desktop: sort + view toggle (pushed to the right) */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Ordenar por</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
              <button
                type="button"
                onClick={() => handleSetView('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  view === 'list' ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                Lista
              </button>
              <button
                type="button"
                onClick={() => handleSetView('map')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  view === 'map' ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                Mapa
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex gap-8 items-start">
          {/* Sidebar filters (desktop only) */}
          <div ref={filtersRef} className="hidden lg:block w-72 flex-shrink-0">
            <Suspense><PropertyFilters operationType={operationType} /></Suspense>
          </div>

          <div className="flex-1 min-w-0">
            {view === 'map' ? (
              <PropertyMapView properties={sorted} operationType={baseOpType} />
            ) : sorted.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginated.map((p) => (
                    <PropertyCard key={p.id} property={p} operationType={baseOpType} />
                  ))}
                </div>
                <Pagination page={page} total={sorted.length} onChange={handlePageChange} />
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg font-medium">No se encontraron propiedades</p>
                <p className="text-sm mt-1">Probá ajustando los filtros o conectando Tokko Broker.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BACK TO TOP BUTTON ── */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 left-6 z-[800] flex items-center justify-center w-12 h-12 rounded-full bg-brand-green text-white shadow-lg hover:bg-brand-green/90 transition-all duration-200"
          aria-label="Volver arriba"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      )}

      {/* ── MOBILE FILTER BOTTOM SHEET ── */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-[1300] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                aria-label="Cerrar filtros"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* Filters content */}
            <div className="overflow-y-auto flex-1">
              <Suspense>
                <PropertyFilters
                  operationType={operationType}
                  mobile
                  onClose={() => setShowMobileFilters(false)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
