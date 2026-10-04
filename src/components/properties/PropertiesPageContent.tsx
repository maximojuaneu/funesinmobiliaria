'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import PropertyCard from './PropertyCard'
import PropertyFilters from './PropertyFilters'
import PropertyMapView from './PropertyMapView'
import type { TokkoProperty } from '@/types/tokko'
import { getOperationPrice } from '@/lib/tokko'

const SCROLL_KEY = 'prop-list-scroll'
const PAGE_SIZE = 24
const CHUNK_SIZE = 6
const FEAT_PER_CHUNK = 3

type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'featured'

// Literal Tailwind classes (must appear as-is in source for the JIT scanner to pick them up).
const BUBBLE_SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1 md:col-span-1 xl:col-span-1',
  2: 'col-span-1 md:col-span-2 xl:col-span-2',
  3: 'col-span-1 md:col-span-2 xl:col-span-3',
}
const BUBBLE_INNER_GRID_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

interface Props {
  properties: TokkoProperty[]
  operationType: 'Sale' | 'Rent' | 'TempRent'
  initialView?: 'list' | 'map'
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const delta = 2
  const start = Math.max(1, page - delta)
  const end   = Math.min(totalPages, page + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  const btn = (label: React.ReactNode, target: number, active = false, disabled = false) => (
    <button key={`${typeof label === 'object' ? 'arrow' : 'n'}-${target}`} onClick={() => !disabled && onChange(target)} disabled={disabled}
      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center ${active ? 'bg-brand-green text-white shadow-sm' : disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
      {label}
    </button>
  )
  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      {btn(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>, page - 1, false, page === 1)}
      {start > 1 && <>{btn(1, 1)}{start > 2 && <span className="w-10 text-center text-gray-400">…</span>}</>}
      {pages.map(p => btn(p, p, p === page))}
      {end < totalPages && <>{end < totalPages - 1 && <span className="w-10 text-center text-gray-400">…</span>}{btn(totalPages, totalPages)}</>}
      {btn(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>, page + 1, false, page === totalPages)}
    </div>
  )
}

export default function PropertiesPageContent({ properties, operationType, initialView = 'list' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>(initialView)
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10)
    return isNaN(p) || p < 1 ? 1 : p
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [featSeed, setFeatSeed] = useState(0)
  useEffect(() => { setFeatSeed(Math.random()) }, [])
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = filtersRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowBackToTop(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const savedY = sessionStorage.getItem(SCROLL_KEY)
    if (!savedY) return
    const y = parseInt(savedY, 10)
    sessionStorage.removeItem(SCROLL_KEY)
    requestAnimationFrame(() => requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: 'instant' }) }))
  }, [])

  const baseOpType: 'Sale' | 'Rent' | 'Temporary Rent' =
    operationType === 'Sale' ? 'Sale' : operationType === 'TempRent' ? 'Temporary Rent' : 'Rent'

  const sorted = useMemo(() => {
    const arr = [...properties]
    if (sort === 'recent') return arr.sort((a, b) => b.id - a.id)
    return arr.sort((a, b) => {
      const pa = getOperationPrice(a, baseOpType)?.amount ?? 0
      const pb = getOperationPrice(b, baseOpType)?.amount ?? 0
      return sort === 'price_asc' ? pa - pb : pb - pa
    })
  }, [properties, sort, baseOpType])

  const featuredPool = useMemo(() => {
    const arr = [...sorted.filter(p => p.is_starred_on_web)]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(((featSeed * (i + 1) * 2654435761) % 1) * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [sorted, featSeed])
  const regularPool = useMemo(
    () => sorted.filter(p => !p.is_starred_on_web),
    [sorted]
  )

  const filterKey = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    params.delete('view')
    return params.toString()
  }, [searchParams])

  const prevFilterKey = useRef(filterKey)
  const prevSort = useRef(sort)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      prevFilterKey.current = filterKey
      prevSort.current = sort
      return
    }
    const filtersChanged = prevFilterKey.current !== filterKey
    const sortChanged    = prevSort.current !== sort
    prevFilterKey.current = filterKey
    prevSort.current = sort
    if (filtersChanged || sortChanged) setPage(1)
  }, [filterKey, sort])

  const useBubbles   = sort === 'recent'
  const displayPool  = sort === 'featured' ? featuredPool : useBubbles ? regularPool : sorted
  const displayTotal = displayPool.length

  const paginated = useMemo(
    () => displayPool.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [displayPool, page]
  )

  const handlePageChange = (p: number) => {
    setPage(p)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    requestAnimationFrame(() => requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }))
  }

  const getFeatChunk = (globalCi: number): TokkoProperty[] => {
    const start = globalCi * FEAT_PER_CHUNK
    return featuredPool.slice(start, start + FEAT_PER_CHUNK)
  }

  // Build every chunk (bubble + regular cards) over the whole regularPool, sized
  // so it always completes full grid rows (never split across pages).
  const allChunks = useMemo(() => {
    const totalFeatChunks = Math.ceil(featuredPool.length / FEAT_PER_CHUNK)
    const result: { globalCi: number; cards: TokkoProperty[] }[] = []
    let offset = 0
    let ci = 0
    while (offset < regularPool.length || ci < totalFeatChunks) {
      const featN = ci < totalFeatChunks
        ? Math.min(FEAT_PER_CHUNK, featuredPool.length - ci * FEAT_PER_CHUNK)
        : 0
      const size = (featN === 0 || featN === 3) ? CHUNK_SIZE : 9 - featN
      const cards = regularPool.slice(offset, offset + size)
      if (cards.length === 0 && featN === 0) break
      result.push({ globalCi: ci, cards })
      offset += size
      ci++
    }
    return result
  }, [regularPool, featuredPool])

  // Group whole chunks into pages (~PAGE_SIZE cards each) without ever splitting a chunk.
  const chunkPages = useMemo(() => {
    const pages: typeof allChunks[] = []
    let current: typeof allChunks = []
    let count = 0
    for (const chunk of allChunks) {
      if (count > 0 && count + chunk.cards.length > PAGE_SIZE) {
        pages.push(current)
        current = []
        count = 0
      }
      current.push(chunk)
      count += chunk.cards.length
    }
    if (current.length) pages.push(current)
    return pages
  }, [allChunks])

  const totalPages = useBubbles ? (chunkPages.length || 1) : Math.ceil(displayTotal / PAGE_SIZE)
  const pageChunks = useBubbles ? (chunkPages[page - 1] || []) : []

  return (
    <>
      {view === 'map' && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[900] flex flex-col bg-white" style={{ top: 80 }}>
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button type="button" onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtros
            </button>
            <span className="text-sm text-gray-500 font-medium">{properties.length} propiedades</span>
          </div>
          <div className="flex-1 min-h-0">
            <PropertyMapView properties={sorted} operationType={baseOpType} hideSideList />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1100]">
            <button type="button" onClick={() => setView('list')}
              className="flex items-center gap-2.5 bg-gray-900 text-white px-7 py-3.5 rounded-full shadow-2xl text-sm font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Lista
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-6 py-12 ${view === 'map' ? 'hidden md:block' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 md:hidden overflow-x-auto flex-1 min-w-0 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 bg-white shadow-sm flex-shrink-0 whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtros
            </button>
            <button type="button" onClick={() => setView('map')}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 bg-white shadow-sm flex-shrink-0 whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              Mapa
            </button>
            <div className="relative flex-shrink-0">
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-6 py-2 text-[13px] font-semibold text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green/30 whitespace-nowrap">
                <option value="recent">Más recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                {featuredPool.length > 0 && <option value="featured">Solo destacadas</option>}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Ordenar por</span>
              <div className="relative">
                <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  {featuredPool.length > 0 && <option value="featured">Solo destacadas</option>}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
              <button type="button" onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${view === 'list' ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                Lista
              </button>
              <button type="button" onClick={() => setView('map')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${view === 'map' ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                Mapa
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          <div ref={filtersRef} className="hidden lg:block w-72 flex-shrink-0">
            <Suspense><PropertyFilters operationType={operationType} /></Suspense>
          </div>

          <div className="flex-1 min-w-0">
            {view === 'map' ? (
              <PropertyMapView properties={sorted} operationType={baseOpType} />
            ) : sorted.length > 0 ? (
              <>
                {!useBubbles ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginated.map(p => <PropertyCard key={p.id} property={p} operationType={baseOpType} />)}
                  </div>
                ) : featuredPool.length > 0 ? (
                  <div className="space-y-6">
                    {pageChunks.map(({ globalCi, cards }) => {
                      const featItems = getFeatChunk(globalCi)
                      return (
                        <div key={globalCi} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {featItems.length > 0 && (
                            <div className={`bg-brand-green/25 border border-brand-green/50 rounded-2xl p-5 ${BUBBLE_SPAN_CLASS[featItems.length]}`}>
                              <div className="flex items-center gap-2 mb-4">
                                <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span className="font-sans text-xs font-bold text-brand-green uppercase tracking-widest">Propiedades destacadas</span>
                              </div>
                              <div className={`grid gap-6 ${BUBBLE_INNER_GRID_CLASS[featItems.length]}`}>
                                {featItems.map(p => <PropertyCard key={p.id} property={p} operationType={baseOpType} />)}
                              </div>
                            </div>
                          )}
                          {cards.map((p, idx) => {
                            const n = featItems.length
                            let offsetClass = ''
                            if (n > 0 && n < 3 && idx < 3 - n) offsetClass += ' xl:mt-14'
                            if (n > 0 && n < 2 && idx < 2 - n) offsetClass += ' md:mt-14'
                            return (
                              <div key={p.id} className={offsetClass || undefined}>
                                <PropertyCard property={p} operationType={baseOpType} />
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginated.map(p => <PropertyCard key={p.id} property={p} operationType={baseOpType} />)}
                  </div>
                )}
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
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

      {showBackToTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 left-6 z-[800] flex items-center justify-center w-12 h-12 rounded-full bg-brand-green text-white shadow-lg hover:bg-brand-green/90 transition-all duration-200"
          aria-label="Volver arriba">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      )}

      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-[1300] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
              <button type="button" onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200" aria-label="Cerrar filtros">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <Suspense>
                <PropertyFilters operationType={operationType} mobile onClose={() => setShowMobileFilters(false)} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
