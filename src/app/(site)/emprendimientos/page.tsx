import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getDevelopments, getDevelopmentCover } from '@/lib/tokko'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Emprendimientos',
  description: 'Conocé los proyectos y desarrollos inmobiliarios en Funes y la región.',
}

export default async function EmprendimientosPage() {
  let result = { objects: [] as any[] }
  try { result = await getDevelopments() } catch {}

  return (
    <>
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <span className="page-hero-eyebrow">Nuestros proyectos</span>
          <div className="flex items-center gap-4 mb-4">
            <div className="hidden sm:block flex-1 h-px bg-gray-200" />
            <h1 className="w-full text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-wide sm:tracking-widest font-eurostile text-center">Emprendimientos</h1>
            <div className="hidden sm:block flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-xs text-gray-600 tracking-widest uppercase">Invertí en los desarrollos más exclusivos de Funes y la región.</p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {result.objects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {result.objects.map((dev: any) => (
              <Link key={dev.id} href={`/emprendimientos/${dev.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-gray-100">
                <div className="relative h-56 overflow-hidden">
                  {getDevelopmentCover(dev.photos)
                    ? <Image src={getDevelopmentCover(dev.photos)} alt={dev.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
                    : <div className="w-full h-full bg-brand-light" />
                  }
                  <span className="absolute top-3 left-3 tag-desarrollo">DESARROLLO</span>
                </div>
                <div className="p-5">
                  <h2 className="font-bold text-gray-900 text-lg mb-1 font-sans">{dev.name}</h2>
                  <p className="text-sm text-gray-500 mb-2">{dev.location?.full_location}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{dev.description}</p>
                  <span className="inline-block mt-4 text-brand-green text-sm font-semibold group-hover:underline">Ver detalle →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">Los emprendimientos se cargarán desde Tokko Broker.</p>
          </div>
        )}
      </section>
    </>
  )
}
