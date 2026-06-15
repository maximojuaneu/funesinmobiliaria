import type { Metadata } from 'next'
import FirmaClient from './FirmaClient'

export const metadata: Metadata = {
  title: 'Autorización de Venta | Funes Inmobiliaria',
  robots: { index: false },
}

export default function FirmaPage({ params }: { params: { token: string } }) {
  return <FirmaClient token={params.token} />
}
