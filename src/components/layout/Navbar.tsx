'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'EMPRENDIMIENTOS',  href: '/emprendimientos' },
  { label: 'NOSOTROS',         href: '/nosotros' },
]

const alquilerDropdown = [
  { label: 'PERMANENTE',  href: '/alquiler' },
  { label: 'TEMPORARIO',  href: '/alquiler?temp=1' },
]

// Scroll distance (px) over which the navbar fades from transparent to white
const FADE_RANGE = 120

export default function Navbar() {
  const [scrollY, setScrollY]             = useState(0)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [alquilerOpen, setAlquilerOpen]   = useState(false)
  const [mobileAlqOpen, setMobileAlqOpen] = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  const alquilerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const isHome = pathname === '/'

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const onMQ = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onMQ)
    return () => mq.removeEventListener('change', onMQ)
  }, [])

  useEffect(() => {
    // Sync initial position (e.g. after back-navigation)
    setScrollY(window.scrollY)
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alquilerRef.current && !alquilerRef.current.contains(e.target as Node)) {
        setAlquilerOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // En mobile siempre blanco. En desktop, fade transparente→blanco al scrollear en home.
  const opacity = (isHome && !isMobile) ? Math.min(scrollY / FADE_RANGE, 1) : 1
  const isTransparent = opacity < 1

  // Text colour interpolation: white → gray-600 (#4b5563)
  const linkColor = isTransparent
    ? `rgba(255,255,255,${0.92 - opacity * 0.32})`   // white fading to near-white, then Tailwind handles hover
    : undefined   // fall back to className colour

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1100] transition-[background-color,box-shadow,border-color] duration-300"
      style={{
        backgroundColor: `rgba(255,255,255,${opacity})`,
        backdropFilter:  opacity > 0.1 ? `blur(${opacity * 8}px)` : 'none',
        boxShadow:       opacity > 0.8 ? '0 1px 12px rgba(0,0,0,0.08)' : 'none',
        borderBottom:    opacity > 0.8 ? '1px solid rgba(229,231,235,1)' : '1px solid rgba(229,231,235,0)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Funes Inmobiliaria"
            width={220} height={88}
            className="h-14 w-auto transition-[filter] duration-300"
            style={{ filter: isTransparent ? `brightness(${1 + (1 - opacity) * 8}) saturate(${opacity})` : 'none' }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold font-eurostile">
          {/* VENTA */}
          <Link
            href="/venta"
            className={`tracking-wide transition-colors hover:text-brand-green ${
              !isTransparent && pathname.startsWith('/venta') ? 'text-brand-green' : ''
            }`}
            style={{ color: isTransparent ? linkColor : undefined }}
          >
            VENTA
          </Link>

          {/* ALQUILER dropdown */}
          <div ref={alquilerRef} className="relative">
            <button
              onClick={() => setAlquilerOpen(o => !o)}
              className={`tracking-wide transition-colors hover:text-brand-green flex items-center gap-1 ${
                !isTransparent && pathname.startsWith('/alquiler') ? 'text-brand-green' : ''
              }`}
              style={{ color: isTransparent ? linkColor : undefined }}
            >
              ALQUILER
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${alquilerOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {alquilerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden min-w-[160px] z-50">
                {alquilerDropdown.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAlquilerOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-green tracking-wide transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resto de links */}
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`tracking-wide transition-colors hover:text-brand-green ${
                !isTransparent && pathname.startsWith(l.href) ? 'text-brand-green' : ''
              }`}
              style={{ color: isTransparent ? linkColor : undefined }}
            >
              {l.label}
            </Link>
          ))}

          {/* Tasación */}
          <Link
            href="/tasar-mi-propiedad"
            className="bg-brand-green text-white px-5 py-2 rounded-lg hover:bg-brand-hover transition-colors font-semibold text-sm"
          >
            Tasación
          </Link>

          {/* Acceso interno */}
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              isTransparent
                ? 'border-2 border-white/80 text-white hover:bg-white/20'
                : 'border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white'
            }`}
          >
            Acceso interno
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-1"
          onClick={() => { setMenuOpen(o => !o); setMobileAlqOpen(false) }}
          aria-label="Menú"
        >
          {[
            menuOpen ? 'rotate-45 translate-y-2' : '',
            menuOpen ? 'opacity-0' : '',
            menuOpen ? '-rotate-45 -translate-y-2' : '',
          ].map((cls, i) => (
            <span
              key={i}
              className={`block w-6 h-0.5 transition-transform ${cls}`}
              style={{ backgroundColor: isTransparent ? 'white' : '#067148' }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu — always white bg */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-semibold">
          <Link href="/venta" onClick={() => setMenuOpen(false)} className={`tracking-wide hover:text-brand-green ${pathname.startsWith('/venta') ? 'text-brand-green' : 'text-gray-700'}`}>VENTA</Link>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMobileAlqOpen(o => !o)}
              className={`tracking-wide flex items-center gap-1 text-left ${pathname.startsWith('/alquiler') ? 'text-brand-green' : 'text-gray-700'}`}
            >
              ALQUILER
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${mobileAlqOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {mobileAlqOpen && (
              <div className="pl-4 flex flex-col gap-3 border-l-2 border-gray-100">
                {alquilerDropdown.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { setMenuOpen(false); setMobileAlqOpen(false) }}
                    className="tracking-wide text-gray-600 hover:text-brand-green"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`tracking-wide hover:text-brand-green ${pathname.startsWith(l.href) ? 'text-brand-green' : 'text-gray-700'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/tasar-mi-propiedad" onClick={() => setMenuOpen(false)} className="btn-primary text-center">Tasación</Link>
          <a href="/login" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="text-brand-green font-semibold">Acceso interno</a>
        </div>
      )}
    </header>
  )
}
