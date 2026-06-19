import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPropertyById, getOperationPrice, hasCustomAvatar } from '@/lib/tokko'
import PhotoGallery from '@/components/properties/PhotoGallery'
import ShareButton from '@/components/properties/ShareButton'
import ContactTracker from '@/components/properties/ContactTracker'

export const fetchCache = 'force-no-store'

// Sanitize description: keep only <u>, <em>, <i>, <br>, <p>, <ul>, <ol>, <li>.
// Strips bold tags, headings, style/class attributes so formatting stays uniform.
function formatDescription(text: string): string {
  if (!text) return ''
  const hasHtml = /<[a-z][\s\S]*>/i.test(text)
  if (!hasHtml) {
    return '<p>' + text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>') + '</p>'
  }
  return text
    // Normalize line endings first
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    // Strip bold tags but keep their content
    .replace(/<\/?(b|strong)[^>]*>/gi, '')
    // Remove style and class attributes from any remaining tag
    .replace(/\s+style=["'][^"']*["']/gi, '')
    .replace(/\s+class=["'][^"']*["']/gi, '')
    // Strip font tags but keep their content
    .replace(/<\/?font[^>]*>/gi, '')
    // Convert headings to plain paragraphs (keep content, lose size)
    .replace(/<h[1-6][^>]*>/gi, '<p>')
    .replace(/<\/h[1-6]>/gi, '</p>')
    // Strip span tags but keep their content
    .replace(/<\/?span[^>]*>/gi, '')
    // Convert closing </div> to <br> so each Tokko line becomes a new line
    .replace(/<\/div>/gi, '<br>')
    // Strip remaining opening <div> tags
    .replace(/<div[^>]*>/gi, '')
    // Convert bare newlines to <br>
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, '<br>')
    // Collapse 3+ consecutive <br> down to two
    .replace(/(<br\s*\/?>[\s]*){3,}/gi, '<br><br>')
    // Remove leading <br> at the very start
    .replace(/^(<br\s*\/?>[\s]*)*/i, '')
}

interface Props { params: { id: string } }

// Format number: round and show only if > 0
const m2 = (val: any) => {
  const n = parseFloat(val)
  return n > 0 ? Math.round(n) : null
}

// Format agent phone for WhatsApp (Argentine format)
const waPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('54')) return clean
  if (clean.startsWith('0')) return `54${clean.slice(1)}`
  return `549${clean}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const p = await getPropertyById(params.id)
    return {
      title: p.publication_title || p.address,
      description: p.description?.slice(0, 160),
      openGraph: { images: p.photos?.[0]?.image ? [p.photos[0].image] : [] },
    }
  } catch {
    return { title: 'Propiedad' }
  }
}

export default async function PropertyPage({ params }: Props) {
  let property: any = null
  try { property = await getPropertyById(params.id) } catch {}

  if (!property) {
    return (
      <div className="page-hero">
        <div className="max-w-4xl mx-auto px-6 text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Propiedad no encontrada</h1>
          <Link href="/venta" className="btn-primary">Ver propiedades</Link>
        </div>
      </div>
    )
  }

  const opType  = property.operations?.[0]?.operation_type as 'Sale' | 'Rent' | undefined
  const price   = getOperationPrice(property, opType)
  const photos  = property.photos?.filter((p: any) => !p.is_blueprint) ?? []

  // Surfaces (rounded, only show if > 0)
  const toHa = (v: any) => { const n = parseFloat(v); return n > 0 ? Math.round(n / 10000).toString() : null }
  const supTotal       = m2(property.total_surface)
  const supTerreno     = m2(property.surface)
  const supCubierta    = m2(property.roofed_surface)
  const supSemicub     = m2(property.semiroofed_surface)
  const typeName       = (property.type?.name ?? '').toLowerCase()
  const isLand         = ['land', 'terreno', 'lote'].some(t => typeName.includes(t))
  const isCampo        = typeName.includes('countryside') || typeName.includes('campo')
  const frente         = property.front_measure ? parseFloat(property.front_measure) : null
  const fondo          = property.depth_measure  ? parseFloat(property.depth_measure)  : null

  // Detect "apta crédito" via Tokko's credit_eligible field
  const isAptaCredito = !!property.credit_eligible &&
    (property.credit_eligible as string).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes('apto')

  // Agent contact
  const agent      = property.producer
  const agentPhone = agent?.cellphone || agent?.phone || ''
  const agentWa    = agentPhone ? waPhone(agentPhone) : null

  return (
    <>
      {/* Photo gallery */}
      <section className="pt-20">
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <PhotoGallery photos={photos} title={property.publication_title || property.address} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">

        {/* ── Title + Characteristics (mobile: 1st, desktop: top-left) ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Title */}
          <div>
            {opType && (
              <span className={`inline-block mb-3 ${opType === 'Sale' ? 'tag-venta' : 'tag-alquiler'}`}>
                {opType === 'Sale' ? 'VENTA' : 'ALQUILER'}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {property.publication_title || property.address}
            </h1>
            <p className="text-gray-500">{property.fake_address || property.address}</p>
            <p className="text-xs text-gray-400 mt-1">ID #{property.id}</p>
          </div>

          {/* Characteristics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {(isCampo ? [
              { label: 'Superficie',        val: toHa(property.surface) ? `${toHa(property.surface)} ha` : toHa(property.total_surface) ? `${toHa(property.total_surface)} ha` : null },
              { label: 'Metros de frente',  val: frente ? `${frente} m` : null },
              { label: 'Metros de fondo',   val: fondo  ? `${fondo} m`  : null },
            ] : isLand ? [
              { label: 'Superficie total',  val: supTotal   ? `${supTotal} m²`   : supTerreno ? `${supTerreno} m²` : null },
              { label: 'Metros de frente',  val: frente     ? `${frente} m`      : null },
              { label: 'Metros de fondo',   val: fondo      ? `${fondo} m`       : null },
            ] : [
              { label: 'Dormitorios',       val: property.suite_amount      || null },
              { label: 'Baños',             val: property.bathroom_amount   || null },
              { label: 'Sup. terreno',      val: supTerreno ? `${supTerreno} m²`   : null },
              { label: 'Sup. cubierta',     val: supCubierta ? `${supCubierta} m²` : null },
              { label: 'Sup. semicubierta', val: supSemicub  ? `${supSemicub} m²`  : null },
              { label: 'Cocheras',          val: property.parking_lot_amount || null },
              { label: 'Antigüedad',        val: property.age ? `${property.age} años` : null },
            ]).filter(i => i.val !== null).map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-2 sm:p-4 text-center border border-gray-100">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{item.val}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
            {isAptaCredito && (
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                <p className="text-lg font-bold text-brand-green">✓</p>
                <p className="text-xs font-semibold text-brand-green mt-1 uppercase tracking-wide">Apta crédito</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar (mobile: 2nd — between characteristics and services; desktop: right column) ── */}
        <div className="space-y-5 lg:row-span-2">

          {/* Price + contact buttons */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {price && (
              <p className="text-3xl font-extrabold text-gray-900 mb-1">
                {price.currency === 'USD' ? 'USD' : '$'} {price.amount.toLocaleString('es-AR')}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-5">{property.location?.full_location || property.address}</p>

            {/* WhatsApp → agent number */}
            <ContactTracker
              propiedadId={property.id}
              agente={agent?.name ?? ''}
              tipo={opType === 'Sale' ? 'venta' : 'alquiler'}
              origen="whatsapp"
              direccion={property.fake_address || property.address || ''}
            >
              <a
                href={agentWa
                  ? `https://wa.me/${agentWa}?text=${encodeURIComponent(`Hola! Me interesa la propiedad: ${property.fake_address || property.address} (ID ${property.id})\n\n${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/propiedades/${property.id}`)}`
                  : '#'}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25d366] text-white font-semibold py-3 px-4 rounded-lg w-full hover:bg-[#1ebe5a] transition-colors mb-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Consultar por WhatsApp
              </a>
            </ContactTracker>

            {/* Call → agent number */}
            {agentPhone && (
              <ContactTracker
                propiedadId={property.id}
                agente={agent?.name ?? ''}
                tipo={opType === 'Sale' ? 'venta' : 'alquiler'}
                origen="llamada"
                direccion={property.fake_address || property.address || ''}
              >
                <a
                  href={`tel:+${waPhone(agentPhone)}`}
                  className="flex items-center justify-center gap-2 border-2 border-brand-green text-brand-green font-semibold py-3 px-4 rounded-lg w-full hover:bg-brand-green hover:text-white transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Llamar
                </a>
              </ContactTracker>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <ShareButton
                propertyAddress={property.fake_address || property.address}
                propertyId={property.id}
              />
            </div>
          </div>

          {/* Agent card */}
          {agent && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Agente responsable</p>
              <div className="flex items-center gap-3">
                {hasCustomAvatar(agent.picture)
                  ? <Image src={agent.picture} alt={agent.name} width={52} height={52} className="rounded-full object-cover flex-shrink-0" style={{ width: 52, height: 52 }} />
                  : <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand-green font-bold text-lg flex-shrink-0">
                      {agent.name?.trim().split(/\s+/).filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                }
                <div>
                  <p className="font-semibold text-gray-900">{agent.name}</p>
                  {agentPhone && (
                    <a href={`tel:+${waPhone(agentPhone)}`} className="text-sm text-brand-green hover:underline">
                      {agentPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Services + Description + Map + Video (mobile: 3rd, desktop: bottom-left) ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Services */}
          {(() => {
            const SERVICE_EMOJIS: Record<string, string> = {
              'agua corriente': '💧',
              'agua de red': '💧',
              'agua de pozo': '🪣',
              'gas natural': '🔥',
              'gas en garrafa': '🫙',
              'electricidad': '⚡',
              'luz': '⚡',
              'cloacas': '🚿',
              'internet': '🌐',
              'wifi': '🌐',
              'teléfono': '📞',
              'telefono': '📞',
              'cable': '📺',
              'tv cable': '📺',
              'pavimento': '🛣️',
              'alumbrado': '💡',
              'alumbrado público': '💡',
              'alumbrado publico': '💡',
            }
            const services = (property.tags ?? []).filter((t: any) => t.type === 1)
            if (!services.length) return null
            return (
              <div>
                <h2 className="text-xl font-bold mb-3">Servicios</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map((s: any) => {
                    const key = s.name.toLowerCase()
                    const emoji = SERVICE_EMOJIS[key] ?? '✅'
                    return (
                      <li key={s.id} className="flex items-center gap-2 text-gray-600 leading-relaxed">
                        <span>{emoji}</span>
                        <span>{s.name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })()}

          {/* Description */}
          {(property.rich_description || property.description) && (
            <div>
              <h2 className="text-xl font-bold mb-3">Descripción</h2>
              <div
                className="text-gray-600 leading-relaxed prose prose-sm max-w-none [&_u]:underline [&_i]:italic [&_em]:italic [&_p]:mb-3 [&_br]:block"
                dangerouslySetInnerHTML={{ __html: formatDescription(property.rich_description || property.description) }}
              />
            </div>
          )}

          {/* Map */}
          {property.geo_lat && property.geo_long && (
            <div>
              <h2 className="text-xl font-bold mb-3">Ubicación</h2>
              <div className="rounded-xl overflow-hidden h-64 bg-gray-100">
                <iframe
                  title="Mapa"
                  width="100%" height="100%" loading="eager" style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${property.geo_lat},${property.geo_long}&z=15&output=embed`}
                />
              </div>
            </div>
          )}

          {/* Video */}
          {property.videos?.[0]?.player_url && (
            <div>
              <h2 className="text-xl font-bold mb-3">Video</h2>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe src={property.videos[0].player_url} className="w-full h-full" allowFullScreen />
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
