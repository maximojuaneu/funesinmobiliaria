import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getDevelopmentById, getPropertiesByDevelopment, getDevelopmentCover } from '@/lib/tokko'
import DevelopmentGallery from '@/components/properties/DevelopmentGallery'
import DevelopmentPropertyList from '@/components/properties/DevelopmentPropertyList'

export const fetchCache = 'force-no-store'

interface Props {
  params: { id: string }
}

// ── Construction status labels ────────────────────────────────────────────────
const CONSTRUCTION_STATUS: Record<number, string> = {
  1: 'Proyecto',
  2: 'En construcción',
  3: 'En pozo',
  4: 'Terminado',
  5: 'A estrenar',
  6: 'Posesión inmediata',
}

// Format ISO date → "Mes YYYY" in Spanish
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function formatDeliveryDate(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  if (!year || !month) return iso
  return `${MONTHS_ES[month - 1]} ${year}`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const dev = await getDevelopmentById(params.id)
    return { title: dev.name, description: dev.description }
  } catch {
    return { title: 'Proyecto' }
  }
}

export default async function DevelopmentDetailPage({ params }: Props) {
  let dev: any = null
  let properties: any[] = []

  try {
    [dev, properties] = await Promise.all([
      getDevelopmentById(params.id),
      getPropertiesByDevelopment(params.id),
    ])
  } catch {}

  if (!dev) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Proyecto no encontrado.</p>
      </div>
    )
  }

  const coverPhoto = getDevelopmentCover(dev.photos)
  const statusLabel = dev.construction_status ? CONSTRUCTION_STATUS[dev.construction_status] : null
  const deliveryDate = dev.construction_date ? formatDeliveryDate(dev.construction_date) : null

  return (
    <>
      {/* HERO */}
      <div className="relative h-72 md:h-96 w-full bg-gray-900 overflow-hidden">
        {coverPhoto && (
          <Image src={coverPhoto} alt={dev.name} fill className="object-cover" priority sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 w-full px-6 pb-8 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white uppercase">{dev.name}</h1>
          {dev.location?.full_location && (
            <p className="text-white/70 mt-1">{dev.location.full_location}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        <Link href="/emprendimientos" className="inline-flex items-center gap-1 text-gray-900 font-semibold text-sm mb-8 hover:underline">
          ← Emprendimientos
        </Link>

        {/* Descripción del proyecto */}
        {dev.description && (
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Descripción del proyecto</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{dev.description}</p>
          </div>
        )}

        {/* Propiedades disponibles */}
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Propiedades disponibles</h2>
          <p className="text-gray-500 text-sm mb-6">
            {properties.length > 0
              ? `${properties.length} propiedad${properties.length !== 1 ? 'es' : ''} vinculada${properties.length !== 1 ? 's' : ''} a este proyecto`
              : 'Las unidades de este proyecto se publicarán próximamente.'}
          </p>
          {properties.length > 0 ? (
            <DevelopmentPropertyList properties={properties} />
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-400">
              <p className="text-lg font-medium">Próximamente</p>
              <p className="text-sm mt-1">Consultanos para más información sobre este proyecto.</p>
              <Link href="/contacto" className="btn-primary inline-block mt-6">Contactar</Link>
            </div>
          )}
        </div>

        {/* Información general */}
        {(() => {
          const SERVICE_EMOJIS: Record<string, string> = {
            'gas natural':          '🔥',
            'gas en garrafa':       '🫙',
            'electricidad':         '⚡',
            'luz':                  '⚡',
            'agua corriente':       '💧',
            'agua de red':          '💧',
            'agua de pozo':         '🪣',
            'cloacas':              '🚿',
            'internet':             '🌐',
            'wifi':                 '🌐',
            'teléfono':             '📞',
            'telefono':             '📞',
            'cable':                '📺',
            'tv cable':             '📺',
            'pavimento':            '🛣️',
            'alumbrado':            '💡',
            'alumbrado público':    '💡',
            'alumbrado publico':    '💡',
          }
          const services = (dev.tags ?? []).filter((t: any) => t.type === 1)
          const hasInfo = statusLabel || deliveryDate || services.length > 0
          if (!hasInfo) return null
          return (
            <div className="mb-12">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Información general</h2>
              <div className="flex flex-wrap gap-3">
                {statusLabel && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700">Estado de la construcción:</span>
                    <span className="text-sm text-gray-500">{statusLabel}</span>
                  </div>
                )}
                {deliveryDate && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700">Fecha de entrega:</span>
                    <span className="text-sm text-gray-500">{deliveryDate}</span>
                  </div>
                )}
              </div>
              {services.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Servicios</h2>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {services.map((s: any) => {
                      const emoji = SERVICE_EMOJIS[s.name.toLowerCase()] ?? '✅'
                      return (
                        <li key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700">
                          <span>{emoji}</span>
                          <span>{s.name}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}

        {/* Ubicación */}
        {dev.geo_lat && dev.geo_long && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Ubicación</h2>
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 400 }}>
              <iframe
                title={`Ubicación de ${dev.name}`}
                width="100%"
                height="100%"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${dev.geo_lat},${dev.geo_long}&z=15&output=embed`}
              />
            </div>
          </div>
        )}

        {/* Galería de fotos */}
        {dev.photos && dev.photos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Imágenes del proyecto</h2>
            <DevelopmentGallery photos={dev.photos} title={dev.name} />
          </div>
        )}

      </div>
    </>
  )
}
