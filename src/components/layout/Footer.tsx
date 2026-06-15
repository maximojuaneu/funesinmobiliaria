import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-brand-green text-white/80">
      <div className="max-w-7xl mx-auto px-8 py-14">

        {/* Main row: logo izquierda + 3 columnas derecha */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">

          {/* Logo + tagline */}
          <div className="flex flex-col items-start max-w-xs">
            <Image src="/logo.png" alt="Funes Inmobiliaria" width={160} height={64}
              className="h-14 w-auto brightness-0 invert mb-3 -ml-1" />
            <Image src="/slogan.png" alt="Siempre con vos" width={160} height={48} className="h-10 w-auto mb-5 -ml-5" />
            <p className="text-sm text-white/90 font-medium mb-4 leading-relaxed">
              Más de 45 años acompañando sueños.
            </p>
            <div className="text-xs text-white/70 space-y-1.5">
              <p>C.I Maximo F. Juaneu - Mat. 2708 COCIR</p>
              <p>C.I Fabio H. Juaneu - Mat 0298 COCIR</p>
            </div>
          </div>

          {/* 3 columnas agrupadas a la derecha */}
          <div className="flex flex-col sm:flex-row gap-16 lg:gap-20">

            {/* Navegación */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">
                Navegación
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  ['Venta',           '/venta'],
                  ['Alquiler',        '/alquiler'],
                  ['Emprendimientos', '/emprendimientos'],
                  ['Tasaciones',      '/tasar-mi-propiedad'],
                  ['Nosotros',        '/nosotros'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">
                Contacto
              </h4>
              <ul className="space-y-3 text-sm">
                <li>Córdoba 2115 (Ruta 9), Funes</li>
                <li>
                  <a href="tel:+5493414932522" className="hover:text-white transition-colors">
                    +54 9 341 4932522
                  </a>
                </li>
                <li>
                  <a href="mailto:info@funesinmobiliaria.com.ar" className="hover:text-white transition-colors">
                    info@funesinmobiliaria.com.ar
                  </a>
                </li>
                <li className="pt-1 text-white/50">
                  Lun–Vie: 9:00–17:00 hs<br />Sáb: 9:00–13:00 hs
                </li>
              </ul>
            </div>

            {/* Redes Sociales */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">
                Redes Sociales
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="https://www.instagram.com/funesinmobiliaria/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-white transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    <span className="text-sm">Instagram</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/profile.php?id=100064200451795" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-white transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-sm">Facebook</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/@funesinmobiliaria?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-white transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                    </svg>
                    <span className="text-sm">TikTok</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-white/15 text-center py-4 text-xs text-white/40">
        © {new Date().getFullYear()} Funes Inmobiliaria. Todos los derechos reservados.
      </div>
    </footer>
  )
}
