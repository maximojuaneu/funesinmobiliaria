'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Role = 'admin' | 'agent' | 'designer'

const navItems: { label: string; href: string; icon: string; roles: Role[] }[] = [
  { label: 'Inicio',                       href: '/dashboard',                icon: '🏠', roles: ['admin', 'agent'] },
  { label: 'Mapa de operaciones cerradas', href: '/dashboard/mapa',          icon: '🗺️', roles: ['admin', 'agent'] },
  { label: 'Diseños y flyers',             href: '/dashboard/flyers',        icon: '🎨', roles: ['admin', 'agent', 'designer'] },
  { label: 'Informe de tasación',          href: '/dashboard/tasaciones',    icon: '📋', roles: ['admin', 'agent'] },
  { label: 'Documentación de propiedades', href: '/dashboard/autorizaciones',icon: '📁', roles: ['admin', 'agent'] },
  { label: 'Métricas del sitio',           href: '/dashboard/metricas',      icon: '📊', roles: ['admin', 'designer'] },
]

interface AgentInfo { name: string; role: string; picture: string | null }

function AgentAvatar({ agent }: { agent: AgentInfo }) {
  return agent.picture ? (
    <img src={agent.picture} alt={agent.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
      {agent.name.charAt(0).toUpperCase()}
    </div>
  )
}

interface SidebarProps {
  initialRole: Role
  initialName: string
}

const INACTIVITY_MS = 5 * 60 * 1000 // 5 minutes

export default function DashboardSidebar({ initialRole, initialName }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [agent, setAgent]           = useState<AgentInfo>({ name: initialName, role: initialRole, picture: null })
  const [dropOpen, setDropOpen]     = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const dropRef     = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((data: AgentInfo | null) => { if (data?.name) setAgent(data) })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Inactivity timeout
  useEffect(() => {
    const expire = async () => {
      setSessionExpired(true)
      await fetch('/api/auth/logout', { method: 'POST' })
    }

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(expire, INACTIVITY_MS)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(agent.role as Role))

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-brand-green text-white flex-col z-40">
        <div className="px-4 pt-5 pb-4 border-b border-white/15">
          <Image src="/logo.png" alt="Funes Inmobiliaria" width={170} height={68} className="h-14 w-auto brightness-0 invert" />
          <p className="text-white/80 text-sm font-semibold mt-3 px-1">Panel comercial</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/15">
          {agent && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <AgentAvatar agent={agent} />
              <div className="min-w-0">
                <p className="text-white/90 text-sm font-semibold truncate">{agent.name}</p>
                <p className="text-white/50 text-xs capitalize">{agent.role === 'admin' ? 'Administrador' : agent.role === 'designer' ? 'Diseñador' : 'Agente'}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full text-white/60 hover:text-white text-sm text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Session expired modal ── */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tu sesión expiró</h2>
            <p className="text-gray-500 text-sm mb-6">Por seguridad, cerramos tu sesión después de 5 minutos de inactividad.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-brand-green text-white font-semibold py-3 rounded-xl hover:bg-brand-green/90 transition-colors"
            >
              Volver al ingreso
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[2000] bg-brand-green text-white flex items-center justify-between px-4 h-14 shadow-md">
        <Image src="/logo.png" alt="Funes Inmobiliaria" width={100} height={40} className="h-8 w-auto brightness-0 invert" />

        {/* Panel Comercial dropdown */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Panel Comercial
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden z-50">
              {visibleItems.map(item => (
                <button
                  key={item.href}
                  onMouseDown={() => { setDropOpen(false); router.push(item.href) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 text-left ${
                    pathname === item.href ? 'bg-brand-green/10 text-brand-green' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                onMouseDown={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <span>🚪</span> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
