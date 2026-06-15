import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProperties } from '@/lib/tokko'
import FeaturedCarousel from '@/components/properties/FeaturedCarousel'
import HeroSearch from '@/components/home/HeroSearch'
import StatsCounter from '@/components/home/StatsCounter'
import HeroVideo from '@/components/home/HeroVideo'

export const revalidate = 300 // regenerate page every 5 minutes

export default async function HomePage() {
  let featuredList: any[] = []
  try { featuredList = await getFeaturedProperties() } catch {}

  return (
    <>
      {/* HERO */}
      <section className="relative h-[82vh] flex items-center justify-center overflow-hidden pt-20">
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        <div className="relative z-10 text-center text-white px-6 w-full max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-5 opacity-80">Propiedades en Funes, Roldán y Rosario</p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-10 drop-shadow-lg">
            Encontrá tu<br />próxima propiedad
          </h1>
          {/* Search */}
          <HeroSearch />
        </div>
      </section>

      {/* PROPIEDADES DESTACADAS */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="eyebrow">Selección especial</span>
              <h2 className="section-title">Propiedades destacadas</h2>
            </div>
            <Link href="/venta" className="text-brand-green font-semibold text-sm hover:underline hidden md:block">Ver todas →</Link>
          </div>
          {featuredList.length > 0
            ? <FeaturedCarousel properties={featuredList} />
            : <p className="text-gray-500 text-sm">Las propiedades se cargarán automáticamente desde Tokko Broker.</p>
          }
        </div>
      </section>

      {/* TABS VENTA / ALQUILER */}
      <section
        className="relative py-20 px-6"
        style={{ backgroundImage: "url('/vista-aerea-banner.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/45" />
        {/* fade inferior hacia el verde del CTA */}
        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #067148)' }} />
        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            { title: 'Propiedades en VENTA', href: '/venta', sub: 'Casas, departamentos, terrenos y más.' },
            { title: 'Propiedades en ALQUILER', href: '/alquiler', sub: 'Viviendas y locales disponibles.' },
          ].map(card => (
            <Link key={card.href} href={card.href}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-md hover:shadow-xl hover:bg-white border border-white/60 hover:border-brand-green transition-all flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900 mb-1">{card.title}</p>
                <p className="text-gray-500 text-sm">{card.sub}</p>
              </div>
              <span className="text-brand-green text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA TASACIÓN */}
      <section className="bg-brand-green py-20 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">¿Querés conocer el valor de tu propiedad?</h2>
            <p className="text-white/75">Informes profesionales realizados por expertos en el mercado.</p>
          </div>
          <Link href="/tasar-mi-propiedad" className="bg-white text-brand-green font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0 text-lg">
            Solicitar tasación
          </Link>
        </div>
      </section>

      {/* EMPRENDIMIENTOS PREVIEW */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="eyebrow">Nuestros proyectos</span>
            <h2 className="section-title mb-4">EMPRENDIMIENTOS</h2>
            <p className="text-gray-600 mb-6">Invertí en los desarrollos más exclusivos de Funes, Roldán, Rosario y la región. Desde el pozo hasta entrega inmediata.</p>
            <Link href="/emprendimientos" className="btn-primary">Ver emprendimientos</Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="relative aspect-square bg-brand-light rounded-2xl overflow-hidden">
              <Image src="/aerea1.jpg" alt="Emprendimiento aéreo 1" fill className="object-cover" sizes="(max-width: 768px) 45vw, 22vw" />
            </div>
            <div className="relative aspect-square bg-brand-light rounded-2xl overflow-hidden">
              <Image src="/aerea2.jpeg" alt="Emprendimiento aéreo 2" fill className="object-cover" sizes="(max-width: 768px) 45vw, 22vw" />
            </div>
          </div>
        </div>
      </section>

      {/* NOSOTROS STRIP */}
      <section
        className="py-20 px-6 bg-cover bg-center"
        style={{ backgroundImage: "url('/marmol.jpeg')" }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <span className="eyebrow">Por qué elegirnos</span>
          <h2 className="section-title mb-14">Una inmobiliaria con trayectoria en el mercado</h2>
          <StatsCounter />
        </div>
      </section>
    </>
  )
}
