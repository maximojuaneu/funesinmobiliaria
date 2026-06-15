import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAgents, hasCustomAvatar } from '@/lib/tokko'
import type { TokkoAgent } from '@/types/tokko'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Más de 45 años construyendo confianza en el mercado inmobiliario. Funes Inmobiliaria, referente en Funes, Roldán y Rosario.',
}

const DIRECTION_MEMBERS: { id: number; matricula: string; positionOverride?: string }[] = [
  { id: 43421, matricula: 'C.I Mat 2708 - COCIR', positionOverride: 'Gerente' },
  { id: 43409, matricula: 'C.I Mat 0298 - COCIR' },
]
const DIRECTION_IDS = DIRECTION_MEMBERS.map(m => m.id)

function AgentInitials({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('')
  return (
    <div className="w-full h-full bg-brand-green/10 flex items-center justify-center">
      <span className="text-brand-green font-bold text-3xl">{initials}</span>
    </div>
  )
}

function DirectionCard({ agent, matricula, positionOverride }: { agent: TokkoAgent; matricula?: string; positionOverride?: string }) {
  const position = positionOverride || agent.position?.trim() || 'Dirección'
  const hasPhoto = hasCustomAvatar(agent.picture)
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '1/1', maxHeight: 240 }}>
        {hasPhoto ? (
          <Image
            src={agent.picture!}
            alt={agent.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 50vw, 240px"
          />
        ) : (
          <AgentInitials name={agent.name} />
        )}
      </div>
      <div className="p-6 border-t border-gray-100 flex flex-col flex-1">
        <p className="text-xl font-bold text-brand-green leading-tight">{agent.name}</p>
        <p className="text-gray-500 text-sm mt-1">{position}</p>
        {matricula && <p className="text-gray-400 text-xs mt-1">{matricula}</p>}
      </div>
    </div>
  )
}

function TeamCard({ agent }: { agent: TokkoAgent }) {
  const position = agent.position?.trim() || 'Asesor Inmobiliario'
  const hasPhoto = hasCustomAvatar(agent.picture)
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 mb-4 shadow-sm">
        {hasPhoto ? (
          <Image
            src={agent.picture!}
            alt={agent.name}
            fill
            className="object-cover object-top"
            sizes="112px"
          />
        ) : (
          <AgentInitials name={agent.name} />
        )}
      </div>
      <p className="font-bold text-gray-900 text-base leading-tight">{agent.name}</p>
      <p className="text-gray-500 text-sm mt-1">{position}</p>
    </div>
  )
}

export default async function NosotrosPage() {
  let allAgents: TokkoAgent[] = []
  try { allAgents = await getAgents() } catch {}
  const direction = allAgents.filter(a => DIRECTION_IDS.includes(a.id))
  const team = allAgents.filter(a => !DIRECTION_IDS.includes(a.id))

  return (
    <>
      {/* Hero: foto a pantalla completa SIN texto, con degradado hacia abajo */}
      <div className="relative w-full" style={{ height: '100vh' }}>
        {/* Desktop */}
        <Image
          src="/nosotros-hero.png"
          alt="Funes Inmobiliaria"
          fill
          priority
          className="object-cover hidden md:block"
          style={{ objectPosition: 'center 40%' }}
          sizes="100vw"
        />
        {/* Mobile */}
        <Image
          src="/nosotros-hero-mobile.png"
          alt="Funes Inmobiliaria"
          fill
          priority
          className="object-cover md:hidden"
          style={{ objectPosition: 'center 30%' }}
          sizes="100vw"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 45%, rgba(255,255,255,0.6) 75%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Contenido: empieza pegado al hero */}
      <div className="relative -mt-32 bg-white">

        {/* Título de sección */}
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 text-center">
          <span className="eyebrow">Quiénes somos</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 uppercase tracking-wide sm:tracking-widest font-eurostile">Nosotros</h1>
          <p className="text-gray-500 mt-3 text-lg">Construyendo confianza en el mercado inmobiliario.</p>
        </div>

        {/* Nuestra historia */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="eyebrow">Nuestra historia</span>
            <h2 className="text-3xl font-bold mb-5">Más de 45 años acompañando a familias, inversores y empresas</h2>
            <p className="text-gray-600 mb-4">
              En Funes Inmobiliaria trabajamos desde hace más de 45 años acompañando a familias, inversores y empresas en cada etapa de sus decisiones inmobiliarias. A lo largo de nuestra trayectoria nos hemos consolidado como una de las inmobiliarias referentes de la ciudad de Funes, combinando experiencia, conocimiento del mercado y una atención profesional orientada a resultados.
            </p>
            <p className="text-gray-600 mb-4">
              Contamos con una amplia cartera de más de 200 propiedades distribuidas entre Funes, Roldán y Rosario, ofreciendo oportunidades para quienes buscan comprar, vender, alquilar o invertir con el respaldo de un equipo comprometido y capacitado.
            </p>
            <p className="text-gray-600">
              Creemos que cada propiedad tiene una historia y cada cliente un objetivo diferente. Por eso brindamos un asesoramiento personalizado, transparente y enfocado en generar operaciones seguras y exitosas.
            </p>
          </div>

          {/* Dos fotos en grilla compacta */}
          <div className="grid grid-cols-2 gap-3 self-start">
            <div className="relative w-full rounded-xl overflow-hidden shadow-sm" style={{ aspectRatio: '3/4' }}>
              <Image
                src="/nosotros-noche.png"
                alt="Funes Inmobiliaria — fachada nocturna"
                fill
                className="object-cover"
                style={{ objectPosition: 'center 30%' }}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative w-full rounded-xl overflow-hidden shadow-sm mt-8" style={{ aspectRatio: '3/4' }}>
              <Image
                src="/nosotros-interior.png"
                alt="Funes Inmobiliaria — interior"
                fill
                className="object-cover"
                style={{ objectPosition: 'center center' }}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>
        </section>

        {/* Misión, Visión y Compromiso */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span className="eyebrow">Nuestra identidad</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide uppercase mt-2">Lo que nos define</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">

            {/* Misión */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-brand-green" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nuestra Misión</h3>
              <p className="text-gray-600 leading-relaxed">
                Brindar soluciones inmobiliarias integrales que permitan a nuestros clientes concretar sus objetivos con seguridad, transparencia y respaldo profesional, ofreciendo un servicio de excelencia basado en la confianza, la experiencia y el conocimiento profundo del mercado local.
              </p>
            </div>

            {/* Visión */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-brand-green text-white">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Nuestra Visión</h3>
              <p className="text-white/85 leading-relaxed">
                Ser la inmobiliaria de referencia en Funes y la región, reconocida por su profesionalismo, innovación y capacidad de generar valor para clientes, propietarios e inversores, liderando el mercado a través de relaciones duraderas y resultados sostenibles.
              </p>
            </div>

            {/* Compromiso */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-brand-green" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nuestro Compromiso</h3>
              <p className="text-gray-600 leading-relaxed">
                Nos comprometemos a actuar con honestidad, responsabilidad y dedicación en cada operación. Trabajamos para proteger los intereses de nuestros clientes, brindando información clara, asesoramiento profesional y un acompañamiento permanente durante todo el proceso.
              </p>
            </div>

          </div>

          {/* Párrafo adicional de compromiso */}
          <div className="mt-10 max-w-3xl mx-auto text-center">
            <p className="text-gray-500 leading-relaxed">
              Nuestro compromiso es ofrecer una experiencia inmobiliaria confiable, eficiente y cercana, respaldada por más de cuatro décadas de trayectoria y por un equipo que entiende que detrás de cada propiedad existe un proyecto de vida.
            </p>
          </div>
        </section>

        {/* Equipo */}
        <section className="py-20 px-6 bg-cover bg-center" style={{ backgroundImage: "url('/marmol.jpeg')" }}>
          <div className="max-w-6xl mx-auto">

            {/* Encabezado de sección */}
            <div className="text-center mb-10">
              <span className="eyebrow">El equipo</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide uppercase mt-2">Conocenos</h2>
            </div>

            {/* Dirección */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Liderazgo · Dirección</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto">
                {DIRECTION_MEMBERS.map(({ id, matricula, positionOverride }) => {
                  const agent = direction.find(a => a.id === id)
                  if (!agent) return null
                  return <DirectionCard key={id} agent={agent} matricula={matricula} positionOverride={positionOverride} />
                })}
              </div>
            </div>

            {/* El equipo */}
            {team.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Nuestro equipo</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-10">
                  {team.map(agent => (
                    <TeamCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ¿Por qué elegirnos? */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="eyebrow">Nuestras ventajas</span>
              <h2 className="section-title">¿Por qué elegirnos?</h2>
            </div>
            {(() => {
              const items = [
                'Más de 45 años de experiencia en el mercado inmobiliario.',
                'Referentes de la zona.',
                'Más de 200 propiedades en cartera.',
                'Cobertura en Funes, Roldán, Rosario y alrededores.',
                'Asesoramiento profesional y personalizado.',
                'Operaciones seguras, transparentes y eficientes.',
                'Equipo en constante capacitación y crecimiento.',
              ]
              const card = (item: string) => (
                <div key={item} className="flex items-start gap-4 bg-gray-50 rounded-xl p-5 h-full">
                  <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-brand-green" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                </div>
              )
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {items.map(card)}
                </div>
              )
            })()}
          </div>
        </section>

        {/* CTA doble */}
        <section className="bg-brand-green py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">

              {/* Vendé con nosotros */}
              <div className="flex flex-col items-center text-center bg-white/10 rounded-2xl p-10">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Vendé con nosotros</h3>
                <p className="text-white/75 mb-8 leading-relaxed">Tasamos tu propiedad y te acompañamos en todo el proceso de venta con respaldo profesional.</p>
                <Link href="/tasar-mi-propiedad" className="bg-white text-brand-green font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors">
                  Tasar mi propiedad
                </Link>
              </div>

              {/* Sumate al equipo */}
              <div className="flex flex-col items-center text-center bg-white/10 rounded-2xl p-10">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Sumate a nuestro equipo</h3>
                <p className="text-white/75 mb-8 leading-relaxed">¿Te apasiona el mercado inmobiliario? Queremos conocerte. Completá el formulario y nos ponemos en contacto.</p>
                <Link
                  href="/sumate"
                  className="bg-white text-brand-green font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Completar formulario
                </Link>
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  )
}
