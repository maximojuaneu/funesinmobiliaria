import type { Metadata } from 'next'
import { getProperties } from '@/lib/tokko'
import PropertiesPageContent from '@/components/properties/PropertiesPageContent'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Propiedades en Venta',
  description: 'Encontrá casas, terrenos, lotes y departamentos en venta en Funes, Santa Fe.',
}

interface Props {
  searchParams: {
    type?: string; location?: string; currency?: string
    priceFrom?: string; priceTo?: string; suites?: string
    surfaceFrom?: string; surfaceTo?: string; view?: string
  }
}

export default async function VentaPage({ searchParams }: Props) {
  const params = searchParams
  let result = { objects: [] as any[], count: 0 }
  try {
    result = await getProperties({
      operation:   'Sale',
      type:        params.type,
      location:    params.location,
      currency:    params.currency,
      priceFrom:   params.priceFrom ? +params.priceFrom : undefined,
      priceTo:     params.priceTo   ? +params.priceTo   : undefined,
      suites:      params.suites    ? params.suites.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
      surfaceFrom: params.surfaceFrom ? +params.surfaceFrom : undefined,
      surfaceTo:   params.surfaceTo   ? +params.surfaceTo   : undefined,
    })
  } catch (e) {
    console.error('Tokko error:', e)
  }

  return (
    <>
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <span className="page-hero-eyebrow">Propiedades disponibles</span>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-widest font-eurostile">Venta</h1>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-xs text-gray-600 tracking-widest uppercase">{result.count} propiedad{result.count !== 1 ? 'es' : ''} encontrada{result.count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <PropertiesPageContent
        properties={result.objects}
        operationType="Sale"
        initialView={params.view === 'map' ? 'map' : 'list'}
      />
    </>
  )
}
