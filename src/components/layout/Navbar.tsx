'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'VENTA',            href: '/venta' },
  { label: 'ALQUILER',         href: '/alquiler' },
  { label: 'EMPRENDIMIENTOS',  href: '/emprendimientos' },
  { label: 'NOSOTROS',         href: '/nosotros' },
]

// Scroll distance (px) over which the navbar fades from transparent to white
const FADE_RANGE = 120

export default function Navbar() {
  const [scrollY, setScrollY]   = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const isHome = pathname === '/'

  useEffect(() => {
    // Sync initial position (e.g. after back-navigation)
    setScrollY(window.scrollY)
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // 0 = fully transparent (top of home), 1 = fully white
  const opacity = isHome ? Math.min(scrollY / FADE_RANGE, 1) : 1
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
          onClick={() => setMenuOpen(!menuOpen)}
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
