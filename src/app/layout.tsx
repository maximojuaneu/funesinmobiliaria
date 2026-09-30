import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Analytics from '@/components/layout/Analytics'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const eurostile = localFont({
  src: '../../public/fonts/EurostileRegular.otf',
  variable: '--font-eurostile',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://funesinmobiliaria.com.ar'),
  title: {
    default: 'Funes Inmobiliaria | Propiedades en Funes, Roldán y Rosario',
    template: '%s | Funes Inmobiliaria',
  },
  description: 'Encontrá propiedades en venta y alquiler en Funes, Roldán y Rosario. Casas, terrenos, departamentos y emprendimientos. Tasaciones sin cargo.',
  keywords: ['inmobiliaria funes', 'casas en venta funes', 'alquiler funes', 'propiedades funes', 'inmobiliaria roldan', 'propiedades rosario'],
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Funes Inmobiliaria',
    images: ['/banner-hero.jpg'],
  },
  robots: { index: true, follow: true },
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://funesinmobiliaria.com.ar'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Funes Inmobiliaria',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/banner-hero.jpg`,
  telephone: '+5493414932522',
  email: 'info@funesinmobiliaria.com.ar',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Córdoba 2115 (Ruta 9)',
    addressLocality: 'Funes',
    addressRegion: 'Santa Fe',
    addressCountry: 'AR',
  },
  openingHours: ['Mo-Fr 09:00-17:00', 'Sa 09:00-13:00'],
  sameAs: [
    'https://www.instagram.com/funesinmobiliaria/',
    'https://www.facebook.com/profile.php?id=100064200451795',
    'https://www.tiktok.com/@funesinmobiliaria',
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${eurostile.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
