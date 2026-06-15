'use client'
import { useState, useEffect, useCallback } from 'react'

interface TokkoProperty {
  id:        number
  address:   string
  type:      string
  price:     number | null
  currency:  string
  agentName: string
}

interface Autorizacion {
  id:             string
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
  titularNombre:  string
  titularDNI:     string
  titularTel:     string
  titularEmail:   string
  fechaFirma:     string
  propiedadId:    string | null
  firmaDataUrl:   string
}

export default function PropiedadesClient() {
  const [propiedades,    setPropiedades]    = useState<TokkoProperty[]>([])
  const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([])
  const [loading,        setLoading]        = useState(true)
  const [isAdmin,        setIsAdmin]        = useState(false)

  const [assignModal,   setAssignModal]   = useState<{ propId: string } | null>(null)
  const [search,        setSearch]        = useState('')
  const [authFilter,    setAuthFilter]    = useState<'all' | 'signed' | 'unsigned'>('all')
  const [agentFilter,   setAgentFilter]   = useState<string>('')
  const [paperSigned,   setPaperSigned]   = useState<Set<string>>(new Set())
  const [paperLoading,  setPaperLoading]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, aRes, meRes, paperRes] = await Promise.all([
      fetch('/api/propiedades/tokko'),
      fetch('/api/autorizaciones'),
      fetch('/api/auth/me'),
      fetch('/api/propiedades/paper-auth'),
    ])

    const props: TokkoProperty[]  = pRes.ok    ? await pRes.json()    : []
    const auths: Autorizacion[]   = aRes.ok    ? await aRes.json()    : []
    const paper: string[]         = paperRes.ok ? await paperRes.json() : []
    if (meRes.ok) { const me = await meRes.json(); setIsAdmin(me.role === 'admin') }

    setPropiedades(props)
    setPaperSigned(new Set(paper))

    // Auto-delete authorizations whose property no longer exists in Tokko
    if (props.length > 0) {
      const validIds  = new Set(props.map(p => String(p.id)))
      const orphanIds = new Set(
        auths.filter(a => a.propiedadId && !validIds.has(a.propiedadId)).map(a => a.id)
      )
      orphanIds.forEach(id =>
        fetch(`/api/autorizaciones/${id}`, { method: 'DELETE' }).catch(() => {})
      )
      setAutorizaciones(auths.filter(a => !orphanIds.has(a.id)))
    } else {
      setAutorizaciones(auths)
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Pre-load PDF module + fonts in background so the first PDF generates instantly
  useEffect(() => {
    import('@react-pdf/renderer').catch(() => {})
    import('../../firma/[token]/AutorizacionDocument').catch(() => {})
    ;[
      '/fonts/Montserrat-Regular.woff',
      '/fonts/Montserrat-SemiBold.woff',
      '/fonts/Montserrat-Bold.woff',
      '/fonts/EurostileRegular.otf',
      '/logo.png',
    ].forEach(url => fetch(url).catch(() => {}))
  }, [])

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const authForProp = (tokkoId: number) =>
    autorizaciones.find(a => a.propiedadId === String(tokkoId))

  const unlinkedAuths = autorizaciones.filter(a => !a.propiedadId)

  const fmtPrice = (price: number | null, currency: string) => {
    if (!price) return null
    const sym = currency === 'USD' ? 'U$S' : '$'
    return `${sym} ${price.toLocaleString('es-AR')}`
  }

  // ── PDF helpers ───────────────────────────────────────────────────────────
  const toBase64 = (url: string): Promise<string> =>
    fetch(url).then(r => r.blob()).then(
      blob => new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload  = () => res(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(blob)
      })
    )

  const fetchFullAuth = async (authId: string): Promise<Autorizacion | null> => {
    try {
      const res = await fetch(`/api/autorizaciones/${authId}`)
      return res.ok ? res.json() : null
    } catch { return null }
  }

  const generatePdfBlob = async (auth: Autorizacion): Promise<Blob> => {
    // Fetch full record to get firmaDataUrl (stripped from list for performance)
    const full    = await fetchFullAuth(auth.id)
    const logoUrl = await toBase64('/logo.png')
    const [{ pdf }, { AutorizacionDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../../firma/[token]/AutorizacionDocument'),
    ])
    return pdf(
      AutorizacionDocument({ data: { ...auth, firmaDataUrl: full?.firmaDataUrl ?? '' }, logoUrl })
    ).toBlob()
  }

  const downloadAuth = async (a: Autorizacion) => {
    try {
      const blob = await generatePdfBlob(a)
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `Autorización - ${a.inmuebleDir} - ${a.titularNombre}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Error al generar el PDF.')
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const assignAuth = async (tokkoId: number, authId: string) => {
    await fetch(`/api/autorizaciones/${authId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propiedadId: String(tokkoId) }),
    })
    setAutorizaciones(prev =>
      prev.map(a => a.id === authId ? { ...a, propiedadId: String(tokkoId) } : a)
    )
    setAssignModal(null)
  }

  const unassignAuth = async (authId: string) => {
    await fetch(`/api/autorizaciones/${authId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propiedadId: null }),
    })
    setAutorizaciones(prev =>
      prev.map(a => a.id === authId ? { ...a, propiedadId: null } : a)
    )
  }

  const deleteAuth = async (authId: string, nombre: string) => {
    if (!confirm(`¿Eliminar la autorización de ${nombre}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/autorizaciones/${authId}`, { method: 'DELETE' })
    if (res.ok) {
      setAutorizaciones(prev => prev.filter(a => a.id !== authId))
    } else {
      alert('No se pudo eliminar la autorización.')
    }
  }

  const togglePaperAuth = async (propId: string) => {
    const isSigned = paperSigned.has(propId)
    if (isSigned && !confirm('¿Quitar la marca de "Firmada en papel"?')) return
    setPaperLoading(propId)
    const res = await fetch('/api/propiedades/paper-auth', {
      method:  isSigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propId }),
    })
    if (res.ok) {
      setPaperSigned(prev => {
        const next = new Set(prev)
        isSigned ? next.delete(propId) : next.add(propId)
        return next
      })
    }
    setPaperLoading(null)
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const agentNames = Array.from(new Set(propiedades.map(p => p.agentName).filter(Boolean))).sort()

  const isFirmada = (propId: number) => !!authForProp(propId) || paperSigned.has(String(propId))

  const propiedadesFiltradas = propiedades.filter(p => {
    if (search.trim() && !p.address.toLowerCase().includes(search.toLowerCase())) return false
    if (agentFilter && p.agentName !== agentFilter) return false
    if (authFilter === 'signed')   return isFirmada(p.id)
    if (authFilter === 'unsigned') return !isFirmada(p.id)
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalFirmadas = propiedades.filter(p => isFirmada(p.id)).length

  return (
    <div className="max-w-4xl space-y-5">

      {/* Stats */}
      <p className="text-sm text-gray-500">
        {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} en cartera
        {' · '}
        {totalFirmadas} autorización{totalFirmadas !== 1 ? 'es' : ''} firmada{totalFirmadas !== 1 ? 's' : ''}
      </p>

      {/* Autorizaciones sin asignar */}
      {unlinkedAuths.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-amber-800 text-sm font-bold mb-3">
            {unlinkedAuths.length} autorización{unlinkedAuths.length !== 1 ? 'es' : ''} sin asignar
          </p>
          <div className="space-y-2">
            {unlinkedAuths.map(a => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.titularNombre}</p>
                  <p className="text-xs text-gray-500">{a.inmuebleDir} — {a.fechaFirma}</p>
                  {a.exclusividad && (
                    <span className="inline-block text-xs bg-brand-green/10 text-brand-green font-semibold px-2 py-0.5 rounded-full mt-1">Exclusiva</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => downloadAuth(a)}
                    className="text-xs border border-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                  {propiedades.length > 0 && (
                    <button onClick={() => setAssignModal({ propId: '' })}
                      className="text-xs bg-brand-green text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-hover transition">
                      Asignar a propiedad
                    </button>
                  )}
                  <button onClick={() => deleteAuth(a.id, a.titularNombre)}
                    className="text-xs border border-red-200 text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      {propiedades.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input type="text" placeholder="Buscar por dirección..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition" />
          </div>

          {isAdmin && agentNames.length > 1 && (
            <select
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition bg-white text-gray-700">
              <option value="">Todos los asesores</option>
              {agentNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-medium">
            {([['all', 'Todas'], ['signed', 'Con autorizac.'], ['unsigned', 'Sin autorizac.']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setAuthFilter(val)}
                className={`px-3 py-2.5 transition ${authFilter === val ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de propiedades */}
      {propiedades.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No tenés propiedades activas en Tokko</p>
          <p className="text-gray-400 text-xs mt-1">Las propiedades se sincronizan automáticamente desde el sistema</p>
        </div>
      ) : propiedadesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-500 text-sm font-medium">Sin resultados</p>
          <p className="text-gray-400 text-xs mt-1">Ninguna propiedad coincide con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {propiedadesFiltradas.map(p => {
            const auth = authForProp(p.id)

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">{p.address}</h3>
                        {p.type && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.type}</span>}
                        {isAdmin && p.agentName && (
                          <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{p.agentName}</span>
                        )}
                      </div>
                      {fmtPrice(p.price, p.currency) && (
                        <p className="text-xs text-gray-500 mt-0.5">{fmtPrice(p.price, p.currency)}</p>
                      )}

                      {/* Auth status */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {auth ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Autorización firmada
                            </span>
                            {auth.exclusividad && (
                              <span className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green text-xs font-semibold px-3 py-1 rounded-full">Exclusiva</span>
                            )}
                            <span className="text-xs text-gray-400">{auth.titularNombre} — {auth.fechaFirma}</span>
                            <button onClick={() => downloadAuth(auth)}
                              className="text-xs text-brand-green hover:text-brand-hover font-semibold transition flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </button>
                            <button onClick={() => unassignAuth(auth.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition underline">
                              Desasignar
                            </button>
                          </>
                        ) : paperSigned.has(String(p.id)) ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Autorización firmada
                            </span>
                            <span className="text-xs text-gray-400">En papel</span>
                            <button
                              onClick={() => togglePaperAuth(String(p.id))}
                              disabled={paperLoading === String(p.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition underline disabled:opacity-50">
                              Quitar
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">Sin autorización firmada</span>
                            {unlinkedAuths.length > 0 && (
                              <button onClick={() => setAssignModal({ propId: String(p.id) })}
                                className="text-xs text-brand-green hover:text-brand-hover font-semibold transition">
                                Asignar autorización
                              </button>
                            )}
                            <button
                              onClick={() => togglePaperAuth(String(p.id))}
                              disabled={paperLoading === String(p.id)}
                              className="text-xs border border-blue-200 text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Firmada en papel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para asignar */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-gray-900 mb-1">Asignar autorización</h3>
            {assignModal.propId ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Seleccioná qué autorización corresponde a esta propiedad.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {unlinkedAuths.map(a => (
                    <button key={a.id}
                      onClick={() => assignAuth(parseInt(assignModal.propId), a.id)}
                      className="w-full text-left bg-gray-50 hover:bg-brand-light rounded-xl px-4 py-3 transition">
                      <p className="text-sm font-semibold text-gray-800">{a.titularNombre}</p>
                      <p className="text-xs text-gray-500">{a.inmuebleDir} — {a.fechaFirma}</p>
                      {a.exclusividad && <span className="text-xs text-brand-green font-semibold">Con exclusividad</span>}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Seleccioná a qué propiedad asignar esta autorización.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {unlinkedAuths.map(auth => (
                    <div key={auth.id} className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">{auth.titularNombre} — {auth.inmuebleDir}</p>
                      {propiedades.map(p => (
                        <button key={p.id}
                          onClick={() => assignAuth(p.id, auth.id)}
                          className="w-full text-left bg-gray-50 hover:bg-brand-light rounded-xl px-4 py-2.5 transition mb-1.5">
                          <p className="text-sm font-semibold text-gray-800">{p.address}</p>
                          <p className="text-xs text-gray-400">{p.type}{p.price ? ` — ${fmtPrice(p.price, p.currency)}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setAssignModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
