import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://funesinmobiliaria.com.ar'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/firma/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
