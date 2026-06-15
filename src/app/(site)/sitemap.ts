import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://funesinmobiliaria.com.ar'

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticPages, ...seoPages].map(p => ({
    ...p,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
  }))
}
