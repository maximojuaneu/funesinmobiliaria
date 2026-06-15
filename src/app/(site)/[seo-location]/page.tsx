import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProperties } from '@/lib/tokko'
import PropertyCard from '@/components/properties/PropertyCard'
import Link from 'next/link'

const SEO_CONFIG: Record<string, { title: string; h1: string; description: string; filters: Record<string, string> }> = {
  'casas-en-venta-funes':        { title: 'Casas en venta en Funes', h1: 'Casas en venta en Funes', description: 'Encontrá casas en venta en Funes, Santa Fe. Las mejores opciones de la inmobiliaria líder en la zona.', filters: { operation: 'Sale', type: 'House', location: 'Funes' } },
  'casas-en-venta-roldan':       { title: 'Casas en venta en Roldán', h1: 'Casas en venta en Roldán', description: 'Propiedades en venta en Roldán, Santa Fe.', filters: { operation: 'Sale', type: 'House', location: 'Roldan' } },
  'lotes-en-venta-funes':        { title: 'Lotes en venta en Funes', h1: 'Lotes y terrenos en venta en Funes', description: 'Los mejores lotes y terrenos en venta en Funes, Santa Fe.', filters: { operation: 'Sale', type: 'Lot', location: 'Funes' } },
  'casas-en-venta-kentucky':     { title: 'Casas en venta en Kentucky', h1: 'Casas en venta en Kentucky', description: 'Casas en venta en barrio Kentucky, Funes, Santa Fe.', filters: { operation: 'Sale', type: 'House', location: 'Kentucky' } },
  'casas-en-venta-funes-hills':  { title: 'Casas en venta en Funes Hills', h1: 'Casas en venta en Funes Hills', description: 'Propiedades en Funes Hills, Funes.', filters: { operation: 'Sale', type: 'House', location: 'Funes Hills' } },
  'casas-en-venta-don-mateo':    { title: 'Casas en venta en Don Mateo', h1: 'Casas en venta en Don Mateo', description: 'Propiedades en Don Mateo, Funes, Santa Fe.', filters: { operation: 'Sale', type: 'House', location: 'Don Mateo' } },
  'casas-en-alquiler-funes':     { title: 'Casas en alquiler en Funes', h1: 'Casas en alquiler en Funes', description: 'Alquilá una casa en Funes, Santa Fe.', filters: { operation: 'Rent', type: 'House', location: 'Funes' } },
  'departamentos-en-venta-funes':{ title: 'Departamentos en venta en Funes', h1: 'Departamentos en venta en Funes', description: 'Departamentos disponibles en Funes.', filters: { operation: 'Sale', type: 'Apartment', location: 'Funes' } },
  'terrenos-en-venta-funes':     { title: 'Terrenos en venta en Funes', h1: 'Terrenos en venta en Funes', description: 'Terrenos y lotes en venta en Funes, Santa Fe.', filters: { operation: 'Sale', type: 'Lot', location: 'Funes' } },
}

interface Props { params: { 'seo-location': string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'seo-location': slug } = params
  const cfg = SEO_CONFIG[slug]
  if (!cfg) return { title: 'Propiedades' }
  return {
    title:       cfg.title,
    description: cfg.description,
    alternates:  { canonical: `/${slug}` },
  }
}

export async function generateStaticParams() {
  return Object.keys(SEO_CONFIG).map(slug => ({ 'seo-location': slug }))
}

export default async function SeoPage({ params }: Props) {
  const { 'seo-location': slug } = params
  const cfg = SEO_CONFIG[slug]
  if (!cfg) notFound()

  let result = { objects: [] as any[], count: 0 }
  try { result = await getProperties({ operation: cfg.filters.operation as any, type: cfg.filters.type, location: cfg.filters.location }) } catch {}

  return (
    <>
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-widest text-center">{cfg.h1}</h1>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-xs text-gray-600 tracking-widest uppercase">{result.count} propiedad{result.count !== 1 ? 'es' : ''} disponible{result.count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-6 py-12">
        {result.objects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {result.objects.map((p: any) => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-4">No hay propiedades disponibles en este momento.</p>
            <Link href="/venta" className="btn-primary">Ver todas las propiedades</Link>
          </div>
        )}
      </section>
    </>
  )
}
