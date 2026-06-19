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
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${eurostile.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
