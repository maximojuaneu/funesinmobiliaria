import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getProperties, getAgents, getClosedOperations } from '@/lib/tokko'
import { readIndividualObjectives, readTeamOperations, type AgentObjective, type AgentOperationCounts } from '@/lib/sheets'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import TasksSection from './TasksSection'

export const metadata: Metadata = { title: 'Dashboard | Funes Inmobiliaria', robots: { index: false } }

const CURRENT_YEAR = new Date().getFullYear().toString()

interface ManualOp {
  captador?: string
  vendedor?: string
  status: string
  fecha: string
  tiempoComercializacion?: number
}

function readClosedOps(): ManualOp[] {
  try {
    const file = path.join(process.cwd(), 'data', 'closed-operations.json')
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return [] }
}

function normalName(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function fmt(n: number) {
  return 'U$S ' + n.toLocaleString('es-AR')
}

function pctColor(pct: number) {
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-500'
}

function pctBg(pct: number) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}

export default async function DashboardPage() {
  const session = await requireAuth()
  if (!session) return null

  const isAdmin = session.role === 'admin'

  // ── Propiedades activas ──────────────────────────────────────────────────────
  const { objects: all } = await getProperties()

  const myProperties = isAdmin
    ? all
    : all.filter(p => p.producer?.id === session.tokkoId)

  const totalProps = myProperties.length
  const forSale    = myProperties.filter(p => p.operations.some(o => o.operation_id === 1)).length
  const forRent    = myProperties.filter(p => p.operations.some(o => o.operation_id === 2)).length

  // ── Closed ops ───────────────────────────────────────────────────────────────
  const closedOps      = readClosedOps()
  const totalClosedOps = closedOps.length
  const withDays       = closedOps.filter(o => (o.tiempoComercializacion ?? 0) > 0)
  const avgClosingDays = withDays.length > 0
    ? Math.round(withDays.reduce((s, o) => s + (o.tiempoComercializacion ?? 0), 0) / withDays.length)
    : null

  // ── Stats anuales ────────────────────────────────────────────────────────────
  const tokkoClosedOps = await getClosedOperations().catch(() => [])
  const thisYearTokko  = tokkoClosedOps.filter(o => o.date.startsWith(CURRENT_YEAR))
  const thisYearManual = closedOps.filter(o => o.status === 'VENDIDA' && o.fecha.startsWith(CURRENT_YEAR))

  const countForAgent = (agentName: string | null) => {
    const myTokko      = agentName ? thisYearTokko.filter(o => o.agentName === agentName) : thisYearTokko
    const sold_tokko   = myTokko.filter(o => o.operationType === 'Sale').length
    const rented_tokko = myTokko.filter(o => o.operationType === 'Rent' || o.operationType === 'TempRent').length
    const myManual     = agentName ? thisYearManual.filter(o => o.captador === agentName || o.vendedor === agentName) : thisYearManual
    return {
      sold:   sold_tokko + myManual.length,
      rented: rented_tokko,
      total:  sold_tokko + myManual.length + rented_tokko,
    }
  }

  const myYearStats = countForAgent(isAdmin ? null : (session.name ?? null))

  // ── Objetivos individuales + operaciones (Google Sheets) ─────────────────────
  const [allObjectives, allOperations] = await Promise.all([
    readIndividualObjectives(),
    readTeamOperations(),
  ])

  let myObjective: AgentObjective | null = null
  let myOperations: AgentOperationCounts | null = null
  if (!isAdmin && session.name) {
    const sn = normalName(session.name ?? '')
    myObjective  = allObjectives.find(o => normalName(o.name) === sn) ?? null
    myOperations = allOperations.find(o => normalName(o.name) === sn) ?? null
  }

  // ── Per-agent table (admins only) ────────────────────────────────────────────
  let agentRows: {
    name: string; total: number; sale: number; rent: number
    yearSold: number; yearRented: number
  }[] = []

  let tokkoAgentsList: { id: number; name: string }[] = []

  if (isAdmin) {
    const tokkoAgents = await getAgents()
    tokkoAgentsList   = tokkoAgents.map(a => ({ id: a.id, name: a.name }))

    agentRows = tokkoAgents.map(agent => {
      const props = all.filter(p => p.producer?.id === agent.id)
      const ys    = countForAgent(agent.name)
      return {
        name:       agent.name,
        total:      props.length,
        sale:       props.filter(p => p.operations.some(o => o.operation_id === 1)).length,
        rent:       props.filter(p => p.operations.some(o => o.operation_id === 2)).length,
        yearSold:   ys.sold,
        yearRented: ys.rented,
      }
    }).sort((a, b) => b.total - a.total)
  }

  const QUARTERS = ['1er Trim.', '2do Trim.', '3er Trim.', '4to Trim.']

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Panel general' : `Hola, ${session.name}`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAdmin
            ? 'Vista completa de la cartera y rendimiento por agente.'
            : 'Tus propiedades asignadas y métricas personales.'}
        </p>
      </div>

      {/* ── Top: propiedades + [tiempo cierre admin] + tareas ── */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-5 mb-8 items-stretch`}>

        {/* Propiedades activas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {isAdmin ? 'Propiedades totales' : 'Mis propiedades'}
              </p>
              <p className="text-4xl font-extrabold text-brand-green">{totalProps}</p>
              <p className="text-xs text-gray-400 mt-1">Activas en el sistema</p>
            </div>
            <svg className="w-8 h-8 text-brand-green mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <div className="flex-1 bg-emerald-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Venta</p>
              <p className="text-2xl font-extrabold text-emerald-600">{forSale}</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Alquiler</p>
              <p className="text-2xl font-extrabold text-blue-600">{forRent}</p>
            </div>
          </div>
        </div>

        {/* Tiempo promedio de cierre — solo admins */}
        {isAdmin && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tiempo prom. de cierre</p>
                {avgClosingDays !== null ? (
                  <>
                    <p className="text-4xl font-extrabold text-purple-600">{avgClosingDays}</p>
                    <p className="text-xs text-gray-400 mt-1">días promedio · {totalClosedOps} operaciones</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-extrabold text-purple-300">—</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {totalClosedOps > 0 ? 'Sin días cargados aún' : 'Sin operaciones en el mapa'}
                    </p>
                  </>
                )}
              </div>
              <svg className="w-8 h-8 text-purple-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Link href="/dashboard/mapa" className="text-xs text-purple-500 hover:text-purple-700 font-medium">
              Ver mapa de operaciones →
            </Link>
          </div>
        )}

        {/* Tareas pendientes — al lado de propiedades */}
        <TasksSection
          isAdmin={isAdmin}
          sessionName={session.name}
          agents={isAdmin ? tokkoAgentsList : []}
        />
      </div>

      {/* ── Objetivos individuales — agente ve solo los suyos ── */}
      {!isAdmin && myObjective && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Mis objetivos {CURRENT_YEAR}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Facturación individual — objetivo vs cumplimiento</p>
            </div>
            <span className={`text-2xl font-extrabold ${pctColor(myObjective.pctCumplimiento)}`}>
              {myObjective.pctCumplimiento}%
            </span>
          </div>
          <div className="p-6">
            {/* Annual summary bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Facturado: <span className="text-gray-900">{fmt(myObjective.facturacionAnual)}</span></span>
                <span>Objetivo anual: <span className="text-gray-900">{fmt(myObjective.objAnual)}</span></span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pctBg(myObjective.pctCumplimiento)}`}
                  style={{ width: `${Math.min(myObjective.pctCumplimiento, 100)}%` }}
                />
              </div>
            </div>

            {/* Quarterly breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUARTERS.map((label, i) => {
                const obj = [myObjective!.obj_q1, myObjective!.obj_q2, myObjective!.obj_q3, myObjective!.obj_q4][i]
                const cum = [myObjective!.cum_q1, myObjective!.cum_q2, myObjective!.cum_q3, myObjective!.cum_q4][i]
                const qPct = obj > 0 ? Math.round((cum / obj) * 100) : 0
                return (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                    <p className={`text-lg font-extrabold ${pctColor(qPct)}`}>{qPct}%</p>
                    <p className="text-xs text-gray-500 mt-1">{fmt(cum)}</p>
                    <p className="text-xs text-gray-400">de {fmt(obj)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Objetivos del equipo — solo admins ── */}
      {isAdmin && allObjectives.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Objetivos individuales del equipo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Facturación {CURRENT_YEAR} — objetivo vs cumplimiento trimestral y anual</p>
          </div>

          {/* Mobile: cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {allObjectives.map((row) => {
              const quarters = [
                { obj: row.obj_q1, cum: row.cum_q1 },
                { obj: row.obj_q2, cum: row.cum_q2 },
                { obj: row.obj_q3, cum: row.cum_q3 },
                { obj: row.obj_q4, cum: row.cum_q4 },
              ]
              return (
                <div key={row.name} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green flex-shrink-0">
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{row.name}</span>
                    </div>
                    <span className={`text-lg font-extrabold ${pctColor(row.pctCumplimiento)}`}>{row.pctCumplimiento}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${pctBg(row.pctCumplimiento)}`} style={{ width: `${Math.min(row.pctCumplimiento, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Facturado: <span className="font-semibold text-gray-700">{fmt(row.facturacionAnual)}</span></span>
                    <span>Objetivo: <span className="font-semibold text-gray-700">{fmt(row.objAnual)}</span></span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {quarters.map((q, qi) => {
                      const qPct = q.obj > 0 ? Math.round((q.cum / q.obj) * 100) : 0
                      return (
                        <div key={qi} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] font-semibold text-gray-400 mb-1">{QUARTERS[qi]}</p>
                          <p className={`text-xs font-bold ${pctColor(qPct)}`}>{qPct}%</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{fmt(q.cum)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3">Agente</th>
                  {QUARTERS.map(q => (
                    <th key={q} className="text-center px-3 py-3">{q}</th>
                  ))}
                  <th className="text-center px-4 py-3 border-l border-gray-100">Objetivo Anual</th>
                  <th className="text-center px-4 py-3">Facturado</th>
                  <th className="text-center px-4 py-3">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {allObjectives.map((row, i) => {
                  const quarters = [
                    { obj: row.obj_q1, cum: row.cum_q1 },
                    { obj: row.obj_q2, cum: row.cum_q2 },
                    { obj: row.obj_q3, cum: row.cum_q3 },
                    { obj: row.obj_q4, cum: row.cum_q4 },
                  ]
                  return (
                    <tr key={row.name} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          {row.name}
                        </div>
                      </td>
                      {quarters.map((q, qi) => {
                        const qPct = q.obj > 0 ? Math.round((q.cum / q.obj) * 100) : 0
                        return (
                          <td key={qi} className="text-center px-3 py-3">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-xs font-bold ${pctColor(qPct)}`}>{qPct}%</span>
                              <span className="text-xs text-gray-400">{fmt(q.cum)}</span>
                            </div>
                          </td>
                        )
                      })}
                      <td className="text-center px-4 py-3 border-l border-gray-100 text-gray-600 text-xs font-semibold">
                        {fmt(row.objAnual)}
                      </td>
                      <td className="text-center px-4 py-3 text-gray-800 text-xs font-semibold">
                        {fmt(row.facturacionAnual)}
                      </td>
                      <td className="text-center px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-extrabold ${pctColor(row.pctCumplimiento)}`}>
                            {row.pctCumplimiento}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pctBg(row.pctCumplimiento)}`} style={{ width: `${Math.min(row.pctCumplimiento, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50 font-bold text-sm border-t-2 border-gray-200">
                  <td className="px-6 py-3 text-gray-700">Total equipo</td>
                  {[0,1,2,3].map(qi => {
                    const keys = [
                      ['cum_q1','obj_q1'],['cum_q2','obj_q2'],['cum_q3','obj_q3'],['cum_q4','obj_q4']
                    ] as const
                    const totalCum = allObjectives.reduce((s,r) => s + r[keys[qi][0]], 0)
                    const totalObj = allObjectives.reduce((s,r) => s + r[keys[qi][1]], 0)
                    const tPct = totalObj > 0 ? Math.round((totalCum / totalObj) * 100) : 0
                    return (
                      <td key={qi} className="text-center px-3 py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-bold ${pctColor(tPct)}`}>{tPct}%</span>
                          <span className="text-xs text-gray-400">{fmt(totalCum)}</span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="text-center px-4 py-3 border-l border-gray-100 text-gray-600 text-xs font-semibold">
                    {fmt(allObjectives.reduce((s,r) => s+r.objAnual, 0))}
                  </td>
                  <td className="text-center px-4 py-3 text-gray-800 text-xs font-semibold">
                    {fmt(allObjectives.reduce((s,r) => s+r.facturacionAnual, 0))}
                  </td>
                  <td className="text-center px-4 py-3">
                    {(() => {
                      const tObj = allObjectives.reduce((s,r) => s+r.objAnual, 0)
                      const tFac = allObjectives.reduce((s,r) => s+r.facturacionAnual, 0)
                      const tPct = tObj > 0 ? Math.round((tFac / tObj) * 100) : 0
                      return (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-extrabold ${pctColor(tPct)}`}>{tPct}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pctBg(tPct)}`} style={{ width: `${Math.min(tPct,100)}%` }} />
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Operaciones del equipo — agente ve solo las suyas ── */}
      {!isAdmin && myOperations && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900">Mis operaciones {CURRENT_YEAR}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cantidad de operaciones en las que participaste (ordenadas por trimestre)</p>
            </div>
            <span className="text-2xl font-extrabold text-indigo-600 flex-shrink-0">{myOperations.total}</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUARTERS.map((label, i) => {
                const count = [myOperations!.q1, myOperations!.q2, myOperations!.q3, myOperations!.q4][i]
                return (
                  <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                    <p className="text-3xl font-extrabold text-indigo-600">{count}</p>
                    <p className="text-xs text-gray-400 mt-1">operaciones</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Operaciones del equipo — solo admins ── */}
      {isAdmin && allOperations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Operaciones del equipo {CURRENT_YEAR}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cantidad de operaciones en las que participó cada agente (ordenadas por trimestre)</p>
          </div>

          {/* Mobile: cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {allOperations.map((row) => (
              <div key={row.name} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green flex-shrink-0">
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{row.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {[row.q1, row.q2, row.q3, row.q4].map((count, qi) => (
                        <span key={qi} className={`text-xs px-1.5 py-0.5 rounded font-bold ${count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-300'}`}>
                          T{qi + 1}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-indigo-700 font-extrabold text-xl flex-shrink-0">{row.total}</span>
              </div>
            ))}
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-bold text-gray-700">Total equipo</span>
              <span className="text-indigo-700 font-extrabold text-xl">{allOperations.reduce((s, r) => s + r.total, 0)}</span>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3">Vendedor</th>
                  {QUARTERS.map(q => (
                    <th key={q} className="text-center px-4 py-3">{q}</th>
                  ))}
                  <th className="text-center px-4 py-3 border-l border-gray-100">Total {CURRENT_YEAR}</th>
                </tr>
              </thead>
              <tbody>
                {allOperations.map((row, i) => (
                  <tr key={row.name} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        {row.name}
                      </div>
                    </td>
                    {[row.q1, row.q2, row.q3, row.q4].map((count, qi) => (
                      <td key={qi} className="text-center px-4 py-3">
                        {count > 0
                          ? <span className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-xs">{count}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="text-center px-4 py-3 border-l border-gray-100">
                      <span className="text-indigo-700 font-extrabold text-sm">{row.total}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold text-sm border-t-2 border-gray-200">
                  <td className="px-6 py-3 text-gray-700">Total equipo</td>
                  {[1,2,3,4].map(q => (
                    <td key={q} className="text-center px-4 py-3">
                      <span className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {allOperations.reduce((s, r) => s + (r[`q${q}` as 'q1'|'q2'|'q3'|'q4']), 0)}
                      </span>
                    </td>
                  ))}
                  <td className="text-center px-4 py-3 border-l border-gray-100">
                    <span className="text-indigo-700 font-extrabold text-sm">
                      {allOperations.reduce((s, r) => s + r.total, 0)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Admin: tabla por agente ── */}
      {isAdmin && agentRows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Rendimiento por agente</h2>
            <p className="text-xs text-gray-400 mt-0.5">Propiedades activas</p>
          </div>

          {/* Mobile: cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {agentRows.map((row) => (
              <div key={row.name} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green flex-shrink-0">
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{row.name}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Activas</p>
                    <p className="font-bold text-gray-900 text-sm">{row.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-emerald-600 uppercase font-semibold">Venta</p>
                    <p className="font-semibold text-emerald-600 text-sm">{row.sale}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-blue-600 uppercase font-semibold">Alquiler</p>
                    <p className="font-semibold text-blue-600 text-sm">{row.rent}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-bold text-gray-700">Total</span>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Activas</p>
                  <p className="font-bold text-gray-900 text-sm">{agentRows.reduce((s,r)=>s+r.total,0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-emerald-600 uppercase font-semibold">Venta</p>
                  <p className="font-semibold text-emerald-700 text-sm">{agentRows.reduce((s,r)=>s+r.sale,0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-blue-600 uppercase font-semibold">Alquiler</p>
                  <p className="font-semibold text-blue-700 text-sm">{agentRows.reduce((s,r)=>s+r.rent,0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3">Agente</th>
                  <th className="text-center px-4 py-3">Activas</th>
                  <th className="text-center px-4 py-3">Venta</th>
                  <th className="text-center px-4 py-3">Alquiler</th>
                </tr>
              </thead>
              <tbody>
                {agentRows.map((row, i) => (
                  <tr key={row.name} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand-green">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        {row.name}
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 font-bold text-gray-900">{row.total}</td>
                    <td className="text-center px-4 py-3 text-emerald-600 font-semibold">{row.sale}</td>
                    <td className="text-center px-4 py-3 text-blue-600 font-semibold">{row.rent}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold text-sm border-t-2 border-gray-200">
                  <td className="px-6 py-3 text-gray-700">Total</td>
                  <td className="text-center px-4 py-3 text-gray-900">{agentRows.reduce((s,r)=>s+r.total,0)}</td>
                  <td className="text-center px-4 py-3 text-emerald-700">{agentRows.reduce((s,r)=>s+r.sale,0)}</td>
                  <td className="text-center px-4 py-3 text-blue-700">{agentRows.reduce((s,r)=>s+r.rent,0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
