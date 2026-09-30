import type { MetadataRoute } from 'next'
import { getProperties, getDevelopments } from '@/lib/tokko'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://funesinmobiliaria.com.ar'

// Re-fetch and rebuild the sitemap at most once per hour, instead of on every crawler hit.
export const revalidate = 3600

const SEO_PAGES = [
  'casas-en-venta-funes',
  'casas-en-venta-roldan',
  'lotes-en-venta-funes',
  'casas-en-venta-kentucky',
  'casas-en-venta-funes-hills',
  'casas-en-venta-don-mateo',
  'casas-en-alquiler-funes',
  'departamentos-en-venta-funes',
  'terrenos-en-venta-funes',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: BASE, priority: 1.0 },
    { url: `${BASE}/venta`, priority: 0.9 },
    { url: `${BASE}/alquiler`, priority: 0.9 },
    { url: `${BASE}/emprendimientos`, priority: 0.8 },
    { url: `${BASE}/tasar-mi-propiedad`, priority: 0.8 },
    { url: `${BASE}/nosotros`, priority: 0.6 },
    { url: `${BASE}/contacto`, priority: 0.7 },
  ]
  const seoPages = SEO_PAGES.map(slug => ({ url: `${BASE}/${slug}`, priority: 0.8 }))

  const fixedPages: MetadataRoute.Sitemap = [...staticPages, ...seoPages].map(p => ({
    ...p,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
  }))

  // Properties and developments come straight from Tokko, so a listing that gets
  // reserved/sold and removed there simply stops appearing here on the next rebuild —
  // no stale/broken URLs to clean up by hand.
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const { objects: properties } = await getProperties()
    propertyPages = properties.map(p => ({
      url: `${BASE}/propiedades/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Tokko unreachable when the sitemap is built — ship the fixed pages only,
    // properties will appear again on the next revalidation.
  }

  let developmentPages: MetadataRoute.Sitemap = []
  try {
    const { objects: developments } = await getDevelopments()
    developmentPages = developments.map(d => ({
      url: `${BASE}/emprendimientos/${d.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {}

  return [...fixedPages, ...propertyPages, ...developmentPages]
}
